import { CLAUDE_CONFIG_DIR_ENV, CLAUDE_PROJECTS_DIR_NAME, DEFAULT_CLAUDE_CODE_PATH, DEFAULT_CLAUDE_CONFIG_PATH, DEFAULT_RECENT_DAYS, PricingFetcher, USAGE_DATA_GLOB_PATTERN, USER_HOME_DIR, __commonJSMin, __require, __toESM, require_usingCtx } from "./pricing-fetcher-CHQAtwwA.js";
import { activityDateSchema, arrayType, createDailyDate, createMonthlyDate, createProjectPath, createSessionId, dailyDateSchema, isoTimestampSchema, messageIdSchema, modelNameSchema, monthlyDateSchema, numberType, objectType, projectPathSchema, requestIdSchema, sessionIdSchema, versionSchema } from "./_types-CH59WmST.js";
import { logger } from "./logger-LJ5xGY9g.js";
import a, { readFile } from "node:fs/promises";
import path, { posix } from "node:path";
import process$1 from "node:process";
import b from "node:fs";
import F from "node:os";
function toArray(array) {
	array = array ?? [];
	return Array.isArray(array) ? array : [array];
}
const VOID = Symbol("p-void");
/**
* Return `true` if the type of `x` is `string`.
*
* ```ts
* import { is } from "@core/unknownutil";
*
* const a: unknown = "a";
* if (is.String(a)) {
*   const _: string = a;
* }
* ```
*/ function isString(x) {
	return typeof x === "string";
}
/**
* Return `true` if the type of `x` satisfies `Record<PropertyKey, unknown>`.
*
* Note that this function returns `true` for ambiguous instances like `Set`, `Map`, `Date`, `Promise`, etc.
* Use {@linkcode [is/record-object].isRecordObject|isRecordObject} instead if you want to check if `x` is an instance of `Object`.
*
* ```ts
* import { is } from "@core/unknownutil";
*
* const a: unknown = {"a": 0, "b": 1};
* if (is.Record(a)) {
*   const _: Record<PropertyKey, unknown> = a;
* }
*
* const b: unknown = new Set();
* if (is.Record(b)) {
*   const _: Record<PropertyKey, unknown> = b;
* }
* ```
*/ function isRecord(x) {
	return x != null && !Array.isArray(x) && typeof x === "object";
}
const defaultThreshold = 20;
/**
* Inspect a value
*/ function inspect(value, options = {}) {
	if (value === null) return "null";
	else if (Array.isArray(value)) return inspectArray(value, options);
	switch (typeof value) {
		case "string": return JSON.stringify(value);
		case "bigint": return `${value}n`;
		case "object":
			if (value.constructor?.name !== "Object") return value.constructor?.name;
			return inspectRecord(value, options);
		case "function": return value.name || "(anonymous)";
	}
	return value?.toString() ?? "undefined";
}
function inspectArray(value, options) {
	const { threshold = defaultThreshold } = options;
	const vs = value.map((v$1) => inspect(v$1, options));
	const s = vs.join(", ");
	if (s.length <= threshold) return `[${s}]`;
	const m$1 = vs.join(",\n");
	return `[\n${indent(2, m$1)}\n]`;
}
function inspectRecord(value, options) {
	const { threshold = defaultThreshold } = options;
	const vs = [...Object.keys(value), ...Object.getOwnPropertySymbols(value)].map((k$1) => `${k$1.toString()}: ${inspect(value[k$1], options)}`);
	const s = vs.join(", ");
	if (s.length <= threshold) return `{${s}}`;
	const m$1 = vs.join(",\n");
	return `{\n${indent(2, m$1)}\n}`;
}
function indent(level, text) {
	const prefix = " ".repeat(level);
	return text.split("\n").map((line) => `${prefix}${line}`).join("\n");
}
/**
* Rewrite the function name.
*/ function rewriteName(fn, name, ...args) {
	let cachedName;
	return Object.defineProperties(fn, { name: { get: () => {
		if (cachedName) return cachedName;
		cachedName = `${name}(${args.map((v$1) => inspect(v$1)).join(", ")})`;
		return cachedName;
	} } });
}
function annotate(fn, name, value) {
	return Object.defineProperties(fn, { [name]: { value } });
}
function hasAnnotation(fn, name) {
	return !!fn[name];
}
/**
* Return a type predicate function that returns `true` if the type of `x` is `ObjectOf<T>`.
*
* Use {@linkcode [is/record-of].isRecordOf|isRecordOf} if you want to check if the type of `x` is a record of `T`.
*
* If {@linkcode [as/optional].asOptional|asOptional} is specified in the predicate function in `predObj`, the property becomes optional.
* If {@linkcode [as/readonly].asReadonly|asReadonly} is specified in the predicate function in `predObj`, the property becomes readonly.
*
* The number of keys of `x` must be greater than or equal to the number of keys of `predObj`.
* Use {@linkcode [is/strict-of].isStrictOf|isStrictOf} if you want to check the exact number of keys.
*
* To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
*
* ```ts
* import { as, is } from "@core/unknownutil";
*
* const isMyType = is.ObjectOf({
*   a: is.Number,
*   b: is.String,
*   c: as.Optional(is.Boolean),
*   d: as.Readonly(is.String),
* });
* const a: unknown = { a: 0, b: "a", d: "d" };
* if (isMyType(a)) {
*   const _: { a: number; b: string; c?: boolean | undefined, readonly d: string } = a;
* }
* ```
*/ function isObjectOf(predObj) {
	const preds = [...Object.keys(predObj), ...Object.getOwnPropertySymbols(predObj)].map((k$1) => [k$1, predObj[k$1]]);
	const pred = rewriteName((x) => {
		if (!isObject$1(x)) return false;
		return preds.every(([k$1, pred$1]) => pred$1(x[k$1]));
	}, "isObjectOf", predObj);
	return annotate(pred, "predObj", predObj);
}
function isObject$1(x) {
	if (x == null) return false;
	if (typeof x !== "object" && typeof x !== "function") return false;
	if (Array.isArray(x)) return false;
	return true;
}
/**
* Annotate the given predicate function as optional.
*
* Use this function to annotate a predicate function of `predObj` in {@linkcode [is/object-of].isObjectOf|isObjectOf}.
*
* Note that the annotated predicate function will return `true` if the type of `x` is `T` or `undefined`, indicating that
* this function is not just for annotation but it also changes the behavior of the predicate function.
*
* Use {@linkcode asUnoptional} to remove the annotation.
* Use {@linkcode hasOptional} to check if a predicate function has annotated with this function.
*
* To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
*
* ```ts
* import { as, is } from "@core/unknownutil";
*
* const isMyType = is.ObjectOf({
*   foo: as.Optional(is.String),
* });
* const a: unknown = {};
* if (isMyType(a)) {
*   const _: {foo?: string} = a;
* }
* ```
*/ function asOptional(pred) {
	if (hasAnnotation(pred, "optional")) return pred;
	return rewriteName(annotate((x) => x === void 0 || pred(x), "optional", pred), "asOptional", pred);
}
/**
* Check if a value is an error object
*/ const isErrorObject = isObjectOf({
	proto: isString,
	name: isString,
	message: isString,
	stack: asOptional(isString),
	attributes: isRecord
});
/**
* Error indicating that this part is unreachable.
*/ var UnreachableError = class UnreachableError extends Error {
	args;
	constructor(args) {
		super(`unreachable: ${args}`);
		if (Error.captureStackTrace) Error.captureStackTrace(this, UnreachableError);
		this.name = this.constructor.name;
		this.args = args;
	}
};
/**
* Function indicating that this part is unreachable.
*
* For example, the following code passed type checking.
*
* ```ts
* import { unreachable } from "@core/errorutil/unreachable";
*
* type Animal = "dog" | "cat";
*
* function say(animal: Animal): void {
*   switch (animal) {
*     case "dog":
*       console.log("dog");
*       break;
*     case "cat":
*       console.log("dog");
*       break;
*     default:
*       unreachable(animal);
*   }
* }
* say("dog");
* ```
*
* But the following code because a case for "bird" is missing.
*
* ```ts
* import { unreachable } from "@core/errorutil/unreachable";
*
* type Animal = "dog" | "cat" | "bird";
*
* function say(animal: Animal): void {
*   switch (animal) {
*     case "dog":
*       console.log("dog");
*       break;
*     case "cat":
*       console.log("dog");
*       break;
*     default: {
*       // The line below causes a type error if we uncomment it.
*       // error: TS2345 [ERROR]: Argument of type 'string' is not assignable to parameter of type 'never'.
*       //unreachable(animal);
*     }
*   }
* }
* say("dog");
* ```
*/ function unreachable(...args) {
	throw new UnreachableError(args);
}
function groupBy(arr, getKeyFromItem) {
	const result = {};
	for (let i = 0; i < arr.length; i++) {
		const item = arr[i];
		const key = getKeyFromItem(item);
		if (!Object.hasOwn(result, key)) result[key] = [];
		result[key].push(item);
	}
	return result;
}
function uniq(arr) {
	return Array.from(new Set(arr));
}
var castComparer = function(comparer) {
	return function(a$1, b$1, order) {
		return comparer(a$1, b$1, order) * order;
	};
};
var throwInvalidConfigErrorIfTrue = function(condition, context) {
	if (condition) throw Error("Invalid sort config: " + context);
};
var unpackObjectSorter = function(sortByObj) {
	var _a = sortByObj || {}, asc = _a.asc, desc = _a.desc;
	var order = asc ? 1 : -1;
	var sortBy = asc || desc;
	throwInvalidConfigErrorIfTrue(!sortBy, "Expected `asc` or `desc` property");
	throwInvalidConfigErrorIfTrue(asc && desc, "Ambiguous object with `asc` and `desc` config properties");
	var comparer = sortByObj.comparer && castComparer(sortByObj.comparer);
	return {
		order,
		sortBy,
		comparer
	};
};
var multiPropertySorterProvider = function(defaultComparer$1) {
	return function multiPropertySorter(sortBy, sortByArr, depth$1, order, comparer, a$1, b$1) {
		var valA;
		var valB;
		if (typeof sortBy === "string") {
			valA = a$1[sortBy];
			valB = b$1[sortBy];
		} else if (typeof sortBy === "function") {
			valA = sortBy(a$1);
			valB = sortBy(b$1);
		} else {
			var objectSorterConfig = unpackObjectSorter(sortBy);
			return multiPropertySorter(objectSorterConfig.sortBy, sortByArr, depth$1, objectSorterConfig.order, objectSorterConfig.comparer || defaultComparer$1, a$1, b$1);
		}
		var equality = comparer(valA, valB, order);
		if ((equality === 0 || valA == null && valB == null) && sortByArr.length > depth$1) return multiPropertySorter(sortByArr[depth$1], sortByArr, depth$1 + 1, order, comparer, a$1, b$1);
		return equality;
	};
};
function getSortStrategy(sortBy, comparer, order) {
	if (sortBy === void 0 || sortBy === true) return function(a$1, b$1) {
		return comparer(a$1, b$1, order);
	};
	if (typeof sortBy === "string") {
		throwInvalidConfigErrorIfTrue(sortBy.includes("."), "String syntax not allowed for nested properties.");
		return function(a$1, b$1) {
			return comparer(a$1[sortBy], b$1[sortBy], order);
		};
	}
	if (typeof sortBy === "function") return function(a$1, b$1) {
		return comparer(sortBy(a$1), sortBy(b$1), order);
	};
	if (Array.isArray(sortBy)) {
		var multiPropSorter_1 = multiPropertySorterProvider(comparer);
		return function(a$1, b$1) {
			return multiPropSorter_1(sortBy[0], sortBy, 1, order, comparer, a$1, b$1);
		};
	}
	var objectSorterConfig = unpackObjectSorter(sortBy);
	return getSortStrategy(objectSorterConfig.sortBy, objectSorterConfig.comparer || comparer, objectSorterConfig.order);
}
var sortArray = function(order, ctx, sortBy, comparer) {
	var _a;
	if (!Array.isArray(ctx)) return ctx;
	if (Array.isArray(sortBy) && sortBy.length < 2) _a = sortBy, sortBy = _a[0];
	return ctx.sort(getSortStrategy(sortBy, comparer, order));
};
function createNewSortInstance(opts) {
	var comparer = castComparer(opts.comparer);
	return function(arrayToSort) {
		var ctx = Array.isArray(arrayToSort) && !opts.inPlaceSorting ? arrayToSort.slice() : arrayToSort;
		return {
			asc: function(sortBy) {
				return sortArray(1, ctx, sortBy, comparer);
			},
			desc: function(sortBy) {
				return sortArray(-1, ctx, sortBy, comparer);
			},
			by: function(sortBy) {
				return sortArray(1, ctx, sortBy, comparer);
			}
		};
	};
}
var defaultComparer = function(a$1, b$1, order) {
	if (a$1 == null) return order;
	if (b$1 == null) return -order;
	if (typeof a$1 !== typeof b$1) return typeof a$1 < typeof b$1 ? -1 : 1;
	if (a$1 < b$1) return -1;
	if (a$1 > b$1) return 1;
	return 0;
};
var sort = createNewSortInstance({ comparer: defaultComparer });
var inPlaceSort = createNewSortInstance({
	comparer: defaultComparer,
	inPlaceSorting: true
});
var d = Object.defineProperty;
var n = (s, t) => d(s, "name", {
	value: t,
	configurable: !0
});
typeof Symbol.asyncDispose != "symbol" && Object.defineProperty(Symbol, "asyncDispose", {
	configurable: !1,
	enumerable: !1,
	writable: !1,
	value: Symbol.for("asyncDispose")
});
var P = class {
	static {
		n(this, "FsFixture");
	}
	path;
	constructor(t) {
		this.path = t;
	}
	getPath(...t) {
		return path.join(this.path, ...t);
	}
	exists(t = "") {
		return a.access(this.getPath(t)).then(() => !0, () => !1);
	}
	rm(t = "") {
		return a.rm(this.getPath(t), {
			recursive: !0,
			force: !0
		});
	}
	cp(t, r, i) {
		return r ? r.endsWith(path.sep) && (r += path.basename(t)) : r = path.basename(t), a.cp(t, this.getPath(r), i);
	}
	mkdir(t) {
		return a.mkdir(this.getPath(t), { recursive: !0 });
	}
	writeFile(t, r) {
		return a.writeFile(this.getPath(t), r);
	}
	writeJson(t, r) {
		return this.writeFile(t, JSON.stringify(r, null, 2));
	}
	readFile(t, r) {
		return a.readFile(this.getPath(t), r);
	}
	async [Symbol.asyncDispose]() {
		await this.rm();
	}
};
const v = b.realpathSync(F.tmpdir()), D = `fs-fixture-${Date.now()}-${process.pid}`;
let m = 0;
const j = n(() => (m += 1, m), "getId");
var u = class {
	static {
		n(this, "Path");
	}
	path;
	constructor(t) {
		this.path = t;
	}
};
var f = class extends u {
	static {
		n(this, "Directory");
	}
};
var y = class extends u {
	static {
		n(this, "File");
	}
	content;
	constructor(t, r) {
		super(t), this.content = r;
	}
};
var l = class {
	static {
		n(this, "Symlink");
	}
	target;
	type;
	path;
	constructor(t, r) {
		this.target = t, this.type = r;
	}
};
const w = n((s, t, r) => {
	const i = [];
	for (const p in s) {
		if (!Object.hasOwn(s, p)) continue;
		const e = path.join(t, p);
		let o = s[p];
		if (typeof o == "function") {
			const g = Object.assign(Object.create(r), { filePath: e }), h = o(g);
			if (h instanceof l) {
				h.path = e, i.push(h);
				continue;
			} else o = h;
		}
		typeof o == "string" ? i.push(new y(e, o)) : i.push(new f(e), ...w(o, e, r));
	}
	return i;
}, "flattenFileTree"), k = n(async (s, t) => {
	const r = t?.tempDir ? path.resolve(t.tempDir) : v, i = path.join(r, `${D}-${j()}/`);
	if (await a.mkdir(i, { recursive: !0 }), s) {
		if (typeof s == "string") await a.cp(s, i, {
			recursive: !0,
			filter: t?.templateFilter
		});
		else if (typeof s == "object") {
			const p = {
				fixturePath: i,
				getPath: n((...e) => path.join(i, ...e), "getPath"),
				symlink: n((e, o) => new l(e, o), "symlink")
			};
			await Promise.all(w(s, i, p).map(async (e) => {
				e instanceof f ? await a.mkdir(e.path, { recursive: !0 }) : e instanceof l ? (await a.mkdir(path.dirname(e.path), { recursive: !0 }), await a.symlink(e.target, e.path, e.type)) : e instanceof y && (await a.mkdir(path.dirname(e.path), { recursive: !0 }), await a.writeFile(e.path, e.content));
			}));
		}
	}
	return new P(i);
}, "createFixture");
async function isType(fsStatType, statsMethodName, filePath) {
	if (typeof filePath !== "string") throw new TypeError(`Expected a string, got ${typeof filePath}`);
	try {
		const stats = await a[fsStatType](filePath);
		return stats[statsMethodName]();
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
function isTypeSync(fsStatType, statsMethodName, filePath) {
	if (typeof filePath !== "string") throw new TypeError(`Expected a string, got ${typeof filePath}`);
	try {
		return b[fsStatType](filePath)[statsMethodName]();
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
const isFile = isType.bind(void 0, "stat", "isFile");
const isDirectory = isType.bind(void 0, "stat", "isDirectory");
const isSymlink = isType.bind(void 0, "lstat", "isSymbolicLink");
const isFileSync = isTypeSync.bind(void 0, "statSync", "isFile");
const isDirectorySync = isTypeSync.bind(void 0, "statSync", "isDirectory");
const isSymlinkSync = isTypeSync.bind(void 0, "lstatSync", "isSymbolicLink");
var require_utils$1 = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.normalizePath = exports.isRootDirectory = exports.convertSlashes = exports.cleanPath = void 0;
	const path_1$4 = __require("node:path");
	function cleanPath(path$1) {
		let normalized = (0, path_1$4.normalize)(path$1);
		if (normalized.length > 1 && normalized[normalized.length - 1] === path_1$4.sep) normalized = normalized.substring(0, normalized.length - 1);
		return normalized;
	}
	exports.cleanPath = cleanPath;
	const SLASHES_REGEX = /[\\/]/g;
	function convertSlashes(path$1, separator) {
		return path$1.replace(SLASHES_REGEX, separator);
	}
	exports.convertSlashes = convertSlashes;
	const WINDOWS_ROOT_DIR_REGEX = /^[a-z]:[\\/]$/i;
	function isRootDirectory(path$1) {
		return path$1 === "/" || WINDOWS_ROOT_DIR_REGEX.test(path$1);
	}
	exports.isRootDirectory = isRootDirectory;
	function normalizePath(path$1, options) {
		const { resolvePaths, normalizePath: normalizePath$1, pathSeparator } = options;
		const pathNeedsCleaning = process.platform === "win32" && path$1.includes("/") || path$1.startsWith(".");
		if (resolvePaths) path$1 = (0, path_1$4.resolve)(path$1);
		if (normalizePath$1 || pathNeedsCleaning) path$1 = cleanPath(path$1);
		if (path$1 === ".") return "";
		const needsSeperator = path$1[path$1.length - 1] !== pathSeparator;
		return convertSlashes(needsSeperator ? path$1 + pathSeparator : path$1, pathSeparator);
	}
	exports.normalizePath = normalizePath;
});
var require_join_path = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.build = exports.joinDirectoryPath = exports.joinPathWithBasePath = void 0;
	const path_1$3 = __require("node:path");
	const utils_1$1 = require_utils$1();
	function joinPathWithBasePath(filename, directoryPath) {
		return directoryPath + filename;
	}
	exports.joinPathWithBasePath = joinPathWithBasePath;
	function joinPathWithRelativePath(root, options) {
		return function(filename, directoryPath) {
			const sameRoot = directoryPath.startsWith(root);
			if (sameRoot) return directoryPath.replace(root, "") + filename;
			else return (0, utils_1$1.convertSlashes)((0, path_1$3.relative)(root, directoryPath), options.pathSeparator) + options.pathSeparator + filename;
		};
	}
	function joinPath$1(filename) {
		return filename;
	}
	function joinDirectoryPath(filename, directoryPath, separator) {
		return directoryPath + filename + separator;
	}
	exports.joinDirectoryPath = joinDirectoryPath;
	function build$7(root, options) {
		const { relativePaths, includeBasePath } = options;
		return relativePaths && root ? joinPathWithRelativePath(root, options) : includeBasePath ? joinPathWithBasePath : joinPath$1;
	}
	exports.build = build$7;
});
var require_push_directory = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.build = void 0;
	function pushDirectoryWithRelativePath(root) {
		return function(directoryPath, paths) {
			paths.push(directoryPath.substring(root.length) || ".");
		};
	}
	function pushDirectoryFilterWithRelativePath(root) {
		return function(directoryPath, paths, filters) {
			const relativePath = directoryPath.substring(root.length) || ".";
			if (filters.every((filter) => filter(relativePath, true))) paths.push(relativePath);
		};
	}
	const pushDirectory$1 = (directoryPath, paths) => {
		paths.push(directoryPath || ".");
	};
	const pushDirectoryFilter = (directoryPath, paths, filters) => {
		const path$1 = directoryPath || ".";
		if (filters.every((filter) => filter(path$1, true))) paths.push(path$1);
	};
	const empty$2 = () => {};
	function build$6(root, options) {
		const { includeDirs, filters, relativePaths } = options;
		if (!includeDirs) return empty$2;
		if (relativePaths) return filters && filters.length ? pushDirectoryFilterWithRelativePath(root) : pushDirectoryWithRelativePath(root);
		return filters && filters.length ? pushDirectoryFilter : pushDirectory$1;
	}
	exports.build = build$6;
});
var require_push_file = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.build = void 0;
	const pushFileFilterAndCount = (filename, _paths, counts, filters) => {
		if (filters.every((filter) => filter(filename, false))) counts.files++;
	};
	const pushFileFilter = (filename, paths, _counts, filters) => {
		if (filters.every((filter) => filter(filename, false))) paths.push(filename);
	};
	const pushFileCount = (_filename, _paths, counts, _filters) => {
		counts.files++;
	};
	const pushFile$1 = (filename, paths) => {
		paths.push(filename);
	};
	const empty$1 = () => {};
	function build$5(options) {
		const { excludeFiles, filters, onlyCounts } = options;
		if (excludeFiles) return empty$1;
		if (filters && filters.length) return onlyCounts ? pushFileFilterAndCount : pushFileFilter;
		else if (onlyCounts) return pushFileCount;
		else return pushFile$1;
	}
	exports.build = build$5;
});
var require_get_array = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.build = void 0;
	const getArray$1 = (paths) => {
		return paths;
	};
	const getArrayGroup = () => {
		return [""].slice(0, 0);
	};
	function build$4(options) {
		return options.group ? getArrayGroup : getArray$1;
	}
	exports.build = build$4;
});
var require_group_files = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.build = void 0;
	const groupFiles$1 = (groups, directory, files) => {
		groups.push({
			directory,
			files,
			dir: directory
		});
	};
	const empty = () => {};
	function build$3(options) {
		return options.group ? groupFiles$1 : empty;
	}
	exports.build = build$3;
});
var require_resolve_symlink = __commonJSMin((exports) => {
	var __importDefault$1 = function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.build = void 0;
	const fs_1$1 = __importDefault$1(__require("node:fs"));
	const path_1$2 = __require("node:path");
	const resolveSymlinksAsync = function(path$1, state, callback$1) {
		const { queue, options: { suppressErrors } } = state;
		queue.enqueue();
		fs_1$1.default.realpath(path$1, (error, resolvedPath) => {
			if (error) return queue.dequeue(suppressErrors ? null : error, state);
			fs_1$1.default.stat(resolvedPath, (error$1, stat) => {
				if (error$1) return queue.dequeue(suppressErrors ? null : error$1, state);
				if (stat.isDirectory() && isRecursive(path$1, resolvedPath, state)) return queue.dequeue(null, state);
				callback$1(stat, resolvedPath);
				queue.dequeue(null, state);
			});
		});
	};
	const resolveSymlinks = function(path$1, state, callback$1) {
		const { queue, options: { suppressErrors } } = state;
		queue.enqueue();
		try {
			const resolvedPath = fs_1$1.default.realpathSync(path$1);
			const stat = fs_1$1.default.statSync(resolvedPath);
			if (stat.isDirectory() && isRecursive(path$1, resolvedPath, state)) return;
			callback$1(stat, resolvedPath);
		} catch (e) {
			if (!suppressErrors) throw e;
		}
	};
	function build$2(options, isSynchronous) {
		if (!options.resolveSymlinks || options.excludeSymlinks) return null;
		return isSynchronous ? resolveSymlinks : resolveSymlinksAsync;
	}
	exports.build = build$2;
	function isRecursive(path$1, resolved, state) {
		if (state.options.useRealPaths) return isRecursiveUsingRealPaths(resolved, state);
		let parent = (0, path_1$2.dirname)(path$1);
		let depth$1 = 1;
		while (parent !== state.root && depth$1 < 2) {
			const resolvedPath = state.symlinks.get(parent);
			const isSameRoot = !!resolvedPath && (resolvedPath === resolved || resolvedPath.startsWith(resolved) || resolved.startsWith(resolvedPath));
			if (isSameRoot) depth$1++;
			else parent = (0, path_1$2.dirname)(parent);
		}
		state.symlinks.set(path$1, resolved);
		return depth$1 > 1;
	}
	function isRecursiveUsingRealPaths(resolved, state) {
		return state.visited.includes(resolved + state.options.pathSeparator);
	}
});
var require_invoke_callback = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.build = void 0;
	const onlyCountsSync = (state) => {
		return state.counts;
	};
	const groupsSync = (state) => {
		return state.groups;
	};
	const defaultSync = (state) => {
		return state.paths;
	};
	const limitFilesSync = (state) => {
		return state.paths.slice(0, state.options.maxFiles);
	};
	const onlyCountsAsync = (state, error, callback$1) => {
		report(error, callback$1, state.counts, state.options.suppressErrors);
		return null;
	};
	const defaultAsync = (state, error, callback$1) => {
		report(error, callback$1, state.paths, state.options.suppressErrors);
		return null;
	};
	const limitFilesAsync = (state, error, callback$1) => {
		report(error, callback$1, state.paths.slice(0, state.options.maxFiles), state.options.suppressErrors);
		return null;
	};
	const groupsAsync = (state, error, callback$1) => {
		report(error, callback$1, state.groups, state.options.suppressErrors);
		return null;
	};
	function report(error, callback$1, output, suppressErrors) {
		if (error && !suppressErrors) callback$1(error, output);
		else callback$1(null, output);
	}
	function build$1(options, isSynchronous) {
		const { onlyCounts, group, maxFiles } = options;
		if (onlyCounts) return isSynchronous ? onlyCountsSync : onlyCountsAsync;
		else if (group) return isSynchronous ? groupsSync : groupsAsync;
		else if (maxFiles) return isSynchronous ? limitFilesSync : limitFilesAsync;
		else return isSynchronous ? defaultSync : defaultAsync;
	}
	exports.build = build$1;
});
var require_walk_directory = __commonJSMin((exports) => {
	var __importDefault = function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.build = void 0;
	const fs_1 = __importDefault(__require("node:fs"));
	const readdirOpts = { withFileTypes: true };
	const walkAsync = (state, crawlPath, directoryPath, currentDepth, callback$1) => {
		state.queue.enqueue();
		if (currentDepth < 0) return state.queue.dequeue(null, state);
		state.visited.push(crawlPath);
		state.counts.directories++;
		fs_1.default.readdir(crawlPath || ".", readdirOpts, (error, entries = []) => {
			callback$1(entries, directoryPath, currentDepth);
			state.queue.dequeue(state.options.suppressErrors ? null : error, state);
		});
	};
	const walkSync = (state, crawlPath, directoryPath, currentDepth, callback$1) => {
		if (currentDepth < 0) return;
		state.visited.push(crawlPath);
		state.counts.directories++;
		let entries = [];
		try {
			entries = fs_1.default.readdirSync(crawlPath || ".", readdirOpts);
		} catch (e) {
			if (!state.options.suppressErrors) throw e;
		}
		callback$1(entries, directoryPath, currentDepth);
	};
	function build(isSynchronous) {
		return isSynchronous ? walkSync : walkAsync;
	}
	exports.build = build;
});
var require_queue = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Queue = void 0;
	/**
	* This is a custom stateless queue to track concurrent async fs calls.
	* It increments a counter whenever a call is queued and decrements it
	* as soon as it completes. When the counter hits 0, it calls onQueueEmpty.
	*/
	var Queue = class {
		onQueueEmpty;
		count = 0;
		constructor(onQueueEmpty) {
			this.onQueueEmpty = onQueueEmpty;
		}
		enqueue() {
			this.count++;
			return this.count;
		}
		dequeue(error, output) {
			if (this.onQueueEmpty && (--this.count <= 0 || error)) {
				this.onQueueEmpty(error, output);
				if (error) {
					output.controller.abort();
					this.onQueueEmpty = void 0;
				}
			}
		}
	};
	exports.Queue = Queue;
});
var require_counter = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Counter = void 0;
	var Counter = class {
		_files = 0;
		_directories = 0;
		set files(num) {
			this._files = num;
		}
		get files() {
			return this._files;
		}
		set directories(num) {
			this._directories = num;
		}
		get directories() {
			return this._directories;
		}
		/**
		* @deprecated use `directories` instead
		*/
		/* c8 ignore next 3 */
		get dirs() {
			return this._directories;
		}
	};
	exports.Counter = Counter;
});
var require_walker = __commonJSMin((exports) => {
	var __createBinding$1 = Object.create ? function(o, m$1, k$1, k2) {
		if (k2 === void 0) k2 = k$1;
		var desc = Object.getOwnPropertyDescriptor(m$1, k$1);
		if (!desc || ("get" in desc ? !m$1.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m$1[k$1];
			}
		};
		Object.defineProperty(o, k2, desc);
	} : function(o, m$1, k$1, k2) {
		if (k2 === void 0) k2 = k$1;
		o[k2] = m$1[k$1];
	};
	var __setModuleDefault = Object.create ? function(o, v$1) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v$1
		});
	} : function(o, v$1) {
		o["default"] = v$1;
	};
	var __importStar = function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k$1 in mod) if (k$1 !== "default" && Object.prototype.hasOwnProperty.call(mod, k$1)) __createBinding$1(result, mod, k$1);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Walker = void 0;
	const path_1$1 = __require("node:path");
	const utils_1 = require_utils$1();
	const joinPath = __importStar(require_join_path());
	const pushDirectory = __importStar(require_push_directory());
	const pushFile = __importStar(require_push_file());
	const getArray = __importStar(require_get_array());
	const groupFiles = __importStar(require_group_files());
	const resolveSymlink = __importStar(require_resolve_symlink());
	const invokeCallback = __importStar(require_invoke_callback());
	const walkDirectory = __importStar(require_walk_directory());
	const queue_1 = require_queue();
	const counter_1 = require_counter();
	var Walker = class {
		root;
		isSynchronous;
		state;
		joinPath;
		pushDirectory;
		pushFile;
		getArray;
		groupFiles;
		resolveSymlink;
		walkDirectory;
		callbackInvoker;
		constructor(root, options, callback$1) {
			this.isSynchronous = !callback$1;
			this.callbackInvoker = invokeCallback.build(options, this.isSynchronous);
			this.root = (0, utils_1.normalizePath)(root, options);
			this.state = {
				root: (0, utils_1.isRootDirectory)(this.root) ? this.root : this.root.slice(0, -1),
				paths: [""].slice(0, 0),
				groups: [],
				counts: new counter_1.Counter(),
				options,
				queue: new queue_1.Queue((error, state) => this.callbackInvoker(state, error, callback$1)),
				symlinks: /* @__PURE__ */ new Map(),
				visited: [""].slice(0, 0),
				controller: new AbortController()
			};
			this.joinPath = joinPath.build(this.root, options);
			this.pushDirectory = pushDirectory.build(this.root, options);
			this.pushFile = pushFile.build(options);
			this.getArray = getArray.build(options);
			this.groupFiles = groupFiles.build(options);
			this.resolveSymlink = resolveSymlink.build(options, this.isSynchronous);
			this.walkDirectory = walkDirectory.build(this.isSynchronous);
		}
		start() {
			this.pushDirectory(this.root, this.state.paths, this.state.options.filters);
			this.walkDirectory(this.state, this.root, this.root, this.state.options.maxDepth, this.walk);
			return this.isSynchronous ? this.callbackInvoker(this.state, null) : null;
		}
		walk = (entries, directoryPath, depth$1) => {
			const { paths, options: { filters, resolveSymlinks: resolveSymlinks$1, excludeSymlinks, exclude, maxFiles, signal, useRealPaths, pathSeparator }, controller } = this.state;
			if (controller.signal.aborted || signal && signal.aborted || maxFiles && paths.length > maxFiles) return;
			const files = this.getArray(this.state.paths);
			for (let i = 0; i < entries.length; ++i) {
				const entry = entries[i];
				if (entry.isFile() || entry.isSymbolicLink() && !resolveSymlinks$1 && !excludeSymlinks) {
					const filename = this.joinPath(entry.name, directoryPath);
					this.pushFile(filename, files, this.state.counts, filters);
				} else if (entry.isDirectory()) {
					let path$1 = joinPath.joinDirectoryPath(entry.name, directoryPath, this.state.options.pathSeparator);
					if (exclude && exclude(entry.name, path$1)) continue;
					this.pushDirectory(path$1, paths, filters);
					this.walkDirectory(this.state, path$1, path$1, depth$1 - 1, this.walk);
				} else if (this.resolveSymlink && entry.isSymbolicLink()) {
					let path$1 = joinPath.joinPathWithBasePath(entry.name, directoryPath);
					this.resolveSymlink(path$1, this.state, (stat, resolvedPath) => {
						if (stat.isDirectory()) {
							resolvedPath = (0, utils_1.normalizePath)(resolvedPath, this.state.options);
							if (exclude && exclude(entry.name, useRealPaths ? resolvedPath : path$1 + pathSeparator)) return;
							this.walkDirectory(this.state, resolvedPath, useRealPaths ? resolvedPath : path$1 + pathSeparator, depth$1 - 1, this.walk);
						} else {
							resolvedPath = useRealPaths ? resolvedPath : path$1;
							const filename = (0, path_1$1.basename)(resolvedPath);
							const directoryPath$1 = (0, utils_1.normalizePath)((0, path_1$1.dirname)(resolvedPath), this.state.options);
							resolvedPath = this.joinPath(filename, directoryPath$1);
							this.pushFile(resolvedPath, files, this.state.counts, filters);
						}
					});
				}
			}
			this.groupFiles(this.state.groups, directoryPath, files);
		};
	};
	exports.Walker = Walker;
});
var require_async = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.callback = exports.promise = void 0;
	const walker_1$1 = require_walker();
	function promise(root, options) {
		return new Promise((resolve, reject) => {
			callback(root, options, (err, output) => {
				if (err) return reject(err);
				resolve(output);
			});
		});
	}
	exports.promise = promise;
	function callback(root, options, callback$1) {
		let walker = new walker_1$1.Walker(root, options, callback$1);
		walker.start();
	}
	exports.callback = callback;
});
var require_sync = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.sync = void 0;
	const walker_1 = require_walker();
	function sync(root, options) {
		const walker = new walker_1.Walker(root, options);
		return walker.start();
	}
	exports.sync = sync;
});
var require_api_builder = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.APIBuilder = void 0;
	const async_1 = require_async();
	const sync_1 = require_sync();
	var APIBuilder = class {
		root;
		options;
		constructor(root, options) {
			this.root = root;
			this.options = options;
		}
		withPromise() {
			return (0, async_1.promise)(this.root, this.options);
		}
		withCallback(cb) {
			(0, async_1.callback)(this.root, this.options, cb);
		}
		sync() {
			return (0, sync_1.sync)(this.root, this.options);
		}
	};
	exports.APIBuilder = APIBuilder;
});
var require_constants = __commonJSMin((exports, module) => {
	const WIN_SLASH = "\\\\/";
	const WIN_NO_SLASH = `[^${WIN_SLASH}]`;
	/**
	* Posix glob regex
	*/
	const DOT_LITERAL = "\\.";
	const PLUS_LITERAL = "\\+";
	const QMARK_LITERAL = "\\?";
	const SLASH_LITERAL = "\\/";
	const ONE_CHAR = "(?=.)";
	const QMARK = "[^/]";
	const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
	const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
	const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
	const NO_DOT = `(?!${DOT_LITERAL})`;
	const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
	const NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
	const NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
	const QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
	const STAR = `${QMARK}*?`;
	const SEP = "/";
	const POSIX_CHARS = {
		DOT_LITERAL,
		PLUS_LITERAL,
		QMARK_LITERAL,
		SLASH_LITERAL,
		ONE_CHAR,
		QMARK,
		END_ANCHOR,
		DOTS_SLASH,
		NO_DOT,
		NO_DOTS,
		NO_DOT_SLASH,
		NO_DOTS_SLASH,
		QMARK_NO_DOT,
		STAR,
		START_ANCHOR,
		SEP
	};
	/**
	* Windows glob regex
	*/
	const WINDOWS_CHARS = {
		...POSIX_CHARS,
		SLASH_LITERAL: `[${WIN_SLASH}]`,
		QMARK: WIN_NO_SLASH,
		STAR: `${WIN_NO_SLASH}*?`,
		DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
		NO_DOT: `(?!${DOT_LITERAL})`,
		NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
		NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
		NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
		QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
		START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
		END_ANCHOR: `(?:[${WIN_SLASH}]|$)`,
		SEP: "\\"
	};
	/**
	* POSIX Bracket Regex
	*/
	const POSIX_REGEX_SOURCE$1 = {
		alnum: "a-zA-Z0-9",
		alpha: "a-zA-Z",
		ascii: "\\x00-\\x7F",
		blank: " \\t",
		cntrl: "\\x00-\\x1F\\x7F",
		digit: "0-9",
		graph: "\\x21-\\x7E",
		lower: "a-z",
		print: "\\x20-\\x7E ",
		punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
		space: " \\t\\r\\n\\v\\f",
		upper: "A-Z",
		word: "A-Za-z0-9_",
		xdigit: "A-Fa-f0-9"
	};
	module.exports = {
		MAX_LENGTH: 1024 * 64,
		POSIX_REGEX_SOURCE: POSIX_REGEX_SOURCE$1,
		REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
		REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
		REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
		REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
		REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
		REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
		REPLACEMENTS: {
			"***": "*",
			"**/**": "**",
			"**/**/**": "**"
		},
		CHAR_0: 48,
		CHAR_9: 57,
		CHAR_UPPERCASE_A: 65,
		CHAR_LOWERCASE_A: 97,
		CHAR_UPPERCASE_Z: 90,
		CHAR_LOWERCASE_Z: 122,
		CHAR_LEFT_PARENTHESES: 40,
		CHAR_RIGHT_PARENTHESES: 41,
		CHAR_ASTERISK: 42,
		CHAR_AMPERSAND: 38,
		CHAR_AT: 64,
		CHAR_BACKWARD_SLASH: 92,
		CHAR_CARRIAGE_RETURN: 13,
		CHAR_CIRCUMFLEX_ACCENT: 94,
		CHAR_COLON: 58,
		CHAR_COMMA: 44,
		CHAR_DOT: 46,
		CHAR_DOUBLE_QUOTE: 34,
		CHAR_EQUAL: 61,
		CHAR_EXCLAMATION_MARK: 33,
		CHAR_FORM_FEED: 12,
		CHAR_FORWARD_SLASH: 47,
		CHAR_GRAVE_ACCENT: 96,
		CHAR_HASH: 35,
		CHAR_HYPHEN_MINUS: 45,
		CHAR_LEFT_ANGLE_BRACKET: 60,
		CHAR_LEFT_CURLY_BRACE: 123,
		CHAR_LEFT_SQUARE_BRACKET: 91,
		CHAR_LINE_FEED: 10,
		CHAR_NO_BREAK_SPACE: 160,
		CHAR_PERCENT: 37,
		CHAR_PLUS: 43,
		CHAR_QUESTION_MARK: 63,
		CHAR_RIGHT_ANGLE_BRACKET: 62,
		CHAR_RIGHT_CURLY_BRACE: 125,
		CHAR_RIGHT_SQUARE_BRACKET: 93,
		CHAR_SEMICOLON: 59,
		CHAR_SINGLE_QUOTE: 39,
		CHAR_SPACE: 32,
		CHAR_TAB: 9,
		CHAR_UNDERSCORE: 95,
		CHAR_VERTICAL_LINE: 124,
		CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
		extglobChars(chars) {
			return {
				"!": {
					type: "negate",
					open: "(?:(?!(?:",
					close: `))${chars.STAR})`
				},
				"?": {
					type: "qmark",
					open: "(?:",
					close: ")?"
				},
				"+": {
					type: "plus",
					open: "(?:",
					close: ")+"
				},
				"*": {
					type: "star",
					open: "(?:",
					close: ")*"
				},
				"@": {
					type: "at",
					open: "(?:",
					close: ")"
				}
			};
		},
		globChars(win32) {
			return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
		}
	};
});
var require_utils = __commonJSMin((exports) => {
	const { REGEX_BACKSLASH, REGEX_REMOVE_BACKSLASH, REGEX_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_GLOBAL } = require_constants();
	exports.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
	exports.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
	exports.isRegexChar = (str) => str.length === 1 && exports.hasRegexChars(str);
	exports.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
	exports.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
	exports.isWindows = () => {
		if (typeof navigator !== "undefined" && navigator.platform) {
			const platform = navigator.platform.toLowerCase();
			return platform === "win32" || platform === "windows";
		}
		if (typeof process !== "undefined" && process.platform) return process.platform === "win32";
		return false;
	};
	exports.removeBackslashes = (str) => {
		return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
			return match === "\\" ? "" : match;
		});
	};
	exports.escapeLast = (input, char, lastIdx) => {
		const idx = input.lastIndexOf(char, lastIdx);
		if (idx === -1) return input;
		if (input[idx - 1] === "\\") return exports.escapeLast(input, char, idx - 1);
		return `${input.slice(0, idx)}\\${input.slice(idx)}`;
	};
	exports.removePrefix = (input, state = {}) => {
		let output = input;
		if (output.startsWith("./")) {
			output = output.slice(2);
			state.prefix = "./";
		}
		return output;
	};
	exports.wrapOutput = (input, state = {}, options = {}) => {
		const prepend = options.contains ? "" : "^";
		const append = options.contains ? "" : "$";
		let output = `${prepend}(?:${input})${append}`;
		if (state.negated === true) output = `(?:^(?!${output}).*$)`;
		return output;
	};
	exports.basename = (path$1, { windows } = {}) => {
		const segs = path$1.split(windows ? /[\\/]/ : "/");
		const last = segs[segs.length - 1];
		if (last === "") return segs[segs.length - 2];
		return last;
	};
});
var require_scan = __commonJSMin((exports, module) => {
	const utils$3 = require_utils();
	const { CHAR_ASTERISK, CHAR_AT, CHAR_BACKWARD_SLASH, CHAR_COMMA, CHAR_DOT, CHAR_EXCLAMATION_MARK, CHAR_FORWARD_SLASH, CHAR_LEFT_CURLY_BRACE, CHAR_LEFT_PARENTHESES, CHAR_LEFT_SQUARE_BRACKET, CHAR_PLUS, CHAR_QUESTION_MARK, CHAR_RIGHT_CURLY_BRACE, CHAR_RIGHT_PARENTHESES, CHAR_RIGHT_SQUARE_BRACKET } = require_constants();
	const isPathSeparator = (code) => {
		return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
	};
	const depth = (token) => {
		if (token.isPrefix !== true) token.depth = token.isGlobstar ? Infinity : 1;
	};
	/**
	* Quickly scans a glob pattern and returns an object with a handful of
	* useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
	* `glob` (the actual pattern), `negated` (true if the path starts with `!` but not
	* with `!(`) and `negatedExtglob` (true if the path starts with `!(`).
	*
	* ```js
	* const pm = require('picomatch');
	* console.log(pm.scan('foo/bar/*.js'));
	* { isGlob: true, input: 'foo/bar/*.js', base: 'foo/bar', glob: '*.js' }
	* ```
	* @param {String} `str`
	* @param {Object} `options`
	* @return {Object} Returns an object with tokens and regex source string.
	* @api public
	*/
	const scan$1 = (input, options) => {
		const opts = options || {};
		const length = input.length - 1;
		const scanToEnd = opts.parts === true || opts.scanToEnd === true;
		const slashes = [];
		const tokens = [];
		const parts = [];
		let str = input;
		let index = -1;
		let start = 0;
		let lastIndex = 0;
		let isBrace = false;
		let isBracket = false;
		let isGlob = false;
		let isExtglob = false;
		let isGlobstar = false;
		let braceEscaped = false;
		let backslashes = false;
		let negated = false;
		let negatedExtglob = false;
		let finished = false;
		let braces = 0;
		let prev;
		let code;
		let token = {
			value: "",
			depth: 0,
			isGlob: false
		};
		const eos = () => index >= length;
		const peek = () => str.charCodeAt(index + 1);
		const advance = () => {
			prev = code;
			return str.charCodeAt(++index);
		};
		while (index < length) {
			code = advance();
			let next;
			if (code === CHAR_BACKWARD_SLASH) {
				backslashes = token.backslashes = true;
				code = advance();
				if (code === CHAR_LEFT_CURLY_BRACE) braceEscaped = true;
				continue;
			}
			if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
				braces++;
				while (eos() !== true && (code = advance())) {
					if (code === CHAR_BACKWARD_SLASH) {
						backslashes = token.backslashes = true;
						advance();
						continue;
					}
					if (code === CHAR_LEFT_CURLY_BRACE) {
						braces++;
						continue;
					}
					if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
						isBrace = token.isBrace = true;
						isGlob = token.isGlob = true;
						finished = true;
						if (scanToEnd === true) continue;
						break;
					}
					if (braceEscaped !== true && code === CHAR_COMMA) {
						isBrace = token.isBrace = true;
						isGlob = token.isGlob = true;
						finished = true;
						if (scanToEnd === true) continue;
						break;
					}
					if (code === CHAR_RIGHT_CURLY_BRACE) {
						braces--;
						if (braces === 0) {
							braceEscaped = false;
							isBrace = token.isBrace = true;
							finished = true;
							break;
						}
					}
				}
				if (scanToEnd === true) continue;
				break;
			}
			if (code === CHAR_FORWARD_SLASH) {
				slashes.push(index);
				tokens.push(token);
				token = {
					value: "",
					depth: 0,
					isGlob: false
				};
				if (finished === true) continue;
				if (prev === CHAR_DOT && index === start + 1) {
					start += 2;
					continue;
				}
				lastIndex = index + 1;
				continue;
			}
			if (opts.noext !== true) {
				const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
				if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
					isGlob = token.isGlob = true;
					isExtglob = token.isExtglob = true;
					finished = true;
					if (code === CHAR_EXCLAMATION_MARK && index === start) negatedExtglob = true;
					if (scanToEnd === true) {
						while (eos() !== true && (code = advance())) {
							if (code === CHAR_BACKWARD_SLASH) {
								backslashes = token.backslashes = true;
								code = advance();
								continue;
							}
							if (code === CHAR_RIGHT_PARENTHESES) {
								isGlob = token.isGlob = true;
								finished = true;
								break;
							}
						}
						continue;
					}
					break;
				}
			}
			if (code === CHAR_ASTERISK) {
				if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
				isGlob = token.isGlob = true;
				finished = true;
				if (scanToEnd === true) continue;
				break;
			}
			if (code === CHAR_QUESTION_MARK) {
				isGlob = token.isGlob = true;
				finished = true;
				if (scanToEnd === true) continue;
				break;
			}
			if (code === CHAR_LEFT_SQUARE_BRACKET) {
				while (eos() !== true && (next = advance())) {
					if (next === CHAR_BACKWARD_SLASH) {
						backslashes = token.backslashes = true;
						advance();
						continue;
					}
					if (next === CHAR_RIGHT_SQUARE_BRACKET) {
						isBracket = token.isBracket = true;
						isGlob = token.isGlob = true;
						finished = true;
						break;
					}
				}
				if (scanToEnd === true) continue;
				break;
			}
			if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
				negated = token.negated = true;
				start++;
				continue;
			}
			if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
				isGlob = token.isGlob = true;
				if (scanToEnd === true) {
					while (eos() !== true && (code = advance())) {
						if (code === CHAR_LEFT_PARENTHESES) {
							backslashes = token.backslashes = true;
							code = advance();
							continue;
						}
						if (code === CHAR_RIGHT_PARENTHESES) {
							finished = true;
							break;
						}
					}
					continue;
				}
				break;
			}
			if (isGlob === true) {
				finished = true;
				if (scanToEnd === true) continue;
				break;
			}
		}
		if (opts.noext === true) {
			isExtglob = false;
			isGlob = false;
		}
		let base = str;
		let prefix = "";
		let glob$1 = "";
		if (start > 0) {
			prefix = str.slice(0, start);
			str = str.slice(start);
			lastIndex -= start;
		}
		if (base && isGlob === true && lastIndex > 0) {
			base = str.slice(0, lastIndex);
			glob$1 = str.slice(lastIndex);
		} else if (isGlob === true) {
			base = "";
			glob$1 = str;
		} else base = str;
		if (base && base !== "" && base !== "/" && base !== str) {
			if (isPathSeparator(base.charCodeAt(base.length - 1))) base = base.slice(0, -1);
		}
		if (opts.unescape === true) {
			if (glob$1) glob$1 = utils$3.removeBackslashes(glob$1);
			if (base && backslashes === true) base = utils$3.removeBackslashes(base);
		}
		const state = {
			prefix,
			input,
			start,
			base,
			glob: glob$1,
			isBrace,
			isBracket,
			isGlob,
			isExtglob,
			isGlobstar,
			negated,
			negatedExtglob
		};
		if (opts.tokens === true) {
			state.maxDepth = 0;
			if (!isPathSeparator(code)) tokens.push(token);
			state.tokens = tokens;
		}
		if (opts.parts === true || opts.tokens === true) {
			let prevIndex;
			for (let idx = 0; idx < slashes.length; idx++) {
				const n$1 = prevIndex ? prevIndex + 1 : start;
				const i = slashes[idx];
				const value = input.slice(n$1, i);
				if (opts.tokens) {
					if (idx === 0 && start !== 0) {
						tokens[idx].isPrefix = true;
						tokens[idx].value = prefix;
					} else tokens[idx].value = value;
					depth(tokens[idx]);
					state.maxDepth += tokens[idx].depth;
				}
				if (idx !== 0 || value !== "") parts.push(value);
				prevIndex = i;
			}
			if (prevIndex && prevIndex + 1 < input.length) {
				const value = input.slice(prevIndex + 1);
				parts.push(value);
				if (opts.tokens) {
					tokens[tokens.length - 1].value = value;
					depth(tokens[tokens.length - 1]);
					state.maxDepth += tokens[tokens.length - 1].depth;
				}
			}
			state.slashes = slashes;
			state.parts = parts;
		}
		return state;
	};
	module.exports = scan$1;
});
var require_parse = __commonJSMin((exports, module) => {
	const constants$1 = require_constants();
	const utils$2 = require_utils();
	/**
	* Constants
	*/
	const { MAX_LENGTH, POSIX_REGEX_SOURCE, REGEX_NON_SPECIAL_CHARS, REGEX_SPECIAL_CHARS_BACKREF, REPLACEMENTS } = constants$1;
	/**
	* Helpers
	*/
	const expandRange = (args, options) => {
		if (typeof options.expandRange === "function") return options.expandRange(...args, options);
		args.sort();
		const value = `[${args.join("-")}]`;
		try {
			new RegExp(value);
		} catch (ex) {
			return args.map((v$1) => utils$2.escapeRegex(v$1)).join("..");
		}
		return value;
	};
	/**
	* Create the message for a syntax error
	*/
	const syntaxError = (type, char) => {
		return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
	};
	/**
	* Parse the given input string.
	* @param {String} input
	* @param {Object} options
	* @return {Object}
	*/
	const parse$1 = (input, options) => {
		if (typeof input !== "string") throw new TypeError("Expected a string");
		input = REPLACEMENTS[input] || input;
		const opts = { ...options };
		const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
		let len = input.length;
		if (len > max) throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
		const bos = {
			type: "bos",
			value: "",
			output: opts.prepend || ""
		};
		const tokens = [bos];
		const capture = opts.capture ? "" : "?:";
		const PLATFORM_CHARS = constants$1.globChars(opts.windows);
		const EXTGLOB_CHARS = constants$1.extglobChars(PLATFORM_CHARS);
		const { DOT_LITERAL: DOT_LITERAL$1, PLUS_LITERAL: PLUS_LITERAL$1, SLASH_LITERAL: SLASH_LITERAL$1, ONE_CHAR: ONE_CHAR$1, DOTS_SLASH: DOTS_SLASH$1, NO_DOT: NO_DOT$1, NO_DOT_SLASH: NO_DOT_SLASH$1, NO_DOTS_SLASH: NO_DOTS_SLASH$1, QMARK: QMARK$1, QMARK_NO_DOT: QMARK_NO_DOT$1, STAR: STAR$1, START_ANCHOR: START_ANCHOR$1 } = PLATFORM_CHARS;
		const globstar = (opts$1) => {
			return `(${capture}(?:(?!${START_ANCHOR$1}${opts$1.dot ? DOTS_SLASH$1 : DOT_LITERAL$1}).)*?)`;
		};
		const nodot = opts.dot ? "" : NO_DOT$1;
		const qmarkNoDot = opts.dot ? QMARK$1 : QMARK_NO_DOT$1;
		let star = opts.bash === true ? globstar(opts) : STAR$1;
		if (opts.capture) star = `(${star})`;
		if (typeof opts.noext === "boolean") opts.noextglob = opts.noext;
		const state = {
			input,
			index: -1,
			start: 0,
			dot: opts.dot === true,
			consumed: "",
			output: "",
			prefix: "",
			backtrack: false,
			negated: false,
			brackets: 0,
			braces: 0,
			parens: 0,
			quotes: 0,
			globstar: false,
			tokens
		};
		input = utils$2.removePrefix(input, state);
		len = input.length;
		const extglobs = [];
		const braces = [];
		const stack = [];
		let prev = bos;
		let value;
		/**
		* Tokenizing helpers
		*/
		const eos = () => state.index === len - 1;
		const peek = state.peek = (n$1 = 1) => input[state.index + n$1];
		const advance = state.advance = () => input[++state.index] || "";
		const remaining = () => input.slice(state.index + 1);
		const consume = (value$1 = "", num = 0) => {
			state.consumed += value$1;
			state.index += num;
		};
		const append = (token) => {
			state.output += token.output != null ? token.output : token.value;
			consume(token.value);
		};
		const negate = () => {
			let count = 1;
			while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
				advance();
				state.start++;
				count++;
			}
			if (count % 2 === 0) return false;
			state.negated = true;
			state.start++;
			return true;
		};
		const increment = (type) => {
			state[type]++;
			stack.push(type);
		};
		const decrement = (type) => {
			state[type]--;
			stack.pop();
		};
		/**
		* Push tokens onto the tokens array. This helper speeds up
		* tokenizing by 1) helping us avoid backtracking as much as possible,
		* and 2) helping us avoid creating extra tokens when consecutive
		* characters are plain text. This improves performance and simplifies
		* lookbehinds.
		*/
		const push = (tok) => {
			if (prev.type === "globstar") {
				const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
				const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
				if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
					state.output = state.output.slice(0, -prev.output.length);
					prev.type = "star";
					prev.value = "*";
					prev.output = star;
					state.output += prev.output;
				}
			}
			if (extglobs.length && tok.type !== "paren") extglobs[extglobs.length - 1].inner += tok.value;
			if (tok.value || tok.output) append(tok);
			if (prev && prev.type === "text" && tok.type === "text") {
				prev.output = (prev.output || prev.value) + tok.value;
				prev.value += tok.value;
				return;
			}
			tok.prev = prev;
			tokens.push(tok);
			prev = tok;
		};
		const extglobOpen = (type, value$1) => {
			const token = {
				...EXTGLOB_CHARS[value$1],
				conditions: 1,
				inner: ""
			};
			token.prev = prev;
			token.parens = state.parens;
			token.output = state.output;
			const output = (opts.capture ? "(" : "") + token.open;
			increment("parens");
			push({
				type,
				value: value$1,
				output: state.output ? "" : ONE_CHAR$1
			});
			push({
				type: "paren",
				extglob: true,
				value: advance(),
				output
			});
			extglobs.push(token);
		};
		const extglobClose = (token) => {
			let output = token.close + (opts.capture ? ")" : "");
			let rest;
			if (token.type === "negate") {
				let extglobStar = star;
				if (token.inner && token.inner.length > 1 && token.inner.includes("/")) extglobStar = globstar(opts);
				if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) output = token.close = `)$))${extglobStar}`;
				if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
					const expression = parse$1(rest, {
						...options,
						fastpaths: false
					}).output;
					output = token.close = `)${expression})${extglobStar})`;
				}
				if (token.prev.type === "bos") state.negatedExtglob = true;
			}
			push({
				type: "paren",
				extglob: true,
				value,
				output
			});
			decrement("parens");
		};
		/**
		* Fast paths
		*/
		if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
			let backslashes = false;
			let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m$1, esc, chars, first, rest, index) => {
				if (first === "\\") {
					backslashes = true;
					return m$1;
				}
				if (first === "?") {
					if (esc) return esc + first + (rest ? QMARK$1.repeat(rest.length) : "");
					if (index === 0) return qmarkNoDot + (rest ? QMARK$1.repeat(rest.length) : "");
					return QMARK$1.repeat(chars.length);
				}
				if (first === ".") return DOT_LITERAL$1.repeat(chars.length);
				if (first === "*") {
					if (esc) return esc + first + (rest ? star : "");
					return star;
				}
				return esc ? m$1 : `\\${m$1}`;
			});
			if (backslashes === true) if (opts.unescape === true) output = output.replace(/\\/g, "");
			else output = output.replace(/\\+/g, (m$1) => {
				return m$1.length % 2 === 0 ? "\\\\" : m$1 ? "\\" : "";
			});
			if (output === input && opts.contains === true) {
				state.output = input;
				return state;
			}
			state.output = utils$2.wrapOutput(output, state, options);
			return state;
		}
		/**
		* Tokenize input until we reach end-of-string
		*/
		while (!eos()) {
			value = advance();
			if (value === "\0") continue;
			/**
			* Escaped characters
			*/
			if (value === "\\") {
				const next = peek();
				if (next === "/" && opts.bash !== true) continue;
				if (next === "." || next === ";") continue;
				if (!next) {
					value += "\\";
					push({
						type: "text",
						value
					});
					continue;
				}
				const match = /^\\+/.exec(remaining());
				let slashes = 0;
				if (match && match[0].length > 2) {
					slashes = match[0].length;
					state.index += slashes;
					if (slashes % 2 !== 0) value += "\\";
				}
				if (opts.unescape === true) value = advance();
				else value += advance();
				if (state.brackets === 0) {
					push({
						type: "text",
						value
					});
					continue;
				}
			}
			/**
			* If we're inside a regex character class, continue
			* until we reach the closing bracket.
			*/
			if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
				if (opts.posix !== false && value === ":") {
					const inner = prev.value.slice(1);
					if (inner.includes("[")) {
						prev.posix = true;
						if (inner.includes(":")) {
							const idx = prev.value.lastIndexOf("[");
							const pre = prev.value.slice(0, idx);
							const rest$1 = prev.value.slice(idx + 2);
							const posix$1 = POSIX_REGEX_SOURCE[rest$1];
							if (posix$1) {
								prev.value = pre + posix$1;
								state.backtrack = true;
								advance();
								if (!bos.output && tokens.indexOf(prev) === 1) bos.output = ONE_CHAR$1;
								continue;
							}
						}
					}
				}
				if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") value = `\\${value}`;
				if (value === "]" && (prev.value === "[" || prev.value === "[^")) value = `\\${value}`;
				if (opts.posix === true && value === "!" && prev.value === "[") value = "^";
				prev.value += value;
				append({ value });
				continue;
			}
			/**
			* If we're inside a quoted string, continue
			* until we reach the closing double quote.
			*/
			if (state.quotes === 1 && value !== "\"") {
				value = utils$2.escapeRegex(value);
				prev.value += value;
				append({ value });
				continue;
			}
			/**
			* Double quotes
			*/
			if (value === "\"") {
				state.quotes = state.quotes === 1 ? 0 : 1;
				if (opts.keepQuotes === true) push({
					type: "text",
					value
				});
				continue;
			}
			/**
			* Parentheses
			*/
			if (value === "(") {
				increment("parens");
				push({
					type: "paren",
					value
				});
				continue;
			}
			if (value === ")") {
				if (state.parens === 0 && opts.strictBrackets === true) throw new SyntaxError(syntaxError("opening", "("));
				const extglob = extglobs[extglobs.length - 1];
				if (extglob && state.parens === extglob.parens + 1) {
					extglobClose(extglobs.pop());
					continue;
				}
				push({
					type: "paren",
					value,
					output: state.parens ? ")" : "\\)"
				});
				decrement("parens");
				continue;
			}
			/**
			* Square brackets
			*/
			if (value === "[") {
				if (opts.nobracket === true || !remaining().includes("]")) {
					if (opts.nobracket !== true && opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
					value = `\\${value}`;
				} else increment("brackets");
				push({
					type: "bracket",
					value
				});
				continue;
			}
			if (value === "]") {
				if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
					push({
						type: "text",
						value,
						output: `\\${value}`
					});
					continue;
				}
				if (state.brackets === 0) {
					if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("opening", "["));
					push({
						type: "text",
						value,
						output: `\\${value}`
					});
					continue;
				}
				decrement("brackets");
				const prevValue = prev.value.slice(1);
				if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) value = `/${value}`;
				prev.value += value;
				append({ value });
				if (opts.literalBrackets === false || utils$2.hasRegexChars(prevValue)) continue;
				const escaped = utils$2.escapeRegex(prev.value);
				state.output = state.output.slice(0, -prev.value.length);
				if (opts.literalBrackets === true) {
					state.output += escaped;
					prev.value = escaped;
					continue;
				}
				prev.value = `(${capture}${escaped}|${prev.value})`;
				state.output += prev.value;
				continue;
			}
			/**
			* Braces
			*/
			if (value === "{" && opts.nobrace !== true) {
				increment("braces");
				const open = {
					type: "brace",
					value,
					output: "(",
					outputIndex: state.output.length,
					tokensIndex: state.tokens.length
				};
				braces.push(open);
				push(open);
				continue;
			}
			if (value === "}") {
				const brace = braces[braces.length - 1];
				if (opts.nobrace === true || !brace) {
					push({
						type: "text",
						value,
						output: value
					});
					continue;
				}
				let output = ")";
				if (brace.dots === true) {
					const arr = tokens.slice();
					const range = [];
					for (let i = arr.length - 1; i >= 0; i--) {
						tokens.pop();
						if (arr[i].type === "brace") break;
						if (arr[i].type !== "dots") range.unshift(arr[i].value);
					}
					output = expandRange(range, opts);
					state.backtrack = true;
				}
				if (brace.comma !== true && brace.dots !== true) {
					const out = state.output.slice(0, brace.outputIndex);
					const toks = state.tokens.slice(brace.tokensIndex);
					brace.value = brace.output = "\\{";
					value = output = "\\}";
					state.output = out;
					for (const t of toks) state.output += t.output || t.value;
				}
				push({
					type: "brace",
					value,
					output
				});
				decrement("braces");
				braces.pop();
				continue;
			}
			/**
			* Pipes
			*/
			if (value === "|") {
				if (extglobs.length > 0) extglobs[extglobs.length - 1].conditions++;
				push({
					type: "text",
					value
				});
				continue;
			}
			/**
			* Commas
			*/
			if (value === ",") {
				let output = value;
				const brace = braces[braces.length - 1];
				if (brace && stack[stack.length - 1] === "braces") {
					brace.comma = true;
					output = "|";
				}
				push({
					type: "comma",
					value,
					output
				});
				continue;
			}
			/**
			* Slashes
			*/
			if (value === "/") {
				if (prev.type === "dot" && state.index === state.start + 1) {
					state.start = state.index + 1;
					state.consumed = "";
					state.output = "";
					tokens.pop();
					prev = bos;
					continue;
				}
				push({
					type: "slash",
					value,
					output: SLASH_LITERAL$1
				});
				continue;
			}
			/**
			* Dots
			*/
			if (value === ".") {
				if (state.braces > 0 && prev.type === "dot") {
					if (prev.value === ".") prev.output = DOT_LITERAL$1;
					const brace = braces[braces.length - 1];
					prev.type = "dots";
					prev.output += value;
					prev.value += value;
					brace.dots = true;
					continue;
				}
				if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
					push({
						type: "text",
						value,
						output: DOT_LITERAL$1
					});
					continue;
				}
				push({
					type: "dot",
					value,
					output: DOT_LITERAL$1
				});
				continue;
			}
			/**
			* Question marks
			*/
			if (value === "?") {
				const isGroup = prev && prev.value === "(";
				if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
					extglobOpen("qmark", value);
					continue;
				}
				if (prev && prev.type === "paren") {
					const next = peek();
					let output = value;
					if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) output = `\\${value}`;
					push({
						type: "text",
						value,
						output
					});
					continue;
				}
				if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
					push({
						type: "qmark",
						value,
						output: QMARK_NO_DOT$1
					});
					continue;
				}
				push({
					type: "qmark",
					value,
					output: QMARK$1
				});
				continue;
			}
			/**
			* Exclamation
			*/
			if (value === "!") {
				if (opts.noextglob !== true && peek() === "(") {
					if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
						extglobOpen("negate", value);
						continue;
					}
				}
				if (opts.nonegate !== true && state.index === 0) {
					negate();
					continue;
				}
			}
			/**
			* Plus
			*/
			if (value === "+") {
				if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
					extglobOpen("plus", value);
					continue;
				}
				if (prev && prev.value === "(" || opts.regex === false) {
					push({
						type: "plus",
						value,
						output: PLUS_LITERAL$1
					});
					continue;
				}
				if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
					push({
						type: "plus",
						value
					});
					continue;
				}
				push({
					type: "plus",
					value: PLUS_LITERAL$1
				});
				continue;
			}
			/**
			* Plain text
			*/
			if (value === "@") {
				if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
					push({
						type: "at",
						extglob: true,
						value,
						output: ""
					});
					continue;
				}
				push({
					type: "text",
					value
				});
				continue;
			}
			/**
			* Plain text
			*/
			if (value !== "*") {
				if (value === "$" || value === "^") value = `\\${value}`;
				const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
				if (match) {
					value += match[0];
					state.index += match[0].length;
				}
				push({
					type: "text",
					value
				});
				continue;
			}
			/**
			* Stars
			*/
			if (prev && (prev.type === "globstar" || prev.star === true)) {
				prev.type = "star";
				prev.star = true;
				prev.value += value;
				prev.output = star;
				state.backtrack = true;
				state.globstar = true;
				consume(value);
				continue;
			}
			let rest = remaining();
			if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
				extglobOpen("star", value);
				continue;
			}
			if (prev.type === "star") {
				if (opts.noglobstar === true) {
					consume(value);
					continue;
				}
				const prior = prev.prev;
				const before = prior.prev;
				const isStart = prior.type === "slash" || prior.type === "bos";
				const afterStar = before && (before.type === "star" || before.type === "globstar");
				if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
					push({
						type: "star",
						value,
						output: ""
					});
					continue;
				}
				const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
				const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
				if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
					push({
						type: "star",
						value,
						output: ""
					});
					continue;
				}
				while (rest.slice(0, 3) === "/**") {
					const after = input[state.index + 4];
					if (after && after !== "/") break;
					rest = rest.slice(3);
					consume("/**", 3);
				}
				if (prior.type === "bos" && eos()) {
					prev.type = "globstar";
					prev.value += value;
					prev.output = globstar(opts);
					state.output = prev.output;
					state.globstar = true;
					consume(value);
					continue;
				}
				if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
					state.output = state.output.slice(0, -(prior.output + prev.output).length);
					prior.output = `(?:${prior.output}`;
					prev.type = "globstar";
					prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
					prev.value += value;
					state.globstar = true;
					state.output += prior.output + prev.output;
					consume(value);
					continue;
				}
				if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
					const end = rest[1] !== void 0 ? "|$" : "";
					state.output = state.output.slice(0, -(prior.output + prev.output).length);
					prior.output = `(?:${prior.output}`;
					prev.type = "globstar";
					prev.output = `${globstar(opts)}${SLASH_LITERAL$1}|${SLASH_LITERAL$1}${end})`;
					prev.value += value;
					state.output += prior.output + prev.output;
					state.globstar = true;
					consume(value + advance());
					push({
						type: "slash",
						value: "/",
						output: ""
					});
					continue;
				}
				if (prior.type === "bos" && rest[0] === "/") {
					prev.type = "globstar";
					prev.value += value;
					prev.output = `(?:^|${SLASH_LITERAL$1}|${globstar(opts)}${SLASH_LITERAL$1})`;
					state.output = prev.output;
					state.globstar = true;
					consume(value + advance());
					push({
						type: "slash",
						value: "/",
						output: ""
					});
					continue;
				}
				state.output = state.output.slice(0, -prev.output.length);
				prev.type = "globstar";
				prev.output = globstar(opts);
				prev.value += value;
				state.output += prev.output;
				state.globstar = true;
				consume(value);
				continue;
			}
			const token = {
				type: "star",
				value,
				output: star
			};
			if (opts.bash === true) {
				token.output = ".*?";
				if (prev.type === "bos" || prev.type === "slash") token.output = nodot + token.output;
				push(token);
				continue;
			}
			if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
				token.output = value;
				push(token);
				continue;
			}
			if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
				if (prev.type === "dot") {
					state.output += NO_DOT_SLASH$1;
					prev.output += NO_DOT_SLASH$1;
				} else if (opts.dot === true) {
					state.output += NO_DOTS_SLASH$1;
					prev.output += NO_DOTS_SLASH$1;
				} else {
					state.output += nodot;
					prev.output += nodot;
				}
				if (peek() !== "*") {
					state.output += ONE_CHAR$1;
					prev.output += ONE_CHAR$1;
				}
			}
			push(token);
		}
		while (state.brackets > 0) {
			if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
			state.output = utils$2.escapeLast(state.output, "[");
			decrement("brackets");
		}
		while (state.parens > 0) {
			if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
			state.output = utils$2.escapeLast(state.output, "(");
			decrement("parens");
		}
		while (state.braces > 0) {
			if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
			state.output = utils$2.escapeLast(state.output, "{");
			decrement("braces");
		}
		if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) push({
			type: "maybe_slash",
			value: "",
			output: `${SLASH_LITERAL$1}?`
		});
		if (state.backtrack === true) {
			state.output = "";
			for (const token of state.tokens) {
				state.output += token.output != null ? token.output : token.value;
				if (token.suffix) state.output += token.suffix;
			}
		}
		return state;
	};
	/**
	* Fast paths for creating regular expressions for common glob patterns.
	* This can significantly speed up processing and has very little downside
	* impact when none of the fast paths match.
	*/
	parse$1.fastpaths = (input, options) => {
		const opts = { ...options };
		const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
		const len = input.length;
		if (len > max) throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
		input = REPLACEMENTS[input] || input;
		const { DOT_LITERAL: DOT_LITERAL$1, SLASH_LITERAL: SLASH_LITERAL$1, ONE_CHAR: ONE_CHAR$1, DOTS_SLASH: DOTS_SLASH$1, NO_DOT: NO_DOT$1, NO_DOTS: NO_DOTS$1, NO_DOTS_SLASH: NO_DOTS_SLASH$1, STAR: STAR$1, START_ANCHOR: START_ANCHOR$1 } = constants$1.globChars(opts.windows);
		const nodot = opts.dot ? NO_DOTS$1 : NO_DOT$1;
		const slashDot = opts.dot ? NO_DOTS_SLASH$1 : NO_DOT$1;
		const capture = opts.capture ? "" : "?:";
		const state = {
			negated: false,
			prefix: ""
		};
		let star = opts.bash === true ? ".*?" : STAR$1;
		if (opts.capture) star = `(${star})`;
		const globstar = (opts$1) => {
			if (opts$1.noglobstar === true) return star;
			return `(${capture}(?:(?!${START_ANCHOR$1}${opts$1.dot ? DOTS_SLASH$1 : DOT_LITERAL$1}).)*?)`;
		};
		const create = (str) => {
			switch (str) {
				case "*": return `${nodot}${ONE_CHAR$1}${star}`;
				case ".*": return `${DOT_LITERAL$1}${ONE_CHAR$1}${star}`;
				case "*.*": return `${nodot}${star}${DOT_LITERAL$1}${ONE_CHAR$1}${star}`;
				case "*/*": return `${nodot}${star}${SLASH_LITERAL$1}${ONE_CHAR$1}${slashDot}${star}`;
				case "**": return nodot + globstar(opts);
				case "**/*": return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL$1})?${slashDot}${ONE_CHAR$1}${star}`;
				case "**/*.*": return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL$1})?${slashDot}${star}${DOT_LITERAL$1}${ONE_CHAR$1}${star}`;
				case "**/.*": return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL$1})?${DOT_LITERAL$1}${ONE_CHAR$1}${star}`;
				default: {
					const match = /^(.*?)\.(\w+)$/.exec(str);
					if (!match) return;
					const source$1 = create(match[1]);
					if (!source$1) return;
					return source$1 + DOT_LITERAL$1 + match[2];
				}
			}
		};
		const output = utils$2.removePrefix(input, state);
		let source = create(output);
		if (source && opts.strictSlashes !== true) source += `${SLASH_LITERAL$1}?`;
		return source;
	};
	module.exports = parse$1;
});
var require_picomatch$1 = __commonJSMin((exports, module) => {
	const scan = require_scan();
	const parse = require_parse();
	const utils$1 = require_utils();
	const constants = require_constants();
	const isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
	/**
	* Creates a matcher function from one or more glob patterns. The
	* returned function takes a string to match as its first argument,
	* and returns true if the string is a match. The returned matcher
	* function also takes a boolean as the second argument that, when true,
	* returns an object with additional information.
	*
	* ```js
	* const picomatch = require('picomatch');
	* // picomatch(glob[, options]);
	*
	* const isMatch = picomatch('*.!(*a)');
	* console.log(isMatch('a.a')); //=> false
	* console.log(isMatch('a.b')); //=> true
	* ```
	* @name picomatch
	* @param {String|Array} `globs` One or more glob patterns.
	* @param {Object=} `options`
	* @return {Function=} Returns a matcher function.
	* @api public
	*/
	const picomatch$2 = (glob$1, options, returnState = false) => {
		if (Array.isArray(glob$1)) {
			const fns = glob$1.map((input) => picomatch$2(input, options, returnState));
			const arrayMatcher = (str) => {
				for (const isMatch of fns) {
					const state$1 = isMatch(str);
					if (state$1) return state$1;
				}
				return false;
			};
			return arrayMatcher;
		}
		const isState = isObject(glob$1) && glob$1.tokens && glob$1.input;
		if (glob$1 === "" || typeof glob$1 !== "string" && !isState) throw new TypeError("Expected pattern to be a non-empty string");
		const opts = options || {};
		const posix$1 = opts.windows;
		const regex = isState ? picomatch$2.compileRe(glob$1, options) : picomatch$2.makeRe(glob$1, options, false, true);
		const state = regex.state;
		delete regex.state;
		let isIgnored = () => false;
		if (opts.ignore) {
			const ignoreOpts = {
				...options,
				ignore: null,
				onMatch: null,
				onResult: null
			};
			isIgnored = picomatch$2(opts.ignore, ignoreOpts, returnState);
		}
		const matcher = (input, returnObject = false) => {
			const { isMatch, match, output } = picomatch$2.test(input, regex, options, {
				glob: glob$1,
				posix: posix$1
			});
			const result = {
				glob: glob$1,
				state,
				regex,
				posix: posix$1,
				input,
				output,
				match,
				isMatch
			};
			if (typeof opts.onResult === "function") opts.onResult(result);
			if (isMatch === false) {
				result.isMatch = false;
				return returnObject ? result : false;
			}
			if (isIgnored(input)) {
				if (typeof opts.onIgnore === "function") opts.onIgnore(result);
				result.isMatch = false;
				return returnObject ? result : false;
			}
			if (typeof opts.onMatch === "function") opts.onMatch(result);
			return returnObject ? result : true;
		};
		if (returnState) matcher.state = state;
		return matcher;
	};
	/**
	* Test `input` with the given `regex`. This is used by the main
	* `picomatch()` function to test the input string.
	*
	* ```js
	* const picomatch = require('picomatch');
	* // picomatch.test(input, regex[, options]);
	*
	* console.log(picomatch.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
	* // { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
	* ```
	* @param {String} `input` String to test.
	* @param {RegExp} `regex`
	* @return {Object} Returns an object with matching info.
	* @api public
	*/
	picomatch$2.test = (input, regex, options, { glob: glob$1, posix: posix$1 } = {}) => {
		if (typeof input !== "string") throw new TypeError("Expected input to be a string");
		if (input === "") return {
			isMatch: false,
			output: ""
		};
		const opts = options || {};
		const format = opts.format || (posix$1 ? utils$1.toPosixSlashes : null);
		let match = input === glob$1;
		let output = match && format ? format(input) : input;
		if (match === false) {
			output = format ? format(input) : input;
			match = output === glob$1;
		}
		if (match === false || opts.capture === true) if (opts.matchBase === true || opts.basename === true) match = picomatch$2.matchBase(input, regex, options, posix$1);
		else match = regex.exec(output);
		return {
			isMatch: Boolean(match),
			match,
			output
		};
	};
	/**
	* Match the basename of a filepath.
	*
	* ```js
	* const picomatch = require('picomatch');
	* // picomatch.matchBase(input, glob[, options]);
	* console.log(picomatch.matchBase('foo/bar.js', '*.js'); // true
	* ```
	* @param {String} `input` String to test.
	* @param {RegExp|String} `glob` Glob pattern or regex created by [.makeRe](#makeRe).
	* @return {Boolean}
	* @api public
	*/
	picomatch$2.matchBase = (input, glob$1, options) => {
		const regex = glob$1 instanceof RegExp ? glob$1 : picomatch$2.makeRe(glob$1, options);
		return regex.test(utils$1.basename(input));
	};
	/**
	* Returns true if **any** of the given glob `patterns` match the specified `string`.
	*
	* ```js
	* const picomatch = require('picomatch');
	* // picomatch.isMatch(string, patterns[, options]);
	*
	* console.log(picomatch.isMatch('a.a', ['b.*', '*.a'])); //=> true
	* console.log(picomatch.isMatch('a.a', 'b.*')); //=> false
	* ```
	* @param {String|Array} str The string to test.
	* @param {String|Array} patterns One or more glob patterns to use for matching.
	* @param {Object} [options] See available [options](#options).
	* @return {Boolean} Returns true if any patterns match `str`
	* @api public
	*/
	picomatch$2.isMatch = (str, patterns, options) => picomatch$2(patterns, options)(str);
	/**
	* Parse a glob pattern to create the source string for a regular
	* expression.
	*
	* ```js
	* const picomatch = require('picomatch');
	* const result = picomatch.parse(pattern[, options]);
	* ```
	* @param {String} `pattern`
	* @param {Object} `options`
	* @return {Object} Returns an object with useful properties and output to be used as a regex source string.
	* @api public
	*/
	picomatch$2.parse = (pattern, options) => {
		if (Array.isArray(pattern)) return pattern.map((p) => picomatch$2.parse(p, options));
		return parse(pattern, {
			...options,
			fastpaths: false
		});
	};
	/**
	* Scan a glob pattern to separate the pattern into segments.
	*
	* ```js
	* const picomatch = require('picomatch');
	* // picomatch.scan(input[, options]);
	*
	* const result = picomatch.scan('!./foo/*.js');
	* console.log(result);
	* { prefix: '!./',
	*   input: '!./foo/*.js',
	*   start: 3,
	*   base: 'foo',
	*   glob: '*.js',
	*   isBrace: false,
	*   isBracket: false,
	*   isGlob: true,
	*   isExtglob: false,
	*   isGlobstar: false,
	*   negated: true }
	* ```
	* @param {String} `input` Glob pattern to scan.
	* @param {Object} `options`
	* @return {Object} Returns an object with
	* @api public
	*/
	picomatch$2.scan = (input, options) => scan(input, options);
	/**
	* Compile a regular expression from the `state` object returned by the
	* [parse()](#parse) method.
	*
	* @param {Object} `state`
	* @param {Object} `options`
	* @param {Boolean} `returnOutput` Intended for implementors, this argument allows you to return the raw output from the parser.
	* @param {Boolean} `returnState` Adds the state to a `state` property on the returned regex. Useful for implementors and debugging.
	* @return {RegExp}
	* @api public
	*/
	picomatch$2.compileRe = (state, options, returnOutput = false, returnState = false) => {
		if (returnOutput === true) return state.output;
		const opts = options || {};
		const prepend = opts.contains ? "" : "^";
		const append = opts.contains ? "" : "$";
		let source = `${prepend}(?:${state.output})${append}`;
		if (state && state.negated === true) source = `^(?!${source}).*$`;
		const regex = picomatch$2.toRegex(source, options);
		if (returnState === true) regex.state = state;
		return regex;
	};
	/**
	* Create a regular expression from a parsed glob pattern.
	*
	* ```js
	* const picomatch = require('picomatch');
	* const state = picomatch.parse('*.js');
	* // picomatch.compileRe(state[, options]);
	*
	* console.log(picomatch.compileRe(state));
	* //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
	* ```
	* @param {String} `state` The object returned from the `.parse` method.
	* @param {Object} `options`
	* @param {Boolean} `returnOutput` Implementors may use this argument to return the compiled output, instead of a regular expression. This is not exposed on the options to prevent end-users from mutating the result.
	* @param {Boolean} `returnState` Implementors may use this argument to return the state from the parsed glob with the returned regular expression.
	* @return {RegExp} Returns a regex created from the given pattern.
	* @api public
	*/
	picomatch$2.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
		if (!input || typeof input !== "string") throw new TypeError("Expected a non-empty string");
		let parsed = {
			negated: false,
			fastpaths: true
		};
		if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) parsed.output = parse.fastpaths(input, options);
		if (!parsed.output) parsed = parse(input, options);
		return picomatch$2.compileRe(parsed, options, returnOutput, returnState);
	};
	/**
	* Create a regular expression from the given regex source string.
	*
	* ```js
	* const picomatch = require('picomatch');
	* // picomatch.toRegex(source[, options]);
	*
	* const { output } = picomatch.parse('*.js');
	* console.log(picomatch.toRegex(output));
	* //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
	* ```
	* @param {String} `source` Regular expression source string.
	* @param {Object} `options`
	* @return {RegExp}
	* @api public
	*/
	picomatch$2.toRegex = (source, options) => {
		try {
			const opts = options || {};
			return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
		} catch (err) {
			if (options && options.debug === true) throw err;
			return /$^/;
		}
	};
	/**
	* Picomatch constants.
	* @return {Object}
	*/
	picomatch$2.constants = constants;
	/**
	* Expose "picomatch"
	*/
	module.exports = picomatch$2;
});
var require_picomatch = __commonJSMin((exports, module) => {
	const pico = require_picomatch$1();
	const utils = require_utils();
	function picomatch$1(glob$1, options, returnState = false) {
		if (options && (options.windows === null || options.windows === void 0)) options = {
			...options,
			windows: utils.isWindows()
		};
		return pico(glob$1, options, returnState);
	}
	Object.assign(picomatch$1, pico);
	module.exports = picomatch$1;
});
var require_builder = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Builder = void 0;
	const path_1 = __require("node:path");
	const api_builder_1 = require_api_builder();
	var pm = null;
	/* c8 ignore next 6 */
	try {
		__require.resolve("picomatch");
		pm = require_picomatch();
	} catch (_e) {}
	var Builder = class {
		globCache = {};
		options = {
			maxDepth: Infinity,
			suppressErrors: true,
			pathSeparator: path_1.sep,
			filters: []
		};
		globFunction;
		constructor(options) {
			this.options = {
				...this.options,
				...options
			};
			this.globFunction = this.options.globFunction;
		}
		group() {
			this.options.group = true;
			return this;
		}
		withPathSeparator(separator) {
			this.options.pathSeparator = separator;
			return this;
		}
		withBasePath() {
			this.options.includeBasePath = true;
			return this;
		}
		withRelativePaths() {
			this.options.relativePaths = true;
			return this;
		}
		withDirs() {
			this.options.includeDirs = true;
			return this;
		}
		withMaxDepth(depth$1) {
			this.options.maxDepth = depth$1;
			return this;
		}
		withMaxFiles(limit) {
			this.options.maxFiles = limit;
			return this;
		}
		withFullPaths() {
			this.options.resolvePaths = true;
			this.options.includeBasePath = true;
			return this;
		}
		withErrors() {
			this.options.suppressErrors = false;
			return this;
		}
		withSymlinks({ resolvePaths = true } = {}) {
			this.options.resolveSymlinks = true;
			this.options.useRealPaths = resolvePaths;
			return this.withFullPaths();
		}
		withAbortSignal(signal) {
			this.options.signal = signal;
			return this;
		}
		normalize() {
			this.options.normalizePath = true;
			return this;
		}
		filter(predicate) {
			this.options.filters.push(predicate);
			return this;
		}
		onlyDirs() {
			this.options.excludeFiles = true;
			this.options.includeDirs = true;
			return this;
		}
		exclude(predicate) {
			this.options.exclude = predicate;
			return this;
		}
		onlyCounts() {
			this.options.onlyCounts = true;
			return this;
		}
		crawl(root) {
			return new api_builder_1.APIBuilder(root || ".", this.options);
		}
		withGlobFunction(fn) {
			this.globFunction = fn;
			return this;
		}
		/**
		* @deprecated Pass options using the constructor instead:
		* ```ts
		* new fdir(options).crawl("/path/to/root");
		* ```
		* This method will be removed in v7.0
		*/
		/* c8 ignore next 4 */
		crawlWithOptions(root, options) {
			this.options = {
				...this.options,
				...options
			};
			return new api_builder_1.APIBuilder(root || ".", this.options);
		}
		glob(...patterns) {
			if (this.globFunction) return this.globWithOptions(patterns);
			return this.globWithOptions(patterns, ...[{ dot: true }]);
		}
		globWithOptions(patterns, ...options) {
			const globFn = this.globFunction || pm;
			/* c8 ignore next 5 */
			if (!globFn) throw new Error("Please specify a glob function to use glob matching.");
			var isMatch = this.globCache[patterns.join("\0")];
			if (!isMatch) {
				isMatch = globFn(patterns, ...options);
				this.globCache[patterns.join("\0")] = isMatch;
			}
			this.options.filters.push((path$1) => isMatch(path$1));
			return this;
		}
	};
	exports.Builder = Builder;
});
var require_types = __commonJSMin((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
});
var require_dist = __commonJSMin((exports) => {
	var __createBinding = Object.create ? function(o, m$1, k$1, k2) {
		if (k2 === void 0) k2 = k$1;
		var desc = Object.getOwnPropertyDescriptor(m$1, k$1);
		if (!desc || ("get" in desc ? !m$1.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m$1[k$1];
			}
		};
		Object.defineProperty(o, k2, desc);
	} : function(o, m$1, k$1, k2) {
		if (k2 === void 0) k2 = k$1;
		o[k2] = m$1[k$1];
	};
	var __exportStar = function(m$1, exports$1) {
		for (var p in m$1) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m$1, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.fdir = void 0;
	const builder_1 = require_builder();
	Object.defineProperty(exports, "fdir", {
		enumerable: true,
		get: function() {
			return builder_1.Builder;
		}
	});
	__exportStar(require_types(), exports);
});
var import_dist = __toESM(require_dist(), 1);
var import_picomatch = __toESM(require_picomatch(), 1);
const ONLY_PARENT_DIRECTORIES = /^(\/?\.\.)+$/;
function getPartialMatcher(patterns, options) {
	const patternsCount = patterns.length;
	const patternsParts = Array(patternsCount);
	const regexes = Array(patternsCount);
	for (let i = 0; i < patternsCount; i++) {
		const parts = splitPattern(patterns[i]);
		patternsParts[i] = parts;
		const partsCount = parts.length;
		const partRegexes = Array(partsCount);
		for (let j$1 = 0; j$1 < partsCount; j$1++) partRegexes[j$1] = import_picomatch.default.makeRe(parts[j$1], options);
		regexes[i] = partRegexes;
	}
	return (input) => {
		const inputParts = input.split("/");
		if (inputParts[0] === ".." && ONLY_PARENT_DIRECTORIES.test(input)) return true;
		for (let i = 0; i < patterns.length; i++) {
			const patternParts = patternsParts[i];
			const regex = regexes[i];
			const inputPatternCount = inputParts.length;
			const minParts = Math.min(inputPatternCount, patternParts.length);
			let j$1 = 0;
			while (j$1 < minParts) {
				const part = patternParts[j$1];
				if (part.includes("/")) return true;
				const match = regex[j$1].test(inputParts[j$1]);
				if (!match) break;
				if (part === "**") return true;
				j$1++;
			}
			if (j$1 === inputPatternCount) return true;
		}
		return false;
	};
}
const splitPatternOptions = { parts: true };
function splitPattern(path$1) {
	var _result$parts;
	const result = import_picomatch.default.scan(path$1, splitPatternOptions);
	return ((_result$parts = result.parts) === null || _result$parts === void 0 ? void 0 : _result$parts.length) ? result.parts : [path$1];
}
const isWin = process.platform === "win32";
const POSIX_UNESCAPED_GLOB_SYMBOLS = /(?<!\\)([()[\]{}*?|]|^!|[!+@](?=\()|\\(?![()[\]{}!*+?@|]))/g;
const WIN32_UNESCAPED_GLOB_SYMBOLS = /(?<!\\)([()[\]{}]|^!|[!+@](?=\())/g;
const escapePosixPath = (path$1) => path$1.replace(POSIX_UNESCAPED_GLOB_SYMBOLS, "\\$&");
const escapeWin32Path = (path$1) => path$1.replace(WIN32_UNESCAPED_GLOB_SYMBOLS, "\\$&");
const escapePath = isWin ? escapeWin32Path : escapePosixPath;
function isDynamicPattern(pattern, options) {
	if ((options === null || options === void 0 ? void 0 : options.caseSensitiveMatch) === false) return true;
	const scan$2 = import_picomatch.default.scan(pattern);
	return scan$2.isGlob || scan$2.negated;
}
function log(...tasks) {
	console.log(`[tinyglobby ${(/* @__PURE__ */ new Date()).toLocaleTimeString("es")}]`, ...tasks);
}
const PARENT_DIRECTORY = /^(\/?\.\.)+/;
const ESCAPING_BACKSLASHES = /\\(?=[()[\]{}!*+?@|])/g;
const BACKSLASHES = /\\/g;
function normalizePattern(pattern, expandDirectories, cwd, props, isIgnore) {
	let result = pattern;
	if (pattern.endsWith("/")) result = pattern.slice(0, -1);
	if (!result.endsWith("*") && expandDirectories) result += "/**";
	const escapedCwd = escapePath(cwd);
	if (path.isAbsolute(result.replace(ESCAPING_BACKSLASHES, ""))) result = posix.relative(escapedCwd, result);
	else result = posix.normalize(result);
	const parentDirectoryMatch = PARENT_DIRECTORY.exec(result);
	const parts = splitPattern(result);
	if (parentDirectoryMatch === null || parentDirectoryMatch === void 0 ? void 0 : parentDirectoryMatch[0]) {
		const n$1 = (parentDirectoryMatch[0].length + 1) / 3;
		let i = 0;
		const cwdParts = escapedCwd.split("/");
		while (i < n$1 && parts[i + n$1] === cwdParts[cwdParts.length + i - n$1]) {
			result = result.slice(0, (n$1 - i - 1) * 3) + result.slice((n$1 - i) * 3 + parts[i + n$1].length + 1) || ".";
			i++;
		}
		const potentialRoot = posix.join(cwd, parentDirectoryMatch[0].slice(i * 3));
		if (!potentialRoot.startsWith(".") && props.root.length > potentialRoot.length) {
			props.root = potentialRoot;
			props.depthOffset = -n$1 + i;
		}
	}
	if (!isIgnore && props.depthOffset >= 0) {
		var _props$commonPath;
		(_props$commonPath = props.commonPath) !== null && _props$commonPath !== void 0 || (props.commonPath = parts);
		const newCommonPath = [];
		const length = Math.min(props.commonPath.length, parts.length);
		for (let i = 0; i < length; i++) {
			const part = parts[i];
			if (part === "**" && !parts[i + 1]) {
				newCommonPath.pop();
				break;
			}
			if (part !== props.commonPath[i] || isDynamicPattern(part) || i === parts.length - 1) break;
			newCommonPath.push(part);
		}
		props.depthOffset = newCommonPath.length;
		props.commonPath = newCommonPath;
		props.root = newCommonPath.length > 0 ? path.posix.join(cwd, ...newCommonPath) : cwd;
	}
	return result;
}
function processPatterns({ patterns, ignore = [], expandDirectories = true }, cwd, props) {
	if (typeof patterns === "string") patterns = [patterns];
	else if (!patterns) patterns = ["**/*"];
	if (typeof ignore === "string") ignore = [ignore];
	const matchPatterns = [];
	const ignorePatterns = [];
	for (const pattern of ignore) {
		if (!pattern) continue;
		if (pattern[0] !== "!" || pattern[1] === "(") ignorePatterns.push(normalizePattern(pattern, expandDirectories, cwd, props, true));
	}
	for (const pattern of patterns) {
		if (!pattern) continue;
		if (pattern[0] !== "!" || pattern[1] === "(") matchPatterns.push(normalizePattern(pattern, expandDirectories, cwd, props, false));
		else if (pattern[1] !== "!" || pattern[2] === "(") ignorePatterns.push(normalizePattern(pattern.slice(1), expandDirectories, cwd, props, true));
	}
	return {
		match: matchPatterns,
		ignore: ignorePatterns
	};
}
function getRelativePath(path$1, cwd, root) {
	return posix.relative(cwd, `${root}/${path$1}`) || ".";
}
function processPath(path$1, cwd, root, isDirectory$1, absolute) {
	const relativePath = absolute ? path$1.slice(root === "/" ? 1 : root.length + 1) || "." : path$1;
	if (root === cwd) return isDirectory$1 && relativePath !== "." ? relativePath.slice(0, -1) : relativePath;
	return getRelativePath(relativePath, cwd, root);
}
function formatPaths(paths, cwd, root) {
	for (let i = paths.length - 1; i >= 0; i--) {
		const path$1 = paths[i];
		paths[i] = getRelativePath(path$1, cwd, root) + (!path$1 || path$1.endsWith("/") ? "/" : "");
	}
	return paths;
}
function crawl(options, cwd, sync$1) {
	if (process.env.TINYGLOBBY_DEBUG) options.debug = true;
	if (options.debug) log("globbing with options:", options, "cwd:", cwd);
	if (Array.isArray(options.patterns) && options.patterns.length === 0) return sync$1 ? [] : Promise.resolve([]);
	const props = {
		root: cwd,
		commonPath: null,
		depthOffset: 0
	};
	const processed = processPatterns(options, cwd, props);
	const nocase = options.caseSensitiveMatch === false;
	if (options.debug) log("internal processing patterns:", processed);
	const matcher = (0, import_picomatch.default)(processed.match, {
		dot: options.dot,
		nocase,
		ignore: processed.ignore
	});
	const ignore = (0, import_picomatch.default)(processed.ignore, {
		dot: options.dot,
		nocase
	});
	const partialMatcher = getPartialMatcher(processed.match, {
		dot: options.dot,
		nocase
	});
	const fdirOptions = {
		filters: [options.debug ? (p, isDirectory$1) => {
			const path$1 = processPath(p, cwd, props.root, isDirectory$1, options.absolute);
			const matches = matcher(path$1);
			if (matches) log(`matched ${path$1}`);
			return matches;
		} : (p, isDirectory$1) => matcher(processPath(p, cwd, props.root, isDirectory$1, options.absolute))],
		exclude: options.debug ? (_, p) => {
			const relativePath = processPath(p, cwd, props.root, true, true);
			const skipped = relativePath !== "." && !partialMatcher(relativePath) || ignore(relativePath);
			if (skipped) log(`skipped ${p}`);
			else log(`crawling ${p}`);
			return skipped;
		} : (_, p) => {
			const relativePath = processPath(p, cwd, props.root, true, true);
			return relativePath !== "." && !partialMatcher(relativePath) || ignore(relativePath);
		},
		pathSeparator: "/",
		relativePaths: true,
		resolveSymlinks: true
	};
	if (options.deep !== void 0) fdirOptions.maxDepth = Math.round(options.deep - props.depthOffset);
	if (options.absolute) {
		fdirOptions.relativePaths = false;
		fdirOptions.resolvePaths = true;
		fdirOptions.includeBasePath = true;
	}
	if (options.followSymbolicLinks === false) {
		fdirOptions.resolveSymlinks = false;
		fdirOptions.excludeSymlinks = true;
	}
	if (options.onlyDirectories) {
		fdirOptions.excludeFiles = true;
		fdirOptions.includeDirs = true;
	} else if (options.onlyFiles === false) fdirOptions.includeDirs = true;
	props.root = props.root.replace(BACKSLASHES, "");
	const root = props.root;
	if (options.debug) log("internal properties:", props);
	const api = new import_dist.fdir(fdirOptions).crawl(root);
	if (cwd === root || options.absolute) return sync$1 ? api.sync() : api.withPromise();
	return sync$1 ? formatPaths(api.sync(), cwd, root) : api.withPromise().then((paths) => formatPaths(paths, cwd, root));
}
async function glob(patternsOrOptions, options) {
	if (patternsOrOptions && (options === null || options === void 0 ? void 0 : options.patterns)) throw new Error("Cannot pass patterns as both an argument and an option");
	const opts = Array.isArray(patternsOrOptions) || typeof patternsOrOptions === "string" ? {
		...options,
		patterns: patternsOrOptions
	} : patternsOrOptions;
	const cwd = opts.cwd ? path.resolve(opts.cwd).replace(BACKSLASHES, "/") : process.cwd().replace(BACKSLASHES, "/");
	return crawl(opts, cwd, false);
}
/**
* Default session duration in hours (Claude's billing block duration)
*/
const DEFAULT_SESSION_DURATION_HOURS = 5;
/**
* Floors a timestamp to the beginning of the hour in UTC
* @param timestamp - The timestamp to floor
* @returns New Date object floored to the UTC hour
*/
function floorToHour(timestamp) {
	const floored = new Date(timestamp);
	floored.setUTCMinutes(0, 0, 0);
	return floored;
}
/**
* Identifies and creates session blocks from usage entries
* Groups entries into time-based blocks (typically 5-hour periods) with gap detection
* @param entries - Array of usage entries to process
* @param sessionDurationHours - Duration of each session block in hours
* @returns Array of session blocks with aggregated usage data
*/
function identifySessionBlocks(entries, sessionDurationHours = DEFAULT_SESSION_DURATION_HOURS) {
	if (entries.length === 0) return [];
	const sessionDurationMs = sessionDurationHours * 60 * 60 * 1e3;
	const blocks = [];
	const sortedEntries = [...entries].sort((a$1, b$1) => a$1.timestamp.getTime() - b$1.timestamp.getTime());
	let currentBlockStart = null;
	let currentBlockEntries = [];
	const now = /* @__PURE__ */ new Date();
	for (const entry of sortedEntries) {
		const entryTime = entry.timestamp;
		if (currentBlockStart == null) {
			currentBlockStart = floorToHour(entryTime);
			currentBlockEntries = [entry];
		} else {
			const timeSinceBlockStart = entryTime.getTime() - currentBlockStart.getTime();
			const lastEntry = currentBlockEntries.at(-1);
			if (lastEntry == null) continue;
			const lastEntryTime = lastEntry.timestamp;
			const timeSinceLastEntry = entryTime.getTime() - lastEntryTime.getTime();
			if (timeSinceBlockStart > sessionDurationMs || timeSinceLastEntry > sessionDurationMs) {
				const block = createBlock(currentBlockStart, currentBlockEntries, now, sessionDurationMs);
				blocks.push(block);
				if (timeSinceLastEntry > sessionDurationMs) {
					const gapBlock = createGapBlock(lastEntryTime, entryTime, sessionDurationMs);
					if (gapBlock != null) blocks.push(gapBlock);
				}
				currentBlockStart = floorToHour(entryTime);
				currentBlockEntries = [entry];
			} else currentBlockEntries.push(entry);
		}
	}
	if (currentBlockStart != null && currentBlockEntries.length > 0) {
		const block = createBlock(currentBlockStart, currentBlockEntries, now, sessionDurationMs);
		blocks.push(block);
	}
	return blocks;
}
/**
* Creates a session block from a start time and usage entries
* @param startTime - When the block started
* @param entries - Usage entries in this block
* @param now - Current time for active block detection
* @param sessionDurationMs - Session duration in milliseconds
* @returns Session block with aggregated data
*/
function createBlock(startTime, entries, now, sessionDurationMs) {
	const endTime = new Date(startTime.getTime() + sessionDurationMs);
	const lastEntry = entries[entries.length - 1];
	const actualEndTime = lastEntry != null ? lastEntry.timestamp : startTime;
	const isActive = now.getTime() - actualEndTime.getTime() < sessionDurationMs && now < endTime;
	const tokenCounts = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationInputTokens: 0,
		cacheReadInputTokens: 0
	};
	let costUSD = 0;
	const models = [];
	const projects = [];
	const modelStats = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		tokenCounts.inputTokens += entry.usage.inputTokens;
		tokenCounts.outputTokens += entry.usage.outputTokens;
		tokenCounts.cacheCreationInputTokens += entry.usage.cacheCreationInputTokens;
		tokenCounts.cacheReadInputTokens += entry.usage.cacheReadInputTokens;
		costUSD += entry.costUSD ?? 0;
		models.push(entry.model);
		if (entry.projectPath != null) projects.push(entry.projectPath);
		const existing = modelStats.get(entry.model) ?? {
			modelName: entry.model,
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0,
			cost: 0
		};
		modelStats.set(entry.model, {
			modelName: entry.model,
			inputTokens: existing.inputTokens + entry.usage.inputTokens,
			outputTokens: existing.outputTokens + entry.usage.outputTokens,
			cacheCreationInputTokens: existing.cacheCreationInputTokens + entry.usage.cacheCreationInputTokens,
			cacheReadInputTokens: existing.cacheReadInputTokens + entry.usage.cacheReadInputTokens,
			cost: existing.cost + (entry.costUSD ?? 0)
		});
	}
	return {
		id: startTime.toISOString(),
		startTime,
		endTime,
		actualEndTime,
		isActive,
		entries,
		tokenCounts,
		costUSD,
		models: uniq(models),
		modelBreakdowns: Array.from(modelStats.values()),
		projects: uniq(projects)
	};
}
/**
* Creates a gap block representing periods with no activity
* @param lastActivityTime - Time of last activity before gap
* @param nextActivityTime - Time of next activity after gap
* @param sessionDurationMs - Session duration in milliseconds
* @returns Gap block or null if gap is too short
*/
function createGapBlock(lastActivityTime, nextActivityTime, sessionDurationMs) {
	const gapDuration = nextActivityTime.getTime() - lastActivityTime.getTime();
	if (gapDuration <= sessionDurationMs) return null;
	const gapStart = new Date(lastActivityTime.getTime() + sessionDurationMs);
	const gapEnd = nextActivityTime;
	return {
		id: `gap-${gapStart.toISOString()}`,
		startTime: gapStart,
		endTime: gapEnd,
		isActive: false,
		isGap: true,
		entries: [],
		tokenCounts: {
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0
		},
		costUSD: 0,
		models: [],
		modelBreakdowns: []
	};
}
/**
* Calculates the burn rate (tokens/minute and cost/hour) for a session block
* @param block - Session block to analyze
* @returns Burn rate calculations or null if block has no activity
*/
function calculateBurnRate(block) {
	if (block.entries.length === 0 || (block.isGap ?? false)) return null;
	const firstEntryData = block.entries[0];
	const lastEntryData = block.entries[block.entries.length - 1];
	if (firstEntryData == null || lastEntryData == null) return null;
	const firstEntry = firstEntryData.timestamp;
	const lastEntry = lastEntryData.timestamp;
	const durationMinutes = (lastEntry.getTime() - firstEntry.getTime()) / (1e3 * 60);
	if (durationMinutes <= 0) return null;
	const totalTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
	const tokensPerMinute = totalTokens / durationMinutes;
	const costPerHour = block.costUSD / durationMinutes * 60;
	return {
		tokensPerMinute,
		costPerHour
	};
}
/**
* Projects total usage for an active session block based on current burn rate
* @param block - Active session block to project
* @returns Projected usage totals or null if block is inactive or has no burn rate
*/
function projectBlockUsage(block) {
	if (!block.isActive || (block.isGap ?? false)) return null;
	const burnRate = calculateBurnRate(block);
	if (burnRate == null) return null;
	const now = /* @__PURE__ */ new Date();
	const remainingTime = block.endTime.getTime() - now.getTime();
	const remainingMinutes = Math.max(0, remainingTime / (1e3 * 60));
	const currentTokens = block.tokenCounts.inputTokens + block.tokenCounts.outputTokens;
	const projectedAdditionalTokens = burnRate.tokensPerMinute * remainingMinutes;
	const totalTokens = currentTokens + projectedAdditionalTokens;
	const projectedAdditionalCost = burnRate.costPerHour / 60 * remainingMinutes;
	const totalCost = block.costUSD + projectedAdditionalCost;
	return {
		totalTokens: Math.round(totalTokens),
		totalCost: Math.round(totalCost * 100) / 100,
		remainingMinutes: Math.round(remainingMinutes)
	};
}
/**
* Filters session blocks to include only recent ones and active blocks
* @param blocks - Array of session blocks to filter
* @param days - Number of recent days to include (default: 3)
* @returns Filtered array of recent or active blocks
*/
function filterRecentBlocks(blocks, days = DEFAULT_RECENT_DAYS) {
	const now = /* @__PURE__ */ new Date();
	const cutoffTime = /* @__PURE__ */ new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
	return blocks.filter((block) => {
		return block.startTime >= cutoffTime || block.isActive;
	});
}
var import_usingCtx = __toESM(require_usingCtx(), 1);
/**
* Get all Claude data directories to search for usage data
* Supports multiple paths: environment variable (comma-separated), new default, and old default
* @returns Array of valid Claude data directory paths
*/
function getClaudePaths() {
	const paths = [];
	const normalizedPaths = /* @__PURE__ */ new Set();
	const envPaths = (process$1.env[CLAUDE_CONFIG_DIR_ENV] ?? "").trim();
	if (envPaths !== "") {
		const envPathList = envPaths.split(",").map((p) => p.trim()).filter((p) => p !== "");
		for (const envPath of envPathList) {
			const normalizedPath = path.resolve(envPath);
			if (isDirectorySync(normalizedPath)) {
				const projectsPath = path.join(normalizedPath, CLAUDE_PROJECTS_DIR_NAME);
				if (isDirectorySync(projectsPath)) {
					if (!normalizedPaths.has(normalizedPath)) {
						normalizedPaths.add(normalizedPath);
						paths.push(normalizedPath);
					}
				}
			}
		}
	}
	const defaultPaths = [DEFAULT_CLAUDE_CONFIG_PATH, path.join(USER_HOME_DIR, DEFAULT_CLAUDE_CODE_PATH)];
	for (const defaultPath of defaultPaths) {
		const normalizedPath = path.resolve(defaultPath);
		if (isDirectorySync(normalizedPath)) {
			const projectsPath = path.join(normalizedPath, CLAUDE_PROJECTS_DIR_NAME);
			if (isDirectorySync(projectsPath)) {
				if (!normalizedPaths.has(normalizedPath)) {
					normalizedPaths.add(normalizedPath);
					paths.push(normalizedPath);
				}
			}
		}
	}
	if (paths.length === 0) throw new Error(`No valid Claude data directories found. Please ensure at least one of the following exists:
- ${path.join(DEFAULT_CLAUDE_CONFIG_PATH, CLAUDE_PROJECTS_DIR_NAME)}
- ${path.join(USER_HOME_DIR, DEFAULT_CLAUDE_CODE_PATH, CLAUDE_PROJECTS_DIR_NAME)}
- Or set ${CLAUDE_CONFIG_DIR_ENV} environment variable to valid directory path(s) containing a '${CLAUDE_PROJECTS_DIR_NAME}' subdirectory`.trim());
	return paths;
}
/**
* Zod schema for validating Claude usage data from JSONL files
*/
const usageDataSchema = objectType({
	timestamp: isoTimestampSchema,
	version: versionSchema.optional(),
	message: objectType({
		usage: objectType({
			input_tokens: numberType(),
			output_tokens: numberType(),
			cache_creation_input_tokens: numberType().optional(),
			cache_read_input_tokens: numberType().optional()
		}),
		model: modelNameSchema.optional(),
		id: messageIdSchema.optional()
	}),
	costUSD: numberType().optional(),
	requestId: requestIdSchema.optional()
});
/**
* Zod schema for model-specific usage breakdown data
*/
const modelBreakdownSchema = objectType({
	modelName: modelNameSchema,
	inputTokens: numberType(),
	outputTokens: numberType(),
	cacheCreationTokens: numberType(),
	cacheReadTokens: numberType(),
	cost: numberType()
});
/**
* Zod schema for daily usage aggregation data
*/
const dailyUsageSchema = objectType({
	date: dailyDateSchema,
	inputTokens: numberType(),
	outputTokens: numberType(),
	cacheCreationTokens: numberType(),
	cacheReadTokens: numberType(),
	totalCost: numberType(),
	modelsUsed: arrayType(modelNameSchema),
	modelBreakdowns: arrayType(modelBreakdownSchema)
});
/**
* Zod schema for session-based usage aggregation data
*/
const sessionUsageSchema = objectType({
	sessionId: sessionIdSchema,
	projectPath: projectPathSchema,
	inputTokens: numberType(),
	outputTokens: numberType(),
	cacheCreationTokens: numberType(),
	cacheReadTokens: numberType(),
	totalCost: numberType(),
	lastActivity: activityDateSchema,
	versions: arrayType(versionSchema),
	modelsUsed: arrayType(modelNameSchema),
	modelBreakdowns: arrayType(modelBreakdownSchema)
});
/**
* Zod schema for monthly usage aggregation data
*/
const monthlyUsageSchema = objectType({
	month: monthlyDateSchema,
	inputTokens: numberType(),
	outputTokens: numberType(),
	cacheCreationTokens: numberType(),
	cacheReadTokens: numberType(),
	totalCost: numberType(),
	modelsUsed: arrayType(modelNameSchema),
	modelBreakdowns: arrayType(modelBreakdownSchema)
});
/**
* Aggregates token counts and costs by model name
*/
function aggregateByModel(entries, getModel, getUsage, getCost) {
	const modelAggregates = /* @__PURE__ */ new Map();
	const defaultStats = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationTokens: 0,
		cacheReadTokens: 0,
		cost: 0
	};
	for (const entry of entries) {
		const modelName = getModel(entry) ?? "unknown";
		if (modelName === "<synthetic>") continue;
		const usage = getUsage(entry);
		const cost = getCost(entry);
		const existing = modelAggregates.get(modelName) ?? defaultStats;
		modelAggregates.set(modelName, {
			inputTokens: existing.inputTokens + (usage.input_tokens ?? 0),
			outputTokens: existing.outputTokens + (usage.output_tokens ?? 0),
			cacheCreationTokens: existing.cacheCreationTokens + (usage.cache_creation_input_tokens ?? 0),
			cacheReadTokens: existing.cacheReadTokens + (usage.cache_read_input_tokens ?? 0),
			cost: existing.cost + cost
		});
	}
	return modelAggregates;
}
/**
* Aggregates model breakdowns from multiple sources
*/
function aggregateModelBreakdowns(breakdowns) {
	const modelAggregates = /* @__PURE__ */ new Map();
	const defaultStats = {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationTokens: 0,
		cacheReadTokens: 0,
		cost: 0
	};
	for (const breakdown of breakdowns) {
		if (breakdown.modelName === "<synthetic>") continue;
		const existing = modelAggregates.get(breakdown.modelName) ?? defaultStats;
		modelAggregates.set(breakdown.modelName, {
			inputTokens: existing.inputTokens + breakdown.inputTokens,
			outputTokens: existing.outputTokens + breakdown.outputTokens,
			cacheCreationTokens: existing.cacheCreationTokens + breakdown.cacheCreationTokens,
			cacheReadTokens: existing.cacheReadTokens + breakdown.cacheReadTokens,
			cost: existing.cost + breakdown.cost
		});
	}
	return modelAggregates;
}
/**
* Converts model aggregates to sorted model breakdowns
*/
function createModelBreakdowns(modelAggregates) {
	return Array.from(modelAggregates.entries()).map(([modelName, stats]) => ({
		modelName,
		...stats
	})).sort((a$1, b$1) => b$1.cost - a$1.cost);
}
/**
* Calculates total token counts and costs from entries
*/
function calculateTotals(entries, getUsage, getCost) {
	return entries.reduce((acc, entry) => {
		const usage = getUsage(entry);
		const cost = getCost(entry);
		return {
			inputTokens: acc.inputTokens + (usage.input_tokens ?? 0),
			outputTokens: acc.outputTokens + (usage.output_tokens ?? 0),
			cacheCreationTokens: acc.cacheCreationTokens + (usage.cache_creation_input_tokens ?? 0),
			cacheReadTokens: acc.cacheReadTokens + (usage.cache_read_input_tokens ?? 0),
			cost: acc.cost + cost,
			totalCost: acc.totalCost + cost
		};
	}, {
		inputTokens: 0,
		outputTokens: 0,
		cacheCreationTokens: 0,
		cacheReadTokens: 0,
		cost: 0,
		totalCost: 0
	});
}
/**
* Filters items by date range
*/
function filterByDateRange(items, getDate, since, until) {
	if (since == null && until == null) return items;
	return items.filter((item) => {
		const dateStr = getDate(item).substring(0, 10).replace(/-/g, "");
		if (since != null && dateStr < since) return false;
		if (until != null && dateStr > until) return false;
		return true;
	});
}
/**
* Checks if an entry is a duplicate based on hash
*/
function isDuplicateEntry(uniqueHash, processedHashes) {
	if (uniqueHash == null) return false;
	return processedHashes.has(uniqueHash);
}
/**
* Marks an entry as processed
*/
function markAsProcessed(uniqueHash, processedHashes) {
	if (uniqueHash != null) processedHashes.add(uniqueHash);
}
/**
* Extracts unique models from entries, excluding synthetic model
*/
function extractUniqueModels(entries, getModel) {
	return uniq(entries.map(getModel).filter((m$1) => m$1 != null && m$1 !== "<synthetic>"));
}
/**
* Formats a date string to YYYY-MM-DD format
* @param dateStr - Input date string
* @returns Formatted date string in YYYY-MM-DD format
*/
function formatDate(dateStr) {
	const date = new Date(dateStr);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
/**
* Formats a date string to compact format with year on first line and month-day on second
* @param dateStr - Input date string
* @returns Formatted date string with newline separator (YYYY\nMM-DD)
*/
function formatDateCompact(dateStr) {
	const date = new Date(dateStr);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}\n${month}-${day}`;
}
/**
* Generic function to sort items by date based on sort order
* @param items - Array of items to sort
* @param getDate - Function to extract date/timestamp from item
* @param order - Sort order (asc or desc)
* @returns Sorted array
*/
function sortByDate(items, getDate, order = "desc") {
	const sorted = sort(items);
	switch (order) {
		case "desc": return sorted.desc((item) => new Date(getDate(item)).getTime());
		case "asc": return sorted.asc((item) => new Date(getDate(item)).getTime());
		default: unreachable(order);
	}
}
/**
* Create a unique identifier for deduplication using message ID and request ID
*/
function createUniqueHash(data) {
	const messageId = data.message.id;
	const requestId = data.requestId;
	if (messageId == null || requestId == null) return null;
	return `${messageId}:${requestId}`;
}
/**
* Extract the earliest timestamp from a JSONL file
* Scans through the file until it finds a valid timestamp
*/
async function getEarliestTimestamp(filePath) {
	try {
		const content = await readFile(filePath, "utf-8");
		const lines = content.trim().split("\n");
		let earliestDate = null;
		for (const line of lines) {
			if (line.trim() === "") continue;
			try {
				const json = JSON.parse(line);
				if (json.timestamp != null && typeof json.timestamp === "string") {
					const date = new Date(json.timestamp);
					if (!Number.isNaN(date.getTime())) {
						if (earliestDate == null || date < earliestDate) earliestDate = date;
					}
				}
			} catch {
				continue;
			}
		}
		return earliestDate;
	} catch (error) {
		logger.debug(`Failed to get earliest timestamp for ${filePath}:`, error);
		return null;
	}
}
/**
* Sort files by their earliest timestamp
* Files without valid timestamps are placed at the end
*/
async function sortFilesByTimestamp(files) {
	const filesWithTimestamps = await Promise.all(files.map(async (file) => ({
		file,
		timestamp: await getEarliestTimestamp(file)
	})));
	return filesWithTimestamps.sort((a$1, b$1) => {
		if (a$1.timestamp == null && b$1.timestamp == null) return 0;
		if (a$1.timestamp == null) return 1;
		if (b$1.timestamp == null) return -1;
		return a$1.timestamp.getTime() - b$1.timestamp.getTime();
	}).map((item) => item.file);
}
/**
* Calculates cost for a single usage data entry based on the specified cost calculation mode
* @param data - Usage data entry
* @param mode - Cost calculation mode (auto, calculate, or display)
* @param fetcher - Pricing fetcher instance for calculating costs from tokens
* @returns Calculated cost in USD
*/
async function calculateCostForEntry(data, mode, fetcher) {
	if (mode === "display") return data.costUSD ?? 0;
	if (mode === "calculate") {
		if (data.message.model != null) return fetcher.calculateCostFromTokens(data.message.usage, data.message.model);
		return 0;
	}
	if (mode === "auto") {
		if (data.costUSD != null) return data.costUSD;
		if (data.message.model != null) return fetcher.calculateCostFromTokens(data.message.usage, data.message.model);
		return 0;
	}
	unreachable(mode);
}
/**
* Loads and aggregates Claude usage data by day
* Processes all JSONL files in the Claude projects directory and groups usage by date
* @param options - Optional configuration for loading and filtering data
* @returns Array of daily usage summaries sorted by date
*/
async function loadDailyUsageData(options) {
	try {
		var _usingCtx = (0, import_usingCtx.default)();
		const claudePaths = toArray(options?.claudePath ?? getClaudePaths());
		const allFiles = [];
		for (const claudePath of claudePaths) {
			const claudeDir = path.join(claudePath, CLAUDE_PROJECTS_DIR_NAME);
			const files = await glob([USAGE_DATA_GLOB_PATTERN], {
				cwd: claudeDir,
				absolute: true
			});
			allFiles.push(...files);
		}
		if (allFiles.length === 0) return [];
		const sortedFiles = await sortFilesByTimestamp(allFiles);
		const mode = options?.mode ?? "auto";
		const fetcher = _usingCtx.u(mode === "display" ? null : new PricingFetcher(options?.offline));
		const processedHashes = /* @__PURE__ */ new Set();
		const allEntries = [];
		for (const file of sortedFiles) {
			const content = await readFile(file, "utf-8");
			const lines = content.trim().split("\n").filter((line) => line.length > 0);
			for (const line of lines) try {
				const parsed = JSON.parse(line);
				const result = usageDataSchema.safeParse(parsed);
				if (!result.success) continue;
				const data = result.data;
				const uniqueHash = createUniqueHash(data);
				if (isDuplicateEntry(uniqueHash, processedHashes)) continue;
				markAsProcessed(uniqueHash, processedHashes);
				const date = formatDate(data.timestamp);
				const cost = fetcher != null ? await calculateCostForEntry(data, mode, fetcher) : data.costUSD ?? 0;
				allEntries.push({
					data,
					date,
					cost,
					model: data.message.model
				});
			} catch {}
		}
		const groupedByDate = groupBy(allEntries, (entry) => entry.date);
		const results = Object.entries(groupedByDate).map(([date, entries]) => {
			if (entries == null) return void 0;
			const modelAggregates = aggregateByModel(entries, (entry) => entry.model, (entry) => entry.data.message.usage, (entry) => entry.cost);
			const modelBreakdowns = createModelBreakdowns(modelAggregates);
			const totals = calculateTotals(entries, (entry) => entry.data.message.usage, (entry) => entry.cost);
			const modelsUsed = extractUniqueModels(entries, (e) => e.model);
			return {
				date: createDailyDate(date),
				...totals,
				modelsUsed,
				modelBreakdowns
			};
		}).filter((item) => item != null);
		const filtered = filterByDateRange(results, (item) => item.date, options?.since, options?.until);
		return sortByDate(filtered, (item) => item.date, options?.order);
	} catch (_) {
		_usingCtx.e = _;
	} finally {
		_usingCtx.d();
	}
}
/**
* Loads and aggregates Claude usage data by session
* Groups usage data by project path and session ID based on file structure
* @param options - Optional configuration for loading and filtering data
* @returns Array of session usage summaries sorted by last activity
*/
async function loadSessionData(options) {
	try {
		var _usingCtx3 = (0, import_usingCtx.default)();
		const claudePaths = toArray(options?.claudePath ?? getClaudePaths());
		const filesWithBase = [];
		for (const claudePath of claudePaths) {
			const claudeDir = path.join(claudePath, CLAUDE_PROJECTS_DIR_NAME);
			const files = await glob([USAGE_DATA_GLOB_PATTERN], {
				cwd: claudeDir,
				absolute: true
			});
			for (const file of files) filesWithBase.push({
				file,
				baseDir: claudeDir
			});
		}
		if (filesWithBase.length === 0) return [];
		const fileToBaseMap = new Map(filesWithBase.map((f$1) => [f$1.file, f$1.baseDir]));
		const sortedFilesWithBase = await sortFilesByTimestamp(filesWithBase.map((f$1) => f$1.file)).then((sortedFiles) => sortedFiles.map((file) => ({
			file,
			baseDir: fileToBaseMap.get(file) ?? ""
		})));
		const mode = options?.mode ?? "auto";
		const fetcher = _usingCtx3.u(mode === "display" ? null : new PricingFetcher(options?.offline));
		const processedHashes = /* @__PURE__ */ new Set();
		const allEntries = [];
		for (const { file, baseDir } of sortedFilesWithBase) {
			const relativePath = path.relative(baseDir, file);
			const parts = relativePath.split(path.sep);
			const sessionId = parts[parts.length - 2] ?? "unknown";
			const joinedPath = parts.slice(0, -2).join(path.sep);
			const projectPath = joinedPath.length > 0 ? joinedPath : "Unknown Project";
			const content = await readFile(file, "utf-8");
			const lines = content.trim().split("\n").filter((line) => line.length > 0);
			for (const line of lines) try {
				const parsed = JSON.parse(line);
				const result = usageDataSchema.safeParse(parsed);
				if (!result.success) continue;
				const data = result.data;
				const uniqueHash = createUniqueHash(data);
				if (isDuplicateEntry(uniqueHash, processedHashes)) continue;
				markAsProcessed(uniqueHash, processedHashes);
				const sessionKey = `${projectPath}/${sessionId}`;
				const cost = fetcher != null ? await calculateCostForEntry(data, mode, fetcher) : data.costUSD ?? 0;
				allEntries.push({
					data,
					sessionKey,
					sessionId,
					projectPath,
					cost,
					timestamp: data.timestamp,
					model: data.message.model
				});
			} catch {}
		}
		const groupedBySessions = groupBy(allEntries, (entry) => entry.sessionKey);
		const results = Object.entries(groupedBySessions).map(([_, entries]) => {
			if (entries == null) return void 0;
			const latestEntry = entries.reduce((latest, current) => current.timestamp > latest.timestamp ? current : latest);
			const versions = [];
			for (const entry of entries) if (entry.data.version != null) versions.push(entry.data.version);
			const modelAggregates = aggregateByModel(entries, (entry) => entry.model, (entry) => entry.data.message.usage, (entry) => entry.cost);
			const modelBreakdowns = createModelBreakdowns(modelAggregates);
			const totals = calculateTotals(entries, (entry) => entry.data.message.usage, (entry) => entry.cost);
			const modelsUsed = extractUniqueModels(entries, (e) => e.model);
			return {
				sessionId: createSessionId(latestEntry.sessionId),
				projectPath: createProjectPath(latestEntry.projectPath),
				...totals,
				lastActivity: formatDate(latestEntry.timestamp),
				versions: uniq(versions).sort(),
				modelsUsed,
				modelBreakdowns
			};
		}).filter((item) => item != null);
		const filtered = filterByDateRange(results, (item) => item.lastActivity, options?.since, options?.until);
		return sortByDate(filtered, (item) => item.lastActivity, options?.order);
	} catch (_) {
		_usingCtx3.e = _;
	} finally {
		_usingCtx3.d();
	}
}
/**
* Loads and aggregates Claude usage data by month
* Uses daily usage data as the source and groups by month
* @param options - Optional configuration for loading and filtering data
* @returns Array of monthly usage summaries sorted by month
*/
async function loadMonthlyUsageData(options) {
	const dailyData = await loadDailyUsageData(options);
	const groupedByMonth = groupBy(dailyData, (data) => data.date.substring(0, 7));
	const monthlyArray = [];
	for (const [month, dailyEntries] of Object.entries(groupedByMonth)) {
		if (dailyEntries == null) continue;
		const allBreakdowns = dailyEntries.flatMap((daily) => daily.modelBreakdowns);
		const modelAggregates = aggregateModelBreakdowns(allBreakdowns);
		const modelBreakdowns = createModelBreakdowns(modelAggregates);
		const models = [];
		for (const data of dailyEntries) for (const model of data.modelsUsed) if (model !== "<synthetic>") models.push(model);
		let totalInputTokens = 0;
		let totalOutputTokens = 0;
		let totalCacheCreationTokens = 0;
		let totalCacheReadTokens = 0;
		let totalCost = 0;
		for (const daily of dailyEntries) {
			totalInputTokens += daily.inputTokens;
			totalOutputTokens += daily.outputTokens;
			totalCacheCreationTokens += daily.cacheCreationTokens;
			totalCacheReadTokens += daily.cacheReadTokens;
			totalCost += daily.totalCost;
		}
		const monthlyUsage = {
			month: createMonthlyDate(month),
			inputTokens: totalInputTokens,
			outputTokens: totalOutputTokens,
			cacheCreationTokens: totalCacheCreationTokens,
			cacheReadTokens: totalCacheReadTokens,
			totalCost,
			modelsUsed: uniq(models),
			modelBreakdowns
		};
		monthlyArray.push(monthlyUsage);
	}
	return sortByDate(monthlyArray, (item) => `${item.month}-01`, options?.order);
}
/**
* Loads usage data and organizes it into session blocks (typically 5-hour billing periods)
* Processes all usage data and groups it into time-based blocks for billing analysis
* @param options - Optional configuration including session duration and filtering
* @returns Array of session blocks with usage and cost information
*/
async function loadSessionBlockData(options) {
	try {
		var _usingCtx4 = (0, import_usingCtx.default)();
		const claudePaths = toArray(options?.claudePath ?? getClaudePaths());
		const allFiles = [];
		for (const claudePath of claudePaths) {
			const claudeDir = path.join(claudePath, CLAUDE_PROJECTS_DIR_NAME);
			const files = await glob([USAGE_DATA_GLOB_PATTERN], {
				cwd: claudeDir,
				absolute: true
			});
			allFiles.push(...files);
		}
		if (allFiles.length === 0) return [];
		const sortedFiles = await sortFilesByTimestamp(allFiles);
		const mode = options?.mode ?? "auto";
		const fetcher = _usingCtx4.u(mode === "display" ? null : new PricingFetcher(options?.offline));
		const processedHashes = /* @__PURE__ */ new Set();
		const allEntries = [];
		for (const file of sortedFiles) {
			const content = await readFile(file, "utf-8");
			const lines = content.trim().split("\n").filter((line) => line.length > 0);
			for (const line of lines) try {
				const parsed = JSON.parse(line);
				const result = usageDataSchema.safeParse(parsed);
				if (!result.success) continue;
				const data = result.data;
				const uniqueHash = createUniqueHash(data);
				if (isDuplicateEntry(uniqueHash, processedHashes)) continue;
				markAsProcessed(uniqueHash, processedHashes);
				const cost = fetcher != null ? await calculateCostForEntry(data, mode, fetcher) : data.costUSD ?? 0;
				allEntries.push({
					timestamp: new Date(data.timestamp),
					usage: {
						inputTokens: data.message.usage.input_tokens,
						outputTokens: data.message.usage.output_tokens,
						cacheCreationInputTokens: data.message.usage.cache_creation_input_tokens ?? 0,
						cacheReadInputTokens: data.message.usage.cache_read_input_tokens ?? 0
					},
					costUSD: cost,
					model: data.message.model ?? "unknown",
					version: data.version
				});
			} catch (error) {
				logger.debug(`Skipping invalid JSON line in 5-hour blocks: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		const blocks = identifySessionBlocks(allEntries, options?.sessionDurationHours);
		const filtered = options?.since != null && options.since !== "" || options?.until != null && options.until !== "" ? blocks.filter((block) => {
			const blockDateStr = formatDate(block.startTime.toISOString()).replace(/-/g, "");
			if (options.since != null && options.since !== "" && blockDateStr < options.since) return false;
			if (options.until != null && options.until !== "" && blockDateStr > options.until) return false;
			return true;
		}) : blocks;
		return sortByDate(filtered, (block) => block.startTime, options?.order);
	} catch (_) {
		_usingCtx4.e = _;
	} finally {
		_usingCtx4.d();
	}
}
export { DEFAULT_SESSION_DURATION_HOURS, calculateBurnRate, calculateCostForEntry, createUniqueHash, dailyUsageSchema, filterRecentBlocks, formatDate, formatDateCompact, getClaudePaths, getEarliestTimestamp, glob, identifySessionBlocks, loadDailyUsageData, loadMonthlyUsageData, loadSessionBlockData, loadSessionData, modelBreakdownSchema, monthlyUsageSchema, projectBlockUsage, sessionUsageSchema, sortFilesByTimestamp, uniq, usageDataSchema };
