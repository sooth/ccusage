/**
* Calculates total token usage and cost across multiple usage data entries
* @param data - Array of daily, monthly, or session usage data
* @returns Aggregated token totals and cost
*/
function calculateTotals(data) {
	return data.reduce((acc, item) => ({
		inputTokens: acc.inputTokens + item.inputTokens,
		outputTokens: acc.outputTokens + item.outputTokens,
		cacheCreationTokens: acc.cacheCreationTokens + item.cacheCreationTokens,
		cacheReadTokens: acc.cacheReadTokens + item.cacheReadTokens,
		totalCost: acc.totalCost + item.totalCost
	}), {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationTokens: 0,
		cacheReadTokens: 0,
		totalCost: 0
	});
}
/**
* Calculates the sum of all token types (input, output, cache creation, cache read)
* @param tokens - Token data containing different token counts
* @returns Total number of tokens across all types
*/
function getTotalTokens(tokens) {
	return tokens.inputTokens + tokens.outputTokens + tokens.cacheCreationTokens + tokens.cacheReadTokens;
}
/**
* Creates a complete totals object by adding total token count to existing totals
* @param totals - Token totals with cost information
* @returns Complete totals object including total token sum
*/
function createTotalsObject(totals) {
	return {
		...totals,
		totalTokens: getTotalTokens(totals)
	};
}
export { calculateTotals, createTotalsObject, getTotalTokens };
