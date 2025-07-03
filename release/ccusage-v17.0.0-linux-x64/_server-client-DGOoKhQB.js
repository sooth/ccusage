import { logger } from "./logger-LJ5xGY9g.js";
import path from "node:path";
import process from "node:process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, hostname } from "node:os";
import { randomUUID } from "node:crypto";
const GUID_FILE_PATH = path.join(homedir(), ".ccusage-guid");
const DEFAULT_SERVER_URL = "https://soothaa.pythonanywhere.com";
const SUBMISSION_INTERVAL_MS = 3e4;
/**
* Get or create a persistent GUID for this user
*/
function getUserGuid() {
	if (existsSync(GUID_FILE_PATH)) try {
		const guid = readFileSync(GUID_FILE_PATH, "utf-8").trim();
		if (guid.length > 0) return guid;
	} catch (error) {
		logger.warn(`Failed to read GUID file: ${String(error)}`);
	}
	const newGuid = randomUUID();
	try {
		writeFileSync(GUID_FILE_PATH, newGuid, "utf-8");
		logger.info(`Generated new user GUID: ${newGuid}`);
	} catch (error) {
		logger.warn(`Failed to write GUID file: ${String(error)}`);
	}
	return newGuid;
}
/**
* Fetch all entries for our GUID from the server
*/
async function fetchGuidEntries() {
	const serverUrl = process.env.CCUSAGE_SERVER_URL ?? DEFAULT_SERVER_URL;
	const guid = getUserGuid();
	try {
		const response = await fetch(`${serverUrl}/status/${guid}`, {
			method: "GET",
			signal: AbortSignal.timeout(5e3)
		});
		if (!response.ok) {
			if (response.status === 404) return null;
			const error = await response.text();
			logger.warn(`Failed to fetch GUID entries (${response.status}): ${error}`);
			return null;
		}
		const data = await response.json();
		return data;
	} catch (error) {
		logger.debug(`Failed to fetch GUID entries: ${String(error)}`);
		return null;
	}
}
/**
* Calculate merged token counts from remote entries, excluding our own hostname
*/
function mergeRemoteTokens(remoteData, excludeHostname) {
	const merged = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationInputTokens: 0,
		cacheReadInputTokens: 0
	};
	if (remoteData == null || remoteData.entries.length === 0) return merged;
	for (const entry of remoteData.entries) if (entry.hostname !== excludeHostname) {
		merged.inputTokens += entry.tokens.inputTokens;
		merged.outputTokens += entry.tokens.outputTokens;
		merged.cacheCreationInputTokens += entry.tokens.cacheCreationTokens;
		merged.cacheReadInputTokens += entry.tokens.cacheReadTokens;
	}
	return merged;
}
/**
* Submit token usage data to the server
*/
async function submitTokenUsage(tokens, modelBreakdowns) {
	const serverUrl = process.env.CCUSAGE_SERVER_URL ?? DEFAULT_SERVER_URL;
	const payload = {
		guid: getUserGuid(),
		hostname: hostname(),
		tokens: {
			inputTokens: tokens.inputTokens,
			outputTokens: tokens.outputTokens,
			cacheCreationTokens: tokens.cacheCreationInputTokens,
			cacheReadTokens: tokens.cacheReadInputTokens
		},
		modelBreakdowns
	};
	try {
		const response = await fetch(`${serverUrl}/update`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(5e3)
		});
		if (!response.ok) {
			const error = await response.text();
			logger.warn(`Server submission failed (${response.status}): ${error}`);
		}
	} catch (error) {
		logger.debug(`Server submission error: ${String(error)}`);
	}
}
/**
* Fetch all entries for our GUID from the server (v2 with project detail)
*/
async function fetchGuidEntriesV2() {
	const serverUrl = process.env.CCUSAGE_SERVER_URL ?? DEFAULT_SERVER_URL;
	const guid = getUserGuid();
	try {
		const response = await fetch(`${serverUrl}/v2/status/${guid}`, {
			method: "GET",
			signal: AbortSignal.timeout(5e3)
		});
		if (!response.ok) {
			if (response.status === 404) return null;
			const error = await response.text();
			logger.warn(`Failed to fetch GUID entries v2 (${response.status}): ${error}`);
			return null;
		}
		const data = await response.json();
		return data;
	} catch (error) {
		logger.debug(`Failed to fetch GUID entries v2: ${String(error)}`);
		return null;
	}
}
/**
* Submit token usage data with project information to the server (v2)
*/
async function submitProjectTokenUsage(projectData) {
	const serverUrl = process.env.CCUSAGE_SERVER_URL ?? DEFAULT_SERVER_URL;
	const payload = {
		guid: getUserGuid(),
		hostname: hostname(),
		projects: projectData.map((project) => ({
			projectName: project.projectName,
			tokens: {
				inputTokens: project.tokens.inputTokens,
				outputTokens: project.tokens.outputTokens,
				cacheCreationTokens: project.tokens.cacheCreationInputTokens,
				cacheReadTokens: project.tokens.cacheReadInputTokens
			},
			modelBreakdowns: project.modelBreakdowns
		}))
	};
	try {
		const response = await fetch(`${serverUrl}/v2/update`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(5e3)
		});
		if (!response.ok) {
			const error = await response.text();
			logger.warn(`Server v2 submission failed (${response.status}): ${error}`);
		}
	} catch (error) {
		logger.debug(`Server v2 submission error: ${String(error)}`);
	}
}
/**
* Add two TokenCounts together
*/
function addTokenCounts(a, b$1) {
	return {
		inputTokens: a.inputTokens + b$1.inputTokens,
		outputTokens: a.outputTokens + b$1.outputTokens,
		cacheCreationInputTokens: a.cacheCreationInputTokens + b$1.cacheCreationInputTokens,
		cacheReadInputTokens: a.cacheReadInputTokens + b$1.cacheReadInputTokens
	};
}
/**
* Extract project-level data from a SessionBlock
*/
function extractProjectDataFromSessionBlock(block) {
	const projectGroups = /* @__PURE__ */ new Map();
	for (const entry of block.entries) {
		const projectName = entry.projectPath ?? "Unknown Project";
		const existing = projectGroups.get(projectName) ?? [];
		existing.push(entry);
		projectGroups.set(projectName, existing);
	}
	const projectDataArray = [];
	for (const [projectName, entries] of projectGroups) {
		const tokens = {
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0
		};
		const modelStats = /* @__PURE__ */ new Map();
		for (const entry of entries) {
			tokens.inputTokens += entry.usage.inputTokens;
			tokens.outputTokens += entry.usage.outputTokens;
			tokens.cacheCreationInputTokens += entry.usage.cacheCreationInputTokens;
			tokens.cacheReadInputTokens += entry.usage.cacheReadInputTokens;
			const existing = modelStats.get(entry.model) ?? {
				modelName: entry.model,
				inputTokens: 0,
				outputTokens: 0,
				cacheCreationInputTokens: 0,
				cacheReadInputTokens: 0,
				cost: 0
			};
			modelStats.set(entry.model, {
				modelName: entry.model,
				inputTokens: existing.inputTokens + entry.usage.inputTokens,
				outputTokens: existing.outputTokens + entry.usage.outputTokens,
				cacheCreationInputTokens: existing.cacheCreationInputTokens + entry.usage.cacheCreationInputTokens,
				cacheReadInputTokens: existing.cacheReadInputTokens + entry.usage.cacheReadInputTokens,
				cost: existing.cost + (entry.costUSD ?? 0)
			});
		}
		projectDataArray.push({
			projectName,
			tokens,
			modelBreakdowns: Array.from(modelStats.values())
		});
	}
	return projectDataArray;
}
/**
* Server submission manager for live monitoring (with project support)
*/
var ServerSubmissionManager = class {
	intervalId = null;
	latestLocalTokens = null;
	latestRemoteTokens = null;
	latestModelBreakdowns = null;
	latestProjectData = null;
	remoteHostCount = 0;
	latestGuidResponse = null;
	latestGuidResponseV2 = null;
	isDisposed = false;
	currentHostname = hostname();
	useV2Api = true;
	constructor(intervalMs = SUBMISSION_INTERVAL_MS) {
		this.intervalMs = intervalMs;
	}
	/**
	* Start automatic submission
	*/
	start() {
		if (this.intervalId != null) return;
		if (this.latestLocalTokens != null) this.submitAndFetch();
		this.intervalId = setInterval(() => {
			if (this.latestLocalTokens != null && !this.isDisposed) this.submitAndFetch();
		}, this.intervalMs);
	}
	/**
	* Submit local data and fetch remote data
	*/
	async submitAndFetch() {
		if (this.useV2Api && this.latestProjectData != null) {
			await submitProjectTokenUsage(this.latestProjectData);
			const remoteDataV2 = await fetchGuidEntriesV2();
			if (remoteDataV2 != null) {
				this.latestGuidResponseV2 = remoteDataV2;
				const remoteData = await fetchGuidEntries();
				if (remoteData != null) {
					this.latestGuidResponse = remoteData;
					this.latestRemoteTokens = mergeRemoteTokens(remoteData, this.currentHostname);
					this.remoteHostCount = remoteData.entries.filter((entry) => entry.hostname !== this.currentHostname).length;
				}
			}
		} else if (this.latestLocalTokens != null) {
			await submitTokenUsage(this.latestLocalTokens, this.latestModelBreakdowns ?? void 0);
			const remoteData = await fetchGuidEntries();
			if (remoteData != null) {
				this.latestGuidResponse = remoteData;
				this.latestRemoteTokens = mergeRemoteTokens(remoteData, this.currentHostname);
				this.remoteHostCount = remoteData.entries.filter((entry) => entry.hostname !== this.currentHostname).length;
			}
		}
	}
	/**
	* Update local tokens for next submission (v1 backward compatible)
	*/
	updateTokens(tokens, modelBreakdowns) {
		this.latestLocalTokens = tokens;
		this.latestModelBreakdowns = modelBreakdowns ?? null;
	}
	/**
	* Update project data for next submission (v2)
	*/
	updateProjectData(projectData) {
		this.latestProjectData = projectData;
		const aggregated = {
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0
		};
		const allModelBreakdowns = [];
		for (const project of projectData) {
			aggregated.inputTokens += project.tokens.inputTokens;
			aggregated.outputTokens += project.tokens.outputTokens;
			aggregated.cacheCreationInputTokens += project.tokens.cacheCreationInputTokens;
			aggregated.cacheReadInputTokens += project.tokens.cacheReadInputTokens;
			if (project.modelBreakdowns != null) allModelBreakdowns.push(...project.modelBreakdowns);
		}
		this.latestLocalTokens = aggregated;
		this.latestModelBreakdowns = allModelBreakdowns;
	}
	/**
	* Get combined token data (local + remote)
	*/
	getCombinedData() {
		if (this.latestLocalTokens == null) return null;
		const remoteTokens = this.latestRemoteTokens ?? {
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0
		};
		return {
			localTokens: this.latestLocalTokens,
			remoteTokens,
			totalTokens: addTokenCounts(this.latestLocalTokens, remoteTokens),
			remoteHostCount: this.remoteHostCount,
			guidResponse: this.latestGuidResponse ?? void 0,
			guidResponseV2: this.latestGuidResponseV2 ?? void 0
		};
	}
	/**
	* Stop automatic submission
	*/
	stop() {
		if (this.intervalId != null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
	/**
	* Implements Disposable interface
	*/
	[Symbol.dispose]() {
		this.isDisposed = true;
		this.stop();
	}
};
export { ServerSubmissionManager, extractProjectDataFromSessionBlock, fetchGuidEntries, fetchGuidEntriesV2, mergeRemoteTokens, submitProjectTokenUsage, submitTokenUsage };
