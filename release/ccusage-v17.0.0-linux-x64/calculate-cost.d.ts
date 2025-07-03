import { DailyUsage, MonthlyUsage, SessionUsage } from "./data-loader-kPO1ovQN.js";
import "./pricing-fetcher-BsD-6blA.js";

//#region src/calculate-cost.d.ts

/**
 * Token usage data structure containing input, output, and cache token counts
 */
type TokenData = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
};
/**
 * Token totals including cost information
 */
type TokenTotals = TokenData & {
  totalCost: number;
};
/**
 * Complete totals object with token counts, cost, and total token sum
 */
type TotalsObject = TokenTotals & {
  totalTokens: number;
};
/**
 * Calculates total token usage and cost across multiple usage data entries
 * @param data - Array of daily, monthly, or session usage data
 * @returns Aggregated token totals and cost
 */
declare function calculateTotals(data: Array<DailyUsage | MonthlyUsage | SessionUsage>): TokenTotals;
/**
 * Calculates the sum of all token types (input, output, cache creation, cache read)
 * @param tokens - Token data containing different token counts
 * @returns Total number of tokens across all types
 */
declare function getTotalTokens(tokens: TokenData): number;
/**
 * Creates a complete totals object by adding total token count to existing totals
 * @param totals - Token totals with cost information
 * @returns Complete totals object including total token sum
 */
declare function createTotalsObject(totals: TokenTotals): TotalsObject;
//#endregion
export { TokenData, calculateTotals, createTotalsObject, getTotalTokens };