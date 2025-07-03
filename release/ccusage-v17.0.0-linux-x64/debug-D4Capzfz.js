import { CLAUDE_PROJECTS_DIR_NAME, DEBUG_MATCH_THRESHOLD_PERCENT, PricingFetcher, USAGE_DATA_GLOB_PATTERN, __toESM, require_usingCtx } from "./pricing-fetcher-CHQAtwwA.js";
import { getClaudePaths, glob, usageDataSchema } from "./data-loader-D4kzdTVq.js";
import { logger } from "./logger-LJ5xGY9g.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
var import_usingCtx = __toESM(require_usingCtx(), 1);
/**
* Analyzes usage data to detect pricing mismatches between stored and calculated costs
* Compares pre-calculated costUSD values with costs calculated from token usage
* @param claudePath - Optional path to Claude data directory
* @returns Statistics about pricing mismatches found
*/
async function detectMismatches(claudePath) {
	try {
		var _usingCtx = (0, import_usingCtx.default)();
		let claudeDir;
		if (claudePath != null && claudePath !== "") claudeDir = claudePath;
		else {
			const paths = getClaudePaths();
			if (paths.length === 0) throw new Error("No valid Claude data directory found");
			claudeDir = path.join(paths[0], CLAUDE_PROJECTS_DIR_NAME);
		}
		const files = await glob([USAGE_DATA_GLOB_PATTERN], {
			cwd: claudeDir,
			absolute: true
		});
		const fetcher = _usingCtx.u(new PricingFetcher());
		const stats = {
			totalEntries: 0,
			entriesWithBoth: 0,
			matches: 0,
			mismatches: 0,
			discrepancies: [],
			modelStats: /* @__PURE__ */ new Map(),
			versionStats: /* @__PURE__ */ new Map()
		};
		for (const file of files) {
			const content = await readFile(file, "utf-8");
			const lines = content.trim().split("\n").filter((line) => line.length > 0);
			for (const line of lines) try {
				const parsed = JSON.parse(line);
				const result = usageDataSchema.safeParse(parsed);
				if (!result.success) continue;
				const data = result.data;
				stats.totalEntries++;
				if (data.costUSD !== void 0 && data.message.model != null && data.message.model !== "<synthetic>") {
					stats.entriesWithBoth++;
					const model = data.message.model;
					const calculatedCost = await fetcher.calculateCostFromTokens(data.message.usage, model);
					const difference = Math.abs(data.costUSD - calculatedCost);
					const percentDiff = data.costUSD > 0 ? difference / data.costUSD * 100 : 0;
					const modelStat = stats.modelStats.get(model) ?? {
						total: 0,
						matches: 0,
						mismatches: 0,
						avgPercentDiff: 0
					};
					modelStat.total++;
					if (data.version != null) {
						const versionStat = stats.versionStats.get(data.version) ?? {
							total: 0,
							matches: 0,
							mismatches: 0,
							avgPercentDiff: 0
						};
						versionStat.total++;
						if (percentDiff < DEBUG_MATCH_THRESHOLD_PERCENT) versionStat.matches++;
						else versionStat.mismatches++;
						versionStat.avgPercentDiff = (versionStat.avgPercentDiff * (versionStat.total - 1) + percentDiff) / versionStat.total;
						stats.versionStats.set(data.version, versionStat);
					}
					if (percentDiff < .1) {
						stats.matches++;
						modelStat.matches++;
					} else {
						stats.mismatches++;
						modelStat.mismatches++;
						stats.discrepancies.push({
							file: path.basename(file),
							timestamp: data.timestamp,
							model,
							originalCost: data.costUSD,
							calculatedCost,
							difference,
							percentDiff,
							usage: data.message.usage
						});
					}
					modelStat.avgPercentDiff = (modelStat.avgPercentDiff * (modelStat.total - 1) + percentDiff) / modelStat.total;
					stats.modelStats.set(model, modelStat);
				}
			} catch {}
		}
		return stats;
	} catch (_) {
		_usingCtx.e = _;
	} finally {
		_usingCtx.d();
	}
}
/**
* Prints a detailed report of pricing mismatches to the console
* @param stats - Mismatch statistics to report
* @param sampleCount - Number of sample discrepancies to show (default: 5)
*/
function printMismatchReport(stats, sampleCount = 5) {
	if (stats.entriesWithBoth === 0) {
		logger.info("No pricing data found to analyze.");
		return;
	}
	const matchRate = stats.matches / stats.entriesWithBoth * 100;
	logger.info("\n=== Pricing Mismatch Debug Report ===");
	logger.info(`Total entries processed: ${stats.totalEntries.toLocaleString()}`);
	logger.info(`Entries with both costUSD and model: ${stats.entriesWithBoth.toLocaleString()}`);
	logger.info(`Matches (within 0.1%): ${stats.matches.toLocaleString()}`);
	logger.info(`Mismatches: ${stats.mismatches.toLocaleString()}`);
	logger.info(`Match rate: ${matchRate.toFixed(2)}%`);
	if (stats.mismatches > 0 && stats.modelStats.size > 0) {
		logger.info("\n=== Model Statistics ===");
		const sortedModels = Array.from(stats.modelStats.entries()).sort((a$1, b) => b[1].mismatches - a$1[1].mismatches);
		for (const [model, modelStat] of sortedModels) if (modelStat.mismatches > 0) {
			const modelMatchRate = modelStat.matches / modelStat.total * 100;
			logger.info(`${model}:`);
			logger.info(`  Total entries: ${modelStat.total.toLocaleString()}`);
			logger.info(`  Matches: ${modelStat.matches.toLocaleString()} (${modelMatchRate.toFixed(1)}%)`);
			logger.info(`  Mismatches: ${modelStat.mismatches.toLocaleString()}`);
			logger.info(`  Avg % difference: ${modelStat.avgPercentDiff.toFixed(1)}%`);
		}
	}
	if (stats.mismatches > 0 && stats.versionStats.size > 0) {
		logger.info("\n=== Version Statistics ===");
		const sortedVersions = Array.from(stats.versionStats.entries()).filter(([_, versionStat]) => versionStat.mismatches > 0).sort((a$1, b) => b[1].mismatches - a$1[1].mismatches);
		for (const [version, versionStat] of sortedVersions) {
			const versionMatchRate = versionStat.matches / versionStat.total * 100;
			logger.info(`${version}:`);
			logger.info(`  Total entries: ${versionStat.total.toLocaleString()}`);
			logger.info(`  Matches: ${versionStat.matches.toLocaleString()} (${versionMatchRate.toFixed(1)}%)`);
			logger.info(`  Mismatches: ${versionStat.mismatches.toLocaleString()}`);
			logger.info(`  Avg % difference: ${versionStat.avgPercentDiff.toFixed(1)}%`);
		}
	}
	if (stats.discrepancies.length > 0 && sampleCount > 0) {
		logger.info(`\n=== Sample Discrepancies (first ${sampleCount}) ===`);
		const samples = stats.discrepancies.slice(0, sampleCount);
		for (const disc of samples) {
			logger.info(`File: ${disc.file}`);
			logger.info(`Timestamp: ${disc.timestamp}`);
			logger.info(`Model: ${disc.model}`);
			logger.info(`Original cost: $${disc.originalCost.toFixed(6)}`);
			logger.info(`Calculated cost: $${disc.calculatedCost.toFixed(6)}`);
			logger.info(`Difference: $${disc.difference.toFixed(6)} (${disc.percentDiff.toFixed(2)}%)`);
			logger.info(`Tokens: ${JSON.stringify(disc.usage)}`);
			logger.info("---");
		}
	}
}
export { detectMismatches, printMismatchReport };
