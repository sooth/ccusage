/**
 * @fileoverview Client for submitting usage data to the token usage server
 *
 * This module handles communication with the external usage tracking server,
 * including GUID persistence and automatic token data submission.
 */

import type { TokenCounts } from './_session-blocks.ts';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, hostname } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { logger } from './logger.ts';

const GUID_FILE_PATH = path.join(homedir(), '.ccusage-guid');
const DEFAULT_SERVER_URL = 'https://soothaa.pythonanywhere.com';
const SUBMISSION_INTERVAL_MS = 30000; // 30 seconds

/**
 * Token submission payload
 */
export type TokenSubmission = {
	guid: string;
	hostname: string;
	tokens: {
		inputTokens: number;
		outputTokens: number;
		cacheCreationTokens: number;
		cacheReadTokens: number;
	};
	modelBreakdowns?: SessionModelBreakdown[];
};

/**
 * Server response for a GUID status query
 */
export type GuidStatusResponse = {
	guid: string;
	entries: Array<{
		hostname: string;
		tokens: {
			inputTokens: number;
			outputTokens: number;
			cacheCreationTokens: number;
			cacheReadTokens: number;
			totalTokens: number;
		};
		lastUpdated: string;
		modelBreakdowns?: Array<{
			modelName: string;
			inputTokens: number;
			outputTokens: number;
			cacheCreationInputTokens: number;
			cacheReadInputTokens: number;
			cost: number;
		}>;
	}>;
};

/**
 * Get or create a persistent GUID for this user
 */
function getUserGuid(): string {
	if (existsSync(GUID_FILE_PATH)) {
		try {
			const guid = readFileSync(GUID_FILE_PATH, 'utf-8').trim();
			if (guid.length > 0) {
				return guid;
			}
		}
		catch (error) {
			logger.warn(`Failed to read GUID file: ${String(error)}`);
		}
	}

	// Generate new GUID
	const newGuid = randomUUID();
	try {
		writeFileSync(GUID_FILE_PATH, newGuid, 'utf-8');
		logger.info(`Generated new user GUID: ${newGuid}`);
	}
	catch (error) {
		logger.warn(`Failed to write GUID file: ${String(error)}`);
	}
	return newGuid;
}

/**
 * Fetch all entries for our GUID from the server
 */
export async function fetchGuidEntries(): Promise<GuidStatusResponse | null> {
	const serverUrl = process.env.CCUSAGE_SERVER_URL ?? DEFAULT_SERVER_URL;
	const guid = getUserGuid();

	try {
		const response = await fetch(`${serverUrl}/status/${guid}`, {
			method: 'GET',
			signal: AbortSignal.timeout(5000), // 5 second timeout
		});

		if (!response.ok) {
			if (response.status === 404) {
				// No data for this GUID yet
				return null;
			}
			const error = await response.text();
			logger.warn(`Failed to fetch GUID entries (${response.status}): ${error}`);
			return null;
		}

		const data = await response.json() as GuidStatusResponse;
		return data;
	}
	catch (error) {
		logger.debug(`Failed to fetch GUID entries: ${String(error)}`);
		return null;
	}
}

/**
 * Calculate merged token counts from remote entries, excluding our own hostname
 */
export function mergeRemoteTokens(
	remoteData: GuidStatusResponse | null,
	excludeHostname: string,
): TokenCounts {
	const merged: TokenCounts = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationInputTokens: 0,
		cacheReadInputTokens: 0,
	};

	if (remoteData == null || remoteData.entries.length === 0) {
		return merged;
	}

	// Sum tokens from all entries except our own hostname
	for (const entry of remoteData.entries) {
		if (entry.hostname !== excludeHostname) {
			merged.inputTokens += entry.tokens.inputTokens;
			merged.outputTokens += entry.tokens.outputTokens;
			merged.cacheCreationInputTokens += entry.tokens.cacheCreationTokens;
			merged.cacheReadInputTokens += entry.tokens.cacheReadTokens;
		}
	}

	return merged;
}

