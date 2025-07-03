import type { LiveMonitoringConfig } from '../_live-rendering.ts';
import type { CombinedTokenData, GuidStatusResponseV2 } from '../_server-client.ts';
import type { SessionBlock } from '../_session-blocks.ts';
import { hostname } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { delay } from '@jsr/std__async/delay';
import { define } from 'gunshi';
import pc from 'picocolors';
import prettyMs from 'pretty-ms';
import { BLOCKS_WARNING_THRESHOLD, DEFAULT_REFRESH_INTERVAL_SECONDS, MAX_REFRESH_INTERVAL_SECONDS, MIN_REFRESH_INTERVAL_SECONDS } from '../_consts.ts';
import { LiveMonitor } from '../_live-monitor.ts';
import { extractProjectDataFromSessionBlock, ServerSubmissionManager } from '../_server-client.ts';
import { calculateBurnRate, DEFAULT_SESSION_DURATION_HOURS, projectBlockUsage } from '../_session-blocks.ts';
import { sharedCommandConfig } from '../_shared-args.ts';
import { formatCurrency, formatNumber } from '../_utils.ts';
import { getClaudePaths } from '../data-loader.ts';
import { log, logger } from '../logger.ts';

/**
 * Parses token limit argument, supporting 'max' keyword
 */
function parseTokenLimit(value: string | undefined, maxFromAll: number): number | undefined {
	if (value == null || value === '') {
		return undefined;
	}

	if (value === 'max') {
		return maxFromAll > 0 ? maxFromAll : undefined;
	}

	const limit = Number.parseInt(value, 10);
	return Number.isNaN(limit) ? undefined : limit;
}

export const blocksMonitorCommand = define({
	name: 'blocks-monitor',
	description: 'Monitor active session block usage in CLI mode (non-interactive)',
	args: {
		...sharedCommandConfig.args,
		tokenLimit: {
			type: 'string',
			short: 't',
			description: 'Token limit for quota warnings (e.g., 500000 or "max")',
		},
		sessionLength: {
			type: 'number',
			short: 'l',
			description: `Session block duration in hours (default: ${DEFAULT_SESSION_DURATION_HOURS})`,
			default: DEFAULT_SESSION_DURATION_HOURS,
		},
		refreshInterval: {
			type: 'number',
			description: `Refresh interval in seconds (default: ${DEFAULT_REFRESH_INTERVAL_SECONDS})`,
			default: DEFAULT_REFRESH_INTERVAL_SECONDS,
		},
	},
	toKebab: true,
	async run(ctx) {
		if (ctx.values.json) {
			logger.error('JSON output is not supported for blocks-monitor command');
			process.exit(1);
		}

		// Validate session length
		if (ctx.values.sessionLength <= 0) {
			logger.error('Session length must be a positive number');
			process.exit(1);
		}

		// Get Claude paths
		const paths = getClaudePaths();
		if (paths.length === 0) {
			logger.error('No valid Claude data directory found');
			process.exit(1);
		}

		// Validate refresh interval
		const refreshInterval = Math.max(MIN_REFRESH_INTERVAL_SECONDS, Math.min(MAX_REFRESH_INTERVAL_SECONDS, ctx.values.refreshInterval));
		if (refreshInterval !== ctx.values.refreshInterval) {
			logger.warn(`Refresh interval adjusted to ${refreshInterval} seconds (valid range: ${MIN_REFRESH_INTERVAL_SECONDS}-${MAX_REFRESH_INTERVAL_SECONDS})`);
		}

		// Get max tokens from all blocks if needed
		let maxTokensFromAll = 0;
		if (ctx.values.tokenLimit === 'max') {
			const { loadSessionBlockData } = await import('../data-loader.ts');
			const allBlocks = await loadSessionBlockData({
				since: ctx.values.since,
				until: ctx.values.until,
				mode: ctx.values.mode,
				order: ctx.values.order,
				offline: ctx.values.offline,
				sessionDurationHours: ctx.values.sessionLength,
			});

			for (const block of allBlocks) {
				if (!(block.isGap ?? false) && !block.isActive) {
					const blockTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
					if (blockTokens > maxTokensFromAll) {
						maxTokensFromAll = blockTokens;
					}
				}
			}
			if (maxTokensFromAll > 0) {
				logger.info(`Using max tokens from previous sessions: ${formatNumber(maxTokensFromAll)}`);
			}
		}

		const tokenLimit = parseTokenLimit(ctx.values.tokenLimit, maxTokensFromAll);

		// Create monitoring config
		const config: LiveMonitoringConfig = {
			claudePaths: paths,
			tokenLimit,
			refreshInterval: refreshInterval * 1000, // Convert to milliseconds
			sessionDurationHours: ctx.values.sessionLength,
			mode: ctx.values.mode,
			order: ctx.values.order,
		};

		// Start monitoring
		await startCLIMonitoring(config);
	},
});

