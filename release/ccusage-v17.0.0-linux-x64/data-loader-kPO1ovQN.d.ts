import { CostMode, PricingFetcher, SortOrder } from "./pricing-fetcher-BsD-6blA.js";
import { z } from "zod";

//#region src/_session-blocks.d.ts

/**
 * Represents a single usage data entry loaded from JSONL files
 */
type LoadedUsageEntry = {
  timestamp: Date;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  costUSD: number | null;
  model: string;
  version?: string;
  projectPath?: string;
};
/**
 * Aggregated token counts for different token types
 */
type TokenCounts = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
};
/**
 * Model breakdown for a session block
 */
type SessionModelBreakdown = {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  cost: number;
};
/**
 * Represents a session block (typically 5-hour billing period) with usage data
 */
type SessionBlock = {
  id: string; // ISO string of block start time
  startTime: Date;
  endTime: Date; // startTime + 5 hours (for normal blocks) or gap end time (for gap blocks)
  actualEndTime?: Date; // Last activity in block
  isActive: boolean;
  isGap?: boolean; // True if this is a gap block
  entries: LoadedUsageEntry[];
  tokenCounts: TokenCounts;
  costUSD: number;
  models: string[];
  modelBreakdowns: SessionModelBreakdown[];
  projects?: string[]; // Unique project paths in this block
};
/**
 * Represents usage burn rate calculations
 */
//#endregion
//#region src/data-loader.d.ts
/**
 * Get all Claude data directories to search for usage data
 * Supports multiple paths: environment variable (comma-separated), new default, and old default
 * @returns Array of valid Claude data directory paths
 */
declare function getClaudePaths(): string[];
/**
 * Zod schema for validating Claude usage data from JSONL files
 */
declare const usageDataSchema: z.ZodObject<{
  timestamp: z.ZodBranded<z.ZodString, "ISOTimestamp">;
  version: z.ZodOptional<z.ZodBranded<z.ZodString, "Version">>;
  message: z.ZodObject<{
    usage: z.ZodObject<{
      input_tokens: z.ZodNumber;
      output_tokens: z.ZodNumber;
      cache_creation_input_tokens: z.ZodOptional<z.ZodNumber>;
      cache_read_input_tokens: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | undefined;
      cache_read_input_tokens?: number | undefined;
    }, {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | undefined;
      cache_read_input_tokens?: number | undefined;
    }>;
    model: z.ZodOptional<z.ZodBranded<z.ZodString, "ModelName">>;
    id: z.ZodOptional<z.ZodBranded<z.ZodString, "MessageId">>;
  }, "strip", z.ZodTypeAny, {
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | undefined;
      cache_read_input_tokens?: number | undefined;
    };
    model?: (string & z.BRAND<"ModelName">) | undefined;
    id?: (string & z.BRAND<"MessageId">) | undefined;
  }, {
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | undefined;
      cache_read_input_tokens?: number | undefined;
    };
    model?: string | undefined;
    id?: string | undefined;
  }>;
  costUSD: z.ZodOptional<z.ZodNumber>;
  requestId: z.ZodOptional<z.ZodBranded<z.ZodString, "RequestId">>;
}, "strip", z.ZodTypeAny, {
  timestamp: string & z.BRAND<"ISOTimestamp">;
  version?: (string & z.BRAND<"Version">) | undefined;
  message: {
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | undefined;
      cache_read_input_tokens?: number | undefined;
    };
    model?: (string & z.BRAND<"ModelName">) | undefined;
    id?: (string & z.BRAND<"MessageId">) | undefined;
  };
  costUSD?: number | undefined;
  requestId?: (string & z.BRAND<"RequestId">) | undefined;
}, {
  timestamp: string;
  version?: string | undefined;
  message: {
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | undefined;
      cache_read_input_tokens?: number | undefined;
    };
    model?: string | undefined;
    id?: string | undefined;
  };
  costUSD?: number | undefined;
  requestId?: string | undefined;
}>;
/**
 * Type definition for Claude usage data entries from JSONL files
 */
type UsageData = z.infer<typeof usageDataSchema>;
/**
 * Zod schema for model-specific usage breakdown data
 */
declare const modelBreakdownSchema: z.ZodObject<{
  modelName: z.ZodBranded<z.ZodString, "ModelName">;
  inputTokens: z.ZodNumber;
  outputTokens: z.ZodNumber;
  cacheCreationTokens: z.ZodNumber;
  cacheReadTokens: z.ZodNumber;
  cost: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
  modelName: string & z.BRAND<"ModelName">;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}, {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}>;