/**
 * Submit token usage data to the server
 */
export async function submitTokenUsage(tokens: TokenCounts, modelBreakdowns?: SessionModelBreakdown[]): Promise<void> {
	const serverUrl = process.env.CCUSAGE_SERVER_URL ?? DEFAULT_SERVER_URL;
	const payload: TokenSubmission = {
		guid: getUserGuid(),
		hostname: hostname(),
		tokens: {
			inputTokens: tokens.inputTokens,
			outputTokens: tokens.outputTokens,
			cacheCreationTokens: tokens.cacheCreationInputTokens,
			cacheReadTokens: tokens.cacheReadInputTokens,
		},
		modelBreakdowns,
	};

	try {
		const response = await fetch(`${serverUrl}/update`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(5000), // 5 second timeout
		});

		if (!response.ok) {
			const error = await response.text();
			logger.warn(`Server submission failed (${response.status}): ${error}`);
		}
	}
	catch (error) {
		// Silently fail - don't disrupt live monitoring
		logger.debug(`Server submission error: ${String(error)}`);
	}
}

/**
 * Combined token data including local and remote totals
 */
export type CombinedTokenData = {
	localTokens: TokenCounts;
	remoteTokens: TokenCounts;
	totalTokens: TokenCounts;
	remoteHostCount: number;
};

/**
 * Add two TokenCounts together
 */
function addTokenCounts(a: TokenCounts, b: TokenCounts): TokenCounts {
	return {
		inputTokens: a.inputTokens + b.inputTokens,
		outputTokens: a.outputTokens + b.outputTokens,
		cacheCreationInputTokens: a.cacheCreationInputTokens + b.cacheCreationInputTokens,
		cacheReadInputTokens: a.cacheReadInputTokens + b.cacheReadInputTokens,
	};
}

/**
 * Server submission manager for live monitoring
 */
export class ServerSubmissionManager implements Disposable {
	private intervalId: NodeJS.Timeout | null = null;
	private latestLocalTokens: TokenCounts | null = null;
	private latestRemoteTokens: TokenCounts | null = null;
	private latestModelBreakdowns: SessionModelBreakdown[] | null = null;
	private remoteHostCount = 0;
	private isDisposed = false;
	private readonly currentHostname = hostname();

	constructor(private readonly intervalMs: number = SUBMISSION_INTERVAL_MS) {}

	/**
	 * Start automatic submission
	 */
	start(): void {
		if (this.intervalId != null) {
			return;
		}

		// Submit immediately if we have data
		if (this.latestLocalTokens != null) {
			void this.submitAndFetch();
		}

		// Set up periodic submission
		this.intervalId = setInterval(() => {
			if (this.latestLocalTokens != null && !this.isDisposed) {
				void this.submitAndFetch();
			}
		}, this.intervalMs);
	}

	/**
	 * Submit local data and fetch remote data
	 */
	private async submitAndFetch(): Promise<void> {
		if (this.latestLocalTokens == null) {
			return;
		}

		// Submit our data
		await submitTokenUsage(this.latestLocalTokens, this.latestModelBreakdowns ?? undefined);

		// Fetch all entries for our GUID
		const remoteData = await fetchGuidEntries();
		if (remoteData != null) {
			// Merge remote tokens, excluding our own hostname
			this.latestRemoteTokens = mergeRemoteTokens(remoteData, this.currentHostname);

			// Count remote hosts (excluding ourselves)
			this.remoteHostCount = remoteData.entries.filter(
				entry => entry.hostname !== this.currentHostname,
			).length;
		}
	}

	/**
	 * Update local tokens for next submission
	 */
	updateTokens(tokens: TokenCounts, modelBreakdowns?: SessionModelBreakdown[]): void {
		this.latestLocalTokens = tokens;
		this.latestModelBreakdowns = modelBreakdowns ?? null;
	}