async function startCLIMonitoring(config: LiveMonitoringConfig): Promise<void> {
	const abortController = new AbortController();

	// Create server submission manager
	using submissionManager = new ServerSubmissionManager();
	submissionManager.start();

	// Setup graceful shutdown
	const cleanup = (): void => {
		abortController.abort();
		logger.info('\nMonitoring stopped.');
		if (process.exitCode == null) {
			process.exit(0);
		}
	};

	process.on('SIGINT', cleanup);
	process.on('SIGTERM', cleanup);

	// Create live monitor
	using monitor = new LiveMonitor({
		claudePaths: config.claudePaths,
		sessionDurationHours: config.sessionDurationHours,
		mode: config.mode,
		order: config.order,
	});

	logger.box('Claude Code Token Usage Monitor - CLI Mode');
	logger.info(`Monitoring active session blocks every ${config.refreshInterval / 1000} seconds...`);
	logger.info('Press Ctrl+C to stop\n');

	let lastPrintedData: string | null = null;

	try {
		while (!abortController.signal.aborted) {
			// Get latest data
			const activeBlock = await monitor.getActiveBlock();
			monitor.clearCache();

			if (activeBlock == null) {
				const msg = 'No active session block found. Waiting...';
				if (lastPrintedData !== msg) {
					log(pc.yellow(msg));
					lastPrintedData = msg;
				}
			}
			else {
				// Update server with project-level token data
				const projectData = extractProjectDataFromSessionBlock(activeBlock);
				submissionManager.updateProjectData(projectData, activeBlock.endTime);

				// Get combined data (local + remote)
				const combinedData = submissionManager.getCombinedData();

				// Print active block info
				printActiveBlockInfo(activeBlock, config, combinedData, lastPrintedData);
				lastPrintedData = 'has-data';
			}

			// Wait before next refresh
			await delay(config.refreshInterval, { signal: abortController.signal });
		}
	}
	catch (error) {
		if ((error instanceof DOMException || error instanceof Error) && error.name === 'AbortError') {
			return; // Normal graceful shutdown
		}

		// Handle and display errors
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(`Monitoring error: ${errorMessage}`);
		throw error;
	}
}

