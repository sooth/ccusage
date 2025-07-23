import process from 'node:process';
import { define } from 'gunshi';
import { LiveMonitor } from '../_live-monitor.ts';
import { extractProjectDataFromSessionBlock, submitProjectTokenUsage } from '../_server-client.ts';
import { DEFAULT_SESSION_DURATION_HOURS } from '../_session-blocks.ts';
import { sharedCommandConfig } from '../_shared-args.ts';
import { getClaudePaths } from '../data-loader.ts';
import { logger } from '../logger.ts';

export const syncCommand = define({
	name: 'sync',
	description: 'Submit current token usage to server once and exit (for automated background sync)',
	args: {
		...sharedCommandConfig.args,
		sessionLength: {
			type: 'number',
			short: 'l',
			description: `Session block duration in hours (default: ${DEFAULT_SESSION_DURATION_HOURS})`,
			default: DEFAULT_SESSION_DURATION_HOURS,
		},
		quiet: {
			type: 'boolean',
			short: 'q',
			description: 'Suppress all output except errors',
			default: false,
		},
	},
	toKebab: true,
	async run(ctx) {
		try {
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

			// Create live monitor
			using monitor = new LiveMonitor({
				claudePaths: paths,
				sessionDurationHours: ctx.values.sessionLength,
				mode: ctx.values.mode,
				order: ctx.values.order,
			});

			// Get active block
			const activeBlock = await monitor.getActiveBlock();

			if (activeBlock == null) {
				if (!ctx.values.quiet) {
					logger.info('No active session block found - nothing to sync');
				}
				process.exit(0);
			}

			// Extract and submit project data
			const projectData = extractProjectDataFromSessionBlock(activeBlock);
			await submitProjectTokenUsage(projectData, activeBlock.endTime);

			if (!ctx.values.quiet) {
				const totalTokens = activeBlock.tokenCounts.inputTokens + activeBlock.tokenCounts.outputTokens
					+ activeBlock.tokenCounts.cacheCreationInputTokens + activeBlock.tokenCounts.cacheReadInputTokens;
				logger.info(`Successfully synced ${projectData.length} project(s) with ${totalTokens.toLocaleString()} total tokens`);
			}

			process.exit(0);
		}
		catch (error) {
			logger.error(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	},
});
