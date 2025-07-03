import { modelPricingSchema } from "./_types-CH59WmST.js";
import { logger } from "./logger-LJ5xGY9g.js";
import { createRequire } from "node:module";
import path from "node:path";
import F, { homedir } from "node:os";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* @__PURE__ */ createRequire(import.meta.url);
const homeDirectory = F.homedir();
const { env } = process;
const xdgData = env.XDG_DATA_HOME || (homeDirectory ? path.join(homeDirectory, ".local", "share") : void 0);
const xdgConfig = env.XDG_CONFIG_HOME || (homeDirectory ? path.join(homeDirectory, ".config") : void 0);
const xdgState = env.XDG_STATE_HOME || (homeDirectory ? path.join(homeDirectory, ".local", "state") : void 0);
const xdgCache = env.XDG_CACHE_HOME || (homeDirectory ? path.join(homeDirectory, ".cache") : void 0);
const xdgRuntime = env.XDG_RUNTIME_DIR || void 0;
const xdgDataDirectories = (env.XDG_DATA_DIRS || "/usr/local/share/:/usr/share/").split(":");
if (xdgData) xdgDataDirectories.unshift(xdgData);
const xdgConfigDirectories = (env.XDG_CONFIG_DIRS || "/etc/xdg").split(":");
if (xdgConfig) xdgConfigDirectories.unshift(xdgConfig);
/**
* URL for LiteLLM's model pricing and context window data
*/
const LITELLM_PRICING_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
/**
* Default number of recent days to include when filtering blocks
* Used in both session blocks and commands for consistent behavior
*/
const DEFAULT_RECENT_DAYS = 3;
/**
* Threshold percentage for showing usage warnings in blocks command (80%)
* When usage exceeds this percentage of limits, warnings are displayed
*/
const BLOCKS_WARNING_THRESHOLD = .8;
/**
* Terminal width threshold for switching to compact display mode in blocks command
* Below this width, tables use more compact formatting
*/
const BLOCKS_COMPACT_WIDTH_THRESHOLD = 120;
/**
* Default terminal width when stdout.columns is not available in blocks command
* Used as fallback for responsive table formatting
*/
const BLOCKS_DEFAULT_TERMINAL_WIDTH = 120;
/**
* Threshold percentage for considering costs as matching (0.1% tolerance)
* Used in debug cost validation to allow for minor calculation differences
*/
const DEBUG_MATCH_THRESHOLD_PERCENT = .1;
/**
* User's home directory path
* Centralized access to OS home directory for consistent path building
*/
const USER_HOME_DIR = homedir();
/**
* XDG config directory path
* Uses XDG_CONFIG_HOME if set, otherwise falls back to ~/.config
*/
const XDG_CONFIG_DIR = xdgConfig ?? `${USER_HOME_DIR}/.config`;
/**
* Default Claude data directory path (~/.claude)
* Used as base path for loading usage data from JSONL files
*/
const DEFAULT_CLAUDE_CODE_PATH = ".claude";
/**
* Default Claude data directory path using XDG config directory
* Uses XDG_CONFIG_HOME if set, otherwise falls back to ~/.config/claude
*/
const DEFAULT_CLAUDE_CONFIG_PATH = `${XDG_CONFIG_DIR}/claude`;
/**
* Environment variable for specifying multiple Claude data directories
* Supports comma-separated paths for multiple locations
*/
const CLAUDE_CONFIG_DIR_ENV = "CLAUDE_CONFIG_DIR";
/**
* Claude projects directory name within the data directory
* Contains subdirectories for each project with usage data
*/
const CLAUDE_PROJECTS_DIR_NAME = "projects";
/**
* JSONL file glob pattern for finding usage data files
* Used to recursively find all JSONL files in project directories
*/
const USAGE_DATA_GLOB_PATTERN = "**/*.jsonl";
/**
* Default port for MCP server HTTP transport
* Used when no port is specified for MCP server communication
*/
const MCP_DEFAULT_PORT = 8080;
/**
* Default refresh interval in seconds for live monitoring mode
* Used in blocks command for real-time updates
*/
const DEFAULT_REFRESH_INTERVAL_SECONDS = 1;
/**
* Minimum refresh interval in seconds for live monitoring mode
* Prevents too-frequent updates that could impact performance
*/
const MIN_REFRESH_INTERVAL_SECONDS = 1;
/**
* Maximum refresh interval in seconds for live monitoring mode
* Prevents too-slow updates that reduce monitoring effectiveness
*/
const MAX_REFRESH_INTERVAL_SECONDS = 60;
/**
* Frame rate limit for live monitoring (16ms = ~60fps)
* Prevents terminal flickering and excessive CPU usage during rapid updates
*/
const MIN_RENDER_INTERVAL_MS = 16;
var require_usingCtx = __commonJSMin((exports, module) => {
	function _usingCtx() {
		var r = "function" == typeof SuppressedError ? SuppressedError : function(r$1, e$1) {
			var n$1 = Error();
			return n$1.name = "SuppressedError", n$1.error = r$1, n$1.suppressed = e$1, n$1;
		}, e = {}, n = [];
		function using(r$1, e$1) {
			if (null != e$1) {
				if (Object(e$1) !== e$1) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined.");
				if (r$1) var o = e$1[Symbol.asyncDispose || Symbol["for"]("Symbol.asyncDispose")];
				if (void 0 === o && (o = e$1[Symbol.dispose || Symbol["for"]("Symbol.dispose")], r$1)) var t = o;
				if ("function" != typeof o) throw new TypeError("Object is not disposable.");
				t && (o = function o$1() {
					try {
						t.call(e$1);
					} catch (r$2) {
						return Promise.reject(r$2);
					}
				}), n.push({
					v: e$1,
					d: o,
					a: r$1
				});
			} else r$1 && n.push({
				d: e$1,
				a: r$1
			});
			return e$1;
		}
		return {
			e,
			u: using.bind(null, !1),
			a: using.bind(null, !0),
			d: function d() {
				var o, t = this.e, s = 0;
				function next() {
					for (; o = n.pop();) try {
						if (!o.a && 1 === s) return s = 0, n.push(o), Promise.resolve().then(next);
						if (o.d) {
							var r$1 = o.d.call(o.v);
							if (o.a) return s |= 2, Promise.resolve(r$1).then(next, err);
						} else s |= 1;
					} catch (r$2) {
						return err(r$2);
					}
					if (1 === s) return t !== e ? Promise.reject(t) : Promise.resolve();
					if (t !== e) throw t;
				}
				function err(n$1) {
					return t = t !== e ? new r(n$1, t) : n$1, next();
				}
				return next();
			}
		};
	}
	module.exports = _usingCtx, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var import_usingCtx = __toESM(require_usingCtx(), 1);
/**
* Fetches and caches model pricing information from LiteLLM
* Implements Disposable pattern for automatic resource cleanup
*/
var PricingFetcher = class {
	cachedPricing = null;
	offline;
	/**
	* Creates a new PricingFetcher instance
	* @param offline - Whether to use pre-fetched pricing data instead of fetching from API
	*/
	constructor(offline = false) {
		this.offline = offline;
	}
	/**
	* Implements Disposable interface for automatic cleanup
	*/
	[Symbol.dispose]() {
		this.clearCache();
	}
	/**
	* Clears the cached pricing data
	*/
	clearCache() {
		this.cachedPricing = null;
	}
	/**
	* Loads offline pricing data from pre-fetched cache
	* @returns Map of model names to pricing information
	*/
	async loadOfflinePricing() {
		const pricing = new Map(Object.entries({
			"claude-instant-1": {
				"input_cost_per_token": 163e-8,
				"output_cost_per_token": 551e-8
			},
			"claude-instant-1.2": {
				"input_cost_per_token": 163e-9,
				"output_cost_per_token": 551e-9
			},
			"claude-2": {
				"input_cost_per_token": 8e-6,
				"output_cost_per_token": 24e-6
			},
			"claude-2.1": {
				"input_cost_per_token": 8e-6,
				"output_cost_per_token": 24e-6
			},
			"claude-3-haiku-20240307": {
				"input_cost_per_token": 25e-8,
				"output_cost_per_token": 125e-8,
				"cache_creation_input_token_cost": 3e-7,
				"cache_read_input_token_cost": 3e-8
			},
			"claude-3-5-haiku-20241022": {
				"input_cost_per_token": 8e-7,
				"output_cost_per_token": 4e-6,
				"cache_creation_input_token_cost": 1e-6,
				"cache_read_input_token_cost": 8e-8
			},
			"claude-3-5-haiku-latest": {
				"input_cost_per_token": 1e-6,
				"output_cost_per_token": 5e-6,
				"cache_creation_input_token_cost": 125e-8,
				"cache_read_input_token_cost": 1e-7
			},
			"claude-3-opus-latest": {
				"input_cost_per_token": 15e-6,
				"output_cost_per_token": 75e-6,
				"cache_creation_input_token_cost": 1875e-8,
				"cache_read_input_token_cost": 15e-7
			},
			"claude-3-opus-20240229": {
				"input_cost_per_token": 15e-6,
				"output_cost_per_token": 75e-6,
				"cache_creation_input_token_cost": 1875e-8,
				"cache_read_input_token_cost": 15e-7
			},
			"claude-3-sonnet-20240229": {
				"input_cost_per_token": 3e-6,
				"output_cost_per_token": 15e-6
			},
			"claude-3-5-sonnet-latest": {
				"input_cost_per_token": 3e-6,
				"output_cost_per_token": 15e-6,
				"cache_creation_input_token_cost": 375e-8,
				"cache_read_input_token_cost": 3e-7
			},
			"claude-3-5-sonnet-20240620": {
				"input_cost_per_token": 3e-6,
				"output_cost_per_token": 15e-6,
				"cache_creation_input_token_cost": 375e-8,
				"cache_read_input_token_cost": 3e-7
			},
			"claude-opus-4-20250514": {
				"input_cost_per_token": 15e-6,
				"output_cost_per_token": 75e-6,
				"cache_creation_input_token_cost": 1875e-8,
				"cache_read_input_token_cost": 15e-7
			},
			"claude-sonnet-4-20250514": {
				"input_cost_per_token": 3e-6,
				"output_cost_per_token": 15e-6,
				"cache_creation_input_token_cost": 375e-8,
				"cache_read_input_token_cost": 3e-7
			},
			"claude-4-opus-20250514": {
				"input_cost_per_token": 15e-6,
				"output_cost_per_token": 75e-6,
				"cache_creation_input_token_cost": 1875e-8,
				"cache_read_input_token_cost": 15e-7
			},
			"claude-4-sonnet-20250514": {
				"input_cost_per_token": 3e-6,
				"output_cost_per_token": 15e-6,
				"cache_creation_input_token_cost": 375e-8,
				"cache_read_input_token_cost": 3e-7
			},
			"claude-3-7-sonnet-latest": {
				"input_cost_per_token": 3e-6,
				"output_cost_per_token": 15e-6,
				"cache_creation_input_token_cost": 375e-8,
				"cache_read_input_token_cost": 3e-7
			},
			"claude-3-7-sonnet-20250219": {
				"input_cost_per_token": 3e-6,
				"output_cost_per_token": 15e-6,
				"cache_creation_input_token_cost": 375e-8,
				"cache_read_input_token_cost": 3e-7
			},
			"claude-3-5-sonnet-20241022": {
				"input_cost_per_token": 3e-6,
				"output_cost_per_token": 15e-6,
				"cache_creation_input_token_cost": 375e-8,
				"cache_read_input_token_cost": 3e-7
			}
		}));
		this.cachedPricing = pricing;
		return pricing;
	}
	/**
	* Handles fallback to offline pricing when network fetch fails
	* @param originalError - The original error from the network fetch
	* @returns Map of model names to pricing information
	* @throws Error if both network fetch and fallback fail
	*/
	async handleFallbackToCachedPricing(originalError) {
		logger.warn("Failed to fetch model pricing from LiteLLM, falling back to cached pricing data");
		logger.debug("Fetch error details:", originalError);
		try {
			const fallbackPricing = await this.loadOfflinePricing();
			logger.info(`Using cached pricing data for ${fallbackPricing.size} models`);
			return fallbackPricing;
		} catch (fallbackError) {
			logger.error("Failed to load cached pricing data as fallback:", fallbackError);
			logger.error("Original fetch error:", originalError);
			throw new Error("Could not fetch model pricing data and fallback data is unavailable");
		}
	}
	/**
	* Ensures pricing data is loaded, either from cache or by fetching
	* Automatically falls back to offline mode if network fetch fails
	* @returns Map of model names to pricing information
	*/
	async ensurePricingLoaded() {
		if (this.cachedPricing != null) return this.cachedPricing;
		if (this.offline) return this.loadOfflinePricing();
		try {
			logger.warn("Fetching latest model pricing from LiteLLM...");
			const response = await fetch(LITELLM_PRICING_URL);
			if (!response.ok) throw new Error(`Failed to fetch pricing data: ${response.statusText}`);
			const data = await response.json();
			const pricing = /* @__PURE__ */ new Map();
			for (const [modelName, modelData] of Object.entries(data)) if (typeof modelData === "object" && modelData !== null) {
				const parsed = modelPricingSchema.safeParse(modelData);
				if (parsed.success) pricing.set(modelName, parsed.data);
			}
			this.cachedPricing = pricing;
			logger.info(`Loaded pricing for ${pricing.size} models`);
			return pricing;
		} catch (error) {
			return this.handleFallbackToCachedPricing(error);
		}
	}
	/**
	* Fetches all available model pricing data
	* @returns Map of model names to pricing information
	*/
	async fetchModelPricing() {
		return this.ensurePricingLoaded();
	}
	/**
	* Gets pricing information for a specific model with fallback matching
	* Tries exact match first, then provider prefixes, then partial matches
	* @param modelName - Name of the model to get pricing for
	* @returns Model pricing information or null if not found
	*/
	async getModelPricing(modelName) {
		const pricing = await this.ensurePricingLoaded();
		const directMatch = pricing.get(modelName);
		if (directMatch != null) return directMatch;
		const variations = [
			modelName,
			`anthropic/${modelName}`,
			`claude-3-5-${modelName}`,
			`claude-3-${modelName}`,
			`claude-${modelName}`
		];
		for (const variant of variations) {
			const match = pricing.get(variant);
			if (match != null) return match;
		}
		const lowerModel = modelName.toLowerCase();
		for (const [key, value] of pricing) if (key.toLowerCase().includes(lowerModel) || lowerModel.includes(key.toLowerCase())) return value;
		return null;
	}
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
	async calculateCostFromTokens(tokens, modelName) {
		const pricing = await this.getModelPricing(modelName);
		if (pricing == null) return 0;
		return this.calculateCostFromPricing(tokens, pricing);
	}
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
	calculateCostFromPricing(tokens, pricing) {
		let cost = 0;
		if (pricing.input_cost_per_token != null) cost += tokens.input_tokens * pricing.input_cost_per_token;
		if (pricing.output_cost_per_token != null) cost += tokens.output_tokens * pricing.output_cost_per_token;
		if (tokens.cache_creation_input_tokens != null && pricing.cache_creation_input_token_cost != null) cost += tokens.cache_creation_input_tokens * pricing.cache_creation_input_token_cost;
		if (tokens.cache_read_input_tokens != null && pricing.cache_read_input_token_cost != null) cost += tokens.cache_read_input_tokens * pricing.cache_read_input_token_cost;
		return cost;
	}
};
export { BLOCKS_COMPACT_WIDTH_THRESHOLD, BLOCKS_DEFAULT_TERMINAL_WIDTH, BLOCKS_WARNING_THRESHOLD, CLAUDE_CONFIG_DIR_ENV, CLAUDE_PROJECTS_DIR_NAME, DEBUG_MATCH_THRESHOLD_PERCENT, DEFAULT_CLAUDE_CODE_PATH, DEFAULT_CLAUDE_CONFIG_PATH, DEFAULT_RECENT_DAYS, DEFAULT_REFRESH_INTERVAL_SECONDS, MAX_REFRESH_INTERVAL_SECONDS, MCP_DEFAULT_PORT, MIN_REFRESH_INTERVAL_SECONDS, MIN_RENDER_INTERVAL_MS, PricingFetcher, USAGE_DATA_GLOB_PATTERN, USER_HOME_DIR, __commonJSMin, __require, __toESM, require_usingCtx };