function printActiveBlockInfo(block: SessionBlock, config: LiveMonitoringConfig, combinedData: CombinedTokenData | null, _lastPrintedData: string | null): void {
	const now = new Date();
	const elapsed = (now.getTime() - block.startTime.getTime()) / (1000 * 60);
	const remaining = (block.endTime.getTime() - now.getTime()) / (1000 * 60);

	// Get current project info from working directory
	const currentProject = path.basename(process.cwd());
	const currentHostname = hostname();

	// Calculate token metrics (including cache tokens)
	const localTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens
		+ block.tokenCounts.cacheCreationInputTokens + block.tokenCounts.cacheReadInputTokens;
	const totalTokens = combinedData != null
		? combinedData.totalTokens.inputTokens + combinedData.totalTokens.outputTokens
		+ combinedData.totalTokens.cacheCreationInputTokens + combinedData.totalTokens.cacheReadInputTokens
		: localTokens;
	const remoteTokens = totalTokens - localTokens;
	const remoteHostCount = combinedData?.remoteHostCount ?? 0;

	// Print header with timestamp
	log(`\n${pc.gray('─'.repeat(60))}`);
	log(`${pc.bold('Update:')} ${new Date().toLocaleTimeString()}`);
	log(`${pc.gray('─'.repeat(60))}`);

	// Session info
	log(`${pc.bold('Session:')} Started ${block.startTime.toLocaleTimeString()} (${prettyMs(elapsed * 60 * 1000, { compact: true })} ago)`);
	log(`${pc.bold('Remaining:')} ${prettyMs(remaining * 60 * 1000, { compact: true })} until ${block.endTime.toLocaleTimeString()}`);

	// Token usage
	log(`\n${pc.bold('Token Usage:')}`);
	if (remoteHostCount > 0) {
		log(`  Local: ${formatNumber(localTokens)} tokens`);
		log(`  Remote: ${formatNumber(remoteTokens)} tokens (${remoteHostCount} host${remoteHostCount > 1 ? 's' : ''})`);
		log(`  Total: ${formatNumber(totalTokens)} tokens`);
	}
	else {
		log(`  Total: ${formatNumber(totalTokens)} tokens`);
	}

	// Token limit status
	if (config.tokenLimit != null && config.tokenLimit > 0) {
		const percentUsed = (totalTokens / config.tokenLimit) * 100;
		const remainingTokens = Math.max(0, config.tokenLimit - totalTokens);
		const status = percentUsed > 100
			? pc.red('EXCEEDS LIMIT')
			: percentUsed > BLOCKS_WARNING_THRESHOLD * 100
				? pc.yellow('WARNING')
				: pc.green('OK');

		log(`  Limit: ${formatNumber(config.tokenLimit)} tokens`);
		log(`  Used: ${percentUsed.toFixed(1)}% ${status}`);
		log(`  Remaining: ${formatNumber(remainingTokens)} tokens`);
	}

	// Cost
	log(`  Cost: ${formatCurrency(block.costUSD)}`);

	// Burn rate
	const burnRate = calculateBurnRate(block);
	if (burnRate != null) {
		const rateStatus = burnRate.tokensPerMinute > 1000
			? pc.red('HIGH')
			: burnRate.tokensPerMinute > 500
				? pc.yellow('MODERATE')
				: pc.green('NORMAL');
		log(`\n${pc.bold('Burn Rate:')}`);
		log(`  Tokens/min: ${formatNumber(burnRate.tokensPerMinute)} ${rateStatus}`);
		log(`  Cost/hour: ${formatCurrency(burnRate.costPerHour)}`);
	}

	// Projections
	const projection = projectBlockUsage(block);
	if (projection != null) {
		log(`\n${pc.bold('Projected (if current rate continues):')}`);
		log(`  Total Tokens: ${formatNumber(projection.totalTokens)}`);
		log(`  Total Cost: ${formatCurrency(projection.totalCost)}`);

		if (config.tokenLimit != null && config.tokenLimit > 0) {
			const projectedPercent = (projection.totalTokens / config.tokenLimit) * 100;
			const projectionStatus = projectedPercent > 100
				? pc.red('WILL EXCEED LIMIT')
				: projectedPercent > 80
					? pc.yellow('APPROACHING LIMIT')
					: pc.green('WITHIN LIMIT');
			log(`  Status: ${projectionStatus}`);
		}
	}

	// Model breakdown
	if (block.modelBreakdowns.length > 0) {
		log(`\n${pc.bold('Model Breakdown:')}`);
		for (const mb of block.modelBreakdowns) {
			const totalModelTokens = mb.inputTokens + mb.outputTokens;
			log(`  ${mb.modelName}:`);
			log(`    Tokens: ${formatNumber(totalModelTokens)} (${formatNumber(mb.inputTokens)} in, ${formatNumber(mb.outputTokens)} out)`);
			if (mb.cacheCreationInputTokens > 0 || mb.cacheReadInputTokens > 0) {
				log(`    Cache: ${formatNumber(mb.cacheCreationInputTokens)} create, ${formatNumber(mb.cacheReadInputTokens)} read`);
			}
			log(`    Cost: ${formatCurrency(mb.cost)}`);
		}
	}

	// Models used
	if (block.models.length > 0) {
		log(`\n${pc.bold('Models:')} ${block.models.join(', ')}`);
	}

	// Host breakdown with project detail
	if (combinedData?.guidResponse != null) {
		log(`\n${pc.bold('Host Breakdown (Project Detail):')}`);

		// Show current host with its projects
		const currentHostEntry = combinedData.guidResponse.entries.find(
			entry => entry.hostname === currentHostname,
		);

		if (currentHostEntry != null) {
			log(`  ${currentHostname} (current):`);
			for (const project of currentHostEntry.projects) {
				const projectTokens = project.tokens.inputTokens + project.tokens.outputTokens
					+ project.tokens.cacheCreationTokens + project.tokens.cacheReadTokens;
				log(`    ${project.projectName}: ${formatNumber(projectTokens)} tokens`);

				// Show token type breakdown (only non-zero values)
				if (project.tokens.inputTokens > 0) {
					log(`      Input: ${formatNumber(project.tokens.inputTokens)}`);
				}
				if (project.tokens.outputTokens > 0) {
					log(`      Output: ${formatNumber(project.tokens.outputTokens)}`);
				}
				if (project.tokens.cacheCreationTokens > 0) {
					log(`      Cache Create: ${formatNumber(project.tokens.cacheCreationTokens)}`);
				}
				if (project.tokens.cacheReadTokens > 0) {
					log(`      Cache Read: ${formatNumber(project.tokens.cacheReadTokens)}`);
				}
			}
		}
		else {
			// Fallback if not found in v2 data
			log(`  ${currentHostname} (current):`);
			log(`    Current Project: ${currentProject}`);
			log(`    Total Tokens: ${formatNumber(localTokens)}`);
		}

		// Show remote hosts with their projects
		const remoteHosts = combinedData.guidResponse.entries.filter(
			entry => entry.hostname !== currentHostname,
		);

		for (const host of remoteHosts) {
			log(`  ${host.hostname}:`);
			for (const project of host.projects) {
				const projectTokens = project.tokens.inputTokens + project.tokens.outputTokens
					+ project.tokens.cacheCreationTokens + project.tokens.cacheReadTokens;
				log(`    ${project.projectName}: ${formatNumber(projectTokens)} tokens`);

				// Show token type breakdown (only non-zero values)
				if (project.tokens.inputTokens > 0) {
					log(`      Input: ${formatNumber(project.tokens.inputTokens)}`);
				}
				if (project.tokens.outputTokens > 0) {
					log(`      Output: ${formatNumber(project.tokens.outputTokens)}`);
				}
				if (project.tokens.cacheCreationTokens > 0) {
					log(`      Cache Create: ${formatNumber(project.tokens.cacheCreationTokens)}`);
				}
				if (project.tokens.cacheReadTokens > 0) {
					log(`      Cache Read: ${formatNumber(project.tokens.cacheReadTokens)}`);
				}

				log(`      Last Update: ${new Date(project.lastUpdated).toLocaleTimeString()}`);
			}
		}
	}
	else if (combinedData?.guidResponse != null) {
		// Fallback to v2 API display
		const guidResponse: GuidStatusResponseV2 = combinedData.guidResponse;
		log(`\n${pc.bold('Host Breakdown:')}`);
		log(`  ${currentHostname} (current):`);
		log(`    Project: ${currentProject}`);
		log(`    Tokens: ${formatNumber(localTokens)}`);

		// Show remote hosts
		const remoteHosts = guidResponse.entries.filter(
			(entry): entry is typeof guidResponse.entries[0] => entry.hostname !== currentHostname,
		);

		for (const host of remoteHosts) {
			// v2 response - aggregate tokens from all projects
			let hostTotalTokens = 0;
			for (const project of host.projects) {
				hostTotalTokens += project.tokens.inputTokens + project.tokens.outputTokens
					+ project.tokens.cacheCreationTokens + project.tokens.cacheReadTokens;
			}
			log(`  ${host.hostname}:`);
			log(`    Tokens: ${formatNumber(hostTotalTokens)}`);

			// Show project breakdown
			for (const project of host.projects) {
				const projectTotalTokens = project.tokens.inputTokens + project.tokens.outputTokens
					+ project.tokens.cacheCreationTokens + project.tokens.cacheReadTokens;
				log(`    ${project.projectName}: ${formatNumber(projectTotalTokens)} tokens`);

				if (project.modelBreakdowns != null && project.modelBreakdowns.length > 0) {
					for (const mb of project.modelBreakdowns) {
						const modelTokens = mb.inputTokens + mb.outputTokens
							+ mb.cacheCreationInputTokens + mb.cacheReadInputTokens;
						log(`      ${mb.modelName}: ${formatNumber(modelTokens)} tokens`);
					}
				}
			}
		}
	}
}
