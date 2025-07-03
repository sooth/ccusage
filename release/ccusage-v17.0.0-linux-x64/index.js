#!/usr/bin/env node
import { BLOCKS_COMPACT_WIDTH_THRESHOLD, BLOCKS_DEFAULT_TERMINAL_WIDTH, BLOCKS_WARNING_THRESHOLD, CLAUDE_PROJECTS_DIR_NAME, DEFAULT_RECENT_DAYS, DEFAULT_REFRESH_INTERVAL_SECONDS, MAX_REFRESH_INTERVAL_SECONDS, MCP_DEFAULT_PORT, MIN_REFRESH_INTERVAL_SECONDS, MIN_RENDER_INTERVAL_MS, PricingFetcher, USAGE_DATA_GLOB_PATTERN, __commonJSMin, __require, __toESM, require_usingCtx } from "./pricing-fetcher-CHQAtwwA.js";
import { CostModes, SortOrders, filterDateSchema } from "./_types-CH59WmST.js";
import { calculateTotals, createTotalsObject, getTotalTokens } from "./calculate-cost-B0RYn0Vm.js";
import { DEFAULT_SESSION_DURATION_HOURS, calculateBurnRate, calculateCostForEntry, createUniqueHash, filterRecentBlocks, formatDateCompact, getClaudePaths, getEarliestTimestamp, glob, identifySessionBlocks, loadDailyUsageData, loadMonthlyUsageData, loadSessionBlockData, loadSessionData, projectBlockUsage, sortFilesByTimestamp, uniq, usageDataSchema } from "./data-loader-D4kzdTVq.js";
import { description, log, logger, name, version } from "./logger-LJ5xGY9g.js";
import { detectMismatches, printMismatchReport } from "./debug-D4Capzfz.js";
import { ServerSubmissionManager, extractProjectDataFromSessionBlock } from "./_server-client-DGOoKhQB.js";
import { createMcpHttpApp, createMcpServer, startMcpServerStdio } from "./mcp-DAyurfq6.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process$1 from "node:process";
import { hostname } from "node:os";
import crypto from "node:crypto";
import { createServer } from "node:http";
import { Http2ServerRequest } from "node:http2";
import { Readable } from "node:stream";
/**
* The default locale string, which format is BCP 47 language tag.
*/
const DEFAULT_LOCALE = "en-US";
const BUILT_IN_PREFIX = "_";
const ARG_PREFIX = "arg";
const BUILT_IN_KEY_SEPARATOR = ":";
const ANONYMOUS_COMMAND_NAME = "(anonymous)";
const NOOP = () => {};
const COMMON_ARGS = {
	help: {
		type: "boolean",
		short: "h",
		description: "Display this help message"
	},
	version: {
		type: "boolean",
		short: "v",
		description: "Display this version"
	}
};
const COMMAND_OPTIONS_DEFAULT = {
	name: void 0,
	description: void 0,
	version: void 0,
	cwd: void 0,
	usageSilent: false,
	subCommands: void 0,
	leftMargin: 2,
	middleMargin: 10,
	usageOptionType: false,
	usageOptionValue: true,
	renderHeader: void 0,
	renderUsage: void 0,
	renderValidationErrors: void 0,
	translationAdapterFactory: void 0
};
function isLazyCommand(cmd) {
	return typeof cmd === "function" && "commandName" in cmd && !!cmd.commandName;
}
async function resolveLazyCommand(cmd, name$1, needRunResolving = false) {
	let command;
	if (isLazyCommand(cmd)) {
		command = Object.assign(create(), {
			name: cmd.commandName,
			description: cmd.description,
			args: cmd.args,
			examples: cmd.examples,
			resource: cmd.resource
		});
		if (needRunResolving) {
			const loaded = await cmd();
			if (typeof loaded === "function") command.run = loaded;
			else if (typeof loaded === "object") {
				if (loaded.run == null) throw new TypeError(`'run' is required in command: ${cmd.name || name$1}`);
				command.run = loaded.run;
				command.name = loaded.name;
				command.description = loaded.description;
				command.args = loaded.args;
				command.examples = loaded.examples;
				command.resource = loaded.resource;
			} else throw new TypeError(`Cannot resolve command: ${cmd.name || name$1}`);
		}
	} else command = Object.assign(create(), cmd);
	if (command.name == null && name$1) command.name = name$1;
	return deepFreeze(command);
}
function resolveBuiltInKey(key) {
	return `${BUILT_IN_PREFIX}${BUILT_IN_KEY_SEPARATOR}${key}`;
}
function resolveArgKey(key) {
	return `${ARG_PREFIX}${BUILT_IN_KEY_SEPARATOR}${key}`;
}
async function resolveExamples(ctx, examples) {
	return typeof examples === "string" ? examples : typeof examples === "function" ? await examples(ctx) : "";
}
function mapResourceWithBuiltinKey(resource) {
	return Object.entries(resource).reduce((acc, [key, value]) => {
		acc[resolveBuiltInKey(key)] = value;
		return acc;
	}, create());
}
function create(obj = null) {
	return Object.create(obj);
}
function log$1(...args) {
	console.log(...args);
}
function deepFreeze(obj) {
	if (obj === null || typeof obj !== "object") return obj;
	for (const key of Object.keys(obj)) {
		const value = obj[key];
		if (typeof value === "object" && value !== null) deepFreeze(value);
	}
	return Object.freeze(obj);
}
var COMMAND = "COMMAND";
var COMMANDS = "COMMANDS";
var SUBCOMMAND = "SUBCOMMAND";
var USAGE = "USAGE";
var ARGUMENTS = "ARGUMENTS";
var OPTIONS = "OPTIONS";
var EXAMPLES = "EXAMPLES";
var FORMORE = "For more info, run any command with the `--help` flag:";
var NEGATABLE = "Negatable of";
var DEFAULT = "default";
var CHOICES = "choices";
var help = "Display this help message";
var version$1 = "Display this version";
var en_US_default = {
	COMMAND,
	COMMANDS,
	SUBCOMMAND,
	USAGE,
	ARGUMENTS,
	OPTIONS,
	EXAMPLES,
	FORMORE,
	NEGATABLE,
	DEFAULT,
	CHOICES,
	help,
	version: version$1
};
function createTranslationAdapter(options) {
	return new DefaultTranslation(options);
}
var DefaultTranslation = class {
	#resources = /* @__PURE__ */ new Map();
	#options;
	constructor(options) {
		this.#options = options;
		this.#resources.set(options.locale, create());
		if (options.locale !== options.fallbackLocale) this.#resources.set(options.fallbackLocale, create());
	}
	getResource(locale) {
		return this.#resources.get(locale);
	}
	setResource(locale, resource) {
		this.#resources.set(locale, resource);
	}
	getMessage(locale, key) {
		const resource = this.getResource(locale);
		if (resource) return resource[key];
		return void 0;
	}
	translate(locale, key, values = create()) {
		let message = this.getMessage(locale, key);
		if (message === void 0 && locale !== this.#options.fallbackLocale) message = this.getMessage(this.#options.fallbackLocale, key);
		if (message === void 0) return;
		return message.replaceAll(/\{\{(\w+)\}\}/g, (_, name$1) => {
			return values[name$1] == null ? "" : values[name$1].toString();
		});
	}
};
const BUILT_IN_PREFIX_CODE = BUILT_IN_PREFIX.codePointAt(0);
/**
* Create a {@link CommandContext | command context}
* @param param A {@link CommandContextParams | parameters} to create a {@link CommandContext | command context}
* @returns A {@link CommandContext | command context}, which is readonly
*/
async function createCommandContext({ args, values, positionals, rest, argv: argv$1, tokens, command, cliOptions, callMode = "entry", omitted = false }) {
	/**
	* normailize the options schema and values, to avoid prototype pollution
	*/
	const _args = Object.entries(args).reduce((acc, [key, value]) => {
		acc[key] = Object.assign(create(), value);
		return acc;
	}, create());
	/**
	* setup the environment
	*/
	const env$2 = Object.assign(create(), COMMAND_OPTIONS_DEFAULT, cliOptions);
	const locale = resolveLocale(cliOptions.locale);
	const localeStr = locale.toString();
	const translationAdapterFactory = cliOptions.translationAdapterFactory || createTranslationAdapter;
	const adapter = translationAdapterFactory({
		locale: localeStr,
		fallbackLocale: DEFAULT_LOCALE
	});
	const localeResources = /* @__PURE__ */ new Map();
	let builtInLoadedResources;
	/**
	* load the built-in locale resources
	*/
	localeResources.set(DEFAULT_LOCALE, mapResourceWithBuiltinKey(en_US_default));
	if (DEFAULT_LOCALE !== localeStr) try {
		builtInLoadedResources = (await import(`./locales/${localeStr}.json`, { with: { type: "json" } })).default;
		localeResources.set(localeStr, mapResourceWithBuiltinKey(builtInLoadedResources));
	} catch {}
	/**
	* define the translation function, which is used to {@link CommandContext.translate}.
	*
	*/
	function translate(key, values$1 = create()) {
		const strKey = key;
		if (strKey.codePointAt(0) === BUILT_IN_PREFIX_CODE) {
			const resource = localeResources.get(localeStr) || localeResources.get(DEFAULT_LOCALE);
			return resource[strKey] || strKey;
		} else return adapter.translate(locale.toString(), strKey, values$1) || "";
	}
	/**
	* load the sub commands
	*/
	let cachedCommands;
	async function loadCommands() {
		if (cachedCommands) return cachedCommands;
		const subCommands$1 = [...cliOptions.subCommands || []];
		return cachedCommands = await Promise.all(subCommands$1.map(async ([name$1, cmd]) => await resolveLazyCommand(cmd, name$1)));
	}
	/**
	* create the context
	*/
	const ctx = deepFreeze(Object.assign(create(), {
		name: getCommandName(command),
		description: command.description,
		omitted,
		callMode,
		locale,
		env: env$2,
		args: _args,
		values,
		positionals,
		rest,
		_: argv$1,
		tokens,
		toKebab: command.toKebab,
		log: cliOptions.usageSilent ? NOOP : log$1,
		loadCommands,
		translate
	}));
	/**
	* load the command resources
	*/
	const loadedOptionsResources = Object.entries(args).map(([key, arg]) => {
		const description$1 = arg.description || "";
		return [key, description$1];
	});
	const defaultCommandResource = loadedOptionsResources.reduce((res, [key, value]) => {
		res[resolveArgKey(key)] = value;
		return res;
	}, create());
	defaultCommandResource.description = command.description || "";
	defaultCommandResource.examples = await resolveExamples(ctx, command.examples);
	adapter.setResource(DEFAULT_LOCALE, defaultCommandResource);
	const originalResource = await loadCommandResource(ctx, command);
	if (originalResource) {
		const resource = Object.assign(create(), originalResource, { examples: await resolveExamples(ctx, originalResource.examples) });
		if (builtInLoadedResources) {
			resource.help = builtInLoadedResources.help;
			resource.version = builtInLoadedResources.version;
		}
		adapter.setResource(localeStr, resource);
	}
	return ctx;
}
function getCommandName(cmd) {
	if (isLazyCommand(cmd)) return cmd.commandName || cmd.name || ANONYMOUS_COMMAND_NAME;
	else if (typeof cmd === "object") return cmd.name || ANONYMOUS_COMMAND_NAME;
	else return ANONYMOUS_COMMAND_NAME;
}
function resolveLocale(locale) {
	return locale instanceof Intl.Locale ? locale : typeof locale === "string" ? new Intl.Locale(locale) : new Intl.Locale(DEFAULT_LOCALE);
}
async function loadCommandResource(ctx, command) {
	let resource;
	try {
		resource = await command.resource?.(ctx);
	} catch {}
	return resource;
}
/**
* Define a {@link Command | command} with type inference
* @param definition A {@link Command | command} definition
* @returns A {@link Command | command} definition with type inference
*/
function define(definition) {
	return definition;
}
/**
* Entry point of utils.
*
* Note that this entry point is used by gunshi to import utility functions.
*
* @module
*/
/**
* @author kazuya kawaguchi (a.k.a. kazupon)
* @license MIT
*/
function kebabnize(str) {
	return str.replace(/[A-Z]/g, (match, offset) => (offset > 0 ? "-" : "") + match.toLowerCase());
}
/**
* Render the header.
* @param ctx A {@link CommandContext | command context}
* @returns A rendered header.
*/
function renderHeader(ctx) {
	const title = ctx.env.description || ctx.env.name || "";
	return Promise.resolve(title ? `${title} (${ctx.env.name || ""}${ctx.env.version ? ` v${ctx.env.version}` : ""})` : title);
}
const COMMON_ARGS_KEYS = Object.keys(COMMON_ARGS);
/**
* Render the usage.
* @param ctx A {@link CommandContext | command context}
* @returns A rendered usage.
*/
async function renderUsage(ctx) {
	const messages$1 = [];
	if (!ctx.omitted) {
		const description$1 = resolveDescription(ctx);
		if (description$1) messages$1.push(description$1, "");
	}
	messages$1.push(...await renderUsageSection(ctx), "");
	if (ctx.omitted && await hasCommands(ctx)) messages$1.push(...await renderCommandsSection(ctx), "");
	if (hasPositionalArgs(ctx)) messages$1.push(...await renderPositionalArgsSection(ctx), "");
	if (hasOptionalArgs(ctx)) messages$1.push(...await renderOptionalArgsSection(ctx), "");
	const examples = await renderExamplesSection(ctx);
	if (examples.length > 0) messages$1.push(...examples, "");
	return messages$1.join("\n");
}
/**
* Render the positional arguments section
* @param ctx A {@link CommandContext | command context}
* @returns A rendered arguments section
*/
async function renderPositionalArgsSection(ctx) {
	const messages$1 = [];
	messages$1.push(`${ctx.translate(resolveBuiltInKey("ARGUMENTS"))}:`);
	messages$1.push(await generatePositionalArgsUsage(ctx));
	return messages$1;
}
/**
* Render the optional arguments section
* @param ctx A {@link CommandContext | command context}
* @returns A rendered options section
*/
async function renderOptionalArgsSection(ctx) {
	const messages$1 = [];
	messages$1.push(`${ctx.translate(resolveBuiltInKey("OPTIONS"))}:`);
	messages$1.push(await generateOptionalArgsUsage(ctx, getOptionalArgsPairs(ctx)));
	return messages$1;
}
/**
* Render the examples section
* @param ctx A {@link CommandContext | command context}
* @returns A rendered examples section
*/
async function renderExamplesSection(ctx) {
	const messages$1 = [];
	const resolvedExamples = await resolveExamples$1(ctx);
	if (resolvedExamples) {
		const examples = resolvedExamples.split("\n").map((example) => example.padStart(ctx.env.leftMargin + example.length));
		messages$1.push(`${ctx.translate(resolveBuiltInKey("EXAMPLES"))}:`, ...examples);
	}
	return messages$1;
}
/**
* Render the usage section
* @param ctx A {@link CommandContext | command context}
* @returns A rendered usage section
*/
async function renderUsageSection(ctx) {
	const messages$1 = [`${ctx.translate(resolveBuiltInKey("USAGE"))}:`];
	if (ctx.omitted) {
		const defaultCommand = `${resolveEntry(ctx)}${await hasCommands(ctx) ? ` [${resolveSubCommand(ctx)}]` : ""} ${[generateOptionsSymbols(ctx), generatePositionalSymbols(ctx)].filter(Boolean).join(" ")}`;
		messages$1.push(defaultCommand.padStart(ctx.env.leftMargin + defaultCommand.length));
		if (await hasCommands(ctx)) {
			const commandsUsage = `${resolveEntry(ctx)} <${ctx.translate(resolveBuiltInKey("COMMANDS"))}>`;
			messages$1.push(commandsUsage.padStart(ctx.env.leftMargin + commandsUsage.length));
		}
	} else {
		const usageStr = `${resolveEntry(ctx)} ${resolveSubCommand(ctx)} ${[generateOptionsSymbols(ctx), generatePositionalSymbols(ctx)].filter(Boolean).join(" ")}`;
		messages$1.push(usageStr.padStart(ctx.env.leftMargin + usageStr.length));
	}
	return messages$1;
}
/**
* Render the commands section
* @param ctx A {@link CommandContext | command context}
* @returns A rendered commands section
*/
async function renderCommandsSection(ctx) {
	const messages$1 = [`${ctx.translate(resolveBuiltInKey("COMMANDS"))}:`];
	const loadedCommands = await ctx.loadCommands();
	const commandMaxLength = Math.max(...loadedCommands.map((cmd) => (cmd.name || "").length));
	const commandsStr = await Promise.all(loadedCommands.map((cmd) => {
		const key = cmd.name || "";
		const desc = cmd.description || "";
		const command = `${key.padEnd(commandMaxLength + ctx.env.middleMargin)}${desc} `;
		return `${command.padStart(ctx.env.leftMargin + command.length)} `;
	}));
	messages$1.push(...commandsStr, "", ctx.translate(resolveBuiltInKey("FORMORE")));
	messages$1.push(...loadedCommands.map((cmd) => {
		const commandHelp = `${ctx.env.name} ${cmd.name} --help`;
		return `${commandHelp.padStart(ctx.env.leftMargin + commandHelp.length)}`;
	}));
	return messages$1;
}
/**
* Resolve the entry command name
* @param ctx A {@link CommandContext | command context}
* @returns The entry command name
*/
function resolveEntry(ctx) {
	return ctx.env.name || ctx.translate(resolveBuiltInKey("COMMAND"));
}
/**
* Resolve the sub command name
* @param ctx A {@link CommandContext | command context}
* @returns The sub command name
*/
function resolveSubCommand(ctx) {
	return ctx.name || ctx.translate(resolveBuiltInKey("SUBCOMMAND"));
}
/**
* Resolve the command description
* @param ctx A {@link CommandContext | command context}
* @returns resolved command description
*/
function resolveDescription(ctx) {
	return ctx.translate("description") || ctx.description || "";
}
/**
* Resolve the command examples
* @param ctx A {@link CommandContext | command context}
* @returns resolved command examples, if not resolved, return empty string
*/
async function resolveExamples$1(ctx) {
	const ret = ctx.translate("examples");
	if (ret) return ret;
	const command = ctx.env.subCommands?.get(ctx.name || "");
	return await resolveExamples(ctx, command?.examples);
}
/**
* Check if the command has sub commands
* @param ctx A {@link CommandContext | command context}
* @returns True if the command has sub commands
*/
async function hasCommands(ctx) {
	const loadedCommands = await ctx.loadCommands();
	return loadedCommands.length > 1;
}
/**
* Check if the command has optional arguments
* @param ctx A {@link CommandContext | command context}
* @returns True if the command has options
*/
function hasOptionalArgs(ctx) {
	return !!(ctx.args && Object.values(ctx.args).some((arg) => arg.type !== "positional"));
}
/**
* Check if the command has positional arguments
* @param ctx A {@link CommandContext | command context}
* @returns True if the command has options
*/
function hasPositionalArgs(ctx) {
	return !!(ctx.args && Object.values(ctx.args).some((arg) => arg.type === "positional"));
}
/**
* Check if all options have default values
* @param ctx A {@link CommandContext | command context}
* @returns True if all options have default values
*/
function hasAllDefaultOptions(ctx) {
	return !!(ctx.args && Object.values(ctx.args).every((arg) => arg.default));
}
/**
* Generate options symbols for usage
* @param ctx A {@link CommandContext | command context}
* @returns Options symbols for usage
*/
function generateOptionsSymbols(ctx) {
	return hasOptionalArgs(ctx) ? hasAllDefaultOptions(ctx) ? `[${ctx.translate(resolveBuiltInKey("OPTIONS"))}]` : `<${ctx.translate(resolveBuiltInKey("OPTIONS"))}>` : "";
}
function makeShortLongOptionPair(schema, name$1, toKebab) {
	const displayName = toKebab || schema.toKebab ? kebabnize(name$1) : name$1;
	let key = `--${displayName}`;
	if (schema.short) key = `-${schema.short}, ${key}`;
	return key;
}
/**
* Get optional arguments pairs for usage
* @param ctx A {@link CommandContext | command context}
* @returns Options pairs for usage
*/
function getOptionalArgsPairs(ctx) {
	return Object.entries(ctx.args).reduce((acc, [name$1, schema]) => {
		if (schema.type === "positional") return acc;
		let key = makeShortLongOptionPair(schema, name$1, ctx.toKebab);
		if (schema.type !== "boolean") {
			const displayName = ctx.toKebab || schema.toKebab ? kebabnize(name$1) : name$1;
			key = schema.default ? `${key} [${displayName}]` : `${key} <${displayName}>`;
		}
		acc[name$1] = key;
		if (schema.type === "boolean" && schema.negatable && !COMMON_ARGS_KEYS.includes(name$1)) {
			const displayName = ctx.toKebab || schema.toKebab ? kebabnize(name$1) : name$1;
			acc[`no-${name$1}`] = `--no-${displayName}`;
		}
		return acc;
	}, create());
}
const resolveNegatableKey = (key) => key.split("no-")[1];
function resolveNegatableType(key, ctx) {
	return ctx.args[key.startsWith("no-") ? resolveNegatableKey(key) : key].type;
}
function generateDefaultDisplayValue(ctx, schema) {
	return `${ctx.translate(resolveBuiltInKey("DEFAULT"))}: ${schema.default}`;
}
function resolveDisplayValue(ctx, key) {
	if (COMMON_ARGS_KEYS.includes(key)) return "";
	const schema = ctx.args[key];
	if ((schema.type === "boolean" || schema.type === "number" || schema.type === "string" || schema.type === "custom") && schema.default !== void 0) return `(${generateDefaultDisplayValue(ctx, schema)})`;
	if (schema.type === "enum") {
		const _default = schema.default !== void 0 ? generateDefaultDisplayValue(ctx, schema) : "";
		const choices = `${ctx.translate(resolveBuiltInKey("CHOICES"))}: ${schema.choices.join(" | ")}`;
		return `(${_default ? `${_default}, ${choices}` : choices})`;
	}
	return "";
}
/**
* Generate optional arguments usage
* @param ctx A {@link CommandContext | command context}
* @param optionsPairs Options pairs for usage
* @returns Generated options usage
*/
async function generateOptionalArgsUsage(ctx, optionsPairs) {
	const optionsMaxLength = Math.max(...Object.entries(optionsPairs).map(([_, value]) => value.length));
	const optionSchemaMaxLength = ctx.env.usageOptionType ? Math.max(...Object.entries(optionsPairs).map(([key]) => resolveNegatableType(key, ctx).length)) : 0;
	const usages = await Promise.all(Object.entries(optionsPairs).map(([key, value]) => {
		let rawDesc = ctx.translate(resolveArgKey(key));
		if (!rawDesc && key.startsWith("no-")) {
			const name$1 = resolveNegatableKey(key);
			const schema = ctx.args[name$1];
			const optionKey = makeShortLongOptionPair(schema, name$1, ctx.toKebab);
			rawDesc = `${ctx.translate(resolveBuiltInKey("NEGATABLE"))} ${optionKey}`;
		}
		const optionsSchema = ctx.env.usageOptionType ? `[${resolveNegatableType(key, ctx)}] ` : "";
		const valueDesc = key.startsWith("no-") ? "" : resolveDisplayValue(ctx, key);
		const desc = `${optionsSchema ? optionsSchema.padEnd(optionSchemaMaxLength + 3) : ""}${rawDesc}`;
		const option = `${value.padEnd(optionsMaxLength + ctx.env.middleMargin)}${desc}${valueDesc ? ` ${valueDesc}` : ""}`;
		return `${option.padStart(ctx.env.leftMargin + option.length)}`;
	}));
	return usages.join("\n");
}
function getPositionalArgs(ctx) {
	return Object.entries(ctx.args).filter(([_, schema]) => schema.type === "positional");
}
async function generatePositionalArgsUsage(ctx) {
	const positionals = getPositionalArgs(ctx);
	const argsMaxLength = Math.max(...positionals.map(([name$1]) => name$1.length));
	const usages = await Promise.all(positionals.map(([name$1]) => {
		const desc = ctx.translate(resolveArgKey(name$1)) || ctx.args[name$1].description || "";
		const arg = `${name$1.padEnd(argsMaxLength + ctx.env.middleMargin)} ${desc}`;
		return `${arg.padStart(ctx.env.leftMargin + arg.length)}`;
	}));
	return usages.join("\n");
}
function generatePositionalSymbols(ctx) {
	return hasPositionalArgs(ctx) ? getPositionalArgs(ctx).map(([name$1]) => `<${name$1}>`).join(" ") : "";
}
/**
* Render the validation errors.
* @param ctx A {@link CommandContext | command context}
* @param error An {@link AggregateError} of option in `args-token` validation
* @returns A rendered validation error.
*/
function renderValidationErrors(_ctx, error) {
	const messages$1 = [];
	for (const err of error.errors) messages$1.push(err.message);
	return Promise.resolve(messages$1.join("\n"));
}
const HYPHEN_CHAR = "-";
const HYPHEN_CODE = HYPHEN_CHAR.codePointAt(0);
const EQUAL_CHAR = "=";
const EQUAL_CODE = EQUAL_CHAR.codePointAt(0);
const TERMINATOR = "--";
const SHORT_OPTION_PREFIX = HYPHEN_CHAR;
const LONG_OPTION_PREFIX = "--";
/**
* Parse command line arguments.
* @example
* ```js
* import { parseArgs } from 'args-tokens' // for Node.js and Bun
* // import { parseArgs } from 'jsr:@kazupon/args-tokens' // for Deno
*
* const tokens = parseArgs(['--foo', 'bar', '-x', '--bar=baz'])
* // do something with using tokens
* // ...
* console.log('tokens:', tokens)
* ```
* @param args command line arguments
* @param options parse options
* @returns Argument tokens.
*/
function parseArgs(args, options = {}) {
	const { allowCompatible = false } = options;
	const tokens = [];
	const remainings = [...args];
	let index = -1;
	let groupCount = 0;
	let hasShortValueSeparator = false;
	while (remainings.length > 0) {
		const arg = remainings.shift();
		if (arg == void 0) break;
		const nextArg = remainings[0];
		if (groupCount > 0) groupCount--;
		else index++;
		if (arg === TERMINATOR) {
			tokens.push({
				kind: "option-terminator",
				index
			});
			const mapped = remainings.map((arg$1) => {
				return {
					kind: "positional",
					index: ++index,
					value: arg$1
				};
			});
			tokens.push(...mapped);
			break;
		}
		if (isShortOption(arg)) {
			const shortOption = arg.charAt(1);
			let value;
			let inlineValue;
			if (groupCount) {
				tokens.push({
					kind: "option",
					name: shortOption,
					rawName: arg,
					index,
					value,
					inlineValue
				});
				if (groupCount === 1 && hasOptionValue(nextArg)) {
					value = remainings.shift();
					if (hasShortValueSeparator) {
						inlineValue = true;
						hasShortValueSeparator = false;
					}
					tokens.push({
						kind: "option",
						index,
						value,
						inlineValue
					});
				}
			} else tokens.push({
				kind: "option",
				name: shortOption,
				rawName: arg,
				index,
				value,
				inlineValue
			});
			if (value != null) ++index;
			continue;
		}
		if (isShortOptionGroup(arg)) {
			const expanded = [];
			let shortValue = "";
			for (let i = 1; i < arg.length; i++) {
				const shortableOption = arg.charAt(i);
				if (hasShortValueSeparator) shortValue += shortableOption;
				else if (!allowCompatible && shortableOption.codePointAt(0) === EQUAL_CODE) hasShortValueSeparator = true;
				else expanded.push(`${SHORT_OPTION_PREFIX}${shortableOption}`);
			}
			if (shortValue) expanded.push(shortValue);
			remainings.unshift(...expanded);
			groupCount = expanded.length;
			continue;
		}
		if (isLongOption(arg)) {
			const longOption = arg.slice(2);
			tokens.push({
				kind: "option",
				name: longOption,
				rawName: arg,
				index,
				value: void 0,
				inlineValue: void 0
			});
			continue;
		}
		if (isLongOptionAndValue(arg)) {
			const equalIndex = arg.indexOf(EQUAL_CHAR);
			const longOption = arg.slice(2, equalIndex);
			const value = arg.slice(equalIndex + 1);
			tokens.push({
				kind: "option",
				name: longOption,
				rawName: `${LONG_OPTION_PREFIX}${longOption}`,
				index,
				value,
				inlineValue: true
			});
			continue;
		}
		tokens.push({
			kind: "positional",
			index,
			value: arg
		});
	}
	return tokens;
}
/**
* Check if `arg` is a short option (e.g. `-f`).
* @param arg the argument to check
* @returns whether `arg` is a short option.
*/
function isShortOption(arg) {
	return arg.length === 2 && arg.codePointAt(0) === HYPHEN_CODE && arg.codePointAt(1) !== HYPHEN_CODE;
}
/**
* Check if `arg` is a short option group (e.g. `-abc`).
* @param arg the argument to check
* @returns whether `arg` is a short option group.
*/
function isShortOptionGroup(arg) {
	if (arg.length <= 2) return false;
	if (arg.codePointAt(0) !== HYPHEN_CODE) return false;
	if (arg.codePointAt(1) === HYPHEN_CODE) return false;
	return true;
}
/**
* Check if `arg` is a long option (e.g. `--foo`).
* @param arg the argument to check
* @returns whether `arg` is a long option.
*/
function isLongOption(arg) {
	return hasLongOptionPrefix(arg) && !arg.includes(EQUAL_CHAR, 3);
}
/**
* Check if `arg` is a long option with value (e.g. `--foo=bar`).
* @param arg the argument to check
* @returns whether `arg` is a long option.
*/
function isLongOptionAndValue(arg) {
	return hasLongOptionPrefix(arg) && arg.includes(EQUAL_CHAR, 3);
}
/**
* Check if `arg` is a long option prefix (e.g. `--`).
* @param arg the argument to check
* @returns whether `arg` is a long option prefix.
*/
function hasLongOptionPrefix(arg) {
	return arg.length > 2 && ~arg.indexOf(LONG_OPTION_PREFIX);
}
/**
* Check if a `value` is an option value.
* @param value a value to check
* @returns whether a `value` is an option value.
*/
function hasOptionValue(value) {
	return !(value == null) && value.codePointAt(0) !== HYPHEN_CODE;
}
const SKIP_POSITIONAL_DEFAULT = -1;
/**
* Resolve command line arguments.
* @param args - An arguments that contains {@link ArgSchema | arguments schema}.
* @param tokens - An array of {@link ArgToken | tokens}.
* @param resolveArgs - An arguments that contains {@link ResolveArgs | resolve arguments}.
* @returns An object that contains the values of the arguments, positional arguments, rest arguments, and {@link AggregateError | validation errors}.
*/
function resolveArgs(args, tokens, { shortGrouping = false, skipPositional = SKIP_POSITIONAL_DEFAULT, toKebab = false } = {}) {
	const skipPositionalIndex = typeof skipPositional === "number" ? Math.max(skipPositional, SKIP_POSITIONAL_DEFAULT) : SKIP_POSITIONAL_DEFAULT;
	const rest = [];
	const optionTokens = [];
	const positionalTokens = [];
	let currentLongOption;
	let currentShortOption;
	const expandableShortOptions = [];
	function toShortValue() {
		if (expandableShortOptions.length === 0) return void 0;
		else {
			const value = expandableShortOptions.map((token) => token.name).join("");
			expandableShortOptions.length = 0;
			return value;
		}
	}
	function applyLongOptionValue(value = void 0) {
		if (currentLongOption) {
			currentLongOption.value = value;
			optionTokens.push({ ...currentLongOption });
			currentLongOption = void 0;
		}
	}
	function applyShortOptionValue(value = void 0) {
		if (currentShortOption) {
			currentShortOption.value = value || toShortValue();
			optionTokens.push({ ...currentShortOption });
			currentShortOption = void 0;
		}
	}
	/**
	* analyze phase to resolve value
	* separate tokens into positionals, long and short options, after that resolve values
	*/
	const schemas = Object.values(args);
	let terminated = false;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token.kind === "positional") {
			if (terminated && token.value) {
				rest.push(token.value);
				continue;
			}
			if (currentShortOption) {
				const found = schemas.find((schema) => schema.short === currentShortOption.name && schema.type === "boolean");
				if (found) positionalTokens.push({ ...token });
			} else if (currentLongOption) {
				const found = args[currentLongOption.name]?.type === "boolean";
				if (found) positionalTokens.push({ ...token });
			} else positionalTokens.push({ ...token });
			applyLongOptionValue(token.value);
			applyShortOptionValue(token.value);
		} else if (token.kind === "option") if (token.rawName) {
			if (hasLongOptionPrefix(token.rawName)) {
				applyLongOptionValue();
				if (token.inlineValue) optionTokens.push({ ...token });
				else currentLongOption = { ...token };
				applyShortOptionValue();
			} else if (isShortOption(token.rawName)) if (currentShortOption) {
				if (currentShortOption.index === token.index) if (shortGrouping) {
					currentShortOption.value = token.value;
					optionTokens.push({ ...currentShortOption });
					currentShortOption = { ...token };
				} else expandableShortOptions.push({ ...token });
				else {
					currentShortOption.value = toShortValue();
					optionTokens.push({ ...currentShortOption });
					currentShortOption = { ...token };
				}
				applyLongOptionValue();
			} else {
				currentShortOption = { ...token };
				applyLongOptionValue();
			}
		} else {
			if (currentShortOption && currentShortOption.index == token.index && token.inlineValue) {
				currentShortOption.value = token.value;
				optionTokens.push({ ...currentShortOption });
				currentShortOption = void 0;
			}
			applyLongOptionValue();
		}
		else {
			if (token.kind === "option-terminator") terminated = true;
			applyLongOptionValue();
			applyShortOptionValue();
		}
	}
	/**
	* check if the last long or short option is not resolved
	*/
	applyLongOptionValue();
	applyShortOptionValue();
	/**
	* resolve values
	*/
	const values = Object.create(null);
	const errors = [];
	function checkTokenName(option, schema, token) {
		return token.name === (schema.type === "boolean" ? schema.negatable && token.name?.startsWith("no-") ? `no-${option}` : option : option);
	}
	const positionalItemCount = tokens.filter((token) => token.kind === "positional").length;
	function getPositionalSkipIndex() {
		return Math.min(skipPositionalIndex, positionalItemCount);
	}
	let positionalsCount = 0;
	for (const [rawArg, schema] of Object.entries(args)) {
		const arg = toKebab || schema.toKebab ? kebabnize(rawArg) : rawArg;
		if (schema.required) {
			const found = optionTokens.find((token) => {
				return schema.short && token.name === schema.short || token.rawName && hasLongOptionPrefix(token.rawName) && token.name === arg;
			});
			if (!found) {
				errors.push(createRequireError(arg, schema));
				continue;
			}
		}
		if (schema.type === "positional") {
			if (skipPositionalIndex > SKIP_POSITIONAL_DEFAULT) while (positionalsCount <= getPositionalSkipIndex()) positionalsCount++;
			const positional = positionalTokens[positionalsCount];
			if (positional != null) values[rawArg] = positional.value;
			else errors.push(createRequireError(arg, schema));
			positionalsCount++;
			continue;
		}
		for (let i = 0; i < optionTokens.length; i++) {
			const token = optionTokens[i];
			if (checkTokenName(arg, schema, token) && token.rawName != void 0 && hasLongOptionPrefix(token.rawName) || schema.short === token.name && token.rawName != void 0 && isShortOption(token.rawName)) {
				const invalid = validateRequire(token, arg, schema);
				if (invalid) {
					errors.push(invalid);
					continue;
				}
				if (schema.type === "boolean") token.value = void 0;
				const [parsedValue, error] = parse(token, arg, schema);
				if (error) errors.push(error);
				else if (schema.multiple) {
					values[rawArg] ||= [];
					values[rawArg].push(parsedValue);
				} else values[rawArg] = parsedValue;
			}
		}
		if (values[rawArg] == null && schema.default != null) values[rawArg] = schema.default;
	}
	return {
		values,
		positionals: positionalTokens.map((token) => token.value),
		rest,
		error: errors.length > 0 ? new AggregateError(errors) : void 0
	};
}
function parse(token, option, schema) {
	switch (schema.type) {
		case "string": return typeof token.value === "string" ? [token.value || schema.default, void 0] : [void 0, createTypeError(option, schema)];
		case "boolean": return token.value ? [token.value || schema.default, void 0] : [!(schema.negatable && token.name.startsWith("no-")), void 0];
		case "number": {
			if (!isNumeric(token.value)) return [void 0, createTypeError(option, schema)];
			return token.value ? [+token.value, void 0] : [+(schema.default || ""), void 0];
		}
		case "enum": {
			if (schema.choices && !schema.choices.includes(token.value)) return [void 0, new ArgResolveError(`Optional argument '--${option}' ${schema.short ? `or '-${schema.short}' ` : ""}should be chosen from '${schema.type}' [${schema.choices.map((c) => JSON.stringify(c)).join(", ")}] values`, option, "type", schema)];
			return [token.value || schema.default, void 0];
		}
		case "custom": {
			if (typeof schema.parse !== "function") throw new TypeError(`argument '${option}' should have a 'parse' function`);
			try {
				return [schema.parse(token.value || String(schema.default || "")), void 0];
			} catch (error) {
				return [void 0, error];
			}
		}
		default: throw new Error(`Unsupported argument type '${schema.type}' for option '${option}'`);
	}
}
function createRequireError(option, schema) {
	const message = schema.type === "positional" ? `Positional argument '${option}' is required` : `Optional argument '--${option}' ${schema.short ? `or '-${schema.short}' ` : ""}is required`;
	return new ArgResolveError(message, option, "required", schema);
}
/**
* An error that occurs when resolving arguments.
* This error is thrown when the argument is not valid.
*/
var ArgResolveError = class extends Error {
	name;
	schema;
	type;
	constructor(message, name$1, type, schema) {
		super(message);
		this.name = name$1;
		this.type = type;
		this.schema = schema;
	}
};
function validateRequire(token, option, schema) {
	if (schema.required && schema.type !== "boolean" && !token.value) return createRequireError(option, schema);
}
function isNumeric(str) {
	return str.trim() !== "" && !isNaN(str);
}
function createTypeError(option, schema) {
	return new ArgResolveError(`Optional argument '--${option}' ${schema.short ? `or '-${schema.short}' ` : ""}should be '${schema.type}'`, option, "type", schema);
}
/**
* Run the command.
* @param args Command line arguments
* @param entry A {@link Command | entry command}, an {@link CommandRunner | inline command runner}, or a {@link LazyCommand | lazily-loaded command}
* @param options A {@link CliOptions | CLI options}
* @returns A rendered usage or undefined. if you will use {@link CliOptions.usageSilent} option, it will return rendered usage string.
*/
async function cli(argv$1, entry, options = {}) {
	const cliOptions = resolveCliOptions(options, entry);
	const tokens = parseArgs(argv$1);
	const subCommand = getSubCommand(tokens);
	const { commandName: name$1, command, callMode } = await resolveCommand(subCommand, entry, cliOptions);
	if (!command) throw new Error(`Command not found: ${name$1 || ""}`);
	const args = resolveArguments(getCommandArgs(command));
	const { values, positionals, rest, error } = resolveArgs(args, tokens, {
		shortGrouping: true,
		toKebab: command.toKebab,
		skipPositional: cliOptions.subCommands.size > 0 ? 0 : -1
	});
	const omitted = !subCommand;
	const ctx = await createCommandContext({
		args,
		values,
		positionals,
		rest,
		argv: argv$1,
		tokens,
		omitted,
		callMode,
		command,
		cliOptions
	});
	if (values.version) {
		showVersion(ctx);
		return;
	}
	const usageBuffer = [];
	const header = await showHeader(ctx);
	if (header) usageBuffer.push(header);
	if (values.help) {
		const usage = await showUsage(ctx);
		if (usage) usageBuffer.push(usage);
		return usageBuffer.join("\n");
	}
	if (error) {
		await showValidationErrors(ctx, error);
		return;
	}
	await executeCommand(command, ctx, name$1 || "");
}
function getCommandArgs(cmd) {
	if (isLazyCommand(cmd)) return cmd.args || create();
	else if (typeof cmd === "object") return cmd.args || create();
	else return create();
}
function resolveArguments(args) {
	return Object.assign(create(), args, COMMON_ARGS);
}
function resolveCliOptions(options, entry) {
	const subCommands$1 = new Map(options.subCommands);
	if (options.subCommands) {
		if (isLazyCommand(entry)) subCommands$1.set(entry.commandName, entry);
		else if (typeof entry === "object" && entry.name) subCommands$1.set(entry.name, entry);
	}
	const resolvedOptions = Object.assign(create(), COMMAND_OPTIONS_DEFAULT, options, { subCommands: subCommands$1 });
	return resolvedOptions;
}
function getSubCommand(tokens) {
	const firstToken = tokens[0];
	return firstToken && firstToken.kind === "positional" && firstToken.index === 0 && firstToken.value ? firstToken.value : "";
}
async function showUsage(ctx) {
	if (ctx.env.renderUsage === null) return;
	const usage = await (ctx.env.renderUsage || renderUsage)(ctx);
	if (usage) {
		ctx.log(usage);
		return usage;
	}
}
function showVersion(ctx) {
	ctx.log(ctx.env.version);
}
async function showHeader(ctx) {
	if (ctx.env.renderHeader === null) return;
	const header = await (ctx.env.renderHeader || renderHeader)(ctx);
	if (header) {
		ctx.log(header);
		ctx.log();
		return header;
	}
}
async function showValidationErrors(ctx, error) {
	if (ctx.env.renderValidationErrors === null) return;
	const render = ctx.env.renderValidationErrors || renderValidationErrors;
	ctx.log(await render(ctx, error));
}
const CANNOT_RESOLVE_COMMAND = { callMode: "unexpected" };
async function resolveCommand(sub, entry, options) {
	const omitted = !sub;
	async function doResolveCommand() {
		if (typeof entry === "function") if ("commandName" in entry && entry.commandName) return {
			commandName: entry.commandName,
			command: entry,
			callMode: "entry"
		};
		else return {
			command: { run: entry },
			callMode: "entry"
		};
		else if (typeof entry === "object") return {
			commandName: resolveEntryName(entry),
			command: entry,
			callMode: "entry"
		};
		else return CANNOT_RESOLVE_COMMAND;
	}
	if (omitted || options.subCommands?.size === 0) return doResolveCommand();
	const cmd = options.subCommands?.get(sub);
	if (cmd == null) return {
		commandName: sub,
		callMode: "unexpected"
	};
	if (isLazyCommand(cmd) && cmd.commandName == null) cmd.commandName = sub;
	else if (typeof cmd === "object" && cmd.name == null) cmd.name = sub;
	return {
		commandName: sub,
		command: cmd,
		callMode: "subCommand"
	};
}
function resolveEntryName(entry) {
	return entry.name || ANONYMOUS_COMMAND_NAME;
}
async function executeCommand(cmd, ctx, name$1) {
	const resolved = isLazyCommand(cmd) ? await resolveLazyCommand(cmd, name$1, true) : cmd;
	if (resolved.run == null) throw new Error(`'run' not found on Command \`${name$1}\``);
	await resolved.run(ctx);
}
/** Options for {@linkcode delay}. */
/**
* Resolve a {@linkcode Promise} after a given amount of milliseconds.
*
* @throws {DOMException} If the optional signal is aborted before the delay
* duration, and `signal.reason` is undefined.
* @param ms Duration in milliseconds for how long the delay should last.
* @param options Additional options.
*
* @example Basic usage
* ```ts no-assert
* import { delay } from "@std/async/delay";
*
* // ...
* const delayedPromise = delay(100);
* const result = await delayedPromise;
* // ...
* ```
*
* @example Disable persistence
*
* Setting `persistent` to `false` will allow the process to continue to run as
* long as the timer exists.
*
* ```ts no-assert ignore
* import { delay } from "@std/async/delay";
*
* // ...
* await delay(100, { persistent: false });
* // ...
* ```
*/ function delay(ms, options = {}) {
	const { signal, persistent = true } = options;
	if (signal?.aborted) return Promise.reject(signal.reason);
	return new Promise((resolve, reject) => {
		const abort = () => {
			clearTimeout(i);
			reject(signal?.reason);
		};
		const done = () => {
			signal?.removeEventListener("abort", abort);
			resolve();
		};
		const i = setTimeout(done, ms);
		signal?.addEventListener("abort", abort, { once: true });
		if (persistent === false) try {
			Deno.unrefTimer(i);
		} catch (error) {
			if (!(error instanceof ReferenceError)) throw error;
			console.error("`persistent` option is only available in Deno");
		}
	});
}
var require_picocolors = __commonJSMin((exports, module) => {
	let p = process || {}, argv = p.argv || [], env$1 = p.env || {};
	let isColorSupported = !(!!env$1.NO_COLOR || argv.includes("--no-color")) && (!!env$1.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env$1.TERM !== "dumb" || !!env$1.CI);
	let formatter = (open, close, replace = open) => (input) => {
		let string = "" + input, index = string.indexOf(close, open.length);
		return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
	};
	let replaceClose = (string, close, replace, index) => {
		let result = "", cursor = 0;
		do {
			result += string.substring(cursor, index) + replace;
			cursor = index + close.length;
			index = string.indexOf(close, cursor);
		} while (~index);
		return result + string.substring(cursor);
	};
	let createColors = (enabled = isColorSupported) => {
		let f = enabled ? formatter : () => String;
		return {
			isColorSupported: enabled,
			reset: f("\x1B[0m", "\x1B[0m"),
			bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
			dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
			italic: f("\x1B[3m", "\x1B[23m"),
			underline: f("\x1B[4m", "\x1B[24m"),
			inverse: f("\x1B[7m", "\x1B[27m"),
			hidden: f("\x1B[8m", "\x1B[28m"),
			strikethrough: f("\x1B[9m", "\x1B[29m"),
			black: f("\x1B[30m", "\x1B[39m"),
			red: f("\x1B[31m", "\x1B[39m"),
			green: f("\x1B[32m", "\x1B[39m"),
			yellow: f("\x1B[33m", "\x1B[39m"),
			blue: f("\x1B[34m", "\x1B[39m"),
			magenta: f("\x1B[35m", "\x1B[39m"),
			cyan: f("\x1B[36m", "\x1B[39m"),
			white: f("\x1B[37m", "\x1B[39m"),
			gray: f("\x1B[90m", "\x1B[39m"),
			bgBlack: f("\x1B[40m", "\x1B[49m"),
			bgRed: f("\x1B[41m", "\x1B[49m"),
			bgGreen: f("\x1B[42m", "\x1B[49m"),
			bgYellow: f("\x1B[43m", "\x1B[49m"),
			bgBlue: f("\x1B[44m", "\x1B[49m"),
			bgMagenta: f("\x1B[45m", "\x1B[49m"),
			bgCyan: f("\x1B[46m", "\x1B[49m"),
			bgWhite: f("\x1B[47m", "\x1B[49m"),
			blackBright: f("\x1B[90m", "\x1B[39m"),
			redBright: f("\x1B[91m", "\x1B[39m"),
			greenBright: f("\x1B[92m", "\x1B[39m"),
			yellowBright: f("\x1B[93m", "\x1B[39m"),
			blueBright: f("\x1B[94m", "\x1B[39m"),
			magentaBright: f("\x1B[95m", "\x1B[39m"),
			cyanBright: f("\x1B[96m", "\x1B[39m"),
			whiteBright: f("\x1B[97m", "\x1B[39m"),
			bgBlackBright: f("\x1B[100m", "\x1B[49m"),
			bgRedBright: f("\x1B[101m", "\x1B[49m"),
			bgGreenBright: f("\x1B[102m", "\x1B[49m"),
			bgYellowBright: f("\x1B[103m", "\x1B[49m"),
			bgBlueBright: f("\x1B[104m", "\x1B[49m"),
			bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
			bgCyanBright: f("\x1B[106m", "\x1B[49m"),
			bgWhiteBright: f("\x1B[107m", "\x1B[49m")
		};
	};
	module.exports = createColors();
	module.exports.createColors = createColors;
});
const toZeroIfInfinity = (value) => Number.isFinite(value) ? value : 0;
function parseNumber(milliseconds) {
	return {
		days: Math.trunc(milliseconds / 864e5),
		hours: Math.trunc(milliseconds / 36e5 % 24),
		minutes: Math.trunc(milliseconds / 6e4 % 60),
		seconds: Math.trunc(milliseconds / 1e3 % 60),
		milliseconds: Math.trunc(milliseconds % 1e3),
		microseconds: Math.trunc(toZeroIfInfinity(milliseconds * 1e3) % 1e3),
		nanoseconds: Math.trunc(toZeroIfInfinity(milliseconds * 1e6) % 1e3)
	};
}
function parseBigint(milliseconds) {
	return {
		days: milliseconds / 86400000n,
		hours: milliseconds / 3600000n % 24n,
		minutes: milliseconds / 60000n % 60n,
		seconds: milliseconds / 1000n % 60n,
		milliseconds: milliseconds % 1000n,
		microseconds: 0n,
		nanoseconds: 0n
	};
}
function parseMilliseconds(milliseconds) {
	switch (typeof milliseconds) {
		case "number": {
			if (Number.isFinite(milliseconds)) return parseNumber(milliseconds);
			break;
		}
		case "bigint": return parseBigint(milliseconds);
	}
	throw new TypeError("Expected a finite number or bigint");
}
const isZero = (value) => value === 0 || value === 0n;
const pluralize = (word, count) => count === 1 || count === 1n ? word : `${word}s`;
const SECOND_ROUNDING_EPSILON = 1e-7;
const ONE_DAY_IN_MILLISECONDS = 24n * 60n * 60n * 1000n;
function prettyMilliseconds(milliseconds, options) {
	const isBigInt = typeof milliseconds === "bigint";
	if (!isBigInt && !Number.isFinite(milliseconds)) throw new TypeError("Expected a finite number or bigint");
	options = { ...options };
	const sign = milliseconds < 0 ? "-" : "";
	milliseconds = milliseconds < 0 ? -milliseconds : milliseconds;
	if (options.colonNotation) {
		options.compact = false;
		options.formatSubMilliseconds = false;
		options.separateMilliseconds = false;
		options.verbose = false;
	}
	if (options.compact) {
		options.unitCount = 1;
		options.secondsDecimalDigits = 0;
		options.millisecondsDecimalDigits = 0;
	}
	let result = [];
	const floorDecimals = (value, decimalDigits) => {
		const flooredInterimValue = Math.floor(value * 10 ** decimalDigits + SECOND_ROUNDING_EPSILON);
		const flooredValue = Math.round(flooredInterimValue) / 10 ** decimalDigits;
		return flooredValue.toFixed(decimalDigits);
	};
	const add = (value, long, short, valueString) => {
		if ((result.length === 0 || !options.colonNotation) && isZero(value) && !(options.colonNotation && short === "m")) return;
		valueString ??= String(value);
		if (options.colonNotation) {
			const wholeDigits = valueString.includes(".") ? valueString.split(".")[0].length : valueString.length;
			const minLength = result.length > 0 ? 2 : 1;
			valueString = "0".repeat(Math.max(0, minLength - wholeDigits)) + valueString;
		} else valueString += options.verbose ? " " + pluralize(long, value) : short;
		result.push(valueString);
	};
	const parsed = parseMilliseconds(milliseconds);
	const days = BigInt(parsed.days);
	if (options.hideYearAndDays) add(BigInt(days) * 24n + BigInt(parsed.hours), "hour", "h");
	else {
		if (options.hideYear) add(days, "day", "d");
		else {
			add(days / 365n, "year", "y");
			add(days % 365n, "day", "d");
		}
		add(Number(parsed.hours), "hour", "h");
	}
	add(Number(parsed.minutes), "minute", "m");
	if (!options.hideSeconds) if (options.separateMilliseconds || options.formatSubMilliseconds || !options.colonNotation && milliseconds < 1e3) {
		const seconds = Number(parsed.seconds);
		const milliseconds$1 = Number(parsed.milliseconds);
		const microseconds = Number(parsed.microseconds);
		const nanoseconds = Number(parsed.nanoseconds);
		add(seconds, "second", "s");
		if (options.formatSubMilliseconds) {
			add(milliseconds$1, "millisecond", "ms");
			add(microseconds, "microsecond", "µs");
			add(nanoseconds, "nanosecond", "ns");
		} else {
			const millisecondsAndBelow = milliseconds$1 + microseconds / 1e3 + nanoseconds / 1e6;
			const millisecondsDecimalDigits = typeof options.millisecondsDecimalDigits === "number" ? options.millisecondsDecimalDigits : 0;
			const roundedMilliseconds = millisecondsAndBelow >= 1 ? Math.round(millisecondsAndBelow) : Math.ceil(millisecondsAndBelow);
			const millisecondsString = millisecondsDecimalDigits ? millisecondsAndBelow.toFixed(millisecondsDecimalDigits) : roundedMilliseconds;
			add(Number.parseFloat(millisecondsString), "millisecond", "ms", millisecondsString);
		}
	} else {
		const seconds = (isBigInt ? Number(milliseconds % ONE_DAY_IN_MILLISECONDS) : milliseconds) / 1e3 % 60;
		const secondsDecimalDigits = typeof options.secondsDecimalDigits === "number" ? options.secondsDecimalDigits : 1;
		const secondsFixed = floorDecimals(seconds, secondsDecimalDigits);
		const secondsString = options.keepDecimalsOnWholeSeconds ? secondsFixed : secondsFixed.replace(/\.0+$/, "");
		add(Number.parseFloat(secondsString), "second", "s", secondsString);
	}
	if (result.length === 0) return sign + "0" + (options.verbose ? " milliseconds" : "ms");
	const separator = options.colonNotation ? ":" : " ";
	if (typeof options.unitCount === "number") result = result.slice(0, Math.max(options.unitCount, 1));
	return sign + result.join(separator);
}
/**
* Manages live monitoring of Claude usage with efficient data reloading
*/
var LiveMonitor = class {
	config;
	fetcher = null;
	lastFileTimestamps = /* @__PURE__ */ new Map();
	processedHashes = /* @__PURE__ */ new Set();
	allEntries = [];
	constructor(config) {
		this.config = config;
		if (config.mode !== "display") this.fetcher = new PricingFetcher();
	}
	/**
	* Implements Disposable interface
	*/
	[Symbol.dispose]() {
		this.fetcher?.[Symbol.dispose]();
	}
	/**
	* Gets the current active session block with minimal file reading
	* Only reads new or modified files since last check
	*/
	async getActiveBlock() {
		const filesWithBaseDirs = [];
		for (const claudePath of this.config.claudePaths) {
			const claudeDir = path.join(claudePath, CLAUDE_PROJECTS_DIR_NAME);
			const files = await glob([USAGE_DATA_GLOB_PATTERN], {
				cwd: claudeDir,
				absolute: true
			});
			for (const file of files) filesWithBaseDirs.push({
				file,
				baseDir: claudeDir
			});
		}
		const allFiles = filesWithBaseDirs.map((item) => item.file);
		if (allFiles.length === 0) return null;
		const filesToRead = [];
		for (const file of allFiles) {
			const timestamp = await getEarliestTimestamp(file);
			const lastTimestamp = this.lastFileTimestamps.get(file);
			if (timestamp != null && (lastTimestamp == null || timestamp.getTime() > lastTimestamp)) {
				filesToRead.push(file);
				this.lastFileTimestamps.set(file, timestamp.getTime());
			}
		}
		if (filesToRead.length > 0) {
			const sortedFiles = await sortFilesByTimestamp(filesToRead);
			for (const file of sortedFiles) {
				const fileInfo = filesWithBaseDirs.find((item) => item.file === file);
				const baseDir = fileInfo?.baseDir ?? "";
				const relativePath = path.relative(baseDir, file);
				const parts = relativePath.split(path.sep);
				const projectPath = parts.length > 0 ? parts[0] : "Unknown Project";
				const content = await readFile(file, "utf-8").catch(() => {
					return "";
				});
				const lines = content.trim().split("\n").filter((line) => line.length > 0);
				for (const line of lines) try {
					const parsed = JSON.parse(line);
					const result = usageDataSchema.safeParse(parsed);
					if (!result.success) continue;
					const data = result.data;
					const uniqueHash = createUniqueHash(data);
					if (uniqueHash != null && this.processedHashes.has(uniqueHash)) continue;
					if (uniqueHash != null) this.processedHashes.add(uniqueHash);
					const costUSD = await (this.config.mode === "display" ? Promise.resolve(data.costUSD ?? 0) : calculateCostForEntry(data, this.config.mode, this.fetcher));
					this.allEntries.push({
						timestamp: new Date(data.timestamp),
						usage: {
							inputTokens: data.message.usage.input_tokens ?? 0,
							outputTokens: data.message.usage.output_tokens ?? 0,
							cacheCreationInputTokens: data.message.usage.cache_creation_input_tokens ?? 0,
							cacheReadInputTokens: data.message.usage.cache_read_input_tokens ?? 0
						},
						costUSD,
						model: data.message.model ?? "<synthetic>",
						version: data.version,
						projectPath
					});
				} catch {}
			}
		}
		const blocks = identifySessionBlocks(this.allEntries, this.config.sessionDurationHours);
		const sortedBlocks = this.config.order === "asc" ? blocks : blocks.reverse();
		return sortedBlocks.find((block) => block.isActive) ?? null;
	}
	/**
	* Clears all cached data to force a full reload
	*/
	clearCache() {
		this.lastFileTimestamps.clear();
		this.processedHashes.clear();
		this.allEntries = [];
	}
};
/**
* Parses and validates a date argument in YYYYMMDD format
* @param value - Date string to parse
* @returns Validated date string
* @throws TypeError if date format is invalid
*/
function parseDateArg(value) {
	const result = filterDateSchema.safeParse(value);
	if (!result.success) throw new TypeError(result.error.issues[0]?.message ?? "Invalid date format");
	return result.data;
}
/**
* Shared command line arguments used across multiple CLI commands
*/
const sharedArgs = {
	since: {
		type: "custom",
		short: "s",
		description: "Filter from date (YYYYMMDD format)",
		parse: parseDateArg
	},
	until: {
		type: "custom",
		short: "u",
		description: "Filter until date (YYYYMMDD format)",
		parse: parseDateArg
	},
	json: {
		type: "boolean",
		short: "j",
		description: "Output in JSON format",
		default: false
	},
	mode: {
		type: "enum",
		short: "m",
		description: "Cost calculation mode: auto (use costUSD if exists, otherwise calculate), calculate (always calculate), display (always use costUSD)",
		default: "auto",
		choices: CostModes
	},
	debug: {
		type: "boolean",
		short: "d",
		description: "Show pricing mismatch information for debugging",
		default: false
	},
	debugSamples: {
		type: "number",
		description: "Number of sample discrepancies to show in debug output (default: 5)",
		default: 5
	},
	order: {
		type: "enum",
		short: "o",
		description: "Sort order: desc (newest first) or asc (oldest first)",
		default: "asc",
		choices: SortOrders
	},
	breakdown: {
		type: "boolean",
		short: "b",
		description: "Show per-model cost breakdown",
		default: false
	},
	offline: {
		type: "boolean",
		negatable: true,
		short: "O",
		description: "Use cached pricing data for Claude models instead of fetching from API",
		default: false
	}
};
/**
* Shared command configuration for Gunshi CLI commands
*/
const sharedCommandConfig = {
	args: sharedArgs,
	toKebab: true
};
var require_debug$1 = __commonJSMin((exports, module) => {
	let messages = [];
	let level = 0;
	const debug$3 = (msg, min) => {
		if (level >= min) messages.push(msg);
	};
	debug$3.WARN = 1;
	debug$3.INFO = 2;
	debug$3.DEBUG = 3;
	debug$3.reset = () => {
		messages = [];
	};
	debug$3.setDebugLevel = (v) => {
		level = v;
	};
	debug$3.warn = (msg) => debug$3(msg, debug$3.WARN);
	debug$3.info = (msg) => debug$3(msg, debug$3.INFO);
	debug$3.debug = (msg) => debug$3(msg, debug$3.DEBUG);
	debug$3.debugMessages = () => messages;
	module.exports = debug$3;
});
var require_ansi_regex = __commonJSMin((exports, module) => {
	module.exports = ({ onlyFirst = false } = {}) => {
		const pattern = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"].join("|");
		return new RegExp(pattern, onlyFirst ? void 0 : "g");
	};
});
var require_strip_ansi = __commonJSMin((exports, module) => {
	const ansiRegex$1 = require_ansi_regex();
	module.exports = (string) => typeof string === "string" ? string.replace(ansiRegex$1(), "") : string;
});
var require_is_fullwidth_code_point = __commonJSMin((exports, module) => {
	const isFullwidthCodePoint$1 = (codePoint) => {
		if (Number.isNaN(codePoint)) return false;
		if (codePoint >= 4352 && (codePoint <= 4447 || codePoint === 9001 || codePoint === 9002 || 11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || 12880 <= codePoint && codePoint <= 19903 || 19968 <= codePoint && codePoint <= 42182 || 43360 <= codePoint && codePoint <= 43388 || 44032 <= codePoint && codePoint <= 55203 || 63744 <= codePoint && codePoint <= 64255 || 65040 <= codePoint && codePoint <= 65049 || 65072 <= codePoint && codePoint <= 65131 || 65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || 110592 <= codePoint && codePoint <= 110593 || 127488 <= codePoint && codePoint <= 127569 || 131072 <= codePoint && codePoint <= 262141)) return true;
		return false;
	};
	module.exports = isFullwidthCodePoint$1;
	module.exports.default = isFullwidthCodePoint$1;
});
var require_emoji_regex$1 = __commonJSMin((exports, module) => {
	module.exports = function() {
		return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
	};
});
var require_string_width = __commonJSMin((exports, module) => {
	const stripAnsi$1 = require_strip_ansi();
	const isFullwidthCodePoint = require_is_fullwidth_code_point();
	const emojiRegex$1 = require_emoji_regex$1();
	const stringWidth$2 = (string) => {
		if (typeof string !== "string" || string.length === 0) return 0;
		string = stripAnsi$1(string);
		if (string.length === 0) return 0;
		string = string.replace(emojiRegex$1(), "  ");
		let width = 0;
		for (let i = 0; i < string.length; i++) {
			const code = string.codePointAt(i);
			if (code <= 31 || code >= 127 && code <= 159) continue;
			if (code >= 768 && code <= 879) continue;
			if (code > 65535) i++;
			width += isFullwidthCodePoint(code) ? 2 : 1;
		}
		return width;
	};
	module.exports = stringWidth$2;
	module.exports.default = stringWidth$2;
});
var require_utils = __commonJSMin((exports, module) => {
	const stringWidth$1 = require_string_width();
	function codeRegex(capture) {
		return capture ? /\u001b\[((?:\d*;){0,5}\d*)m/g : /\u001b\[(?:\d*;){0,5}\d*m/g;
	}
	function strlen(str) {
		let code = codeRegex();
		let stripped = ("" + str).replace(code, "");
		let split = stripped.split("\n");
		return split.reduce(function(memo, s) {
			return stringWidth$1(s) > memo ? stringWidth$1(s) : memo;
		}, 0);
	}
	function repeat(str, times) {
		return Array(times + 1).join(str);
	}
	function pad(str, len, pad$1, dir) {
		let length = strlen(str);
		if (len + 1 >= length) {
			let padlen = len - length;
			switch (dir) {
				case "right": {
					str = repeat(pad$1, padlen) + str;
					break;
				}
				case "center": {
					let right = Math.ceil(padlen / 2);
					let left = padlen - right;
					str = repeat(pad$1, left) + str + repeat(pad$1, right);
					break;
				}
				default: {
					str = str + repeat(pad$1, padlen);
					break;
				}
			}
		}
		return str;
	}
	let codeCache = {};
	function addToCodeCache(name$1, on, off) {
		on = "\x1B[" + on + "m";
		off = "\x1B[" + off + "m";
		codeCache[on] = {
			set: name$1,
			to: true
		};
		codeCache[off] = {
			set: name$1,
			to: false
		};
		codeCache[name$1] = {
			on,
			off
		};
	}
	addToCodeCache("bold", 1, 22);
	addToCodeCache("italics", 3, 23);
	addToCodeCache("underline", 4, 24);
	addToCodeCache("inverse", 7, 27);
	addToCodeCache("strikethrough", 9, 29);
	function updateState(state, controlChars) {
		let controlCode = controlChars[1] ? parseInt(controlChars[1].split(";")[0]) : 0;
		if (controlCode >= 30 && controlCode <= 39 || controlCode >= 90 && controlCode <= 97) {
			state.lastForegroundAdded = controlChars[0];
			return;
		}
		if (controlCode >= 40 && controlCode <= 49 || controlCode >= 100 && controlCode <= 107) {
			state.lastBackgroundAdded = controlChars[0];
			return;
		}
		if (controlCode === 0) {
			for (let i in state)
 /* istanbul ignore else */
			if (Object.prototype.hasOwnProperty.call(state, i)) delete state[i];
			return;
		}
		let info$1 = codeCache[controlChars[0]];
		if (info$1) state[info$1.set] = info$1.to;
	}
	function readState(line) {
		let code = codeRegex(true);
		let controlChars = code.exec(line);
		let state = {};
		while (controlChars !== null) {
			updateState(state, controlChars);
			controlChars = code.exec(line);
		}
		return state;
	}
	function unwindState(state, ret) {
		let lastBackgroundAdded = state.lastBackgroundAdded;
		let lastForegroundAdded = state.lastForegroundAdded;
		delete state.lastBackgroundAdded;
		delete state.lastForegroundAdded;
		Object.keys(state).forEach(function(key) {
			if (state[key]) ret += codeCache[key].off;
		});
		if (lastBackgroundAdded && lastBackgroundAdded != "\x1B[49m") ret += "\x1B[49m";
		if (lastForegroundAdded && lastForegroundAdded != "\x1B[39m") ret += "\x1B[39m";
		return ret;
	}
	function rewindState(state, ret) {
		let lastBackgroundAdded = state.lastBackgroundAdded;
		let lastForegroundAdded = state.lastForegroundAdded;
		delete state.lastBackgroundAdded;
		delete state.lastForegroundAdded;
		Object.keys(state).forEach(function(key) {
			if (state[key]) ret = codeCache[key].on + ret;
		});
		if (lastBackgroundAdded && lastBackgroundAdded != "\x1B[49m") ret = lastBackgroundAdded + ret;
		if (lastForegroundAdded && lastForegroundAdded != "\x1B[39m") ret = lastForegroundAdded + ret;
		return ret;
	}
	function truncateWidth(str, desiredLength) {
		if (str.length === strlen(str)) return str.substr(0, desiredLength);
		while (strlen(str) > desiredLength) str = str.slice(0, -1);
		return str;
	}
	function truncateWidthWithAnsi(str, desiredLength) {
		let code = codeRegex(true);
		let split = str.split(codeRegex());
		let splitIndex = 0;
		let retLen = 0;
		let ret = "";
		let myArray;
		let state = {};
		while (retLen < desiredLength) {
			myArray = code.exec(str);
			let toAdd = split[splitIndex];
			splitIndex++;
			if (retLen + strlen(toAdd) > desiredLength) toAdd = truncateWidth(toAdd, desiredLength - retLen);
			ret += toAdd;
			retLen += strlen(toAdd);
			if (retLen < desiredLength) {
				if (!myArray) break;
				ret += myArray[0];
				updateState(state, myArray);
			}
		}
		return unwindState(state, ret);
	}
	function truncate(str, desiredLength, truncateChar) {
		truncateChar = truncateChar || "…";
		let lengthOfStr = strlen(str);
		if (lengthOfStr <= desiredLength) return str;
		desiredLength -= strlen(truncateChar);
		let ret = truncateWidthWithAnsi(str, desiredLength);
		ret += truncateChar;
		const hrefTag = "\x1B]8;;\x07";
		if (str.includes(hrefTag) && !ret.includes(hrefTag)) ret += hrefTag;
		return ret;
	}
	function defaultOptions() {
		return {
			chars: {
				top: "─",
				"top-mid": "┬",
				"top-left": "┌",
				"top-right": "┐",
				bottom: "─",
				"bottom-mid": "┴",
				"bottom-left": "└",
				"bottom-right": "┘",
				left: "│",
				"left-mid": "├",
				mid: "─",
				"mid-mid": "┼",
				right: "│",
				"right-mid": "┤",
				middle: "│"
			},
			truncate: "…",
			colWidths: [],
			rowHeights: [],
			colAligns: [],
			rowAligns: [],
			style: {
				"padding-left": 1,
				"padding-right": 1,
				head: ["red"],
				border: ["grey"],
				compact: false
			},
			head: []
		};
	}
	function mergeOptions(options, defaults) {
		options = options || {};
		defaults = defaults || defaultOptions();
		let ret = Object.assign({}, defaults, options);
		ret.chars = Object.assign({}, defaults.chars, options.chars);
		ret.style = Object.assign({}, defaults.style, options.style);
		return ret;
	}
	function wordWrap(maxLength, input) {
		let lines = [];
		let split = input.split(/(\s+)/g);
		let line = [];
		let lineLength = 0;
		let whitespace;
		for (let i = 0; i < split.length; i += 2) {
			let word = split[i];
			let newLength = lineLength + strlen(word);
			if (lineLength > 0 && whitespace) newLength += whitespace.length;
			if (newLength > maxLength) {
				if (lineLength !== 0) lines.push(line.join(""));
				line = [word];
				lineLength = strlen(word);
			} else {
				line.push(whitespace || "", word);
				lineLength = newLength;
			}
			whitespace = split[i + 1];
		}
		if (lineLength) lines.push(line.join(""));
		return lines;
	}
	function textWrap(maxLength, input) {
		let lines = [];
		let line = "";
		function pushLine(str, ws) {
			if (line.length && ws) line += ws;
			line += str;
			while (line.length > maxLength) {
				lines.push(line.slice(0, maxLength));
				line = line.slice(maxLength);
			}
		}
		let split = input.split(/(\s+)/g);
		for (let i = 0; i < split.length; i += 2) pushLine(split[i], i && split[i - 1]);
		if (line.length) lines.push(line);
		return lines;
	}
	function multiLineWordWrap(maxLength, input, wrapOnWordBoundary = true) {
		let output = [];
		input = input.split("\n");
		const handler = wrapOnWordBoundary ? wordWrap : textWrap;
		for (let i = 0; i < input.length; i++) output.push.apply(output, handler(maxLength, input[i]));
		return output;
	}
	function colorizeLines(input) {
		let state = {};
		let output = [];
		for (let i = 0; i < input.length; i++) {
			let line = rewindState(state, input[i]);
			state = readState(line);
			let temp = Object.assign({}, state);
			output.push(unwindState(temp, line));
		}
		return output;
	}
	/**
	* Credit: Matheus Sampaio https://github.com/matheussampaio
	*/
	function hyperlink(url, text) {
		const OSC = "\x1B]";
		const BEL = "\x07";
		const SEP$1 = ";";
		return [
			OSC,
			"8",
			SEP$1,
			SEP$1,
			url || text,
			BEL,
			text,
			OSC,
			"8",
			SEP$1,
			SEP$1,
			BEL
		].join("");
	}
	module.exports = {
		strlen,
		repeat,
		pad,
		truncate,
		mergeOptions,
		wordWrap: multiLineWordWrap,
		colorizeLines,
		hyperlink
	};
});
var require_styles = __commonJSMin((exports, module) => {
	var styles$1 = {};
	module["exports"] = styles$1;
	var codes = {
		reset: [0, 0],
		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29],
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],
		gray: [90, 39],
		grey: [90, 39],
		brightRed: [91, 39],
		brightGreen: [92, 39],
		brightYellow: [93, 39],
		brightBlue: [94, 39],
		brightMagenta: [95, 39],
		brightCyan: [96, 39],
		brightWhite: [97, 39],
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],
		bgGray: [100, 49],
		bgGrey: [100, 49],
		bgBrightRed: [101, 49],
		bgBrightGreen: [102, 49],
		bgBrightYellow: [103, 49],
		bgBrightBlue: [104, 49],
		bgBrightMagenta: [105, 49],
		bgBrightCyan: [106, 49],
		bgBrightWhite: [107, 49],
		blackBG: [40, 49],
		redBG: [41, 49],
		greenBG: [42, 49],
		yellowBG: [43, 49],
		blueBG: [44, 49],
		magentaBG: [45, 49],
		cyanBG: [46, 49],
		whiteBG: [47, 49]
	};
	Object.keys(codes).forEach(function(key) {
		var val = codes[key];
		var style = styles$1[key] = [];
		style.open = "\x1B[" + val[0] + "m";
		style.close = "\x1B[" + val[1] + "m";
	});
});
var require_has_flag = __commonJSMin((exports, module) => {
	module.exports = function(flag, argv$1) {
		argv$1 = argv$1 || process.argv;
		var terminatorPos = argv$1.indexOf("--");
		var prefix = /^-{1,2}/.test(flag) ? "" : "--";
		var pos = argv$1.indexOf(prefix + flag);
		return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
	};
});
var require_supports_colors = __commonJSMin((exports, module) => {
	var os = __require("node:os");
	var hasFlag = require_has_flag();
	var env = process.env;
	var forceColor = void 0;
	if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false")) forceColor = false;
	else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) forceColor = true;
	if ("FORCE_COLOR" in env) forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
	function translateLevel(level$1) {
		if (level$1 === 0) return false;
		return {
			level: level$1,
			hasBasic: true,
			has256: level$1 >= 2,
			has16m: level$1 >= 3
		};
	}
	function supportsColor(stream) {
		if (forceColor === false) return 0;
		if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) return 3;
		if (hasFlag("color=256")) return 2;
		if (stream && !stream.isTTY && forceColor !== true) return 0;
		var min = forceColor ? 1 : 0;
		if (process.platform === "win32") {
			var osRelease = os.release().split(".");
			if (Number(process.versions.node.split(".")[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
			return 1;
		}
		if ("CI" in env) {
			if ([
				"TRAVIS",
				"CIRCLECI",
				"APPVEYOR",
				"GITLAB_CI"
			].some(function(sign) {
				return sign in env;
			}) || env.CI_NAME === "codeship") return 1;
			return min;
		}
		if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		if ("TERM_PROGRAM" in env) {
			var version$2 = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
			switch (env.TERM_PROGRAM) {
				case "iTerm.app": return version$2 >= 3 ? 3 : 2;
				case "Hyper": return 3;
				case "Apple_Terminal": return 2;
			}
		}
		if (/-256(color)?$/i.test(env.TERM)) return 2;
		if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
		if ("COLORTERM" in env) return 1;
		if (env.TERM === "dumb") return min;
		return min;
	}
	function getSupportLevel(stream) {
		var level$1 = supportsColor(stream);
		return translateLevel(level$1);
	}
	module.exports = {
		supportsColor: getSupportLevel,
		stdout: getSupportLevel(process.stdout),
		stderr: getSupportLevel(process.stderr)
	};
});
var require_trap = __commonJSMin((exports, module) => {
	module["exports"] = function runTheTrap(text, options) {
		var result = "";
		text = text || "Run the trap, drop the bass";
		text = text.split("");
		var trap = {
			a: [
				"@",
				"Ą",
				"Ⱥ",
				"Ʌ",
				"Δ",
				"Λ",
				"Д"
			],
			b: [
				"ß",
				"Ɓ",
				"Ƀ",
				"ɮ",
				"β",
				"฿"
			],
			c: [
				"©",
				"Ȼ",
				"Ͼ"
			],
			d: [
				"Ð",
				"Ɗ",
				"Ԁ",
				"ԁ",
				"Ԃ",
				"ԃ"
			],
			e: [
				"Ë",
				"ĕ",
				"Ǝ",
				"ɘ",
				"Σ",
				"ξ",
				"Ҽ",
				"੬"
			],
			f: ["Ӻ"],
			g: ["ɢ"],
			h: [
				"Ħ",
				"ƕ",
				"Ң",
				"Һ",
				"Ӈ",
				"Ԋ"
			],
			i: ["༏"],
			j: ["Ĵ"],
			k: [
				"ĸ",
				"Ҡ",
				"Ӄ",
				"Ԟ"
			],
			l: ["Ĺ"],
			m: [
				"ʍ",
				"Ӎ",
				"ӎ",
				"Ԡ",
				"ԡ",
				"൩"
			],
			n: [
				"Ñ",
				"ŋ",
				"Ɲ",
				"Ͷ",
				"Π",
				"Ҋ"
			],
			o: [
				"Ø",
				"õ",
				"ø",
				"Ǿ",
				"ʘ",
				"Ѻ",
				"ם",
				"۝",
				"๏"
			],
			p: ["Ƿ", "Ҏ"],
			q: ["্"],
			r: [
				"®",
				"Ʀ",
				"Ȑ",
				"Ɍ",
				"ʀ",
				"Я"
			],
			s: [
				"§",
				"Ϟ",
				"ϟ",
				"Ϩ"
			],
			t: [
				"Ł",
				"Ŧ",
				"ͳ"
			],
			u: ["Ʊ", "Ս"],
			v: ["ט"],
			w: [
				"Ш",
				"Ѡ",
				"Ѽ",
				"൰"
			],
			x: [
				"Ҳ",
				"Ӿ",
				"Ӽ",
				"ӽ"
			],
			y: [
				"¥",
				"Ұ",
				"Ӌ"
			],
			z: ["Ƶ", "ɀ"]
		};
		text.forEach(function(c) {
			c = c.toLowerCase();
			var chars = trap[c] || [" "];
			var rand = Math.floor(Math.random() * chars.length);
			if (typeof trap[c] !== "undefined") result += trap[c][rand];
			else result += c;
		});
		return result;
	};
});
var require_zalgo = __commonJSMin((exports, module) => {
	module["exports"] = function zalgo(text, options) {
		text = text || "   he is here   ";
		var soul = {
			"up": [
				"̍",
				"̎",
				"̄",
				"̅",
				"̿",
				"̑",
				"̆",
				"̐",
				"͒",
				"͗",
				"͑",
				"̇",
				"̈",
				"̊",
				"͂",
				"̓",
				"̈",
				"͊",
				"͋",
				"͌",
				"̃",
				"̂",
				"̌",
				"͐",
				"̀",
				"́",
				"̋",
				"̏",
				"̒",
				"̓",
				"̔",
				"̽",
				"̉",
				"ͣ",
				"ͤ",
				"ͥ",
				"ͦ",
				"ͧ",
				"ͨ",
				"ͩ",
				"ͪ",
				"ͫ",
				"ͬ",
				"ͭ",
				"ͮ",
				"ͯ",
				"̾",
				"͛",
				"͆",
				"̚"
			],
			"down": [
				"̖",
				"̗",
				"̘",
				"̙",
				"̜",
				"̝",
				"̞",
				"̟",
				"̠",
				"̤",
				"̥",
				"̦",
				"̩",
				"̪",
				"̫",
				"̬",
				"̭",
				"̮",
				"̯",
				"̰",
				"̱",
				"̲",
				"̳",
				"̹",
				"̺",
				"̻",
				"̼",
				"ͅ",
				"͇",
				"͈",
				"͉",
				"͍",
				"͎",
				"͓",
				"͔",
				"͕",
				"͖",
				"͙",
				"͚",
				"̣"
			],
			"mid": [
				"̕",
				"̛",
				"̀",
				"́",
				"͘",
				"̡",
				"̢",
				"̧",
				"̨",
				"̴",
				"̵",
				"̶",
				"͜",
				"͝",
				"͞",
				"͟",
				"͠",
				"͢",
				"̸",
				"̷",
				"͡",
				" ҉"
			]
		};
		var all = [].concat(soul.up, soul.down, soul.mid);
		function randomNumber(range) {
			var r = Math.floor(Math.random() * range);
			return r;
		}
		function isChar(character) {
			var bool = false;
			all.filter(function(i) {
				bool = i === character;
			});
			return bool;
		}
		function heComes(text$1, options$1) {
			var result = "";
			var counts;
			var l;
			options$1 = options$1 || {};
			options$1["up"] = typeof options$1["up"] !== "undefined" ? options$1["up"] : true;
			options$1["mid"] = typeof options$1["mid"] !== "undefined" ? options$1["mid"] : true;
			options$1["down"] = typeof options$1["down"] !== "undefined" ? options$1["down"] : true;
			options$1["size"] = typeof options$1["size"] !== "undefined" ? options$1["size"] : "maxi";
			text$1 = text$1.split("");
			for (l in text$1) {
				if (isChar(l)) continue;
				result = result + text$1[l];
				counts = {
					"up": 0,
					"down": 0,
					"mid": 0
				};
				switch (options$1.size) {
					case "mini":
						counts.up = randomNumber(8);
						counts.mid = randomNumber(2);
						counts.down = randomNumber(8);
						break;
					case "maxi":
						counts.up = randomNumber(16) + 3;
						counts.mid = randomNumber(4) + 1;
						counts.down = randomNumber(64) + 3;
						break;
					default:
						counts.up = randomNumber(8) + 1;
						counts.mid = randomNumber(6) / 2;
						counts.down = randomNumber(8) + 1;
						break;
				}
				var arr = [
					"up",
					"mid",
					"down"
				];
				for (var d in arr) {
					var index = arr[d];
					for (var i = 0; i <= counts[index]; i++) if (options$1[index]) result = result + soul[index][randomNumber(soul[index].length)];
				}
			}
			return result;
		}
		return heComes(text, options);
	};
});
var require_america = __commonJSMin((exports, module) => {
	module["exports"] = function(colors$2) {
		return function(letter, i, exploded) {
			if (letter === " ") return letter;
			switch (i % 3) {
				case 0: return colors$2.red(letter);
				case 1: return colors$2.white(letter);
				case 2: return colors$2.blue(letter);
			}
		};
	};
});
var require_zebra = __commonJSMin((exports, module) => {
	module["exports"] = function(colors$2) {
		return function(letter, i, exploded) {
			return i % 2 === 0 ? letter : colors$2.inverse(letter);
		};
	};
});
var require_rainbow = __commonJSMin((exports, module) => {
	module["exports"] = function(colors$2) {
		var rainbowColors = [
			"red",
			"yellow",
			"green",
			"blue",
			"magenta"
		];
		return function(letter, i, exploded) {
			if (letter === " ") return letter;
			else return colors$2[rainbowColors[i++ % rainbowColors.length]](letter);
		};
	};
});
var require_random = __commonJSMin((exports, module) => {
	module["exports"] = function(colors$2) {
		var available = [
			"underline",
			"inverse",
			"grey",
			"yellow",
			"red",
			"green",
			"blue",
			"white",
			"cyan",
			"magenta",
			"brightYellow",
			"brightRed",
			"brightGreen",
			"brightBlue",
			"brightWhite",
			"brightCyan",
			"brightMagenta"
		];
		return function(letter, i, exploded) {
			return letter === " " ? letter : colors$2[available[Math.round(Math.random() * (available.length - 2))]](letter);
		};
	};
});
var require_colors = __commonJSMin((exports, module) => {
	var colors$1 = {};
	module["exports"] = colors$1;
	colors$1.themes = {};
	var util = __require("node:util");
	var ansiStyles = colors$1.styles = require_styles();
	var defineProps = Object.defineProperties;
	var newLineRegex = /* @__PURE__ */ new RegExp(/[\r\n]+/g);
	colors$1.supportsColor = require_supports_colors().supportsColor;
	if (typeof colors$1.enabled === "undefined") colors$1.enabled = colors$1.supportsColor() !== false;
	colors$1.enable = function() {
		colors$1.enabled = true;
	};
	colors$1.disable = function() {
		colors$1.enabled = false;
	};
	colors$1.stripColors = colors$1.strip = function(str) {
		return ("" + str).replace(/\x1B\[\d+m/g, "");
	};
	var stylize = colors$1.stylize = function stylize$1(str, style) {
		if (!colors$1.enabled) return str + "";
		var styleMap = ansiStyles[style];
		if (!styleMap && style in colors$1) return colors$1[style](str);
		return styleMap.open + str + styleMap.close;
	};
	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
	var escapeStringRegexp = function(str) {
		if (typeof str !== "string") throw new TypeError("Expected a string");
		return str.replace(matchOperatorsRe, "\\$&");
	};
	function build(_styles) {
		var builder = function builder$1() {
			return applyStyle.apply(builder$1, arguments);
		};
		builder._styles = _styles;
		builder.__proto__ = proto;
		return builder;
	}
	var styles = function() {
		var ret = {};
		ansiStyles.grey = ansiStyles.gray;
		Object.keys(ansiStyles).forEach(function(key) {
			ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), "g");
			ret[key] = { get: function() {
				return build(this._styles.concat(key));
			} };
		});
		return ret;
	}();
	var proto = defineProps(function colors$2() {}, styles);
	function applyStyle() {
		var args = Array.prototype.slice.call(arguments);
		var str = args.map(function(arg) {
			if (arg != null && arg.constructor === String) return arg;
			else return util.inspect(arg);
		}).join(" ");
		if (!colors$1.enabled || !str) return str;
		var newLinesPresent = str.indexOf("\n") != -1;
		var nestedStyles = this._styles;
		var i = nestedStyles.length;
		while (i--) {
			var code = ansiStyles[nestedStyles[i]];
			str = code.open + str.replace(code.closeRe, code.open) + code.close;
			if (newLinesPresent) str = str.replace(newLineRegex, function(match) {
				return code.close + match + code.open;
			});
		}
		return str;
	}
	colors$1.setTheme = function(theme) {
		if (typeof theme === "string") {
			console.log("colors.setTheme now only accepts an object, not a string.  If you are trying to set a theme from a file, it is now your (the caller's) responsibility to require the file.  The old syntax looked like colors.setTheme(__dirname + '/../themes/generic-logging.js'); The new syntax looks like colors.setTheme(require(__dirname + '/../themes/generic-logging.js'));");
			return;
		}
		for (var style in theme) (function(style$1) {
			colors$1[style$1] = function(str) {
				if (typeof theme[style$1] === "object") {
					var out = str;
					for (var i in theme[style$1]) out = colors$1[theme[style$1][i]](out);
					return out;
				}
				return colors$1[theme[style$1]](str);
			};
		})(style);
	};
	function init() {
		var ret = {};
		Object.keys(styles).forEach(function(name$1) {
			ret[name$1] = { get: function() {
				return build([name$1]);
			} };
		});
		return ret;
	}
	var sequencer = function sequencer$1(map$1, str) {
		var exploded = str.split("");
		exploded = exploded.map(map$1);
		return exploded.join("");
	};
	colors$1.trap = require_trap();
	colors$1.zalgo = require_zalgo();
	colors$1.maps = {};
	colors$1.maps.america = require_america()(colors$1);
	colors$1.maps.zebra = require_zebra()(colors$1);
	colors$1.maps.rainbow = require_rainbow()(colors$1);
	colors$1.maps.random = require_random()(colors$1);
	for (var map in colors$1.maps) (function(map$1) {
		colors$1[map$1] = function(str) {
			return sequencer(colors$1.maps[map$1], str);
		};
	})(map);
	defineProps(colors$1, init());
});
var require_safe = __commonJSMin((exports, module) => {
	var colors = require_colors();
	module["exports"] = colors;
});
var require_cell = __commonJSMin((exports, module) => {
	const { info, debug: debug$2 } = require_debug$1();
	const utils$1 = require_utils();
	var Cell$1 = class Cell$1 {
		/**
		* A representation of a cell within the table.
		* Implementations must have `init` and `draw` methods,
		* as well as `colSpan`, `rowSpan`, `desiredHeight` and `desiredWidth` properties.
		* @param options
		* @constructor
		*/
		constructor(options) {
			this.setOptions(options);
			/**
			* Each cell will have it's `x` and `y` values set by the `layout-manager` prior to
			* `init` being called;
			* @type {Number}
			*/
			this.x = null;
			this.y = null;
		}
		setOptions(options) {
			if ([
				"boolean",
				"number",
				"bigint",
				"string"
			].indexOf(typeof options) !== -1) options = { content: "" + options };
			options = options || {};
			this.options = options;
			let content = options.content;
			if ([
				"boolean",
				"number",
				"bigint",
				"string"
			].indexOf(typeof content) !== -1) this.content = String(content);
			else if (!content) this.content = this.options.href || "";
			else throw new Error("Content needs to be a primitive, got: " + typeof content);
			this.colSpan = options.colSpan || 1;
			this.rowSpan = options.rowSpan || 1;
			if (this.options.href) Object.defineProperty(this, "href", { get() {
				return this.options.href;
			} });
		}
		mergeTableOptions(tableOptions, cells) {
			this.cells = cells;
			let optionsChars = this.options.chars || {};
			let tableChars = tableOptions.chars;
			let chars = this.chars = {};
			CHAR_NAMES.forEach(function(name$1) {
				setOption(optionsChars, tableChars, name$1, chars);
			});
			this.truncate = this.options.truncate || tableOptions.truncate;
			let style = this.options.style = this.options.style || {};
			let tableStyle = tableOptions.style;
			setOption(style, tableStyle, "padding-left", this);
			setOption(style, tableStyle, "padding-right", this);
			this.head = style.head || tableStyle.head;
			this.border = style.border || tableStyle.border;
			this.fixedWidth = tableOptions.colWidths[this.x];
			this.lines = this.computeLines(tableOptions);
			this.desiredWidth = utils$1.strlen(this.content) + this.paddingLeft + this.paddingRight;
			this.desiredHeight = this.lines.length;
		}
		computeLines(tableOptions) {
			const tableWordWrap = tableOptions.wordWrap || tableOptions.textWrap;
			const { wordWrap: wordWrap$1 = tableWordWrap } = this.options;
			if (this.fixedWidth && wordWrap$1) {
				this.fixedWidth -= this.paddingLeft + this.paddingRight;
				if (this.colSpan) {
					let i = 1;
					while (i < this.colSpan) {
						this.fixedWidth += tableOptions.colWidths[this.x + i];
						i++;
					}
				}
				const { wrapOnWordBoundary: tableWrapOnWordBoundary = true } = tableOptions;
				const { wrapOnWordBoundary = tableWrapOnWordBoundary } = this.options;
				return this.wrapLines(utils$1.wordWrap(this.fixedWidth, this.content, wrapOnWordBoundary));
			}
			return this.wrapLines(this.content.split("\n"));
		}
		wrapLines(computedLines) {
			const lines = utils$1.colorizeLines(computedLines);
			if (this.href) return lines.map((line) => utils$1.hyperlink(this.href, line));
			return lines;
		}
		/**
		* Initializes the Cells data structure.
		*
		* @param tableOptions - A fully populated set of tableOptions.
		* In addition to the standard default values, tableOptions must have fully populated the
		* `colWidths` and `rowWidths` arrays. Those arrays must have lengths equal to the number
		* of columns or rows (respectively) in this table, and each array item must be a Number.
		*
		*/
		init(tableOptions) {
			let x = this.x;
			let y = this.y;
			this.widths = tableOptions.colWidths.slice(x, x + this.colSpan);
			this.heights = tableOptions.rowHeights.slice(y, y + this.rowSpan);
			this.width = this.widths.reduce(sumPlusOne, -1);
			this.height = this.heights.reduce(sumPlusOne, -1);
			this.hAlign = this.options.hAlign || tableOptions.colAligns[x];
			this.vAlign = this.options.vAlign || tableOptions.rowAligns[y];
			this.drawRight = x + this.colSpan == tableOptions.colWidths.length;
		}
		/**
		* Draws the given line of the cell.
		* This default implementation defers to methods `drawTop`, `drawBottom`, `drawLine` and `drawEmpty`.
		* @param lineNum - can be `top`, `bottom` or a numerical line number.
		* @param spanningCell - will be a number if being called from a RowSpanCell, and will represent how
		* many rows below it's being called from. Otherwise it's undefined.
		* @returns {String} The representation of this line.
		*/
		draw(lineNum, spanningCell) {
			if (lineNum == "top") return this.drawTop(this.drawRight);
			if (lineNum == "bottom") return this.drawBottom(this.drawRight);
			let content = utils$1.truncate(this.content, 10, this.truncate);
			if (!lineNum) info(`${this.y}-${this.x}: ${this.rowSpan - lineNum}x${this.colSpan} Cell ${content}`);
			let padLen = Math.max(this.height - this.lines.length, 0);
			let padTop;
			switch (this.vAlign) {
				case "center":
					padTop = Math.ceil(padLen / 2);
					break;
				case "bottom":
					padTop = padLen;
					break;
				default: padTop = 0;
			}
			if (lineNum < padTop || lineNum >= padTop + this.lines.length) return this.drawEmpty(this.drawRight, spanningCell);
			let forceTruncation = this.lines.length > this.height && lineNum + 1 >= this.height;
			return this.drawLine(lineNum - padTop, this.drawRight, forceTruncation, spanningCell);
		}
		/**
		* Renders the top line of the cell.
		* @param drawRight - true if this method should render the right edge of the cell.
		* @returns {String}
		*/
		drawTop(drawRight) {
			let content = [];
			if (this.cells) this.widths.forEach(function(width, index) {
				content.push(this._topLeftChar(index));
				content.push(utils$1.repeat(this.chars[this.y == 0 ? "top" : "mid"], width));
			}, this);
			else {
				content.push(this._topLeftChar(0));
				content.push(utils$1.repeat(this.chars[this.y == 0 ? "top" : "mid"], this.width));
			}
			if (drawRight) content.push(this.chars[this.y == 0 ? "topRight" : "rightMid"]);
			return this.wrapWithStyleColors("border", content.join(""));
		}
		_topLeftChar(offset) {
			let x = this.x + offset;
			let leftChar;
			if (this.y == 0) leftChar = x == 0 ? "topLeft" : offset == 0 ? "topMid" : "top";
			else if (x == 0) leftChar = "leftMid";
			else {
				leftChar = offset == 0 ? "midMid" : "bottomMid";
				if (this.cells) {
					let spanAbove = this.cells[this.y - 1][x] instanceof Cell$1.ColSpanCell;
					if (spanAbove) leftChar = offset == 0 ? "topMid" : "mid";
					if (offset == 0) {
						let i = 1;
						while (this.cells[this.y][x - i] instanceof Cell$1.ColSpanCell) i++;
						if (this.cells[this.y][x - i] instanceof Cell$1.RowSpanCell) leftChar = "leftMid";
					}
				}
			}
			return this.chars[leftChar];
		}
		wrapWithStyleColors(styleProperty, content) {
			if (this[styleProperty] && this[styleProperty].length) try {
				let colors$2 = require_safe();
				for (let i = this[styleProperty].length - 1; i >= 0; i--) colors$2 = colors$2[this[styleProperty][i]];
				return colors$2(content);
			} catch (e) {
				return content;
			}
			else return content;
		}
		/**
		* Renders a line of text.
		* @param lineNum - Which line of text to render. This is not necessarily the line within the cell.
		* There may be top-padding above the first line of text.
		* @param drawRight - true if this method should render the right edge of the cell.
		* @param forceTruncationSymbol - `true` if the rendered text should end with the truncation symbol even
		* if the text fits. This is used when the cell is vertically truncated. If `false` the text should
		* only include the truncation symbol if the text will not fit horizontally within the cell width.
		* @param spanningCell - a number of if being called from a RowSpanCell. (how many rows below). otherwise undefined.
		* @returns {String}
		*/
		drawLine(lineNum, drawRight, forceTruncationSymbol, spanningCell) {
			let left = this.chars[this.x == 0 ? "left" : "middle"];
			if (this.x && spanningCell && this.cells) {
				let cellLeft = this.cells[this.y + spanningCell][this.x - 1];
				while (cellLeft instanceof ColSpanCell$1) cellLeft = this.cells[cellLeft.y][cellLeft.x - 1];
				if (!(cellLeft instanceof RowSpanCell$1)) left = this.chars["rightMid"];
			}
			let leftPadding = utils$1.repeat(" ", this.paddingLeft);
			let right = drawRight ? this.chars["right"] : "";
			let rightPadding = utils$1.repeat(" ", this.paddingRight);
			let line = this.lines[lineNum];
			let len = this.width - (this.paddingLeft + this.paddingRight);
			if (forceTruncationSymbol) line += this.truncate || "…";
			let content = utils$1.truncate(line, len, this.truncate);
			content = utils$1.pad(content, len, " ", this.hAlign);
			content = leftPadding + content + rightPadding;
			return this.stylizeLine(left, content, right);
		}
		stylizeLine(left, content, right) {
			left = this.wrapWithStyleColors("border", left);
			right = this.wrapWithStyleColors("border", right);
			if (this.y === 0) content = this.wrapWithStyleColors("head", content);
			return left + content + right;
		}
		/**
		* Renders the bottom line of the cell.
		* @param drawRight - true if this method should render the right edge of the cell.
		* @returns {String}
		*/
		drawBottom(drawRight) {
			let left = this.chars[this.x == 0 ? "bottomLeft" : "bottomMid"];
			let content = utils$1.repeat(this.chars.bottom, this.width);
			let right = drawRight ? this.chars["bottomRight"] : "";
			return this.wrapWithStyleColors("border", left + content + right);
		}
		/**
		* Renders a blank line of text within the cell. Used for top and/or bottom padding.
		* @param drawRight - true if this method should render the right edge of the cell.
		* @param spanningCell - a number of if being called from a RowSpanCell. (how many rows below). otherwise undefined.
		* @returns {String}
		*/
		drawEmpty(drawRight, spanningCell) {
			let left = this.chars[this.x == 0 ? "left" : "middle"];
			if (this.x && spanningCell && this.cells) {
				let cellLeft = this.cells[this.y + spanningCell][this.x - 1];
				while (cellLeft instanceof ColSpanCell$1) cellLeft = this.cells[cellLeft.y][cellLeft.x - 1];
				if (!(cellLeft instanceof RowSpanCell$1)) left = this.chars["rightMid"];
			}
			let right = drawRight ? this.chars["right"] : "";
			let content = utils$1.repeat(" ", this.width);
			return this.stylizeLine(left, content, right);
		}
	};
	var ColSpanCell$1 = class {
		/**
		* A Cell that doesn't do anything. It just draws empty lines.
		* Used as a placeholder in column spanning.
		* @constructor
		*/
		constructor() {}
		draw(lineNum) {
			if (typeof lineNum === "number") debug$2(`${this.y}-${this.x}: 1x1 ColSpanCell`);
			return "";
		}
		init() {}
		mergeTableOptions() {}
	};
	var RowSpanCell$1 = class {
		/**
		* A placeholder Cell for a Cell that spans multiple rows.
		* It delegates rendering to the original cell, but adds the appropriate offset.
		* @param originalCell
		* @constructor
		*/
		constructor(originalCell) {
			this.originalCell = originalCell;
		}
		init(tableOptions) {
			let y = this.y;
			let originalY = this.originalCell.y;
			this.cellOffset = y - originalY;
			this.offset = findDimension(tableOptions.rowHeights, originalY, this.cellOffset);
		}
		draw(lineNum) {
			if (lineNum == "top") return this.originalCell.draw(this.offset, this.cellOffset);
			if (lineNum == "bottom") return this.originalCell.draw("bottom");
			debug$2(`${this.y}-${this.x}: 1x${this.colSpan} RowSpanCell for ${this.originalCell.content}`);
			return this.originalCell.draw(this.offset + 1 + lineNum);
		}
		mergeTableOptions() {}
	};
	function firstDefined(...args) {
		return args.filter((v) => v !== void 0 && v !== null).shift();
	}
	function setOption(objA, objB, nameB, targetObj) {
		let nameA = nameB.split("-");
		if (nameA.length > 1) {
			nameA[1] = nameA[1].charAt(0).toUpperCase() + nameA[1].substr(1);
			nameA = nameA.join("");
			targetObj[nameA] = firstDefined(objA[nameA], objA[nameB], objB[nameA], objB[nameB]);
		} else targetObj[nameB] = firstDefined(objA[nameB], objB[nameB]);
	}
	function findDimension(dimensionTable, startingIndex, span) {
		let ret = dimensionTable[startingIndex];
		for (let i = 1; i < span; i++) ret += 1 + dimensionTable[startingIndex + i];
		return ret;
	}
	function sumPlusOne(a$1, b) {
		return a$1 + b + 1;
	}
	let CHAR_NAMES = [
		"top",
		"top-mid",
		"top-left",
		"top-right",
		"bottom",
		"bottom-mid",
		"bottom-left",
		"bottom-right",
		"left",
		"left-mid",
		"mid",
		"mid-mid",
		"right",
		"right-mid",
		"middle"
	];
	module.exports = Cell$1;
	module.exports.ColSpanCell = ColSpanCell$1;
	module.exports.RowSpanCell = RowSpanCell$1;
});
var require_layout_manager = __commonJSMin((exports, module) => {
	const { warn, debug: debug$1 } = require_debug$1();
	const Cell = require_cell();
	const { ColSpanCell, RowSpanCell } = Cell;
	(function() {
		function next(alloc, col) {
			if (alloc[col] > 0) return next(alloc, col + 1);
			return col;
		}
		function layoutTable(table) {
			let alloc = {};
			table.forEach(function(row, rowIndex) {
				let col = 0;
				row.forEach(function(cell) {
					cell.y = rowIndex;
					cell.x = rowIndex ? next(alloc, col) : col;
					const rowSpan = cell.rowSpan || 1;
					const colSpan = cell.colSpan || 1;
					if (rowSpan > 1) for (let cs = 0; cs < colSpan; cs++) alloc[cell.x + cs] = rowSpan;
					col = cell.x + colSpan;
				});
				Object.keys(alloc).forEach((idx) => {
					alloc[idx]--;
					if (alloc[idx] < 1) delete alloc[idx];
				});
			});
		}
		function maxWidth(table) {
			let mw = 0;
			table.forEach(function(row) {
				row.forEach(function(cell) {
					mw = Math.max(mw, cell.x + (cell.colSpan || 1));
				});
			});
			return mw;
		}
		function maxHeight(table) {
			return table.length;
		}
		function cellsConflict(cell1, cell2) {
			let yMin1 = cell1.y;
			let yMax1 = cell1.y - 1 + (cell1.rowSpan || 1);
			let yMin2 = cell2.y;
			let yMax2 = cell2.y - 1 + (cell2.rowSpan || 1);
			let yConflict = !(yMin1 > yMax2 || yMin2 > yMax1);
			let xMin1 = cell1.x;
			let xMax1 = cell1.x - 1 + (cell1.colSpan || 1);
			let xMin2 = cell2.x;
			let xMax2 = cell2.x - 1 + (cell2.colSpan || 1);
			let xConflict = !(xMin1 > xMax2 || xMin2 > xMax1);
			return yConflict && xConflict;
		}
		function conflictExists(rows, x, y) {
			let i_max = Math.min(rows.length - 1, y);
			let cell = {
				x,
				y
			};
			for (let i = 0; i <= i_max; i++) {
				let row = rows[i];
				for (let j = 0; j < row.length; j++) if (cellsConflict(cell, row[j])) return true;
			}
			return false;
		}
		function allBlank(rows, y, xMin, xMax) {
			for (let x = xMin; x < xMax; x++) if (conflictExists(rows, x, y)) return false;
			return true;
		}
		function addRowSpanCells(table) {
			table.forEach(function(row, rowIndex) {
				row.forEach(function(cell) {
					for (let i = 1; i < cell.rowSpan; i++) {
						let rowSpanCell = new RowSpanCell(cell);
						rowSpanCell.x = cell.x;
						rowSpanCell.y = cell.y + i;
						rowSpanCell.colSpan = cell.colSpan;
						insertCell(rowSpanCell, table[rowIndex + i]);
					}
				});
			});
		}
		function addColSpanCells(cellRows) {
			for (let rowIndex = cellRows.length - 1; rowIndex >= 0; rowIndex--) {
				let cellColumns = cellRows[rowIndex];
				for (let columnIndex = 0; columnIndex < cellColumns.length; columnIndex++) {
					let cell = cellColumns[columnIndex];
					for (let k = 1; k < cell.colSpan; k++) {
						let colSpanCell = new ColSpanCell();
						colSpanCell.x = cell.x + k;
						colSpanCell.y = cell.y;
						cellColumns.splice(columnIndex + 1, 0, colSpanCell);
					}
				}
			}
		}
		function insertCell(cell, row) {
			let x = 0;
			while (x < row.length && row[x].x < cell.x) x++;
			row.splice(x, 0, cell);
		}
		function fillInTable(table) {
			let h_max = maxHeight(table);
			let w_max = maxWidth(table);
			debug$1(`Max rows: ${h_max}; Max cols: ${w_max}`);
			for (let y = 0; y < h_max; y++) for (let x = 0; x < w_max; x++) if (!conflictExists(table, x, y)) {
				let opts = {
					x,
					y,
					colSpan: 1,
					rowSpan: 1
				};
				x++;
				while (x < w_max && !conflictExists(table, x, y)) {
					opts.colSpan++;
					x++;
				}
				let y2 = y + 1;
				while (y2 < h_max && allBlank(table, y2, opts.x, opts.x + opts.colSpan)) {
					opts.rowSpan++;
					y2++;
				}
				let cell = new Cell(opts);
				cell.x = opts.x;
				cell.y = opts.y;
				warn(`Missing cell at ${cell.y}-${cell.x}.`);
				insertCell(cell, table[y]);
			}
		}
		function generateCells(rows) {
			return rows.map(function(row) {
				if (!Array.isArray(row)) {
					let key = Object.keys(row)[0];
					row = row[key];
					if (Array.isArray(row)) {
						row = row.slice();
						row.unshift(key);
					} else row = [key, row];
				}
				return row.map(function(cell) {
					return new Cell(cell);
				});
			});
		}
		function makeTableLayout(rows) {
			let cellRows = generateCells(rows);
			layoutTable(cellRows);
			fillInTable(cellRows);
			addRowSpanCells(cellRows);
			addColSpanCells(cellRows);
			return cellRows;
		}
		module.exports = {
			makeTableLayout,
			layoutTable,
			addRowSpanCells,
			maxWidth,
			fillInTable,
			computeWidths: makeComputeWidths("colSpan", "desiredWidth", "x", 1),
			computeHeights: makeComputeWidths("rowSpan", "desiredHeight", "y", 1)
		};
	})();
	function makeComputeWidths(colSpan, desiredWidth, x, forcedMin) {
		return function(vals, table) {
			let result = [];
			let spanners = [];
			let auto = {};
			table.forEach(function(row) {
				row.forEach(function(cell) {
					if ((cell[colSpan] || 1) > 1) spanners.push(cell);
					else result[cell[x]] = Math.max(result[cell[x]] || 0, cell[desiredWidth] || 0, forcedMin);
				});
			});
			vals.forEach(function(val, index) {
				if (typeof val === "number") result[index] = val;
			});
			for (let k = spanners.length - 1; k >= 0; k--) {
				let cell = spanners[k];
				let span = cell[colSpan];
				let col = cell[x];
				let existingWidth = result[col];
				let editableCols = typeof vals[col] === "number" ? 0 : 1;
				if (typeof existingWidth === "number") for (let i = 1; i < span; i++) {
					existingWidth += 1 + result[col + i];
					if (typeof vals[col + i] !== "number") editableCols++;
				}
				else {
					existingWidth = desiredWidth === "desiredWidth" ? cell.desiredWidth - 1 : 1;
					if (!auto[col] || auto[col] < existingWidth) auto[col] = existingWidth;
				}
				if (cell[desiredWidth] > existingWidth) {
					let i = 0;
					while (editableCols > 0 && cell[desiredWidth] > existingWidth) {
						if (typeof vals[col + i] !== "number") {
							let dif = Math.round((cell[desiredWidth] - existingWidth) / editableCols);
							existingWidth += dif;
							result[col + i] += dif;
							editableCols--;
						}
						i++;
					}
				}
			}
			Object.assign(vals, result, auto);
			for (let j = 0; j < vals.length; j++) vals[j] = Math.max(forcedMin, vals[j] || 0);
		};
	}
});
var require_table = __commonJSMin((exports, module) => {
	const debug = require_debug$1();
	const utils = require_utils();
	const tableLayout = require_layout_manager();
	var Table$1 = class extends Array {
		constructor(opts) {
			super();
			const options = utils.mergeOptions(opts);
			Object.defineProperty(this, "options", {
				value: options,
				enumerable: options.debug
			});
			if (options.debug) {
				switch (typeof options.debug) {
					case "boolean":
						debug.setDebugLevel(debug.WARN);
						break;
					case "number":
						debug.setDebugLevel(options.debug);
						break;
					case "string":
						debug.setDebugLevel(parseInt(options.debug, 10));
						break;
					default:
						debug.setDebugLevel(debug.WARN);
						debug.warn(`Debug option is expected to be boolean, number, or string. Received a ${typeof options.debug}`);
				}
				Object.defineProperty(this, "messages", { get() {
					return debug.debugMessages();
				} });
			}
		}
		toString() {
			let array = this;
			let headersPresent = this.options.head && this.options.head.length;
			if (headersPresent) {
				array = [this.options.head];
				if (this.length) array.push.apply(array, this);
			} else this.options.style.head = [];
			let cells = tableLayout.makeTableLayout(array);
			cells.forEach(function(row) {
				row.forEach(function(cell) {
					cell.mergeTableOptions(this.options, cells);
				}, this);
			}, this);
			tableLayout.computeWidths(this.options.colWidths, cells);
			tableLayout.computeHeights(this.options.rowHeights, cells);
			cells.forEach(function(row) {
				row.forEach(function(cell) {
					cell.init(this.options);
				}, this);
			}, this);
			let result = [];
			for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
				let row = cells[rowIndex];
				let heightOfRow = this.options.rowHeights[rowIndex];
				if (rowIndex === 0 || !this.options.style.compact || rowIndex == 1 && headersPresent) doDraw(row, "top", result);
				for (let lineNum = 0; lineNum < heightOfRow; lineNum++) doDraw(row, lineNum, result);
				if (rowIndex + 1 == cells.length) doDraw(row, "bottom", result);
			}
			return result.join("\n");
		}
		get width() {
			let str = this.toString().split("\n");
			return str[0].length;
		}
	};
	Table$1.reset = () => debug.reset();
	function doDraw(row, lineNum, result) {
		let line = [];
		row.forEach(function(cell) {
			line.push(cell.draw(lineNum));
		});
		let str = line.join("");
		if (str.length) result.push(str);
	}
	module.exports = Table$1;
});
var require_cli_table3 = __commonJSMin((exports, module) => {
	module.exports = require_table();
});
function ansiRegex({ onlyFirst = false } = {}) {
	const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
	const pattern = [`[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`, "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
	return new RegExp(pattern, onlyFirst ? void 0 : "g");
}
const regex = ansiRegex();
function stripAnsi(string) {
	if (typeof string !== "string") throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
	return string.replace(regex, "");
}
function isAmbiguous(x) {
	return x === 161 || x === 164 || x === 167 || x === 168 || x === 170 || x === 173 || x === 174 || x >= 176 && x <= 180 || x >= 182 && x <= 186 || x >= 188 && x <= 191 || x === 198 || x === 208 || x === 215 || x === 216 || x >= 222 && x <= 225 || x === 230 || x >= 232 && x <= 234 || x === 236 || x === 237 || x === 240 || x === 242 || x === 243 || x >= 247 && x <= 250 || x === 252 || x === 254 || x === 257 || x === 273 || x === 275 || x === 283 || x === 294 || x === 295 || x === 299 || x >= 305 && x <= 307 || x === 312 || x >= 319 && x <= 322 || x === 324 || x >= 328 && x <= 331 || x === 333 || x === 338 || x === 339 || x === 358 || x === 359 || x === 363 || x === 462 || x === 464 || x === 466 || x === 468 || x === 470 || x === 472 || x === 474 || x === 476 || x === 593 || x === 609 || x === 708 || x === 711 || x >= 713 && x <= 715 || x === 717 || x === 720 || x >= 728 && x <= 731 || x === 733 || x === 735 || x >= 768 && x <= 879 || x >= 913 && x <= 929 || x >= 931 && x <= 937 || x >= 945 && x <= 961 || x >= 963 && x <= 969 || x === 1025 || x >= 1040 && x <= 1103 || x === 1105 || x === 8208 || x >= 8211 && x <= 8214 || x === 8216 || x === 8217 || x === 8220 || x === 8221 || x >= 8224 && x <= 8226 || x >= 8228 && x <= 8231 || x === 8240 || x === 8242 || x === 8243 || x === 8245 || x === 8251 || x === 8254 || x === 8308 || x === 8319 || x >= 8321 && x <= 8324 || x === 8364 || x === 8451 || x === 8453 || x === 8457 || x === 8467 || x === 8470 || x === 8481 || x === 8482 || x === 8486 || x === 8491 || x === 8531 || x === 8532 || x >= 8539 && x <= 8542 || x >= 8544 && x <= 8555 || x >= 8560 && x <= 8569 || x === 8585 || x >= 8592 && x <= 8601 || x === 8632 || x === 8633 || x === 8658 || x === 8660 || x === 8679 || x === 8704 || x === 8706 || x === 8707 || x === 8711 || x === 8712 || x === 8715 || x === 8719 || x === 8721 || x === 8725 || x === 8730 || x >= 8733 && x <= 8736 || x === 8739 || x === 8741 || x >= 8743 && x <= 8748 || x === 8750 || x >= 8756 && x <= 8759 || x === 8764 || x === 8765 || x === 8776 || x === 8780 || x === 8786 || x === 8800 || x === 8801 || x >= 8804 && x <= 8807 || x === 8810 || x === 8811 || x === 8814 || x === 8815 || x === 8834 || x === 8835 || x === 8838 || x === 8839 || x === 8853 || x === 8857 || x === 8869 || x === 8895 || x === 8978 || x >= 9312 && x <= 9449 || x >= 9451 && x <= 9547 || x >= 9552 && x <= 9587 || x >= 9600 && x <= 9615 || x >= 9618 && x <= 9621 || x === 9632 || x === 9633 || x >= 9635 && x <= 9641 || x === 9650 || x === 9651 || x === 9654 || x === 9655 || x === 9660 || x === 9661 || x === 9664 || x === 9665 || x >= 9670 && x <= 9672 || x === 9675 || x >= 9678 && x <= 9681 || x >= 9698 && x <= 9701 || x === 9711 || x === 9733 || x === 9734 || x === 9737 || x === 9742 || x === 9743 || x === 9756 || x === 9758 || x === 9792 || x === 9794 || x === 9824 || x === 9825 || x >= 9827 && x <= 9829 || x >= 9831 && x <= 9834 || x === 9836 || x === 9837 || x === 9839 || x === 9886 || x === 9887 || x === 9919 || x >= 9926 && x <= 9933 || x >= 9935 && x <= 9939 || x >= 9941 && x <= 9953 || x === 9955 || x === 9960 || x === 9961 || x >= 9963 && x <= 9969 || x === 9972 || x >= 9974 && x <= 9977 || x === 9979 || x === 9980 || x === 9982 || x === 9983 || x === 10045 || x >= 10102 && x <= 10111 || x >= 11094 && x <= 11097 || x >= 12872 && x <= 12879 || x >= 57344 && x <= 63743 || x >= 65024 && x <= 65039 || x === 65533 || x >= 127232 && x <= 127242 || x >= 127248 && x <= 127277 || x >= 127280 && x <= 127337 || x >= 127344 && x <= 127373 || x === 127375 || x === 127376 || x >= 127387 && x <= 127404 || x >= 917760 && x <= 917999 || x >= 983040 && x <= 1048573 || x >= 1048576 && x <= 1114109;
}
function isFullWidth(x) {
	return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
}
function isWide(x) {
	return x >= 4352 && x <= 4447 || x === 8986 || x === 8987 || x === 9001 || x === 9002 || x >= 9193 && x <= 9196 || x === 9200 || x === 9203 || x === 9725 || x === 9726 || x === 9748 || x === 9749 || x >= 9776 && x <= 9783 || x >= 9800 && x <= 9811 || x === 9855 || x >= 9866 && x <= 9871 || x === 9875 || x === 9889 || x === 9898 || x === 9899 || x === 9917 || x === 9918 || x === 9924 || x === 9925 || x === 9934 || x === 9940 || x === 9962 || x === 9970 || x === 9971 || x === 9973 || x === 9978 || x === 9981 || x === 9989 || x === 9994 || x === 9995 || x === 10024 || x === 10060 || x === 10062 || x >= 10067 && x <= 10069 || x === 10071 || x >= 10133 && x <= 10135 || x === 10160 || x === 10175 || x === 11035 || x === 11036 || x === 11088 || x === 11093 || x >= 11904 && x <= 11929 || x >= 11931 && x <= 12019 || x >= 12032 && x <= 12245 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12353 && x <= 12438 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12773 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 42124 || x >= 42128 && x <= 42182 || x >= 43360 && x <= 43388 || x >= 44032 && x <= 55203 || x >= 63744 && x <= 64255 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 94176 && x <= 94180 || x === 94192 || x === 94193 || x >= 94208 && x <= 100343 || x >= 100352 && x <= 101589 || x >= 101631 && x <= 101640 || x >= 110576 && x <= 110579 || x >= 110581 && x <= 110587 || x === 110589 || x === 110590 || x >= 110592 && x <= 110882 || x === 110898 || x >= 110928 && x <= 110930 || x === 110933 || x >= 110948 && x <= 110951 || x >= 110960 && x <= 111355 || x >= 119552 && x <= 119638 || x >= 119648 && x <= 119670 || x === 126980 || x === 127183 || x === 127374 || x >= 127377 && x <= 127386 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x === 127568 || x === 127569 || x >= 127584 && x <= 127589 || x >= 127744 && x <= 127776 || x >= 127789 && x <= 127797 || x >= 127799 && x <= 127868 || x >= 127870 && x <= 127891 || x >= 127904 && x <= 127946 || x >= 127951 && x <= 127955 || x >= 127968 && x <= 127984 || x === 127988 || x >= 127992 && x <= 128062 || x === 128064 || x >= 128066 && x <= 128252 || x >= 128255 && x <= 128317 || x >= 128331 && x <= 128334 || x >= 128336 && x <= 128359 || x === 128378 || x === 128405 || x === 128406 || x === 128420 || x >= 128507 && x <= 128591 || x >= 128640 && x <= 128709 || x === 128716 || x >= 128720 && x <= 128722 || x >= 128725 && x <= 128727 || x >= 128732 && x <= 128735 || x === 128747 || x === 128748 || x >= 128756 && x <= 128764 || x >= 128992 && x <= 129003 || x === 129008 || x >= 129292 && x <= 129338 || x >= 129340 && x <= 129349 || x >= 129351 && x <= 129535 || x >= 129648 && x <= 129660 || x >= 129664 && x <= 129673 || x >= 129679 && x <= 129734 || x >= 129742 && x <= 129756 || x >= 129759 && x <= 129769 || x >= 129776 && x <= 129784 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
}
function validate(codePoint) {
	if (!Number.isSafeInteger(codePoint)) throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
	validate(codePoint);
	if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) return 2;
	return 1;
}
var require_emoji_regex = __commonJSMin((exports, module) => {
	module.exports = () => {
		return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC2\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
	};
});
var import_emoji_regex = __toESM(require_emoji_regex(), 1);
const segmenter = new Intl.Segmenter();
const defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth(string, options = {}) {
	if (typeof string !== "string" || string.length === 0) return 0;
	const { ambiguousIsNarrow = true, countAnsiEscapeCodes = false } = options;
	if (!countAnsiEscapeCodes) string = stripAnsi(string);
	if (string.length === 0) return 0;
	let width = 0;
	const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
	for (const { segment: character } of segmenter.segment(string)) {
		const codePoint = character.codePointAt(0);
		if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) continue;
		if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) continue;
		if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) continue;
		if (codePoint >= 55296 && codePoint <= 57343) continue;
		if (codePoint >= 65024 && codePoint <= 65039) continue;
		if (defaultIgnorableCodePointRegex.test(character)) continue;
		if ((0, import_emoji_regex.default)().test(character)) {
			width += 2;
			continue;
		}
		width += eastAsianWidth(codePoint, eastAsianWidthOptions);
	}
	return width;
}
var import_cli_table3 = __toESM(require_cli_table3(), 1);
var import_picocolors$7 = __toESM(require_picocolors(), 1);
/**
* Responsive table class that adapts column widths based on terminal size
* Automatically adjusts formatting and layout for different screen sizes
*/
var ResponsiveTable = class {
	head;
	rows = [];
	colAligns;
	style;
	dateFormatter;
	compactHead;
	compactColAligns;
	compactThreshold;
	compactMode = false;
	/**
	* Creates a new responsive table instance
	* @param options - Table configuration options
	*/
	constructor(options) {
		this.head = options.head;
		this.colAligns = options.colAligns ?? Array.from({ length: this.head.length }, () => "left");
		this.style = options.style;
		this.dateFormatter = options.dateFormatter;
		this.compactHead = options.compactHead;
		this.compactColAligns = options.compactColAligns;
		this.compactThreshold = options.compactThreshold ?? 100;
	}
	/**
	* Adds a row to the table
	* @param row - Row data to add
	*/
	push(row) {
		this.rows.push(row);
	}
	/**
	* Filters a row to compact mode columns
	* @param row - Row to filter
	* @param compactIndices - Indices of columns to keep in compact mode
	* @returns Filtered row
	*/
	filterRowToCompact(row, compactIndices) {
		return compactIndices.map((index) => row[index] ?? "");
	}
	/**
	* Gets the current table head and col aligns based on compact mode
	* @returns Current head and colAligns arrays
	*/
	getCurrentTableConfig() {
		if (this.compactMode && this.compactHead != null && this.compactColAligns != null) return {
			head: this.compactHead,
			colAligns: this.compactColAligns
		};
		return {
			head: this.head,
			colAligns: this.colAligns
		};
	}
	/**
	* Gets indices mapping from full table to compact table
	* @returns Array of column indices to keep in compact mode
	*/
	getCompactIndices() {
		if (this.compactHead == null || !this.compactMode) return Array.from({ length: this.head.length }, (_, i) => i);
		return this.compactHead.map((compactHeader) => {
			const index = this.head.indexOf(compactHeader);
			if (index < 0) {
				console.warn(`Warning: Compact header "${compactHeader}" not found in table headers [${this.head.join(", ")}]. Using first column as fallback.`);
				return 0;
			}
			return index;
		});
	}
	/**
	* Returns whether the table is currently in compact mode
	* @returns True if compact mode is active
	*/
	isCompactMode() {
		return this.compactMode;
	}
	/**
	* Renders the table as a formatted string
	* Automatically adjusts layout based on terminal width
	* @returns Formatted table string
	*/
	toString() {
		const terminalWidth = Number.parseInt(process$1.env.COLUMNS ?? "", 10) || process$1.stdout.columns || 120;
		this.compactMode = terminalWidth < this.compactThreshold && this.compactHead != null;
		const { head, colAligns } = this.getCurrentTableConfig();
		const compactIndices = this.getCompactIndices();
		const dataRows = this.rows.filter((row) => !this.isSeparatorRow(row));
		const processedDataRows = this.compactMode ? dataRows.map((row) => this.filterRowToCompact(row, compactIndices)) : dataRows;
		const allRows = [head.map(String), ...processedDataRows.map((row) => row.map((cell) => {
			if (typeof cell === "object" && cell != null && "content" in cell) return String(cell.content);
			return String(cell ?? "");
		}))];
		const contentWidths = head.map((_, colIndex) => {
			const maxLength = Math.max(...allRows.map((row) => stringWidth(String(row[colIndex] ?? ""))));
			return maxLength;
		});
		const numColumns = head.length;
		const tableOverhead = 3 * numColumns + 1;
		const availableWidth = terminalWidth - tableOverhead;
		const columnWidths = contentWidths.map((width, index) => {
			const align = colAligns[index];
			if (align === "right") return Math.max(width + 3, 11);
			else if (index === 1) return Math.max(width + 2, 15);
			return Math.max(width + 2, 10);
		});
		const totalRequiredWidth = columnWidths.reduce((sum, width) => sum + width, 0) + tableOverhead;
		if (totalRequiredWidth > terminalWidth) {
			const scaleFactor = availableWidth / columnWidths.reduce((sum, width) => sum + width, 0);
			const adjustedWidths = columnWidths.map((width, index) => {
				const align = colAligns[index];
				let adjustedWidth = Math.floor(width * scaleFactor);
				if (align === "right") adjustedWidth = Math.max(adjustedWidth, 10);
				else if (index === 0) adjustedWidth = Math.max(adjustedWidth, 10);
				else if (index === 1) adjustedWidth = Math.max(adjustedWidth, 12);
				else adjustedWidth = Math.max(adjustedWidth, 8);
				return adjustedWidth;
			});
			const table = new import_cli_table3.default({
				head,
				style: this.style,
				colAligns,
				colWidths: adjustedWidths,
				wordWrap: true,
				wrapOnWordBoundary: true
			});
			for (const row of this.rows) if (this.isSeparatorRow(row)) continue;
			else {
				let processedRow = row.map((cell, index) => {
					if (index === 0 && this.dateFormatter != null && typeof cell === "string" && this.isDateString(cell)) return this.dateFormatter(cell);
					return cell;
				});
				if (this.compactMode) processedRow = this.filterRowToCompact(processedRow, compactIndices);
				table.push(processedRow);
			}
			return table.toString();
		} else {
			const table = new import_cli_table3.default({
				head,
				style: this.style,
				colAligns,
				colWidths: columnWidths,
				wordWrap: true,
				wrapOnWordBoundary: true
			});
			for (const row of this.rows) if (this.isSeparatorRow(row)) continue;
			else {
				const processedRow = this.compactMode ? this.filterRowToCompact(row, compactIndices) : row;
				table.push(processedRow);
			}
			return table.toString();
		}
	}
	/**
	* Checks if a row is a separator row (contains only empty cells or dashes)
	* @param row - Row to check
	* @returns True if the row is a separator
	*/
	isSeparatorRow(row) {
		return row.every((cell) => {
			if (typeof cell === "object" && cell != null && "content" in cell) return cell.content === "" || /^─+$/.test(cell.content);
			return typeof cell === "string" && (cell === "" || /^─+$/.test(cell));
		});
	}
	/**
	* Checks if a string matches the YYYY-MM-DD date format
	* @param text - String to check
	* @returns True if the string is a valid date format
	*/
	isDateString(text) {
		return /^\d{4}-\d{2}-\d{2}$/.test(text);
	}
};
/**
* Formats a number with locale-specific thousand separators
* @param num - The number to format
* @returns Formatted number string with commas as thousand separators
*/
function formatNumber(num) {
	return num.toLocaleString("en-US");
}
/**
* Formats a number as USD currency with dollar sign and 2 decimal places
* @param amount - The amount to format
* @returns Formatted currency string (e.g., "$12.34")
*/
function formatCurrency(amount) {
	return `$${amount.toFixed(2)}`;
}
/**
* Formats Claude model names into a shorter, more readable format
* Extracts model type and generation from full model name
* @param modelName - Full model name (e.g., "claude-sonnet-4-20250514")
* @returns Shortened model name (e.g., "sonnet-4") or original if pattern doesn't match
*/
function formatModelName(modelName) {
	const match = modelName.match(/claude-(\w+)-(\d+)-\d+/);
	if (match != null) return `${match[1]}-${match[2]}`;
	return modelName;
}
/**
* Formats an array of model names for display as a comma-separated string
* Removes duplicates and sorts alphabetically
* @param models - Array of model names
* @returns Formatted string with unique, sorted model names separated by commas
*/
function formatModelsDisplay(models) {
	const uniqueModels = uniq(models.map(formatModelName));
	return uniqueModels.sort().join(", ");
}
/**
* Formats an array of model names for display with each model on a new line
* Removes duplicates and sorts alphabetically
* @param models - Array of model names
* @returns Formatted string with unique, sorted model names as a bulleted list
*/
function formatModelsDisplayMultiline(models) {
	const uniqueModels = uniq(models.map(formatModelName));
	return uniqueModels.sort().map((model) => `- ${model}`).join("\n");
}
/**
* Pushes model breakdown rows to a table
* @param table - The table to push rows to
* @param table.push - Method to add rows to the table
* @param breakdowns - Array of model breakdowns
* @param extraColumns - Number of extra empty columns before the data (default: 1 for models column)
* @param trailingColumns - Number of extra empty columns after the data (default: 0)
*/
function pushBreakdownRows(table, breakdowns, extraColumns = 1, trailingColumns = 0) {
	for (const breakdown of breakdowns) {
		const row = [`  └─ ${formatModelName(breakdown.modelName)}`];
		for (let i = 0; i < extraColumns; i++) row.push("");
		const totalTokens = breakdown.inputTokens + breakdown.outputTokens + breakdown.cacheCreationTokens + breakdown.cacheReadTokens;
		row.push(import_picocolors$7.default.gray(formatNumber(breakdown.inputTokens)), import_picocolors$7.default.gray(formatNumber(breakdown.outputTokens)), import_picocolors$7.default.gray(formatNumber(breakdown.cacheCreationTokens)), import_picocolors$7.default.gray(formatNumber(breakdown.cacheReadTokens)), import_picocolors$7.default.gray(formatNumber(totalTokens)), import_picocolors$7.default.gray(formatCurrency(breakdown.cost)));
		for (let i = 0; i < trailingColumns; i++) row.push("");
		table.push(row);
	}
}
var import_picocolors$6 = __toESM(require_picocolors(), 1);
var import_usingCtx$1 = __toESM(require_usingCtx(), 1);
/**
* Parses token limit argument, supporting 'max' keyword
*/
function parseTokenLimit$1(value, maxFromAll) {
	if (value == null || value === "") return void 0;
	if (value === "max") return maxFromAll > 0 ? maxFromAll : void 0;
	const limit = Number.parseInt(value, 10);
	return Number.isNaN(limit) ? void 0 : limit;
}
const blocksMonitorCommand = define({
	name: "blocks-monitor",
	description: "Monitor active session block usage in CLI mode (non-interactive)",
	args: {
		...sharedCommandConfig.args,
		tokenLimit: {
			type: "string",
			short: "t",
			description: "Token limit for quota warnings (e.g., 500000 or \"max\")"
		},
		sessionLength: {
			type: "number",
			short: "l",
			description: `Session block duration in hours (default: ${DEFAULT_SESSION_DURATION_HOURS})`,
			default: DEFAULT_SESSION_DURATION_HOURS
		},
		refreshInterval: {
			type: "number",
			description: `Refresh interval in seconds (default: ${DEFAULT_REFRESH_INTERVAL_SECONDS})`,
			default: DEFAULT_REFRESH_INTERVAL_SECONDS
		}
	},
	toKebab: true,
	async run(ctx) {
		if (ctx.values.json) {
			logger.error("JSON output is not supported for blocks-monitor command");
			process$1.exit(1);
		}
		if (ctx.values.sessionLength <= 0) {
			logger.error("Session length must be a positive number");
			process$1.exit(1);
		}
		const paths = getClaudePaths();
		if (paths.length === 0) {
			logger.error("No valid Claude data directory found");
			process$1.exit(1);
		}
		const refreshInterval = Math.max(MIN_REFRESH_INTERVAL_SECONDS, Math.min(MAX_REFRESH_INTERVAL_SECONDS, ctx.values.refreshInterval));
		if (refreshInterval !== ctx.values.refreshInterval) logger.warn(`Refresh interval adjusted to ${refreshInterval} seconds (valid range: ${MIN_REFRESH_INTERVAL_SECONDS}-${MAX_REFRESH_INTERVAL_SECONDS})`);
		let maxTokensFromAll = 0;
		if (ctx.values.tokenLimit === "max") {
			const { loadSessionBlockData: loadSessionBlockData$1 } = await import("./data-loader.js");
			const allBlocks = await loadSessionBlockData$1({
				since: ctx.values.since,
				until: ctx.values.until,
				mode: ctx.values.mode,
				order: ctx.values.order,
				offline: ctx.values.offline,
				sessionDurationHours: ctx.values.sessionLength
			});
			for (const block of allBlocks) if (!(block.isGap ?? false) && !block.isActive) {
				const blockTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
				if (blockTokens > maxTokensFromAll) maxTokensFromAll = blockTokens;
			}
			if (maxTokensFromAll > 0) logger.info(`Using max tokens from previous sessions: ${formatNumber(maxTokensFromAll)}`);
		}
		const tokenLimit = parseTokenLimit$1(ctx.values.tokenLimit, maxTokensFromAll);
		const config = {
			claudePaths: paths,
			tokenLimit,
			refreshInterval: refreshInterval * 1e3,
			sessionDurationHours: ctx.values.sessionLength,
			mode: ctx.values.mode,
			order: ctx.values.order
		};
		await startCLIMonitoring(config);
	}
});
async function startCLIMonitoring(config) {
	try {
		var _usingCtx = (0, import_usingCtx$1.default)();
		const abortController = new AbortController();
		const submissionManager = _usingCtx.u(new ServerSubmissionManager());
		submissionManager.start();
		const cleanup = () => {
			abortController.abort();
			logger.info("\nMonitoring stopped.");
			if (process$1.exitCode == null) process$1.exit(0);
		};
		process$1.on("SIGINT", cleanup);
		process$1.on("SIGTERM", cleanup);
		const monitor = _usingCtx.u(new LiveMonitor({
			claudePaths: config.claudePaths,
			sessionDurationHours: config.sessionDurationHours,
			mode: config.mode,
			order: config.order
		}));
		logger.box("Claude Code Token Usage Monitor - CLI Mode");
		logger.info(`Monitoring active session blocks every ${config.refreshInterval / 1e3} seconds...`);
		logger.info("Press Ctrl+C to stop\n");
		let lastPrintedData = null;
		try {
			while (!abortController.signal.aborted) {
				const activeBlock = await monitor.getActiveBlock();
				monitor.clearCache();
				if (activeBlock == null) {
					const msg = "No active session block found. Waiting...";
					if (lastPrintedData !== msg) {
						log(import_picocolors$6.default.yellow(msg));
						lastPrintedData = msg;
					}
				} else {
					const projectData = extractProjectDataFromSessionBlock(activeBlock);
					submissionManager.updateProjectData(projectData);
					const combinedData = submissionManager.getCombinedData();
					printActiveBlockInfo(activeBlock, config, combinedData, lastPrintedData);
					lastPrintedData = "has-data";
				}
				await delay(config.refreshInterval, { signal: abortController.signal });
			}
		} catch (error) {
			if ((error instanceof DOMException || error instanceof Error) && error.name === "AbortError") return;
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Monitoring error: ${errorMessage}`);
			throw error;
		}
	} catch (_) {
		_usingCtx.e = _;
	} finally {
		_usingCtx.d();
	}
}
function printActiveBlockInfo(block, config, combinedData, _lastPrintedData) {
	const now = /* @__PURE__ */ new Date();
	const elapsed = (now.getTime() - block.startTime.getTime()) / (1e3 * 60);
	const remaining = (block.endTime.getTime() - now.getTime()) / (1e3 * 60);
	const currentProject = path.basename(process$1.cwd());
	const currentHostname = hostname();
	const localTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
	const totalTokens = combinedData != null ? combinedData.totalTokens.inputTokens + combinedData.totalTokens.outputTokens : localTokens;
	const remoteTokens = totalTokens - localTokens;
	const remoteHostCount = combinedData?.remoteHostCount ?? 0;
	log(`\n${import_picocolors$6.default.gray("─".repeat(60))}`);
	log(`${import_picocolors$6.default.bold("Update:")} ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`);
	log(`${import_picocolors$6.default.gray("─".repeat(60))}`);
	log(`${import_picocolors$6.default.bold("Session:")} Started ${block.startTime.toLocaleTimeString()} (${prettyMilliseconds(elapsed * 60 * 1e3, { compact: true })} ago)`);
	log(`${import_picocolors$6.default.bold("Remaining:")} ${prettyMilliseconds(remaining * 60 * 1e3, { compact: true })} until ${block.endTime.toLocaleTimeString()}`);
	log(`\n${import_picocolors$6.default.bold("Token Usage:")}`);
	if (remoteHostCount > 0) {
		log(`  Local: ${formatNumber(localTokens)} tokens`);
		log(`  Remote: ${formatNumber(remoteTokens)} tokens (${remoteHostCount} host${remoteHostCount > 1 ? "s" : ""})`);
		log(`  Total: ${formatNumber(totalTokens)} tokens`);
	} else log(`  Total: ${formatNumber(totalTokens)} tokens`);
	if (config.tokenLimit != null && config.tokenLimit > 0) {
		const percentUsed = totalTokens / config.tokenLimit * 100;
		const remainingTokens = Math.max(0, config.tokenLimit - totalTokens);
		const status = percentUsed > 100 ? import_picocolors$6.default.red("EXCEEDS LIMIT") : percentUsed > BLOCKS_WARNING_THRESHOLD * 100 ? import_picocolors$6.default.yellow("WARNING") : import_picocolors$6.default.green("OK");
		log(`  Limit: ${formatNumber(config.tokenLimit)} tokens`);
		log(`  Used: ${percentUsed.toFixed(1)}% ${status}`);
		log(`  Remaining: ${formatNumber(remainingTokens)} tokens`);
	}
	log(`  Cost: ${formatCurrency(block.costUSD)}`);
	const burnRate = calculateBurnRate(block);
	if (burnRate != null) {
		const rateStatus = burnRate.tokensPerMinute > 1e3 ? import_picocolors$6.default.red("HIGH") : burnRate.tokensPerMinute > 500 ? import_picocolors$6.default.yellow("MODERATE") : import_picocolors$6.default.green("NORMAL");
		log(`\n${import_picocolors$6.default.bold("Burn Rate:")}`);
		log(`  Tokens/min: ${formatNumber(burnRate.tokensPerMinute)} ${rateStatus}`);
		log(`  Cost/hour: ${formatCurrency(burnRate.costPerHour)}`);
	}
	const projection = projectBlockUsage(block);
	if (projection != null) {
		log(`\n${import_picocolors$6.default.bold("Projected (if current rate continues):")}`);
		log(`  Total Tokens: ${formatNumber(projection.totalTokens)}`);
		log(`  Total Cost: ${formatCurrency(projection.totalCost)}`);
		if (config.tokenLimit != null && config.tokenLimit > 0) {
			const projectedPercent = projection.totalTokens / config.tokenLimit * 100;
			const projectionStatus = projectedPercent > 100 ? import_picocolors$6.default.red("WILL EXCEED LIMIT") : projectedPercent > 80 ? import_picocolors$6.default.yellow("APPROACHING LIMIT") : import_picocolors$6.default.green("WITHIN LIMIT");
			log(`  Status: ${projectionStatus}`);
		}
	}
	if (block.modelBreakdowns.length > 0) {
		log(`\n${import_picocolors$6.default.bold("Model Breakdown:")}`);
		for (const mb of block.modelBreakdowns) {
			const totalModelTokens = mb.inputTokens + mb.outputTokens;
			log(`  ${mb.modelName}:`);
			log(`    Tokens: ${formatNumber(totalModelTokens)} (${formatNumber(mb.inputTokens)} in, ${formatNumber(mb.outputTokens)} out)`);
			if (mb.cacheCreationInputTokens > 0 || mb.cacheReadInputTokens > 0) log(`    Cache: ${formatNumber(mb.cacheCreationInputTokens)} create, ${formatNumber(mb.cacheReadInputTokens)} read`);
			log(`    Cost: ${formatCurrency(mb.cost)}`);
		}
	}
	if (block.models.length > 0) log(`\n${import_picocolors$6.default.bold("Models:")} ${block.models.join(", ")}`);
	if (combinedData?.guidResponseV2 != null) {
		log(`\n${import_picocolors$6.default.bold("Host Breakdown (Project Detail):")}`);
		const currentHostEntry = combinedData.guidResponseV2.entries.find((entry) => entry.hostname === currentHostname);
		if (currentHostEntry != null) {
			log(`  ${currentHostname} (current):`);
			for (const project of currentHostEntry.projects) {
				const projectTokens = project.tokens.inputTokens + project.tokens.outputTokens;
				log(`    ${project.projectName}: ${formatNumber(projectTokens)} tokens`);
			}
		} else {
			log(`  ${currentHostname} (current):`);
			log(`    Current Project: ${currentProject}`);
			log(`    Total Tokens: ${formatNumber(localTokens)}`);
		}
		const remoteHosts = combinedData.guidResponseV2.entries.filter((entry) => entry.hostname !== currentHostname);
		for (const host of remoteHosts) {
			log(`  ${host.hostname}:`);
			for (const project of host.projects) {
				const projectTokens = project.tokens.inputTokens + project.tokens.outputTokens;
				log(`    ${project.projectName}: ${formatNumber(projectTokens)} tokens`);
				log(`      Last Update: ${new Date(project.lastUpdated).toLocaleTimeString()}`);
			}
		}
	} else if (combinedData?.guidResponse != null) {
		log(`\n${import_picocolors$6.default.bold("Host Breakdown:")}`);
		log(`  ${currentHostname} (current):`);
		log(`    Project: ${currentProject}`);
		log(`    Tokens: ${formatNumber(localTokens)}`);
		const remoteHosts = combinedData.guidResponse.entries.filter((entry) => entry.hostname !== currentHostname);
		for (const host of remoteHosts) {
			const hostTotalTokens = host.tokens.inputTokens + host.tokens.outputTokens;
			log(`  ${host.hostname}:`);
			log(`    Tokens: ${formatNumber(hostTotalTokens)}`);
			log(`    Last Update: ${new Date(host.lastUpdated).toLocaleTimeString()}`);
			if (host.modelBreakdowns != null && host.modelBreakdowns.length > 0) for (const mb of host.modelBreakdowns) {
				const modelTokens = mb.inputTokens + mb.outputTokens;
				log(`      ${mb.modelName}: ${formatNumber(modelTokens)} tokens`);
			}
		}
	}
}
const isBrowser = globalThis.window?.document !== void 0;
const isNode = globalThis.process?.versions?.node !== void 0;
const isBun = globalThis.process?.versions?.bun !== void 0;
const isDeno = globalThis.Deno?.version?.deno !== void 0;
const isElectron = globalThis.process?.versions?.electron !== void 0;
const isJsDom = globalThis.navigator?.userAgent?.includes("jsdom") === true;
const isWebWorker = typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope;
const isDedicatedWorker = typeof DedicatedWorkerGlobalScope !== "undefined" && globalThis instanceof DedicatedWorkerGlobalScope;
const isSharedWorker = typeof SharedWorkerGlobalScope !== "undefined" && globalThis instanceof SharedWorkerGlobalScope;
const isServiceWorker = typeof ServiceWorkerGlobalScope !== "undefined" && globalThis instanceof ServiceWorkerGlobalScope;
const platform = globalThis.navigator?.userAgentData?.platform;
const isMacOs = platform === "macOS" || globalThis.navigator?.platform === "MacIntel" || globalThis.navigator?.userAgent?.includes(" Mac ") === true || globalThis.process?.platform === "darwin";
const isWindows$1 = platform === "Windows" || globalThis.navigator?.platform === "Win32" || globalThis.process?.platform === "win32";
const isLinux = platform === "Linux" || globalThis.navigator?.platform?.startsWith("Linux") === true || globalThis.navigator?.userAgent?.includes(" Linux ") === true || globalThis.process?.platform === "linux";
const isIos = platform === "iOS" || globalThis.navigator?.platform === "MacIntel" && globalThis.navigator?.maxTouchPoints > 1 || /iPad|iPhone|iPod/.test(globalThis.navigator?.platform);
const isAndroid = platform === "Android" || globalThis.navigator?.platform === "Android" || globalThis.navigator?.userAgent?.includes(" Android ") === true || globalThis.process?.platform === "android";
const ESC = "\x1B[";
const SEP = ";";
const isTerminalApp = !isBrowser && process$1.env.TERM_PROGRAM === "Apple_Terminal";
const isWindows = !isBrowser && process$1.platform === "win32";
const cwdFunction = isBrowser ? () => {
	throw new Error("`process.cwd()` only works in Node.js, not the browser.");
} : process$1.cwd;
const cursorTo = (x, y) => {
	if (typeof x !== "number") throw new TypeError("The `x` argument is required");
	if (typeof y !== "number") return ESC + (x + 1) + "G";
	return ESC + (y + 1) + SEP + (x + 1) + "H";
};
const cursorLeft = ESC + "G";
const cursorSavePosition = isTerminalApp ? "\x1B7" : ESC + "s";
const cursorRestorePosition = isTerminalApp ? "\x1B8" : ESC + "u";
const cursorGetPosition = ESC + "6n";
const cursorNextLine = ESC + "E";
const cursorPrevLine = ESC + "F";
const cursorHide = ESC + "?25l";
const cursorShow = ESC + "?25h";
const eraseEndLine = ESC + "K";
const eraseStartLine = ESC + "1K";
const eraseLine = ESC + "2K";
const eraseDown = ESC + "J";
const eraseUp = ESC + "1J";
const eraseScreen = ESC + "2J";
const scrollUp = ESC + "S";
const scrollDown = ESC + "T";
const clearScreen = "\x1Bc";
const clearTerminal = isWindows ? `${eraseScreen}${ESC}0f` : `${eraseScreen}${ESC}3J${ESC}H`;
const enterAlternativeScreen = ESC + "?1049h";
const exitAlternativeScreen = ESC + "?1049l";
const SYNC_START = "\x1B[?2026h";
const SYNC_END = "\x1B[?2026l";
const DISABLE_LINE_WRAP = "\x1B[?7l";
const ENABLE_LINE_WRAP = "\x1B[?7h";
const ANSI_RESET = "\x1B[0m";
/**
* Manages terminal state for live updates
* Provides a clean interface for terminal operations with automatic TTY checking
* and cursor state management for live monitoring displays
*/
var TerminalManager = class {
	stream;
	cursorHidden = false;
	buffer = [];
	useBuffering = false;
	alternateScreenActive = false;
	syncMode = false;
	constructor(stream = process$1.stdout) {
		this.stream = stream;
	}
	/**
	* Hides the terminal cursor for cleaner live updates
	* Only works in TTY environments (real terminals)
	*/
	hideCursor() {
		if (!this.cursorHidden && this.stream.isTTY) {
			this.stream.write(cursorHide);
			this.cursorHidden = true;
		}
	}
	/**
	* Shows the terminal cursor
	* Should be called during cleanup to restore normal terminal behavior
	*/
	showCursor() {
		if (this.cursorHidden && this.stream.isTTY) {
			this.stream.write(cursorShow);
			this.cursorHidden = false;
		}
	}
	/**
	* Clears the entire screen and moves cursor to top-left corner
	* Essential for live monitoring displays that need to refresh completely
	*/
	clearScreen() {
		if (this.stream.isTTY) {
			this.stream.write(clearScreen);
			this.stream.write(cursorTo(0, 0));
		}
	}
	/**
	* Writes text to the terminal stream
	* Supports buffering mode for performance optimization
	*/
	write(text) {
		if (this.useBuffering) this.buffer.push(text);
		else this.stream.write(text);
	}
	/**
	* Enables buffering mode - collects all writes in memory instead of sending immediately
	* This prevents flickering when doing many rapid updates
	*/
	startBuffering() {
		this.useBuffering = true;
		this.buffer = [];
	}
	/**
	* Sends all buffered content to terminal at once
	* This creates smooth, atomic updates without flickering
	*/
	flush() {
		if (this.useBuffering && this.buffer.length > 0) {
			if (this.syncMode && this.stream.isTTY) this.stream.write(SYNC_START + this.buffer.join("") + SYNC_END);
			else this.stream.write(this.buffer.join(""));
			this.buffer = [];
		}
		this.useBuffering = false;
	}
	/**
	* Switches to alternate screen buffer (like vim/less does)
	* This preserves what was on screen before and allows full-screen apps
	*/
	enterAlternateScreen() {
		if (!this.alternateScreenActive && this.stream.isTTY) {
			this.stream.write(enterAlternativeScreen);
			this.stream.write(DISABLE_LINE_WRAP);
			this.alternateScreenActive = true;
		}
	}
	/**
	* Returns to normal screen, restoring what was there before
	*/
	exitAlternateScreen() {
		if (this.alternateScreenActive && this.stream.isTTY) {
			this.stream.write(ENABLE_LINE_WRAP);
			this.stream.write(exitAlternativeScreen);
			this.alternateScreenActive = false;
		}
	}
	/**
	* Enables sync mode - terminal will wait for END signal before showing updates
	* Prevents the user from seeing partial/torn screen updates
	*/
	enableSyncMode() {
		this.syncMode = true;
	}
	/**
	* Disables synchronized output mode
	*/
	disableSyncMode() {
		this.syncMode = false;
	}
	/**
	* Gets terminal width in columns
	* Falls back to 80 columns if detection fails
	*/
	get width() {
		return this.stream.columns || 80;
	}
	/**
	* Gets terminal height in rows
	* Falls back to 24 rows if detection fails
	*/
	get height() {
		return this.stream.rows || 24;
	}
	/**
	* Returns true if output goes to a real terminal (not a file or pipe)
	* We only send fancy ANSI codes to real terminals
	*/
	get isTTY() {
		return this.stream.isTTY ?? false;
	}
	/**
	* Restores terminal to normal state - MUST call before program exits
	* Otherwise user's terminal might be left in a broken state
	*/
	cleanup() {
		this.showCursor();
		this.exitAlternateScreen();
		this.disableSyncMode();
	}
};
/**
* Creates a progress bar string with customizable appearance
*
* Example: createProgressBar(75, 100, 20) -> "[████████████████░░░░] 75.0%"
*
* @param value - Current progress value
* @param max - Maximum value (100% point)
* @param width - Character width of the progress bar (excluding brackets and text)
* @param options - Customization options for appearance and display
* @param options.showPercentage - Whether to show percentage after the bar
* @param options.showValues - Whether to show current/max values
* @param options.fillChar - Character for filled portion (default: '█')
* @param options.emptyChar - Character for empty portion (default: '░')
* @param options.leftBracket - Left bracket character (default: '[')
* @param options.rightBracket - Right bracket character (default: ']')
* @param options.colors - Color configuration for different thresholds
* @param options.colors.low - Color for low percentage values
* @param options.colors.medium - Color for medium percentage values
* @param options.colors.high - Color for high percentage values
* @param options.colors.critical - Color for critical percentage values
* @returns Formatted progress bar string with optional percentage/values
*/
function createProgressBar(value, max, width, options = {}) {
	const { showPercentage = true, showValues = false, fillChar = "█", emptyChar = "░", leftBracket = "[", rightBracket = "]", colors: colors$2 = {} } = options;
	const percentage = max > 0 ? Math.min(100, value / max * 100) : 0;
	const fillWidth = Math.round(percentage / 100 * width);
	const emptyWidth = width - fillWidth;
	let color = "";
	if (colors$2.critical != null && percentage >= 90) color = colors$2.critical;
	else if (colors$2.high != null && percentage >= 80) color = colors$2.high;
	else if (colors$2.medium != null && percentage >= 50) color = colors$2.medium;
	else if (colors$2.low != null) color = colors$2.low;
	let bar = leftBracket;
	if (color !== "") bar += color;
	bar += fillChar.repeat(fillWidth);
	bar += emptyChar.repeat(emptyWidth);
	if (color !== "") bar += ANSI_RESET;
	bar += rightBracket;
	if (showPercentage) bar += ` ${percentage.toFixed(1)}%`;
	if (showValues) bar += ` (${value}/${max})`;
	return bar;
}
/**
* Centers text within a specified width using spaces for padding
*
* Uses string-width to handle Unicode characters and ANSI escape codes properly.
* If text is longer than width, returns original text without truncation.
*
* Example: centerText("Hello", 10) -> "  Hello   "
*
* @param text - Text to center (may contain ANSI color codes)
* @param width - Total character width including padding
* @returns Text with spaces added for centering
*/
function centerText(text, width) {
	const textLength = stringWidth(text);
	if (textLength >= width) return text;
	const leftPadding = Math.floor((width - textLength) / 2);
	const rightPadding = width - textLength - leftPadding;
	return " ".repeat(leftPadding) + text + " ".repeat(rightPadding);
}
var import_picocolors$5 = __toESM(require_picocolors(), 1);
/**
* Delay with AbortSignal support and graceful error handling
*/
async function delayWithAbort(ms, signal) {
	await delay(ms, { signal });
}
/**
* Shows waiting message when no Claude session is active
* Uses efficient cursor positioning instead of full screen clear
*/
async function renderWaitingState(terminal, config, signal) {
	terminal.startBuffering();
	terminal.write(cursorTo(0, 0));
	terminal.write(eraseDown);
	terminal.write(import_picocolors$5.default.yellow("No active session block found. Waiting...\n"));
	terminal.write(cursorHide);
	terminal.flush();
	await delayWithAbort(config.refreshInterval, signal);
}
/**
* Displays the live monitoring dashboard for active Claude session
* Uses buffering and sync mode to prevent screen flickering
*/
function renderActiveBlock(terminal, activeBlock, config, combinedData) {
	terminal.startBuffering();
	terminal.write(cursorTo(0, 0));
	terminal.write(eraseDown);
	renderLiveDisplay(terminal, activeBlock, config, combinedData);
	terminal.write(cursorHide);
	terminal.flush();
}
/**
* Format token counts with K suffix for display
*/
function formatTokensShort(num) {
	if (num >= 1e3) return `${(num / 1e3).toFixed(1)}k`;
	return num.toString();
}
/**
* Column layout constants for detail rows
*/
const DETAIL_COLUMN_WIDTHS = {
	col1: 46,
	col2: 37
};
/**
* Renders the live display for an active session block
*/
function renderLiveDisplay(terminal, block, config, combinedData) {
	const width = terminal.width;
	const now = /* @__PURE__ */ new Date();
	const localTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
	const totalTokens = combinedData != null ? combinedData.totalTokens.inputTokens + combinedData.totalTokens.outputTokens : localTokens;
	const remoteTokens = totalTokens - localTokens;
	const remoteHostCount = combinedData?.remoteHostCount ?? 0;
	const elapsed = (now.getTime() - block.startTime.getTime()) / (1e3 * 60);
	const remaining = (block.endTime.getTime() - now.getTime()) / (1e3 * 60);
	if (width < 60) {
		renderCompactLiveDisplay(terminal, block, config, totalTokens, elapsed, remaining, combinedData);
		return;
	}
	const boxWidth = Math.min(120, width - 2);
	const boxMargin = Math.floor((width - boxWidth) / 2);
	const marginStr = " ".repeat(boxMargin);
	const labelWidth = 14;
	const percentWidth = 7;
	const shortLabelWidth = 20;
	const barWidth = boxWidth - labelWidth - percentWidth - shortLabelWidth - 4;
	const sessionDuration = elapsed + remaining;
	const sessionPercent = elapsed / sessionDuration * 100;
	const sessionProgressBar = createProgressBar(elapsed, sessionDuration, barWidth, {
		showPercentage: false,
		fillChar: import_picocolors$5.default.cyan("█"),
		emptyChar: import_picocolors$5.default.gray("░"),
		leftBracket: "[",
		rightBracket: "]"
	});
	const startTime = block.startTime.toLocaleTimeString(void 0, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true
	});
	const endTime = block.endTime.toLocaleTimeString(void 0, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true
	});
	terminal.write(`${marginStr}┌${"─".repeat(boxWidth - 2)}┐\n`);
	terminal.write(`${marginStr}│${import_picocolors$5.default.bold(centerText("CLAUDE CODE - LIVE TOKEN USAGE MONITOR", boxWidth - 2))}│\n`);
	terminal.write(`${marginStr}├${"─".repeat(boxWidth - 2)}┤\n`);
	terminal.write(`${marginStr}│${" ".repeat(boxWidth - 2)}│\n`);
	const sessionLabel = import_picocolors$5.default.bold("⏱️ SESSION");
	const sessionLabelWidth = stringWidth(sessionLabel);
	const sessionBarStr = `${sessionLabel}${"".padEnd(Math.max(0, labelWidth - sessionLabelWidth))} ${sessionProgressBar} ${sessionPercent.toFixed(1).padStart(6)}%`;
	const sessionBarPadded = sessionBarStr + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(sessionBarStr)));
	terminal.write(`${marginStr}│ ${sessionBarPadded}│\n`);
	const col1 = `${import_picocolors$5.default.gray("Started:")} ${startTime}`;
	const col2 = `${import_picocolors$5.default.gray("Elapsed:")} ${prettyMilliseconds(elapsed * 60 * 1e3, { compact: true })}`;
	const col3 = `${import_picocolors$5.default.gray("Remaining:")} ${prettyMilliseconds(remaining * 60 * 1e3, { compact: true })} (${endTime})`;
	const col1Visible = stringWidth(col1);
	const col2Visible = stringWidth(col2);
	const pad1 = " ".repeat(Math.max(0, DETAIL_COLUMN_WIDTHS.col1 - col1Visible));
	const pad2 = " ".repeat(Math.max(0, DETAIL_COLUMN_WIDTHS.col2 - col2Visible));
	const sessionDetails = `   ${col1}${pad1}${pad2}${col3}`;
	const sessionDetailsPadded = sessionDetails + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(sessionDetails)));
	terminal.write(`${marginStr}│ ${sessionDetailsPadded}│\n`);
	terminal.write(`${marginStr}│${" ".repeat(boxWidth - 2)}│\n`);
	terminal.write(`${marginStr}├${"─".repeat(boxWidth - 2)}┤\n`);
	terminal.write(`${marginStr}│${" ".repeat(boxWidth - 2)}│\n`);
	const tokenPercent = config.tokenLimit != null && config.tokenLimit > 0 ? totalTokens / config.tokenLimit * 100 : 0;
	let barColor = import_picocolors$5.default.green;
	if (tokenPercent > 100) barColor = import_picocolors$5.default.red;
	else if (tokenPercent > 80) barColor = import_picocolors$5.default.yellow;
	const usageBar = config.tokenLimit != null && config.tokenLimit > 0 ? createProgressBar(totalTokens, config.tokenLimit, barWidth, {
		showPercentage: false,
		fillChar: barColor("█"),
		emptyChar: import_picocolors$5.default.gray("░"),
		leftBracket: "[",
		rightBracket: "]"
	}) : `[${import_picocolors$5.default.green("█".repeat(Math.floor(barWidth * .1)))}${import_picocolors$5.default.gray("░".repeat(barWidth - Math.floor(barWidth * .1)))}]`;
	const burnRate = calculateBurnRate(block);
	const rateIndicator = burnRate != null ? burnRate.tokensPerMinute > 1e3 ? import_picocolors$5.default.red("⚡ HIGH") : burnRate.tokensPerMinute > 500 ? import_picocolors$5.default.yellow("⚡ MODERATE") : import_picocolors$5.default.green("✓ NORMAL") : "";
	const rateDisplay = burnRate != null ? `${import_picocolors$5.default.bold("Burn Rate:")} ${Math.round(burnRate.tokensPerMinute)} token/min ${rateIndicator}` : `${import_picocolors$5.default.bold("Burn Rate:")} N/A`;
	const usageLabel = import_picocolors$5.default.bold("🔥 USAGE");
	const usageLabelWidth = stringWidth(usageLabel);
	const { usageBarStr, usageCol1, usageCol2, usageCol3 } = config.tokenLimit != null && config.tokenLimit > 0 ? {
		usageBarStr: `${usageLabel}${"".padEnd(Math.max(0, labelWidth - usageLabelWidth))} ${usageBar} ${tokenPercent.toFixed(1).padStart(6)}% (${formatTokensShort(totalTokens)}/${formatTokensShort(config.tokenLimit)})`,
		usageCol1: remoteHostCount > 0 ? `${import_picocolors$5.default.gray("Local:")} ${formatNumber(localTokens)} ${import_picocolors$5.default.gray("Remote:")} ${formatNumber(remoteTokens)} (${remoteHostCount} host${remoteHostCount > 1 ? "s" : ""})` : `${import_picocolors$5.default.gray("Tokens:")} ${formatNumber(totalTokens)} (${rateDisplay})`,
		usageCol2: `${import_picocolors$5.default.gray("Limit:")} ${formatNumber(config.tokenLimit)} tokens`,
		usageCol3: remoteHostCount > 0 ? `${import_picocolors$5.default.gray("Total:")} ${formatNumber(totalTokens)} ${import_picocolors$5.default.gray("Cost:")} ${formatCurrency(block.costUSD)}` : `${import_picocolors$5.default.gray("Cost:")} ${formatCurrency(block.costUSD)}`
	} : {
		usageBarStr: `${usageLabel}${"".padEnd(Math.max(0, labelWidth - usageLabelWidth))} ${usageBar} (${formatTokensShort(totalTokens)} tokens)`,
		usageCol1: remoteHostCount > 0 ? `${import_picocolors$5.default.gray("Local:")} ${formatNumber(localTokens)} ${import_picocolors$5.default.gray("Remote:")} ${formatNumber(remoteTokens)} (${remoteHostCount} host${remoteHostCount > 1 ? "s" : ""})` : `${import_picocolors$5.default.gray("Tokens:")} ${formatNumber(totalTokens)} (${rateDisplay})`,
		usageCol2: remoteHostCount > 0 ? `${import_picocolors$5.default.gray("Total:")} ${formatNumber(totalTokens)}` : "",
		usageCol3: `${import_picocolors$5.default.gray("Cost:")} ${formatCurrency(block.costUSD)}`
	};
	const usageBarPadded = usageBarStr + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(usageBarStr)));
	terminal.write(`${marginStr}│ ${usageBarPadded}│\n`);
	const usageCol1Visible = stringWidth(usageCol1);
	const usageCol2Visible = stringWidth(usageCol2);
	const usagePad1 = " ".repeat(Math.max(0, DETAIL_COLUMN_WIDTHS.col1 - usageCol1Visible));
	const usagePad2 = usageCol2.length > 0 ? " ".repeat(Math.max(0, DETAIL_COLUMN_WIDTHS.col2 - usageCol2Visible)) : " ".repeat(DETAIL_COLUMN_WIDTHS.col2);
	const usageDetails = `   ${usageCol1}${usagePad1}${usageCol2}${usagePad2}${usageCol3}`;
	const usageDetailsPadded = usageDetails + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(usageDetails)));
	terminal.write(`${marginStr}│ ${usageDetailsPadded}│\n`);
	terminal.write(`${marginStr}│${" ".repeat(boxWidth - 2)}│\n`);
	terminal.write(`${marginStr}├${"─".repeat(boxWidth - 2)}┤\n`);
	terminal.write(`${marginStr}│${" ".repeat(boxWidth - 2)}│\n`);
	const projection = projectBlockUsage(block);
	if (projection != null) {
		const projectedPercent = config.tokenLimit != null && config.tokenLimit > 0 ? projection.totalTokens / config.tokenLimit * 100 : 0;
		let projBarColor = import_picocolors$5.default.green;
		if (projectedPercent > 100) projBarColor = import_picocolors$5.default.red;
		else if (projectedPercent > 80) projBarColor = import_picocolors$5.default.yellow;
		const projectionBar = config.tokenLimit != null && config.tokenLimit > 0 ? createProgressBar(projection.totalTokens, config.tokenLimit, barWidth, {
			showPercentage: false,
			fillChar: projBarColor("█"),
			emptyChar: import_picocolors$5.default.gray("░"),
			leftBracket: "[",
			rightBracket: "]"
		}) : `[${import_picocolors$5.default.green("█".repeat(Math.floor(barWidth * .15)))}${import_picocolors$5.default.gray("░".repeat(barWidth - Math.floor(barWidth * .15)))}]`;
		const limitStatus = config.tokenLimit != null && config.tokenLimit > 0 ? projectedPercent > 100 ? import_picocolors$5.default.red("❌ WILL EXCEED LIMIT") : projectedPercent > 80 ? import_picocolors$5.default.yellow("⚠️  APPROACHING LIMIT") : import_picocolors$5.default.green("✓ WITHIN LIMIT") : import_picocolors$5.default.green("✓ ON TRACK");
		const projLabel = import_picocolors$5.default.bold("📈 PROJECTION");
		const projLabelWidth = stringWidth(projLabel);
		if (config.tokenLimit != null && config.tokenLimit > 0) {
			const projBarStr = `${projLabel}${"".padEnd(Math.max(0, labelWidth - projLabelWidth))} ${projectionBar} ${projectedPercent.toFixed(1).padStart(6)}% (${formatTokensShort(projection.totalTokens)}/${formatTokensShort(config.tokenLimit)})`;
			const projBarPadded = projBarStr + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(projBarStr)));
			terminal.write(`${marginStr}│ ${projBarPadded}│\n`);
			const col1$1 = `${import_picocolors$5.default.gray("Status:")} ${limitStatus}`;
			const col2$1 = `${import_picocolors$5.default.gray("Tokens:")} ${formatNumber(projection.totalTokens)}`;
			const col3$1 = `${import_picocolors$5.default.gray("Cost:")} ${formatCurrency(projection.totalCost)}`;
			const col1Visible$1 = stringWidth(col1$1);
			const col2Visible$1 = stringWidth(col2$1);
			const pad1$1 = " ".repeat(Math.max(0, DETAIL_COLUMN_WIDTHS.col1 - col1Visible$1));
			const pad2$1 = " ".repeat(Math.max(0, DETAIL_COLUMN_WIDTHS.col2 - col2Visible$1));
			const projDetails = `   ${col1$1}${pad1$1}${col2$1}${pad2$1}${col3$1}`;
			const projDetailsPadded = projDetails + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(projDetails)));
			terminal.write(`${marginStr}│ ${projDetailsPadded}│\n`);
		} else {
			const projBarStr = `${projLabel}${"".padEnd(Math.max(0, labelWidth - projLabelWidth))} ${projectionBar} (${formatTokensShort(projection.totalTokens)} tokens)`;
			const projBarPadded = projBarStr + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(projBarStr)));
			terminal.write(`${marginStr}│ ${projBarPadded}│\n`);
			const col1$1 = `${import_picocolors$5.default.gray("Status:")} ${limitStatus}`;
			const col2$1 = `${import_picocolors$5.default.gray("Tokens:")} ${formatNumber(projection.totalTokens)}`;
			const col3$1 = `${import_picocolors$5.default.gray("Cost:")} ${formatCurrency(projection.totalCost)}`;
			const col1Visible$1 = stringWidth(col1$1);
			const col2Visible$1 = stringWidth(col2$1);
			const pad1$1 = " ".repeat(Math.max(0, DETAIL_COLUMN_WIDTHS.col1 - col1Visible$1));
			const pad2$1 = " ".repeat(Math.max(0, DETAIL_COLUMN_WIDTHS.col2 - col2Visible$1));
			const projDetails = `   ${col1$1}${pad1$1}${col2$1}${pad2$1}${col3$1}`;
			const projDetailsPadded = projDetails + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(projDetails)));
			terminal.write(`${marginStr}│ ${projDetailsPadded}│\n`);
		}
		terminal.write(`${marginStr}│${" ".repeat(boxWidth - 2)}│\n`);
	}
	if (block.models.length > 0) {
		terminal.write(`${marginStr}├${"─".repeat(boxWidth - 2)}┤\n`);
		const modelsLine = `⚙️  Models: ${formatModelsDisplay(block.models)}`;
		const modelsLinePadded = modelsLine + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(modelsLine)));
		terminal.write(`${marginStr}│ ${modelsLinePadded}│\n`);
	}
	if (block.modelBreakdowns.length > 0) {
		terminal.write(`${marginStr}│${" ".repeat(boxWidth - 2)}│\n`);
		terminal.write(`${marginStr}│   ${import_picocolors$5.default.bold("Model Breakdown:")}${" ".repeat(boxWidth - 21)}│\n`);
		for (const mb of block.modelBreakdowns) {
			const totalTokens$1 = mb.inputTokens + mb.outputTokens;
			const modelLine = `   ${mb.modelName}: ${formatNumber(totalTokens$1)} tokens (${formatCurrency(mb.cost)})`;
			const modelLinePadded = modelLine + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(modelLine)));
			terminal.write(`${marginStr}│ ${modelLinePadded}│\n`);
			if (mb.cacheCreationInputTokens > 0 || mb.cacheReadInputTokens > 0) {
				const cacheLine = `      ${import_picocolors$5.default.gray("Cache:")} ${formatNumber(mb.cacheCreationInputTokens)} create, ${formatNumber(mb.cacheReadInputTokens)} read`;
				const cacheLinePadded = cacheLine + " ".repeat(Math.max(0, boxWidth - 3 - stringWidth(cacheLine)));
				terminal.write(`${marginStr}│ ${cacheLinePadded}│\n`);
			}
		}
	}
	terminal.write(`${marginStr}├${"─".repeat(boxWidth - 2)}┤\n`);
	const refreshText = `↻ Refreshing every ${config.refreshInterval / 1e3}s  •  Press Ctrl+C to stop`;
	terminal.write(`${marginStr}│${import_picocolors$5.default.gray(centerText(refreshText, boxWidth - 2))}│\n`);
	terminal.write(`${marginStr}└${"─".repeat(boxWidth - 2)}┘\n`);
}
/**
* Renders a compact live display for narrow terminals
*/
function renderCompactLiveDisplay(terminal, block, config, totalTokens, elapsed, remaining, combinedData) {
	const width = terminal.width;
	terminal.write(`${import_picocolors$5.default.bold(centerText("LIVE MONITOR", width))}\n`);
	terminal.write(`${"─".repeat(width)}\n`);
	const sessionPercent = elapsed / (elapsed + remaining) * 100;
	terminal.write(`Session: ${sessionPercent.toFixed(1)}% (${Math.floor(elapsed / 60)}h ${Math.floor(elapsed % 60)}m)\n`);
	const localTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
	const remoteTokens = totalTokens - localTokens;
	const remoteHostCount = combinedData?.remoteHostCount ?? 0;
	if (remoteHostCount > 0) {
		terminal.write(`Local: ${formatNumber(localTokens)}\n`);
		terminal.write(`Remote: ${formatNumber(remoteTokens)} (${remoteHostCount} host${remoteHostCount > 1 ? "s" : ""})\n`);
		terminal.write(`Total: ${formatNumber(totalTokens)}\n`);
	} else if (config.tokenLimit != null && config.tokenLimit > 0) {
		const tokenPercent = totalTokens / config.tokenLimit * 100;
		const status = tokenPercent > 100 ? import_picocolors$5.default.red("OVER") : tokenPercent > 80 ? import_picocolors$5.default.yellow("WARN") : import_picocolors$5.default.green("OK");
		terminal.write(`Tokens: ${formatNumber(totalTokens)}/${formatNumber(config.tokenLimit)} ${status}\n`);
	} else terminal.write(`Tokens: ${formatNumber(totalTokens)}\n`);
	terminal.write(`Cost: ${formatCurrency(block.costUSD)}\n`);
	const burnRate = calculateBurnRate(block);
	if (burnRate != null) terminal.write(`Rate: ${formatNumber(burnRate.tokensPerMinute)}/min\n`);
	if (block.modelBreakdowns.length > 0) {
		terminal.write(`${"─".repeat(width)}\n`);
		for (const mb of block.modelBreakdowns) {
			const totalTokens$1 = mb.inputTokens + mb.outputTokens;
			terminal.write(`${mb.modelName}: ${formatNumber(totalTokens$1)}t\n`);
		}
	}
	terminal.write(`${"─".repeat(width)}\n`);
	terminal.write(import_picocolors$5.default.gray(`Refresh: ${config.refreshInterval / 1e3}s | Ctrl+C: stop\n`));
}
var import_picocolors$4 = __toESM(require_picocolors(), 1);
var import_usingCtx = __toESM(require_usingCtx(), 1);
async function startLiveMonitoring(config) {
	try {
		var _usingCtx = (0, import_usingCtx.default)();
		const terminal = new TerminalManager();
		const abortController = new AbortController();
		let lastRenderTime = 0;
		const submissionManager = _usingCtx.u(new ServerSubmissionManager());
		submissionManager.start();
		const cleanup = () => {
			abortController.abort();
			terminal.cleanup();
			terminal.clearScreen();
			logger.info("Live monitoring stopped.");
			if (process$1.exitCode == null) process$1.exit(0);
		};
		process$1.on("SIGINT", cleanup);
		process$1.on("SIGTERM", cleanup);
		terminal.enterAlternateScreen();
		terminal.enableSyncMode();
		terminal.clearScreen();
		terminal.hideCursor();
		const monitor = _usingCtx.u(new LiveMonitor({
			claudePaths: config.claudePaths,
			sessionDurationHours: config.sessionDurationHours,
			mode: config.mode,
			order: config.order
		}));
		try {
			while (!abortController.signal.aborted) {
				const now = Date.now();
				const timeSinceLastRender = now - lastRenderTime;
				if (timeSinceLastRender < MIN_RENDER_INTERVAL_MS) {
					await delayWithAbort(MIN_RENDER_INTERVAL_MS - timeSinceLastRender, abortController.signal);
					continue;
				}
				const activeBlock = await monitor.getActiveBlock();
				monitor.clearCache();
				if (activeBlock == null) {
					await renderWaitingState(terminal, config, abortController.signal);
					continue;
				}
				const { extractProjectDataFromSessionBlock: extractProjectDataFromSessionBlock$1 } = await import("./_server-client-CoHpogaI.js");
				const projectData = extractProjectDataFromSessionBlock$1(activeBlock);
				submissionManager.updateProjectData(projectData);
				const combinedData = submissionManager.getCombinedData();
				renderActiveBlock(terminal, activeBlock, config, combinedData);
				lastRenderTime = Date.now();
				await delayWithAbort(config.refreshInterval, abortController.signal);
			}
		} catch (error) {
			if ((error instanceof DOMException || error instanceof Error) && error.name === "AbortError") return;
			const errorMessage = error instanceof Error ? error.message : String(error);
			terminal.startBuffering();
			terminal.clearScreen();
			terminal.write(import_picocolors$4.default.red(`Error: ${errorMessage}\n`));
			terminal.flush();
			logger.error(`Live monitoring error: ${errorMessage}`);
			await delayWithAbort(config.refreshInterval, abortController.signal).catch(() => {});
		}
	} catch (_) {
		_usingCtx.e = _;
	} finally {
		_usingCtx.d();
	}
}
var import_picocolors$3 = __toESM(require_picocolors(), 1);
/**
* Formats the time display for a session block
* @param block - Session block to format
* @param compact - Whether to use compact formatting for narrow terminals
* @returns Formatted time string with duration and status information
*/
function formatBlockTime(block, compact = false) {
	const start = compact ? block.startTime.toLocaleString(void 0, {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	}) : block.startTime.toLocaleString();
	if (block.isGap ?? false) {
		const end = compact ? block.endTime.toLocaleString(void 0, {
			hour: "2-digit",
			minute: "2-digit"
		}) : block.endTime.toLocaleString();
		const duration$1 = Math.round((block.endTime.getTime() - block.startTime.getTime()) / (1e3 * 60 * 60));
		return compact ? `${start}-${end}\n(${duration$1}h gap)` : `${start} - ${end} (${duration$1}h gap)`;
	}
	const duration = block.actualEndTime != null ? Math.round((block.actualEndTime.getTime() - block.startTime.getTime()) / (1e3 * 60)) : 0;
	if (block.isActive) {
		const now = /* @__PURE__ */ new Date();
		const elapsed = Math.round((now.getTime() - block.startTime.getTime()) / (1e3 * 60));
		const remaining = Math.round((block.endTime.getTime() - now.getTime()) / (1e3 * 60));
		const elapsedHours = Math.floor(elapsed / 60);
		const elapsedMins = elapsed % 60;
		const remainingHours = Math.floor(remaining / 60);
		const remainingMins = remaining % 60;
		if (compact) return `${start}\n(${elapsedHours}h${elapsedMins}m/${remainingHours}h${remainingMins}m)`;
		return `${start} (${elapsedHours}h ${elapsedMins}m elapsed, ${remainingHours}h ${remainingMins}m remaining)`;
	}
	const hours = Math.floor(duration / 60);
	const mins = duration % 60;
	if (compact) return hours > 0 ? `${start}\n(${hours}h${mins}m)` : `${start}\n(${mins}m)`;
	if (hours > 0) return `${start} (${hours}h ${mins}m)`;
	return `${start} (${mins}m)`;
}
/**
* Formats the list of models used in a block for display
* @param models - Array of model names
* @returns Formatted model names string
*/
function formatModels(models) {
	if (models.length === 0) return "-";
	return formatModelsDisplayMultiline(models);
}
/**
* Parses token limit argument, supporting 'max' keyword
* @param value - Token limit string value
* @param maxFromAll - Maximum token count found in all blocks
* @returns Parsed token limit or undefined if invalid
*/
function parseTokenLimit(value, maxFromAll) {
	if (value == null || value === "") return void 0;
	if (value === "max") return maxFromAll > 0 ? maxFromAll : void 0;
	const limit = Number.parseInt(value, 10);
	return Number.isNaN(limit) ? void 0 : limit;
}
const blocksCommand = define({
	name: "blocks",
	description: "Show usage report grouped by session billing blocks",
	args: {
		...sharedCommandConfig.args,
		active: {
			type: "boolean",
			short: "a",
			description: "Show only active block with projections",
			default: false
		},
		recent: {
			type: "boolean",
			short: "r",
			description: `Show blocks from last ${DEFAULT_RECENT_DAYS} days (including active)`,
			default: false
		},
		tokenLimit: {
			type: "string",
			short: "t",
			description: "Token limit for quota warnings (e.g., 500000 or \"max\")"
		},
		sessionLength: {
			type: "number",
			short: "l",
			description: `Session block duration in hours (default: ${DEFAULT_SESSION_DURATION_HOURS})`,
			default: DEFAULT_SESSION_DURATION_HOURS
		},
		live: {
			type: "boolean",
			description: "Live monitoring mode with real-time updates",
			default: false
		},
		refreshInterval: {
			type: "number",
			description: `Refresh interval in seconds for live mode (default: ${DEFAULT_REFRESH_INTERVAL_SECONDS})`,
			default: DEFAULT_REFRESH_INTERVAL_SECONDS
		}
	},
	toKebab: true,
	async run(ctx) {
		if (ctx.values.json) logger.level = 0;
		if (ctx.values.sessionLength <= 0) {
			logger.error("Session length must be a positive number");
			process$1.exit(1);
		}
		let blocks = await loadSessionBlockData({
			since: ctx.values.since,
			until: ctx.values.until,
			mode: ctx.values.mode,
			order: ctx.values.order,
			offline: ctx.values.offline,
			sessionDurationHours: ctx.values.sessionLength
		});
		if (blocks.length === 0) {
			if (ctx.values.json) log(JSON.stringify({ blocks: [] }));
			else logger.warn("No Claude usage data found.");
			process$1.exit(0);
		}
		let maxTokensFromAll = 0;
		if (ctx.values.tokenLimit === "max") {
			for (const block of blocks) if (!(block.isGap ?? false) && !block.isActive) {
				const blockTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
				if (blockTokens > maxTokensFromAll) maxTokensFromAll = blockTokens;
			}
			if (!ctx.values.json && maxTokensFromAll > 0) logger.info(`Using max tokens from previous sessions: ${formatNumber(maxTokensFromAll)}`);
		}
		if (ctx.values.recent) blocks = filterRecentBlocks(blocks, DEFAULT_RECENT_DAYS);
		if (ctx.values.active) {
			blocks = blocks.filter((block) => block.isActive);
			if (blocks.length === 0) {
				if (ctx.values.json) log(JSON.stringify({
					blocks: [],
					message: "No active block"
				}));
				else logger.info("No active session block found.");
				process$1.exit(0);
			}
		}
		if (ctx.values.live && !ctx.values.json) {
			if (!ctx.values.active) logger.info("Live mode automatically shows only active blocks.");
			let tokenLimitValue = ctx.values.tokenLimit;
			if (tokenLimitValue == null || tokenLimitValue === "") {
				tokenLimitValue = "max";
				if (maxTokensFromAll > 0) logger.info(`No token limit specified, using max from previous sessions: ${formatNumber(maxTokensFromAll)}`);
			}
			const refreshInterval = Math.max(MIN_REFRESH_INTERVAL_SECONDS, Math.min(MAX_REFRESH_INTERVAL_SECONDS, ctx.values.refreshInterval));
			if (refreshInterval !== ctx.values.refreshInterval) logger.warn(`Refresh interval adjusted to ${refreshInterval} seconds (valid range: ${MIN_REFRESH_INTERVAL_SECONDS}-${MAX_REFRESH_INTERVAL_SECONDS})`);
			const paths = getClaudePaths();
			if (paths.length === 0) {
				logger.error("No valid Claude data directory found");
				throw new Error("No valid Claude data directory found");
			}
			await startLiveMonitoring({
				claudePaths: paths,
				tokenLimit: parseTokenLimit(tokenLimitValue, maxTokensFromAll),
				refreshInterval: refreshInterval * 1e3,
				sessionDurationHours: ctx.values.sessionLength,
				mode: ctx.values.mode,
				order: ctx.values.order
			});
			return;
		}
		if (ctx.values.json) {
			const jsonOutput = { blocks: blocks.map((block) => {
				const burnRate = block.isActive ? calculateBurnRate(block) : null;
				const projection = block.isActive ? projectBlockUsage(block) : null;
				return {
					id: block.id,
					startTime: block.startTime.toISOString(),
					endTime: block.endTime.toISOString(),
					actualEndTime: block.actualEndTime?.toISOString() ?? null,
					isActive: block.isActive,
					isGap: block.isGap ?? false,
					entries: block.entries.length,
					tokenCounts: block.tokenCounts,
					totalTokens: block.tokenCounts.inputTokens + block.tokenCounts.outputTokens,
					costUSD: block.costUSD,
					models: block.models,
					modelBreakdowns: block.modelBreakdowns,
					burnRate,
					projection,
					tokenLimitStatus: projection != null && ctx.values.tokenLimit != null ? (() => {
						const limit = parseTokenLimit(ctx.values.tokenLimit, maxTokensFromAll);
						return limit != null ? {
							limit,
							projectedUsage: projection.totalTokens,
							percentUsed: projection.totalTokens / limit * 100,
							status: projection.totalTokens > limit ? "exceeds" : projection.totalTokens > limit * BLOCKS_WARNING_THRESHOLD ? "warning" : "ok"
						} : void 0;
					})() : void 0
				};
			}) };
			log(JSON.stringify(jsonOutput, null, 2));
		} else if (ctx.values.active && blocks.length === 1) {
			const block = blocks[0];
			if (block == null) {
				logger.warn("No active block found.");
				process$1.exit(0);
			}
			const burnRate = calculateBurnRate(block);
			const projection = projectBlockUsage(block);
			logger.box("Current Session Block Status");
			const now = /* @__PURE__ */ new Date();
			const elapsed = Math.round((now.getTime() - block.startTime.getTime()) / (1e3 * 60));
			const remaining = Math.round((block.endTime.getTime() - now.getTime()) / (1e3 * 60));
			log(`Block Started: ${import_picocolors$3.default.cyan(block.startTime.toLocaleString())} (${import_picocolors$3.default.yellow(`${Math.floor(elapsed / 60)}h ${elapsed % 60}m`)} ago)`);
			log(`Time Remaining: ${import_picocolors$3.default.green(`${Math.floor(remaining / 60)}h ${remaining % 60}m`)}\n`);
			log(import_picocolors$3.default.bold("Current Usage:"));
			log(`  Input Tokens:     ${formatNumber(block.tokenCounts.inputTokens)}`);
			log(`  Output Tokens:    ${formatNumber(block.tokenCounts.outputTokens)}`);
			log(`  Total Cost:       ${formatCurrency(block.costUSD)}\n`);
			if (ctx.values.breakdown && block.modelBreakdowns.length > 0) {
				log(import_picocolors$3.default.bold("Model Breakdown:"));
				for (const mb of block.modelBreakdowns) {
					const totalTokens = mb.inputTokens + mb.outputTokens;
					log(`  ${mb.modelName}:`);
					log(`    Tokens: ${formatNumber(totalTokens)} (${formatNumber(mb.inputTokens)} in, ${formatNumber(mb.outputTokens)} out)`);
					if (mb.cacheCreationInputTokens > 0 || mb.cacheReadInputTokens > 0) log(`    Cache: ${formatNumber(mb.cacheCreationInputTokens)} create, ${formatNumber(mb.cacheReadInputTokens)} read`);
					log(`    Cost: ${formatCurrency(mb.cost)}`);
				}
				log("");
			}
			if (burnRate != null) {
				log(import_picocolors$3.default.bold("Burn Rate:"));
				log(`  Tokens/minute:    ${formatNumber(burnRate.tokensPerMinute)}`);
				log(`  Cost/hour:        ${formatCurrency(burnRate.costPerHour)}\n`);
			}
			if (projection != null) {
				log(import_picocolors$3.default.bold("Projected Usage (if current rate continues):"));
				log(`  Total Tokens:     ${formatNumber(projection.totalTokens)}`);
				log(`  Total Cost:       ${formatCurrency(projection.totalCost)}\n`);
				if (ctx.values.tokenLimit != null) {
					const limit = parseTokenLimit(ctx.values.tokenLimit, maxTokensFromAll);
					if (limit != null && limit > 0) {
						const currentTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
						const remainingTokens = Math.max(0, limit - currentTokens);
						const percentUsed = projection.totalTokens / limit * 100;
						const status = percentUsed > 100 ? import_picocolors$3.default.red("EXCEEDS LIMIT") : percentUsed > BLOCKS_WARNING_THRESHOLD * 100 ? import_picocolors$3.default.yellow("WARNING") : import_picocolors$3.default.green("OK");
						log(import_picocolors$3.default.bold("Token Limit Status:"));
						log(`  Limit:            ${formatNumber(limit)} tokens`);
						log(`  Current Usage:    ${formatNumber(currentTokens)} (${(currentTokens / limit * 100).toFixed(1)}%)`);
						log(`  Remaining:        ${formatNumber(remainingTokens)} tokens`);
						log(`  Projected Usage:  ${percentUsed.toFixed(1)}% ${status}`);
					}
				}
			}
		} else {
			logger.box("Claude Code Token Usage Report - Session Blocks");
			const actualTokenLimit = parseTokenLimit(ctx.values.tokenLimit, maxTokensFromAll);
			const tableHeaders = [
				"Block Start",
				"Duration/Status",
				"Models",
				"Tokens"
			];
			const tableAligns = [
				"left",
				"left",
				"left",
				"right"
			];
			if (actualTokenLimit != null && actualTokenLimit > 0) {
				tableHeaders.push("%");
				tableAligns.push("right");
			}
			tableHeaders.push("Cost");
			tableAligns.push("right");
			const table = new ResponsiveTable({
				head: tableHeaders,
				style: { head: ["cyan"] },
				colAligns: tableAligns
			});
			const terminalWidth = process$1.stdout.columns || BLOCKS_DEFAULT_TERMINAL_WIDTH;
			const useCompactFormat = terminalWidth < BLOCKS_COMPACT_WIDTH_THRESHOLD;
			for (const block of blocks) if (block.isGap ?? false) {
				const gapRow = [
					import_picocolors$3.default.gray(formatBlockTime(block, useCompactFormat)),
					import_picocolors$3.default.gray("(inactive)"),
					import_picocolors$3.default.gray("-"),
					import_picocolors$3.default.gray("-")
				];
				if (actualTokenLimit != null && actualTokenLimit > 0) gapRow.push(import_picocolors$3.default.gray("-"));
				gapRow.push(import_picocolors$3.default.gray("-"));
				table.push(gapRow);
			} else {
				const totalTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
				const status = block.isActive ? import_picocolors$3.default.green("ACTIVE") : "";
				const row = [
					formatBlockTime(block, useCompactFormat),
					status,
					formatModels(block.models),
					formatNumber(totalTokens)
				];
				if (actualTokenLimit != null && actualTokenLimit > 0) {
					const percentage = totalTokens / actualTokenLimit * 100;
					const percentText = `${percentage.toFixed(1)}%`;
					row.push(percentage > 100 ? import_picocolors$3.default.red(percentText) : percentText);
				}
				row.push(formatCurrency(block.costUSD));
				table.push(row);
				if (ctx.values.breakdown && block.modelBreakdowns.length > 0) {
					const modelBreakdowns = block.modelBreakdowns.map((mb) => ({
						modelName: mb.modelName,
						inputTokens: mb.inputTokens,
						outputTokens: mb.outputTokens,
						cacheCreationTokens: mb.cacheCreationInputTokens,
						cacheReadTokens: mb.cacheReadInputTokens,
						cost: mb.cost
					}));
					pushBreakdownRows(table, modelBreakdowns);
				}
				if (block.isActive) {
					if (actualTokenLimit != null && actualTokenLimit > 0) {
						const currentTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
						const remainingTokens = Math.max(0, actualTokenLimit - currentTokens);
						const remainingText = remainingTokens > 0 ? formatNumber(remainingTokens) : import_picocolors$3.default.red("0");
						const remainingPercent = (actualTokenLimit - currentTokens) / actualTokenLimit * 100;
						const remainingPercentText = remainingPercent > 0 ? `${remainingPercent.toFixed(1)}%` : import_picocolors$3.default.red("0.0%");
						const remainingRow = [
							{
								content: import_picocolors$3.default.gray(`(assuming ${formatNumber(actualTokenLimit)} token limit)`),
								hAlign: "right"
							},
							import_picocolors$3.default.blue("REMAINING"),
							"",
							remainingText,
							remainingPercentText,
							""
						];
						table.push(remainingRow);
					}
					const projection = projectBlockUsage(block);
					if (projection != null) {
						const projectedTokens = formatNumber(projection.totalTokens);
						const projectedText = actualTokenLimit != null && actualTokenLimit > 0 && projection.totalTokens > actualTokenLimit ? import_picocolors$3.default.red(projectedTokens) : projectedTokens;
						const projectedRow = [
							{
								content: import_picocolors$3.default.gray("(assuming current burn rate)"),
								hAlign: "right"
							},
							import_picocolors$3.default.yellow("PROJECTED"),
							"",
							projectedText
						];
						if (actualTokenLimit != null && actualTokenLimit > 0) {
							const percentage = projection.totalTokens / actualTokenLimit * 100;
							const percentText = `${percentage.toFixed(1)}%`;
							projectedRow.push(percentText);
						}
						projectedRow.push(formatCurrency(projection.totalCost));
						table.push(projectedRow);
					}
				}
			}
			log(table.toString());
		}
	}
});
var import_picocolors$2 = __toESM(require_picocolors(), 1);
const dailyCommand = define({
	name: "daily",
	description: "Show usage report grouped by date",
	...sharedCommandConfig,
	async run(ctx) {
		if (ctx.values.json) logger.level = 0;
		const dailyData = await loadDailyUsageData({
			since: ctx.values.since,
			until: ctx.values.until,
			mode: ctx.values.mode,
			order: ctx.values.order,
			offline: ctx.values.offline
		});
		if (dailyData.length === 0) {
			if (ctx.values.json) log(JSON.stringify([]));
			else logger.warn("No Claude usage data found.");
			process$1.exit(0);
		}
		const totals = calculateTotals(dailyData);
		if (ctx.values.debug && !ctx.values.json) {
			const mismatchStats = await detectMismatches(void 0);
			printMismatchReport(mismatchStats, ctx.values.debugSamples);
		}
		if (ctx.values.json) {
			const jsonOutput = {
				daily: dailyData.map((data) => ({
					date: data.date,
					inputTokens: data.inputTokens,
					outputTokens: data.outputTokens,
					cacheCreationTokens: data.cacheCreationTokens,
					cacheReadTokens: data.cacheReadTokens,
					totalTokens: getTotalTokens(data),
					totalCost: data.totalCost,
					modelsUsed: data.modelsUsed,
					modelBreakdowns: data.modelBreakdowns
				})),
				totals: createTotalsObject(totals)
			};
			log(JSON.stringify(jsonOutput, null, 2));
		} else {
			logger.box("Claude Code Token Usage Report - Daily");
			const table = new ResponsiveTable({
				head: [
					"Date",
					"Models",
					"Input",
					"Output",
					"Cache Create",
					"Cache Read",
					"Total Tokens",
					"Cost (USD)"
				],
				style: { head: ["cyan"] },
				colAligns: [
					"left",
					"left",
					"right",
					"right",
					"right",
					"right",
					"right",
					"right"
				],
				dateFormatter: formatDateCompact,
				compactHead: [
					"Date",
					"Models",
					"Input",
					"Output",
					"Cost (USD)"
				],
				compactColAligns: [
					"left",
					"left",
					"right",
					"right",
					"right"
				],
				compactThreshold: 100
			});
			for (const data of dailyData) {
				table.push([
					data.date,
					formatModelsDisplayMultiline(data.modelsUsed),
					formatNumber(data.inputTokens),
					formatNumber(data.outputTokens),
					formatNumber(data.cacheCreationTokens),
					formatNumber(data.cacheReadTokens),
					formatNumber(getTotalTokens(data)),
					formatCurrency(data.totalCost)
				]);
				if (ctx.values.breakdown) pushBreakdownRows(table, data.modelBreakdowns);
			}
			table.push([
				"",
				"",
				"",
				"",
				"",
				"",
				"",
				""
			]);
			table.push([
				import_picocolors$2.default.yellow("Total"),
				"",
				import_picocolors$2.default.yellow(formatNumber(totals.inputTokens)),
				import_picocolors$2.default.yellow(formatNumber(totals.outputTokens)),
				import_picocolors$2.default.yellow(formatNumber(totals.cacheCreationTokens)),
				import_picocolors$2.default.yellow(formatNumber(totals.cacheReadTokens)),
				import_picocolors$2.default.yellow(formatNumber(getTotalTokens(totals))),
				import_picocolors$2.default.yellow(formatCurrency(totals.totalCost))
			]);
			log(table.toString());
			if (table.isCompactMode()) {
				logger.info("\nRunning in Compact Mode");
				logger.info("Expand terminal width to see cache metrics and total tokens");
			}
		}
	}
});
var RequestError = class extends Error {
	constructor(message, options) {
		super(message, options);
		this.name = "RequestError";
	}
};
var toRequestError = (e) => {
	if (e instanceof RequestError) return e;
	return new RequestError(e.message, { cause: e });
};
var GlobalRequest = global.Request;
var Request = class extends GlobalRequest {
	constructor(input, options) {
		if (typeof input === "object" && getRequestCache in input) input = input[getRequestCache]();
		if (typeof options?.body?.getReader !== "undefined") options.duplex ??= "half";
		super(input, options);
	}
};
var newRequestFromIncoming = (method, url, incoming, abortController) => {
	const headerRecord = [];
	const rawHeaders = incoming.rawHeaders;
	for (let i = 0; i < rawHeaders.length; i += 2) {
		const { [i]: key, [i + 1]: value } = rawHeaders;
		if (key.charCodeAt(0) !== 58) headerRecord.push([key, value]);
	}
	const init$1 = {
		method,
		headers: headerRecord,
		signal: abortController.signal
	};
	if (method === "TRACE") {
		init$1.method = "GET";
		const req = new Request(url, init$1);
		Object.defineProperty(req, "method", { get() {
			return "TRACE";
		} });
		return req;
	}
	if (!(method === "GET" || method === "HEAD")) if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) init$1.body = new ReadableStream({ start(controller) {
		controller.enqueue(incoming.rawBody);
		controller.close();
	} });
	else init$1.body = Readable.toWeb(incoming);
	return new Request(url, init$1);
};
var getRequestCache = Symbol("getRequestCache");
var requestCache = Symbol("requestCache");
var incomingKey = Symbol("incomingKey");
var urlKey = Symbol("urlKey");
var abortControllerKey = Symbol("abortControllerKey");
var getAbortController = Symbol("getAbortController");
var requestPrototype = {
	get method() {
		return this[incomingKey].method || "GET";
	},
	get url() {
		return this[urlKey];
	},
	[getAbortController]() {
		this[getRequestCache]();
		return this[abortControllerKey];
	},
	[getRequestCache]() {
		this[abortControllerKey] ||= new AbortController();
		return this[requestCache] ||= newRequestFromIncoming(this.method, this[urlKey], this[incomingKey], this[abortControllerKey]);
	}
};
[
	"body",
	"bodyUsed",
	"cache",
	"credentials",
	"destination",
	"headers",
	"integrity",
	"mode",
	"redirect",
	"referrer",
	"referrerPolicy",
	"signal",
	"keepalive"
].forEach((k) => {
	Object.defineProperty(requestPrototype, k, { get() {
		return this[getRequestCache]()[k];
	} });
});
[
	"arrayBuffer",
	"blob",
	"clone",
	"formData",
	"json",
	"text"
].forEach((k) => {
	Object.defineProperty(requestPrototype, k, { value: function() {
		return this[getRequestCache]()[k]();
	} });
});
Object.setPrototypeOf(requestPrototype, Request.prototype);
var newRequest = (incoming, defaultHostname) => {
	const req = Object.create(requestPrototype);
	req[incomingKey] = incoming;
	const incomingUrl = incoming.url || "";
	if (incomingUrl[0] !== "/" && (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
		if (incoming instanceof Http2ServerRequest) throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
		try {
			const url2 = new URL(incomingUrl);
			req[urlKey] = url2.href;
		} catch (e) {
			throw new RequestError("Invalid absolute URL", { cause: e });
		}
		return req;
	}
	const host = (incoming instanceof Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
	if (!host) throw new RequestError("Missing host header");
	let scheme;
	if (incoming instanceof Http2ServerRequest) {
		scheme = incoming.scheme;
		if (!(scheme === "http" || scheme === "https")) throw new RequestError("Unsupported scheme");
	} else scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
	const url = new URL(`${scheme}://${host}${incomingUrl}`);
	if (url.hostname.length !== host.length && url.hostname !== host.replace(/:\d+$/, "")) throw new RequestError("Invalid host header");
	req[urlKey] = url.href;
	return req;
};
var responseCache = Symbol("responseCache");
var getResponseCache = Symbol("getResponseCache");
var cacheKey = Symbol("cache");
var GlobalResponse = global.Response;
var Response2 = class _Response {
	#body;
	#init;
	[getResponseCache]() {
		delete this[cacheKey];
		return this[responseCache] ||= new GlobalResponse(this.#body, this.#init);
	}
	constructor(body, init$1) {
		let headers;
		this.#body = body;
		if (init$1 instanceof _Response) {
			const cachedGlobalResponse = init$1[responseCache];
			if (cachedGlobalResponse) {
				this.#init = cachedGlobalResponse;
				this[getResponseCache]();
				return;
			} else {
				this.#init = init$1.#init;
				headers = new Headers(init$1.#init.headers);
			}
		} else this.#init = init$1;
		if (typeof body === "string" || typeof body?.getReader !== "undefined" || body instanceof Blob || body instanceof Uint8Array) {
			headers ||= init$1?.headers || { "content-type": "text/plain; charset=UTF-8" };
			this[cacheKey] = [
				init$1?.status || 200,
				body,
				headers
			];
		}
	}
	get headers() {
		const cache = this[cacheKey];
		if (cache) {
			if (!(cache[2] instanceof Headers)) cache[2] = new Headers(cache[2]);
			return cache[2];
		}
		return this[getResponseCache]().headers;
	}
	get status() {
		return this[cacheKey]?.[0] ?? this[getResponseCache]().status;
	}
	get ok() {
		const status = this.status;
		return status >= 200 && status < 300;
	}
};
[
	"body",
	"bodyUsed",
	"redirected",
	"statusText",
	"trailers",
	"type",
	"url"
].forEach((k) => {
	Object.defineProperty(Response2.prototype, k, { get() {
		return this[getResponseCache]()[k];
	} });
});
[
	"arrayBuffer",
	"blob",
	"clone",
	"formData",
	"json",
	"text"
].forEach((k) => {
	Object.defineProperty(Response2.prototype, k, { value: function() {
		return this[getResponseCache]()[k]();
	} });
});
Object.setPrototypeOf(Response2, GlobalResponse);
Object.setPrototypeOf(Response2.prototype, GlobalResponse.prototype);
function writeFromReadableStream(stream, writable) {
	if (stream.locked) throw new TypeError("ReadableStream is locked.");
	else if (writable.destroyed) {
		stream.cancel();
		return;
	}
	const reader = stream.getReader();
	writable.on("close", cancel);
	writable.on("error", cancel);
	reader.read().then(flow, cancel);
	return reader.closed.finally(() => {
		writable.off("close", cancel);
		writable.off("error", cancel);
	});
	function cancel(error) {
		reader.cancel(error).catch(() => {});
		if (error) writable.destroy(error);
	}
	function onDrain() {
		reader.read().then(flow, cancel);
	}
	function flow({ done, value }) {
		try {
			if (done) writable.end();
			else if (!writable.write(value)) writable.once("drain", onDrain);
			else return reader.read().then(flow, cancel);
		} catch (e) {
			cancel(e);
		}
	}
}
var buildOutgoingHttpHeaders = (headers) => {
	const res = {};
	if (!(headers instanceof Headers)) headers = new Headers(headers ?? void 0);
	const cookies = [];
	for (const [k, v] of headers) if (k === "set-cookie") cookies.push(v);
	else res[k] = v;
	if (cookies.length > 0) res["set-cookie"] = cookies;
	res["content-type"] ??= "text/plain; charset=UTF-8";
	return res;
};
var X_ALREADY_SENT = "x-hono-already-sent";
var webFetch = global.fetch;
if (typeof global.crypto === "undefined") global.crypto = crypto;
global.fetch = (info$1, init$1) => {
	init$1 = {
		compress: false,
		...init$1
	};
	return webFetch(info$1, init$1);
};
var regBuffer = /^no$/i;
var regContentType = /^(application\/json\b|text\/(?!event-stream\b))/i;
var handleRequestError = () => new Response(null, { status: 400 });
var handleFetchError = (e) => new Response(null, { status: e instanceof Error && (e.name === "TimeoutError" || e.constructor.name === "TimeoutError") ? 504 : 500 });
var handleResponseError = (e, outgoing) => {
	const err = e instanceof Error ? e : new Error("unknown error", { cause: e });
	if (err.code === "ERR_STREAM_PREMATURE_CLOSE") console.info("The user aborted a request.");
	else {
		console.error(e);
		if (!outgoing.headersSent) outgoing.writeHead(500, { "Content-Type": "text/plain" });
		outgoing.end(`Error: ${err.message}`);
		outgoing.destroy(err);
	}
};
var flushHeaders = (outgoing) => {
	if ("flushHeaders" in outgoing && outgoing.writable) outgoing.flushHeaders();
};
var responseViaCache = async (res, outgoing) => {
	let [status, body, header] = res[cacheKey];
	if (header instanceof Headers) header = buildOutgoingHttpHeaders(header);
	if (typeof body === "string") header["Content-Length"] = Buffer.byteLength(body);
	else if (body instanceof Uint8Array) header["Content-Length"] = body.byteLength;
	else if (body instanceof Blob) header["Content-Length"] = body.size;
	outgoing.writeHead(status, header);
	if (typeof body === "string" || body instanceof Uint8Array) outgoing.end(body);
	else if (body instanceof Blob) outgoing.end(new Uint8Array(await body.arrayBuffer()));
	else {
		flushHeaders(outgoing);
		return writeFromReadableStream(body, outgoing)?.catch((e) => handleResponseError(e, outgoing));
	}
};
var responseViaResponseObject = async (res, outgoing, options = {}) => {
	if (res instanceof Promise) if (options.errorHandler) try {
		res = await res;
	} catch (err) {
		const errRes = await options.errorHandler(err);
		if (!errRes) return;
		res = errRes;
	}
	else res = await res.catch(handleFetchError);
	if (cacheKey in res) return responseViaCache(res, outgoing);
	const resHeaderRecord = buildOutgoingHttpHeaders(res.headers);
	if (res.body) {
		const { "transfer-encoding": transferEncoding, "content-encoding": contentEncoding, "content-length": contentLength, "x-accel-buffering": accelBuffering, "content-type": contentType } = resHeaderRecord;
		if (transferEncoding || contentEncoding || contentLength || accelBuffering && regBuffer.test(accelBuffering) || !regContentType.test(contentType)) {
			outgoing.writeHead(res.status, resHeaderRecord);
			flushHeaders(outgoing);
			await writeFromReadableStream(res.body, outgoing);
		} else {
			const buffer = await res.arrayBuffer();
			resHeaderRecord["content-length"] = buffer.byteLength;
			outgoing.writeHead(res.status, resHeaderRecord);
			outgoing.end(new Uint8Array(buffer));
		}
	} else if (resHeaderRecord[X_ALREADY_SENT]) {} else {
		outgoing.writeHead(res.status, resHeaderRecord);
		outgoing.end();
	}
};
var getRequestListener = (fetchCallback, options = {}) => {
	if (options.overrideGlobalObjects !== false && global.Request !== Request) {
		Object.defineProperty(global, "Request", { value: Request });
		Object.defineProperty(global, "Response", { value: Response2 });
	}
	return async (incoming, outgoing) => {
		let res, req;
		try {
			req = newRequest(incoming, options.hostname);
			outgoing.on("close", () => {
				const abortController = req[abortControllerKey];
				if (!abortController) return;
				if (incoming.errored) req[abortControllerKey].abort(incoming.errored.toString());
				else if (!outgoing.writableFinished) req[abortControllerKey].abort("Client connection prematurely closed.");
			});
			res = fetchCallback(req, {
				incoming,
				outgoing
			});
			if (cacheKey in res) return responseViaCache(res, outgoing);
		} catch (e) {
			if (!res) if (options.errorHandler) {
				res = await options.errorHandler(req ? e : toRequestError(e));
				if (!res) return;
			} else if (!req) res = handleRequestError();
			else res = handleFetchError(e);
			else return handleResponseError(e, outgoing);
		}
		try {
			return await responseViaResponseObject(res, outgoing, options);
		} catch (e) {
			return handleResponseError(e, outgoing);
		}
	};
};
var createAdaptorServer = (options) => {
	const fetchCallback = options.fetch;
	const requestListener = getRequestListener(fetchCallback, {
		hostname: options.hostname,
		overrideGlobalObjects: options.overrideGlobalObjects
	});
	const createServer$1 = options.createServer || createServer;
	const server = createServer$1(options.serverOptions || {}, requestListener);
	return server;
};
var serve = (options, listeningListener) => {
	const server = createAdaptorServer(options);
	server.listen(options?.port ?? 3e3, options.hostname, () => {
		const serverInfo = server.address();
		listeningListener && listeningListener(serverInfo);
	});
	return server;
};
/**
* MCP server command that supports both stdio and HTTP transports.
* Allows starting an MCP server for external integrations with usage reporting tools.
*/
const mcpCommand = define({
	name: "mcp",
	description: "Start MCP server with usage reporting tools",
	args: {
		mode: sharedArgs.mode,
		type: {
			type: "enum",
			short: "t",
			description: "Transport type for MCP server",
			choices: ["stdio", "http"],
			default: "stdio"
		},
		port: {
			type: "number",
			description: `Port for HTTP transport (default: ${MCP_DEFAULT_PORT})`,
			default: MCP_DEFAULT_PORT
		}
	},
	async run(ctx) {
		const { type, mode, port } = ctx.values;
		if (type === "stdio") logger.level = 0;
		const paths = getClaudePaths();
		if (paths.length === 0) {
			logger.error("No valid Claude data directory found");
			throw new Error("No valid Claude data directory found");
		}
		const options = {
			claudePath: paths[0],
			mode
		};
		if (type === "stdio") {
			const server = createMcpServer(options);
			await startMcpServerStdio(server);
		} else {
			const app = createMcpHttpApp(options);
			serve({
				fetch: app.fetch,
				port
			});
			logger.info(`MCP server is running on http://localhost:${port}`);
		}
	}
});
var import_picocolors$1 = __toESM(require_picocolors(), 1);
const monthlyCommand = define({
	name: "monthly",
	description: "Show usage report grouped by month",
	...sharedCommandConfig,
	async run(ctx) {
		if (ctx.values.json) logger.level = 0;
		const monthlyData = await loadMonthlyUsageData({
			since: ctx.values.since,
			until: ctx.values.until,
			mode: ctx.values.mode,
			order: ctx.values.order,
			offline: ctx.values.offline
		});
		if (monthlyData.length === 0) {
			if (ctx.values.json) {
				const emptyOutput = {
					monthly: [],
					totals: {
						inputTokens: 0,
						outputTokens: 0,
						cacheCreationTokens: 0,
						cacheReadTokens: 0,
						totalTokens: 0,
						totalCost: 0
					}
				};
				log(JSON.stringify(emptyOutput, null, 2));
			} else logger.warn("No Claude usage data found.");
			process$1.exit(0);
		}
		const totals = calculateTotals(monthlyData);
		if (ctx.values.debug && !ctx.values.json) {
			const mismatchStats = await detectMismatches(void 0);
			printMismatchReport(mismatchStats, ctx.values.debugSamples);
		}
		if (ctx.values.json) {
			const jsonOutput = {
				monthly: monthlyData.map((data) => ({
					month: data.month,
					inputTokens: data.inputTokens,
					outputTokens: data.outputTokens,
					cacheCreationTokens: data.cacheCreationTokens,
					cacheReadTokens: data.cacheReadTokens,
					totalTokens: getTotalTokens(data),
					totalCost: data.totalCost,
					modelsUsed: data.modelsUsed,
					modelBreakdowns: data.modelBreakdowns
				})),
				totals: createTotalsObject(totals)
			};
			log(JSON.stringify(jsonOutput, null, 2));
		} else {
			logger.box("Claude Code Token Usage Report - Monthly");
			const table = new ResponsiveTable({
				head: [
					"Month",
					"Models",
					"Input",
					"Output",
					"Cache Create",
					"Cache Read",
					"Total Tokens",
					"Cost (USD)"
				],
				style: { head: ["cyan"] },
				colAligns: [
					"left",
					"left",
					"right",
					"right",
					"right",
					"right",
					"right",
					"right"
				],
				dateFormatter: formatDateCompact,
				compactHead: [
					"Month",
					"Models",
					"Input",
					"Output",
					"Cost (USD)"
				],
				compactColAligns: [
					"left",
					"left",
					"right",
					"right",
					"right"
				],
				compactThreshold: 100
			});
			for (const data of monthlyData) {
				table.push([
					data.month,
					formatModelsDisplayMultiline(data.modelsUsed),
					formatNumber(data.inputTokens),
					formatNumber(data.outputTokens),
					formatNumber(data.cacheCreationTokens),
					formatNumber(data.cacheReadTokens),
					formatNumber(getTotalTokens(data)),
					formatCurrency(data.totalCost)
				]);
				if (ctx.values.breakdown) pushBreakdownRows(table, data.modelBreakdowns);
			}
			table.push([
				"",
				"",
				"",
				"",
				"",
				"",
				"",
				""
			]);
			table.push([
				import_picocolors$1.default.yellow("Total"),
				"",
				import_picocolors$1.default.yellow(formatNumber(totals.inputTokens)),
				import_picocolors$1.default.yellow(formatNumber(totals.outputTokens)),
				import_picocolors$1.default.yellow(formatNumber(totals.cacheCreationTokens)),
				import_picocolors$1.default.yellow(formatNumber(totals.cacheReadTokens)),
				import_picocolors$1.default.yellow(formatNumber(getTotalTokens(totals))),
				import_picocolors$1.default.yellow(formatCurrency(totals.totalCost))
			]);
			log(table.toString());
			if (table.isCompactMode()) {
				logger.info("\nRunning in Compact Mode");
				logger.info("Expand terminal width to see cache metrics and total tokens");
			}
		}
	}
});
var import_picocolors = __toESM(require_picocolors(), 1);
const sessionCommand = define({
	name: "session",
	description: "Show usage report grouped by conversation session",
	...sharedCommandConfig,
	async run(ctx) {
		if (ctx.values.json) logger.level = 0;
		const sessionData = await loadSessionData({
			since: ctx.values.since,
			until: ctx.values.until,
			mode: ctx.values.mode,
			order: ctx.values.order,
			offline: ctx.values.offline
		});
		if (sessionData.length === 0) {
			if (ctx.values.json) log(JSON.stringify([]));
			else logger.warn("No Claude usage data found.");
			process$1.exit(0);
		}
		const totals = calculateTotals(sessionData);
		if (ctx.values.debug && !ctx.values.json) {
			const mismatchStats = await detectMismatches(void 0);
			printMismatchReport(mismatchStats, ctx.values.debugSamples);
		}
		if (ctx.values.json) {
			const jsonOutput = {
				sessions: sessionData.map((data) => ({
					sessionId: data.sessionId,
					inputTokens: data.inputTokens,
					outputTokens: data.outputTokens,
					cacheCreationTokens: data.cacheCreationTokens,
					cacheReadTokens: data.cacheReadTokens,
					totalTokens: getTotalTokens(data),
					totalCost: data.totalCost,
					lastActivity: data.lastActivity,
					modelsUsed: data.modelsUsed,
					modelBreakdowns: data.modelBreakdowns
				})),
				totals: createTotalsObject(totals)
			};
			log(JSON.stringify(jsonOutput, null, 2));
		} else {
			logger.box("Claude Code Token Usage Report - By Session");
			const table = new ResponsiveTable({
				head: [
					"Session",
					"Models",
					"Input",
					"Output",
					"Cache Create",
					"Cache Read",
					"Total Tokens",
					"Cost (USD)",
					"Last Activity"
				],
				style: { head: ["cyan"] },
				colAligns: [
					"left",
					"left",
					"right",
					"right",
					"right",
					"right",
					"right",
					"right",
					"left"
				],
				dateFormatter: formatDateCompact,
				compactHead: [
					"Session",
					"Models",
					"Input",
					"Output",
					"Cost (USD)",
					"Last Activity"
				],
				compactColAligns: [
					"left",
					"left",
					"right",
					"right",
					"right",
					"left"
				],
				compactThreshold: 100
			});
			let maxSessionLength = 0;
			for (const data of sessionData) {
				const sessionDisplay = data.sessionId.split("-").slice(-2).join("-");
				maxSessionLength = Math.max(maxSessionLength, sessionDisplay.length);
				table.push([
					sessionDisplay,
					formatModelsDisplayMultiline(data.modelsUsed),
					formatNumber(data.inputTokens),
					formatNumber(data.outputTokens),
					formatNumber(data.cacheCreationTokens),
					formatNumber(data.cacheReadTokens),
					formatNumber(getTotalTokens(data)),
					formatCurrency(data.totalCost),
					data.lastActivity
				]);
				if (ctx.values.breakdown) pushBreakdownRows(table, data.modelBreakdowns, 1, 1);
			}
			table.push([
				"",
				"",
				"",
				"",
				"",
				"",
				"",
				"",
				""
			]);
			table.push([
				import_picocolors.default.yellow("Total"),
				"",
				import_picocolors.default.yellow(formatNumber(totals.inputTokens)),
				import_picocolors.default.yellow(formatNumber(totals.outputTokens)),
				import_picocolors.default.yellow(formatNumber(totals.cacheCreationTokens)),
				import_picocolors.default.yellow(formatNumber(totals.cacheReadTokens)),
				import_picocolors.default.yellow(formatNumber(getTotalTokens(totals))),
				import_picocolors.default.yellow(formatCurrency(totals.totalCost)),
				""
			]);
			log(table.toString());
			if (table.isCompactMode()) {
				logger.info("\nRunning in Compact Mode");
				logger.info("Expand terminal width to see cache metrics and total tokens");
			}
		}
	}
});
/**
* Map of available CLI subcommands
*/
const subCommands = /* @__PURE__ */ new Map();
subCommands.set("daily", dailyCommand);
subCommands.set("monthly", monthlyCommand);
subCommands.set("session", sessionCommand);
subCommands.set("blocks", blocksCommand);
subCommands.set("blocks-monitor", blocksMonitorCommand);
subCommands.set("mcp", mcpCommand);
/**
* Default command when no subcommand is specified (defaults to daily)
*/
const mainCommand = dailyCommand;
await cli(process$1.argv.slice(2), mainCommand, {
	name,
	version,
	description,
	subCommands,
	renderHeader: null
});
