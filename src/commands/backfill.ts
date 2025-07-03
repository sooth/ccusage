import os from "node:os";
import process from "node:process";
import { define } from "gunshi";
import { logger } from "../logger.ts";
import { loadDailyUsageData } from "../data-loader.ts";
import { createDailyDate } from "../_types.ts";
import { sharedCommandConfig } from "../_shared-args.ts";
import { submitBackfillData, getGuid, getServerUrl } from "../_server-client.ts";
import ProgressBar from "progress";

/**
 * Backfill command - uploads historical usage data to the server
 * This allows clients with existing local data to populate the server's historical storage
 */
export const backfillCommand = define({
	name: 'backfill',
	description: 'Upload historical usage data to the server for daily/monthly aggregation',
	args: {
		...sharedCommandConfig.args,
		dryRun: {
			type: 'boolean',
			default: false,
			description: 'Show what would be uploaded without actually uploading',
		},
		verbose: {
			type: 'boolean', 
			default: false,
			description: 'Show detailed information about the backfill process',
		},
	},
	async run(ctx) {
		try {
			// Get configuration from context
			const dryRun = ctx.values.dryRun;
			const verbose = ctx.values.verbose;
			
			// Check if server mode is enabled
			if (!ctx.values.server) {
				logger.error("Backfill requires --server flag to be enabled");
				logger.info("Usage: ccusage backfill --server [--dry-run] [--verbose]");
				process.exit(1);
			}
			
			// Get GUID and server URL from server client module
			const guidValue = getGuid();
			const serverUrlValue = getServerUrl();
			
			// Get hostname for submission
			const hostname = os.hostname();
			
			logger.info("Starting backfill process...");
			logger.info(`GUID: ${guidValue}`);
			logger.info(`Hostname: ${hostname}`);
			logger.info(`Server: ${serverUrlValue}`);
			if (dryRun) {
				logger.info("DRY RUN MODE - No data will be uploaded");
			}
			
			// Load all local daily usage data (without date filters to get all historical data)
			logger.info("Loading local usage data...");
			const dailyData = await loadDailyUsageData({
				mode: 'calculate', // Always calculate costs from tokens for consistency
				offline: true, // Don't fetch from server since we're uploading TO server
			});
			
			if (dailyData.length === 0) {
				logger.info("No usage data found to backfill");
				return;
			}
			
			logger.info(`Found ${dailyData.length} days of usage data`);
			
			// Convert daily data to the format expected by the backfill endpoint
			// Structure: { date: { projectName: { tokens, modelBreakdowns, cost } } }
			const historicalData: Record<string, Record<string, {
				tokens: {
					inputTokens: number;
					outputTokens: number;
					cacheCreationTokens: number;
					cacheReadTokens: number;
					totalTokens: number;
				};
				modelBreakdowns: Array<{
					modelName: string;
					inputTokens: number;
					outputTokens: number;
					cacheCreationInputTokens: number;
					cacheReadInputTokens: number;
					cost: number;
				}>;
				cost: number;
			}>> = {};
			
			// Process each day's data
			for (const dayData of dailyData) {
				const dateKey = dayData.date;
				
				// For now, aggregate all data under a single "default" project
				// TODO: In the future, we could enhance this to track individual projects
				const projectName = "default";
				
				historicalData[dateKey] = {
					[projectName]: {
						tokens: {
							inputTokens: dayData.inputTokens,
							outputTokens: dayData.outputTokens,
							cacheCreationTokens: dayData.cacheCreationTokens,
							cacheReadTokens: dayData.cacheReadTokens,
							totalTokens: dayData.inputTokens + dayData.outputTokens + 
							           dayData.cacheCreationTokens + dayData.cacheReadTokens,
						},
						modelBreakdowns: dayData.modelBreakdowns.map(mb => ({
							modelName: mb.modelName,
							inputTokens: mb.inputTokens,
							outputTokens: mb.outputTokens,
							cacheCreationInputTokens: mb.cacheCreationTokens,
							cacheReadInputTokens: mb.cacheReadTokens,
							cost: mb.cost,
						})),
						cost: dayData.totalCost,
					},
				};
			}
			
			// Count totals for reporting
			const totalDates = Object.keys(historicalData).length;
			let totalProjects = 0;
			for (const projects of Object.values(historicalData)) {
				if (projects) {
					totalProjects += Object.keys(projects).length;
				}
			}
			
			logger.info(`Aggregated data: ${totalDates} dates, ${totalProjects} total project entries`);
			
			if (verbose) {
				// Show summary of what will be uploaded
				logger.info("\nData summary by date:");
				const sortedDates = Object.keys(historicalData).sort();
				for (const date of sortedDates.slice(0, 10)) {
					const projects = historicalData[date];
					if (!projects) continue;
					const projectCount = Object.keys(projects).length;
					let totalTokens = 0;
					for (const project of Object.values(projects)) {
						if (project) {
							totalTokens += project.tokens.totalTokens;
						}
					}
					logger.info(`  ${date}: ${projectCount} projects, ${totalTokens.toLocaleString()} tokens`);
				}
				if (sortedDates.length > 10) {
					logger.info(`  ... and ${sortedDates.length - 10} more dates`);
				}
			}
			
			if (dryRun) {
				logger.info("\nDRY RUN COMPLETE - No data was uploaded");
				logger.info(`Would have uploaded: ${totalDates} dates with ${totalProjects} project entries`);
				return;
			}
			
			// Submit data in chunks to avoid overwhelming the server
			const CHUNK_SIZE = 30; // Submit 30 days at a time
			const dateKeys = Object.keys(historicalData).sort();
			const totalChunks = Math.ceil(dateKeys.length / CHUNK_SIZE);
			
			logger.info(`\nUploading data in ${totalChunks} chunks...`);
			
			// Create progress bar
			const progressBar = new ProgressBar("Uploading [:bar] :percent :current/:total chunks", {
				total: totalChunks,
				width: 40,
				complete: "=",
				incomplete: " ",
			});
			
			let successfulChunks = 0;
			let failedChunks = 0;
			
			for (let i = 0; i < dateKeys.length; i += CHUNK_SIZE) {
				const chunkDates = dateKeys.slice(i, i + CHUNK_SIZE);
				const chunkData: typeof historicalData = {};
				
				// Build chunk data
				for (const date of chunkDates) {
					const dateData = historicalData[date];
					if (dateData) {
						chunkData[date] = dateData;
					}
				}
				
				// Submit chunk
				const result = await submitBackfillData(guidValue, hostname, chunkData);
				
				if (result) {
					successfulChunks++;
				} else {
					failedChunks++;
					if (verbose) {
						logger.error(`Failed to upload chunk ${Math.floor(i / CHUNK_SIZE) + 1}`);
					}
				}
				
				progressBar.tick();
			}
			
			// Report results
			logger.info("\n\nBackfill complete!");
			logger.info(`Successfully uploaded: ${successfulChunks} chunks`);
			if (failedChunks > 0) {
				logger.error(`Failed chunks: ${failedChunks}`);
				logger.info("Some data may not have been uploaded. Please check server logs.");
			} else {
				logger.info("All historical data has been uploaded successfully!");
			}
			
		} catch (error) {
			logger.error("Backfill failed:", error);
			process.exit(1);
		}
	},
});