	/**
	 * Get combined token data (local + remote)
	 */
	getCombinedData(): CombinedTokenData | null {
		if (this.latestLocalTokens == null) {
			return null;
		}

		const remoteTokens = this.latestRemoteTokens ?? {
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0,
		};

		return {
			localTokens: this.latestLocalTokens,
			remoteTokens,
			totalTokens: addTokenCounts(this.latestLocalTokens, remoteTokens),
			remoteHostCount: this.remoteHostCount,
		};
	}

	/**
	 * Stop automatic submission
	 */
	stop(): void {
		if (this.intervalId != null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Implements Disposable interface
	 */
	[Symbol.dispose](): void {
		this.isDisposed = true;
		this.stop();
	}
}

if (import.meta.vitest != null) {
	describe('mergeRemoteTokens', () => {
		it('should return empty tokens when no remote data', () => {
			const result = mergeRemoteTokens(null, 'test-host');
			expect(result).toEqual({
				inputTokens: 0,
				outputTokens: 0,
				cacheCreationInputTokens: 0,
				cacheReadInputTokens: 0,
			});
		});

		it('should return empty tokens when entries array is empty', () => {
			const remoteData: GuidStatusResponse = {
				guid: 'test-guid',
				entries: [],
			};
			const result = mergeRemoteTokens(remoteData, 'test-host');
			expect(result).toEqual({
				inputTokens: 0,
				outputTokens: 0,
				cacheCreationInputTokens: 0,
				cacheReadInputTokens: 0,
			});
		});

		it('should exclude entries from the specified hostname', () => {
			const remoteData: GuidStatusResponse = {
				guid: 'test-guid',
				entries: [
					{
						hostname: 'host1',
						tokens: {
							inputTokens: 100,
							outputTokens: 50,
							cacheCreationTokens: 10,
							cacheReadTokens: 5,
							totalTokens: 165,
						},
						lastUpdated: new Date().toISOString(),
					},
					{
						hostname: 'host2',
						tokens: {
							inputTokens: 200,
							outputTokens: 100,
							cacheCreationTokens: 20,
							cacheReadTokens: 10,
							totalTokens: 330,
						},
						lastUpdated: new Date().toISOString(),
					},
				],
			};

			const result = mergeRemoteTokens(remoteData, 'host1');
			expect(result).toEqual({
				inputTokens: 200,
				outputTokens: 100,
				cacheCreationInputTokens: 20,
				cacheReadInputTokens: 10,
			});
		});

		it('should sum tokens from all entries except excluded hostname', () => {
			const remoteData: GuidStatusResponse = {
				guid: 'test-guid',
				entries: [
					{
						hostname: 'host1',
						tokens: {
							inputTokens: 100,
							outputTokens: 50,
							cacheCreationTokens: 10,
							cacheReadTokens: 5,
							totalTokens: 165,
						},
						lastUpdated: new Date().toISOString(),
					},
					{
						hostname: 'host2',
						tokens: {
							inputTokens: 200,
							outputTokens: 100,
							cacheCreationTokens: 20,
							cacheReadTokens: 10,
							totalTokens: 330,
						},
						lastUpdated: new Date().toISOString(),
					},
					{
						hostname: 'host3',
						tokens: {
							inputTokens: 300,
							outputTokens: 150,
							cacheCreationTokens: 30,
							cacheReadTokens: 15,
							totalTokens: 495,
						},
						lastUpdated: new Date().toISOString(),
					},
				],
			};

			const result = mergeRemoteTokens(remoteData, 'host2');
			expect(result).toEqual({
				inputTokens: 400, // 100 + 300
				outputTokens: 200, // 50 + 150
				cacheCreationInputTokens: 40, // 10 + 30
				cacheReadInputTokens: 20, // 5 + 15
			});
		});
	});
}