/**
 * Type definition for model-specific usage breakdown
 */
type ModelBreakdown = z.infer<typeof modelBreakdownSchema>;
/**
 * Zod schema for daily usage aggregation data
 */
declare const dailyUsageSchema: z.ZodObject<{
  date: z.ZodBranded<z.ZodString, "DailyDate">;
  inputTokens: z.ZodNumber;
  outputTokens: z.ZodNumber;
  cacheCreationTokens: z.ZodNumber;
  cacheReadTokens: z.ZodNumber;
  totalCost: z.ZodNumber;
  modelsUsed: z.ZodArray<z.ZodBranded<z.ZodString, "ModelName">, "many">;
  modelBreakdowns: z.ZodArray<z.ZodObject<{
    modelName: z.ZodBranded<z.ZodString, "ModelName">;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    cacheCreationTokens: z.ZodNumber;
    cacheReadTokens: z.ZodNumber;
    cost: z.ZodNumber;
  }, "strip", z.ZodTypeAny, {
    modelName: string & z.BRAND<"ModelName">;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }, {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }>, "many">;
}, "strip", z.ZodTypeAny, {
  date: string & z.BRAND<"DailyDate">;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  modelsUsed: (string & z.BRAND<"ModelName">)[];
  modelBreakdowns: {
    modelName: string & z.BRAND<"ModelName">;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }[];
}, {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }[];
}>;
/**
 * Type definition for daily usage aggregation
 */
type DailyUsage = z.infer<typeof dailyUsageSchema>;
/**
 * Zod schema for session-based usage aggregation data
 */
declare const sessionUsageSchema: z.ZodObject<{
  sessionId: z.ZodBranded<z.ZodString, "SessionId">;
  projectPath: z.ZodBranded<z.ZodString, "ProjectPath">;
  inputTokens: z.ZodNumber;
  outputTokens: z.ZodNumber;
  cacheCreationTokens: z.ZodNumber;
  cacheReadTokens: z.ZodNumber;
  totalCost: z.ZodNumber;
  lastActivity: z.ZodBranded<z.ZodString, "ActivityDate">;
  versions: z.ZodArray<z.ZodBranded<z.ZodString, "Version">, "many">;
  modelsUsed: z.ZodArray<z.ZodBranded<z.ZodString, "ModelName">, "many">;
  modelBreakdowns: z.ZodArray<z.ZodObject<{
    modelName: z.ZodBranded<z.ZodString, "ModelName">;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    cacheCreationTokens: z.ZodNumber;
    cacheReadTokens: z.ZodNumber;
    cost: z.ZodNumber;
  }, "strip", z.ZodTypeAny, {
    modelName: string & z.BRAND<"ModelName">;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }, {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }>, "many">;
}, "strip", z.ZodTypeAny, {
  sessionId: string & z.BRAND<"SessionId">;
  projectPath: string & z.BRAND<"ProjectPath">;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  lastActivity: string & z.BRAND<"ActivityDate">;
  versions: (string & z.BRAND<"Version">)[];
  modelsUsed: (string & z.BRAND<"ModelName">)[];
  modelBreakdowns: {
    modelName: string & z.BRAND<"ModelName">;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }[];
}, {
  sessionId: string;
  projectPath: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  lastActivity: string;
  versions: string[];
  modelsUsed: string[];
  modelBreakdowns: {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }[];
}>;
/**
 * Type definition for session-based usage aggregation
 */
type SessionUsage = z.infer<typeof sessionUsageSchema>;
/**
 * Zod schema for monthly usage aggregation data
 */
declare const monthlyUsageSchema: z.ZodObject<{
  month: z.ZodBranded<z.ZodString, "MonthlyDate">;
  inputTokens: z.ZodNumber;
  outputTokens: z.ZodNumber;
  cacheCreationTokens: z.ZodNumber;
  cacheReadTokens: z.ZodNumber;
  totalCost: z.ZodNumber;
  modelsUsed: z.ZodArray<z.ZodBranded<z.ZodString, "ModelName">, "many">;
  modelBreakdowns: z.ZodArray<z.ZodObject<{
    modelName: z.ZodBranded<z.ZodString, "ModelName">;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    cacheCreationTokens: z.ZodNumber;
    cacheReadTokens: z.ZodNumber;
    cost: z.ZodNumber;
  }, "strip", z.ZodTypeAny, {
    modelName: string & z.BRAND<"ModelName">;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }, {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }>, "many">;
}, "strip", z.ZodTypeAny, {
  month: string & z.BRAND<"MonthlyDate">;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  modelsUsed: (string & z.BRAND<"ModelName">)[];
  modelBreakdowns: {
    modelName: string & z.BRAND<"ModelName">;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }[];
}, {
  month: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: {
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }[];
}>;
/**
 * Type definition for monthly usage aggregation
 */
