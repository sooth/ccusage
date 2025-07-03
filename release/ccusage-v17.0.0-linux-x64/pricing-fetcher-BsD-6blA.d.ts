import { z } from "zod";

//#region node_modules/type-fest/source/observable-like.d.ts
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- It has to be an `interface` so that it can be merged.
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

/**
@remarks
The TC39 observable proposal defines a `closed` property, but some implementations (such as xstream) do not as of 10/08/2021.
As well, some guidance on making an `Observable` to not include `closed` property.
@see https://github.com/tc39/proposal-observable/blob/master/src/Observable.js#L129-L130
@see https://github.com/staltz/xstream/blob/6c22580c1d84d69773ee4b0905df44ad464955b3/src/index.ts#L79-L85
@see https://github.com/benlesh/symbol-observable#making-an-object-observable

@category Observable
*/

//#endregion
//#region node_modules/type-fest/source/tuple-to-union.d.ts
/**
Convert a tuple/array into a union type of its elements.

This can be useful when you have a fixed set of allowed values and want a type defining only the allowed values, but do not want to repeat yourself.

@example
```
import type {TupleToUnion} from 'type-fest';

const destinations = ['a', 'b', 'c'] as const;

type Destination = TupleToUnion<typeof destinations>;
//=> 'a' | 'b' | 'c'

function verifyDestination(destination: unknown): destination is Destination {
	return destinations.includes(destination as any);
}

type RequestBody = {
	deliverTo: Destination;
};

function verifyRequestBody(body: unknown): body is RequestBody {
	const deliverTo = (body as any).deliverTo;
	return typeof body === 'object' && body !== null && verifyDestination(deliverTo);
}
```

Alternatively, you may use `typeof destinations[number]`. If `destinations` is a tuple, there is no difference. However if `destinations` is a string, the resulting type will the union of the characters in the string. Other types of `destinations` may result in a compile error. In comparison, TupleToUnion will return `never` if a tuple is not provided.

@example
```
const destinations = ['a', 'b', 'c'] as const;

type Destination = typeof destinations[number];
//=> 'a' | 'b' | 'c'

const erroringType = new Set(['a', 'b', 'c']);

type ErroringType = typeof erroringType[number];
//=> Type 'Set<string>' has no matching index signature for type 'number'. ts(2537)

const numberBool: { [n: number]: boolean } = { 1: true };

type NumberBool = typeof numberBool[number];
//=> boolean
```

@category Array
*/
type TupleToUnion<ArrayType> = ArrayType extends readonly unknown[] ? ArrayType[number] : never;
//#endregion
//#region src/_types.d.ts

/**
 * Available cost calculation modes
 * - auto: Use pre-calculated costs when available, otherwise calculate from tokens
 * - calculate: Always calculate costs from token counts using model pricing
 * - display: Always use pre-calculated costs, show 0 for missing costs
 */
declare const CostModes: readonly ["auto", "calculate", "display"];
/**
 * Union type for cost calculation modes
 */
type CostMode = TupleToUnion<typeof CostModes>;
/**
 * Available sort orders for data presentation
 */
declare const SortOrders: readonly ["desc", "asc"];
/**
 * Union type for sort order options
 */
type SortOrder = TupleToUnion<typeof SortOrders>;
/**
 * Zod schema for model pricing information from LiteLLM
 */
declare const modelPricingSchema: z.ZodObject<{
  input_cost_per_token: z.ZodOptional<z.ZodNumber>;
  output_cost_per_token: z.ZodOptional<z.ZodNumber>;
  cache_creation_input_token_cost: z.ZodOptional<z.ZodNumber>;
  cache_read_input_token_cost: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
  input_cost_per_token?: number | undefined;
  output_cost_per_token?: number | undefined;
  cache_creation_input_token_cost?: number | undefined;
  cache_read_input_token_cost?: number | undefined;
}, {
  input_cost_per_token?: number | undefined;
  output_cost_per_token?: number | undefined;
  cache_creation_input_token_cost?: number | undefined;
  cache_read_input_token_cost?: number | undefined;
}>;
/**
 * Type definition for model pricing information
 */
type ModelPricing = z.infer<typeof modelPricingSchema>;
//#endregion
//#region src/pricing-fetcher.d.ts
/**
 * Fetches and caches model pricing information from LiteLLM
 * Implements Disposable pattern for automatic resource cleanup
 */
declare class PricingFetcher implements Disposable {
  private cachedPricing;
  private readonly offline;
  /**
   * Creates a new PricingFetcher instance
   * @param offline - Whether to use pre-fetched pricing data instead of fetching from API
   */
  constructor(offline?: boolean);
  /**
   * Implements Disposable interface for automatic cleanup
   */
  [Symbol.dispose](): void;
  /**
   * Clears the cached pricing data
   */
  clearCache(): void;
  private loadOfflinePricing;
  private handleFallbackToCachedPricing;
  private ensurePricingLoaded;
  /**
   * Fetches all available model pricing data
   * @returns Map of model names to pricing information
   */
  fetchModelPricing(): Promise<Map<string, ModelPricing>>;
  /**
   * Gets pricing information for a specific model with fallback matching
   * Tries exact match first, then provider prefixes, then partial matches
   * @param modelName - Name of the model to get pricing for
   * @returns Model pricing information or null if not found
   */
  getModelPricing(modelName: string): Promise<ModelPricing | null>;
  /**
   * Calculates the cost for given token usage and model
   * @param tokens - Token usage breakdown
   * @param tokens.input_tokens - Number of input tokens
   * @param tokens.output_tokens - Number of output tokens
   * @param tokens.cache_creation_input_tokens - Number of cache creation tokens
   * @param tokens.cache_read_input_tokens - Number of cache read tokens
   * @param modelName - Name of the model used
   * @returns Total cost in USD
   */
  calculateCostFromTokens(tokens: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }, modelName: string): Promise<number>;
  /**
   * Calculates cost from token usage and pricing information
   * @param tokens - Token usage breakdown
   * @param tokens.input_tokens - Number of input tokens
   * @param tokens.output_tokens - Number of output tokens
   * @param tokens.cache_creation_input_tokens - Number of cache creation tokens
   * @param tokens.cache_read_input_tokens - Number of cache read tokens
   * @param pricing - Model pricing rates
   * @returns Total cost in USD
   */
  calculateCostFromPricing(tokens: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }, pricing: ModelPricing): number;
}
//#endregion
export { CostMode, PricingFetcher, SortOrder };