type MonthlyUsage = z.infer<typeof monthlyUsageSchema>;
/**
 * Formats a date string to YYYY-MM-DD format
 * @param dateStr - Input date string
 * @returns Formatted date string in YYYY-MM-DD format
 */
declare function formatDate(dateStr: string): string;
/**
 * Formats a date string to compact format with year on first line and month-day on second
 * @param dateStr - Input date string
 * @returns Formatted date string with newline separator (YYYY\nMM-DD)
 */
declare function formatDateCompact(dateStr: string): string;
/**
 * Create a unique identifier for deduplication using message ID and request ID
 */
declare function createUniqueHash(data: UsageData): string | null;
/**
 * Extract the earliest timestamp from a JSONL file
 * Scans through the file until it finds a valid timestamp
 */
declare function getEarliestTimestamp(filePath: string): Promise<Date | null>;
/**
 * Sort files by their earliest timestamp
 * Files without valid timestamps are placed at the end
 */
declare function sortFilesByTimestamp(files: string[]): Promise<string[]>;
/**
 * Calculates cost for a single usage data entry based on the specified cost calculation mode
 * @param data - Usage data entry
 * @param mode - Cost calculation mode (auto, calculate, or display)
 * @param fetcher - Pricing fetcher instance for calculating costs from tokens
 * @returns Calculated cost in USD
 */
declare function calculateCostForEntry(data: UsageData, mode: CostMode, fetcher: PricingFetcher): Promise<number>;
/**
 * Date range filter for limiting usage data by date
 */
type DateFilter = {
  since?: string; // YYYYMMDD format
  until?: string; // YYYYMMDD format
};
/**
 * Configuration options for loading usage data
 */
type LoadOptions = {
  claudePath?: string; // Custom path to Claude data directory
  mode?: CostMode; // Cost calculation mode
  order?: SortOrder; // Sort order for dates
  offline?: boolean; // Use offline mode for pricing
  sessionDurationHours?: number; // Session block duration in hours
} & DateFilter;
/**
 * Loads and aggregates Claude usage data by day
 * Processes all JSONL files in the Claude projects directory and groups usage by date
 * @param options - Optional configuration for loading and filtering data
 * @returns Array of daily usage summaries sorted by date
 */
declare function loadDailyUsageData(options?: LoadOptions): Promise<DailyUsage[]>;
/**
 * Loads and aggregates Claude usage data by session
 * Groups usage data by project path and session ID based on file structure
 * @param options - Optional configuration for loading and filtering data
 * @returns Array of session usage summaries sorted by last activity
 */
declare function loadSessionData(options?: LoadOptions): Promise<SessionUsage[]>;
/**
 * Loads and aggregates Claude usage data by month
 * Uses daily usage data as the source and groups by month
 * @param options - Optional configuration for loading and filtering data
 * @returns Array of monthly usage summaries sorted by month
 */
declare function loadMonthlyUsageData(options?: LoadOptions): Promise<MonthlyUsage[]>;
/**
 * Loads usage data and organizes it into session blocks (typically 5-hour billing periods)
 * Processes all usage data and groups it into time-based blocks for billing analysis
 * @param options - Optional configuration including session duration and filtering
 * @returns Array of session blocks with usage and cost information
 */
declare function loadSessionBlockData(options?: LoadOptions): Promise<SessionBlock[]>;
//#endregion
export { DailyUsage, DateFilter, LoadOptions, ModelBreakdown, MonthlyUsage, SessionUsage, UsageData, calculateCostForEntry, createUniqueHash, dailyUsageSchema, formatDate, formatDateCompact, getClaudePaths, getEarliestTimestamp, loadDailyUsageData, loadMonthlyUsageData, loadSessionBlockData, loadSessionData, modelBreakdownSchema, monthlyUsageSchema, sessionUsageSchema, sortFilesByTimestamp, usageDataSchema };