import { __commonJSMin, __toESM, require_usingCtx } from "./pricing-fetcher-CHQAtwwA.js";
import { ZodFirstPartyTypeKind, ZodType, arrayType, booleanType, discriminatedUnionType, enumType, filterDateSchema, literalType, numberType, objectType, optionalType, recordType, stringType, unionType, unknownType } from "./_types-CH59WmST.js";
import { calculateTotals, createTotalsObject, getTotalTokens } from "./calculate-cost-B0RYn0Vm.js";
import { getClaudePaths, loadDailyUsageData, loadMonthlyUsageData, loadSessionBlockData, loadSessionData } from "./data-loader-D4kzdTVq.js";
import { name, version } from "./logger-LJ5xGY9g.js";
import process from "node:process";
const LATEST_PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_PROTOCOL_VERSIONS = [
	LATEST_PROTOCOL_VERSION,
	"2025-03-26",
	"2024-11-05",
	"2024-10-07"
];
const JSONRPC_VERSION = "2.0";
/**
* A progress token, used to associate progress notifications with the original request.
*/
const ProgressTokenSchema = unionType([stringType(), numberType().int()]);
/**
* An opaque token used to represent a cursor for pagination.
*/
const CursorSchema = stringType();
const RequestMetaSchema = objectType({ progressToken: optionalType(ProgressTokenSchema) }).passthrough();
const BaseRequestParamsSchema = objectType({ _meta: optionalType(RequestMetaSchema) }).passthrough();
const RequestSchema = objectType({
	method: stringType(),
	params: optionalType(BaseRequestParamsSchema)
});
const BaseNotificationParamsSchema = objectType({ _meta: optionalType(objectType({}).passthrough()) }).passthrough();
const NotificationSchema = objectType({
	method: stringType(),
	params: optionalType(BaseNotificationParamsSchema)
});
const ResultSchema = objectType({ _meta: optionalType(objectType({}).passthrough()) }).passthrough();
/**
* A uniquely identifying ID for a request in JSON-RPC.
*/
const RequestIdSchema = unionType([stringType(), numberType().int()]);
/**
* A request that expects a response.
*/
const JSONRPCRequestSchema = objectType({
	jsonrpc: literalType(JSONRPC_VERSION),
	id: RequestIdSchema
}).merge(RequestSchema).strict();
const isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success;
/**
* A notification which does not expect a response.
*/
const JSONRPCNotificationSchema = objectType({ jsonrpc: literalType(JSONRPC_VERSION) }).merge(NotificationSchema).strict();
const isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success;
/**
* A successful (non-error) response to a request.
*/
const JSONRPCResponseSchema = objectType({
	jsonrpc: literalType(JSONRPC_VERSION),
	id: RequestIdSchema,
	result: ResultSchema
}).strict();
const isJSONRPCResponse = (value) => JSONRPCResponseSchema.safeParse(value).success;
/**
* Error codes defined by the JSON-RPC specification.
*/
var ErrorCode;
(function(ErrorCode$1) {
	ErrorCode$1[ErrorCode$1["ConnectionClosed"] = -32e3] = "ConnectionClosed";
	ErrorCode$1[ErrorCode$1["RequestTimeout"] = -32001] = "RequestTimeout";
	ErrorCode$1[ErrorCode$1["ParseError"] = -32700] = "ParseError";
	ErrorCode$1[ErrorCode$1["InvalidRequest"] = -32600] = "InvalidRequest";
	ErrorCode$1[ErrorCode$1["MethodNotFound"] = -32601] = "MethodNotFound";
	ErrorCode$1[ErrorCode$1["InvalidParams"] = -32602] = "InvalidParams";
	ErrorCode$1[ErrorCode$1["InternalError"] = -32603] = "InternalError";
})(ErrorCode || (ErrorCode = {}));
/**
* A response to a request that indicates an error occurred.
*/
const JSONRPCErrorSchema = objectType({
	jsonrpc: literalType(JSONRPC_VERSION),
	id: RequestIdSchema,
	error: objectType({
		code: numberType().int(),
		message: stringType(),
		data: optionalType(unknownType())
	})
}).strict();
const isJSONRPCError = (value) => JSONRPCErrorSchema.safeParse(value).success;
const JSONRPCMessageSchema = unionType([
	JSONRPCRequestSchema,
	JSONRPCNotificationSchema,
	JSONRPCResponseSchema,
	JSONRPCErrorSchema
]);
/**
* A response that indicates success but carries no data.
*/
const EmptyResultSchema = ResultSchema.strict();
/**
* This notification can be sent by either side to indicate that it is cancelling a previously-issued request.
*
* The request SHOULD still be in-flight, but due to communication latency, it is always possible that this notification MAY arrive after the request has already finished.
*
* This notification indicates that the result will be unused, so any associated processing SHOULD cease.
*
* A client MUST NOT attempt to cancel its `initialize` request.
*/
const CancelledNotificationSchema = NotificationSchema.extend({
	method: literalType("notifications/cancelled"),
	params: BaseNotificationParamsSchema.extend({
		requestId: RequestIdSchema,
		reason: stringType().optional()
	})
});
/**
* Base metadata interface for common properties across resources, tools, prompts, and implementations.
*/
const BaseMetadataSchema = objectType({
	name: stringType(),
	title: optionalType(stringType())
}).passthrough();
/**
* Describes the name and version of an MCP implementation.
*/
const ImplementationSchema = BaseMetadataSchema.extend({ version: stringType() });
/**
* Capabilities a client may support. Known capabilities are defined here, in this schema, but this is not a closed set: any client can define its own, additional capabilities.
*/
const ClientCapabilitiesSchema = objectType({
	experimental: optionalType(objectType({}).passthrough()),
	sampling: optionalType(objectType({}).passthrough()),
	elicitation: optionalType(objectType({}).passthrough()),
	roots: optionalType(objectType({ listChanged: optionalType(booleanType()) }).passthrough())
}).passthrough();
/**
* This request is sent from the client to the server when it first connects, asking it to begin initialization.
*/
const InitializeRequestSchema = RequestSchema.extend({
	method: literalType("initialize"),
	params: BaseRequestParamsSchema.extend({
		protocolVersion: stringType(),
		capabilities: ClientCapabilitiesSchema,
		clientInfo: ImplementationSchema
	})
});
const isInitializeRequest = (value) => InitializeRequestSchema.safeParse(value).success;
/**
* Capabilities that a server may support. Known capabilities are defined here, in this schema, but this is not a closed set: any server can define its own, additional capabilities.
*/
const ServerCapabilitiesSchema = objectType({
	experimental: optionalType(objectType({}).passthrough()),
	logging: optionalType(objectType({}).passthrough()),
	completions: optionalType(objectType({}).passthrough()),
	prompts: optionalType(objectType({ listChanged: optionalType(booleanType()) }).passthrough()),
	resources: optionalType(objectType({
		subscribe: optionalType(booleanType()),
		listChanged: optionalType(booleanType())
	}).passthrough()),
	tools: optionalType(objectType({ listChanged: optionalType(booleanType()) }).passthrough())
}).passthrough();
/**
* After receiving an initialize request from the client, the server sends this response.
*/
const InitializeResultSchema = ResultSchema.extend({
	protocolVersion: stringType(),
	capabilities: ServerCapabilitiesSchema,
	serverInfo: ImplementationSchema,
	instructions: optionalType(stringType())
});
/**
* This notification is sent from the client to the server after initialization has finished.
*/
const InitializedNotificationSchema = NotificationSchema.extend({ method: literalType("notifications/initialized") });
/**
* A ping, issued by either the server or the client, to check that the other party is still alive. The receiver must promptly respond, or else may be disconnected.
*/
const PingRequestSchema = RequestSchema.extend({ method: literalType("ping") });
const ProgressSchema = objectType({
	progress: numberType(),
	total: optionalType(numberType()),
	message: optionalType(stringType())
}).passthrough();
/**
* An out-of-band notification used to inform the receiver of a progress update for a long-running request.
*/
const ProgressNotificationSchema = NotificationSchema.extend({
	method: literalType("notifications/progress"),
	params: BaseNotificationParamsSchema.merge(ProgressSchema).extend({ progressToken: ProgressTokenSchema })
});
const PaginatedRequestSchema = RequestSchema.extend({ params: BaseRequestParamsSchema.extend({ cursor: optionalType(CursorSchema) }).optional() });
const PaginatedResultSchema = ResultSchema.extend({ nextCursor: optionalType(CursorSchema) });
/**
* The contents of a specific resource or sub-resource.
*/
const ResourceContentsSchema = objectType({
	uri: stringType(),
	mimeType: optionalType(stringType()),
	_meta: optionalType(objectType({}).passthrough())
}).passthrough();
const TextResourceContentsSchema = ResourceContentsSchema.extend({ text: stringType() });
const BlobResourceContentsSchema = ResourceContentsSchema.extend({ blob: stringType().base64() });
/**
* A known resource that the server is capable of reading.
*/
const ResourceSchema = BaseMetadataSchema.extend({
	uri: stringType(),
	description: optionalType(stringType()),
	mimeType: optionalType(stringType()),
	_meta: optionalType(objectType({}).passthrough())
});
/**
* A template description for resources available on the server.
*/
const ResourceTemplateSchema = BaseMetadataSchema.extend({
	uriTemplate: stringType(),
	description: optionalType(stringType()),
	mimeType: optionalType(stringType()),
	_meta: optionalType(objectType({}).passthrough())
});
/**
* Sent from the client to request a list of resources the server has.
*/
const ListResourcesRequestSchema = PaginatedRequestSchema.extend({ method: literalType("resources/list") });
/**
* The server's response to a resources/list request from the client.
*/
const ListResourcesResultSchema = PaginatedResultSchema.extend({ resources: arrayType(ResourceSchema) });
/**
* Sent from the client to request a list of resource templates the server has.
*/
const ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({ method: literalType("resources/templates/list") });
/**
* The server's response to a resources/templates/list request from the client.
*/
const ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({ resourceTemplates: arrayType(ResourceTemplateSchema) });
/**
* Sent from the client to the server, to read a specific resource URI.
*/
const ReadResourceRequestSchema = RequestSchema.extend({
	method: literalType("resources/read"),
	params: BaseRequestParamsSchema.extend({ uri: stringType() })
});
/**
* The server's response to a resources/read request from the client.
*/
const ReadResourceResultSchema = ResultSchema.extend({ contents: arrayType(unionType([TextResourceContentsSchema, BlobResourceContentsSchema])) });
/**
* An optional notification from the server to the client, informing it that the list of resources it can read from has changed. This may be issued by servers without any previous subscription from the client.
*/
const ResourceListChangedNotificationSchema = NotificationSchema.extend({ method: literalType("notifications/resources/list_changed") });
/**
* Sent from the client to request resources/updated notifications from the server whenever a particular resource changes.
*/
const SubscribeRequestSchema = RequestSchema.extend({
	method: literalType("resources/subscribe"),
	params: BaseRequestParamsSchema.extend({ uri: stringType() })
});
/**
* Sent from the client to request cancellation of resources/updated notifications from the server. This should follow a previous resources/subscribe request.
*/
const UnsubscribeRequestSchema = RequestSchema.extend({
	method: literalType("resources/unsubscribe"),
	params: BaseRequestParamsSchema.extend({ uri: stringType() })
});
/**
* A notification from the server to the client, informing it that a resource has changed and may need to be read again. This should only be sent if the client previously sent a resources/subscribe request.
*/
const ResourceUpdatedNotificationSchema = NotificationSchema.extend({
	method: literalType("notifications/resources/updated"),
	params: BaseNotificationParamsSchema.extend({ uri: stringType() })
});
/**
* Describes an argument that a prompt can accept.
*/
const PromptArgumentSchema = objectType({
	name: stringType(),
	description: optionalType(stringType()),
	required: optionalType(booleanType())
}).passthrough();
/**
* A prompt or prompt template that the server offers.
*/
const PromptSchema = BaseMetadataSchema.extend({
	description: optionalType(stringType()),
	arguments: optionalType(arrayType(PromptArgumentSchema)),
	_meta: optionalType(objectType({}).passthrough())
});
/**
* Sent from the client to request a list of prompts and prompt templates the server has.
*/
const ListPromptsRequestSchema = PaginatedRequestSchema.extend({ method: literalType("prompts/list") });
/**
* The server's response to a prompts/list request from the client.
*/
const ListPromptsResultSchema = PaginatedResultSchema.extend({ prompts: arrayType(PromptSchema) });
/**
* Used by the client to get a prompt provided by the server.
*/
const GetPromptRequestSchema = RequestSchema.extend({
	method: literalType("prompts/get"),
	params: BaseRequestParamsSchema.extend({
		name: stringType(),
		arguments: optionalType(recordType(stringType()))
	})
});
/**
* Text provided to or from an LLM.
*/
const TextContentSchema = objectType({
	type: literalType("text"),
	text: stringType(),
	_meta: optionalType(objectType({}).passthrough())
}).passthrough();
/**
* An image provided to or from an LLM.
*/
const ImageContentSchema = objectType({
	type: literalType("image"),
	data: stringType().base64(),
	mimeType: stringType(),
	_meta: optionalType(objectType({}).passthrough())
}).passthrough();
/**
* An Audio provided to or from an LLM.
*/
const AudioContentSchema = objectType({
	type: literalType("audio"),
	data: stringType().base64(),
	mimeType: stringType(),
	_meta: optionalType(objectType({}).passthrough())
}).passthrough();
/**
* The contents of a resource, embedded into a prompt or tool call result.
*/
const EmbeddedResourceSchema = objectType({
	type: literalType("resource"),
	resource: unionType([TextResourceContentsSchema, BlobResourceContentsSchema]),
	_meta: optionalType(objectType({}).passthrough())
}).passthrough();
/**
* A resource that the server is capable of reading, included in a prompt or tool call result.
*
* Note: resource links returned by tools are not guaranteed to appear in the results of `resources/list` requests.
*/
const ResourceLinkSchema = ResourceSchema.extend({ type: literalType("resource_link") });
/**
* A content block that can be used in prompts and tool results.
*/
const ContentBlockSchema = unionType([
	TextContentSchema,
	ImageContentSchema,
	AudioContentSchema,
	ResourceLinkSchema,
	EmbeddedResourceSchema
]);
/**
* Describes a message returned as part of a prompt.
*/
const PromptMessageSchema = objectType({
	role: enumType(["user", "assistant"]),
	content: ContentBlockSchema
}).passthrough();
/**
* The server's response to a prompts/get request from the client.
*/
const GetPromptResultSchema = ResultSchema.extend({
	description: optionalType(stringType()),
	messages: arrayType(PromptMessageSchema)
});
/**
* An optional notification from the server to the client, informing it that the list of prompts it offers has changed. This may be issued by servers without any previous subscription from the client.
*/
const PromptListChangedNotificationSchema = NotificationSchema.extend({ method: literalType("notifications/prompts/list_changed") });
/**
* Additional properties describing a Tool to clients.
*
* NOTE: all properties in ToolAnnotations are **hints**.
* They are not guaranteed to provide a faithful description of
* tool behavior (including descriptive properties like `title`).
*
* Clients should never make tool use decisions based on ToolAnnotations
* received from untrusted servers.
*/
const ToolAnnotationsSchema = objectType({
	title: optionalType(stringType()),
	readOnlyHint: optionalType(booleanType()),
	destructiveHint: optionalType(booleanType()),
	idempotentHint: optionalType(booleanType()),
	openWorldHint: optionalType(booleanType())
}).passthrough();
/**
* Definition for a tool the client can call.
*/
const ToolSchema = BaseMetadataSchema.extend({
	description: optionalType(stringType()),
	inputSchema: objectType({
		type: literalType("object"),
		properties: optionalType(objectType({}).passthrough()),
		required: optionalType(arrayType(stringType()))
	}).passthrough(),
	outputSchema: optionalType(objectType({
		type: literalType("object"),
		properties: optionalType(objectType({}).passthrough()),
		required: optionalType(arrayType(stringType()))
	}).passthrough()),
	annotations: optionalType(ToolAnnotationsSchema),
	_meta: optionalType(objectType({}).passthrough())
});
/**
* Sent from the client to request a list of tools the server has.
*/
const ListToolsRequestSchema = PaginatedRequestSchema.extend({ method: literalType("tools/list") });
/**
* The server's response to a tools/list request from the client.
*/
const ListToolsResultSchema = PaginatedResultSchema.extend({ tools: arrayType(ToolSchema) });
/**
* The server's response to a tool call.
*/
const CallToolResultSchema = ResultSchema.extend({
	content: arrayType(ContentBlockSchema).default([]),
	structuredContent: objectType({}).passthrough().optional(),
	isError: optionalType(booleanType())
});
/**
* CallToolResultSchema extended with backwards compatibility to protocol version 2024-10-07.
*/
const CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({ toolResult: unknownType() }));
/**
* Used by the client to invoke a tool provided by the server.
*/
const CallToolRequestSchema = RequestSchema.extend({
	method: literalType("tools/call"),
	params: BaseRequestParamsSchema.extend({
		name: stringType(),
		arguments: optionalType(recordType(unknownType()))
	})
});
/**
* An optional notification from the server to the client, informing it that the list of tools it offers has changed. This may be issued by servers without any previous subscription from the client.
*/
const ToolListChangedNotificationSchema = NotificationSchema.extend({ method: literalType("notifications/tools/list_changed") });
/**
* The severity of a log message.
*/
const LoggingLevelSchema = enumType([
	"debug",
	"info",
	"notice",
	"warning",
	"error",
	"critical",
	"alert",
	"emergency"
]);
/**
* A request from the client to the server, to enable or adjust logging.
*/
const SetLevelRequestSchema = RequestSchema.extend({
	method: literalType("logging/setLevel"),
	params: BaseRequestParamsSchema.extend({ level: LoggingLevelSchema })
});
/**
* Notification of a log message passed from server to client. If no logging/setLevel request has been sent from the client, the server MAY decide which messages to send automatically.
*/
const LoggingMessageNotificationSchema = NotificationSchema.extend({
	method: literalType("notifications/message"),
	params: BaseNotificationParamsSchema.extend({
		level: LoggingLevelSchema,
		logger: optionalType(stringType()),
		data: unknownType()
	})
});
/**
* Hints to use for model selection.
*/
const ModelHintSchema = objectType({ name: stringType().optional() }).passthrough();
/**
* The server's preferences for model selection, requested of the client during sampling.
*/
const ModelPreferencesSchema = objectType({
	hints: optionalType(arrayType(ModelHintSchema)),
	costPriority: optionalType(numberType().min(0).max(1)),
	speedPriority: optionalType(numberType().min(0).max(1)),
	intelligencePriority: optionalType(numberType().min(0).max(1))
}).passthrough();
/**
* Describes a message issued to or received from an LLM API.
*/
const SamplingMessageSchema = objectType({
	role: enumType(["user", "assistant"]),
	content: unionType([
		TextContentSchema,
		ImageContentSchema,
		AudioContentSchema
	])
}).passthrough();
/**
* A request from the server to sample an LLM via the client. The client has full discretion over which model to select. The client should also inform the user before beginning sampling, to allow them to inspect the request (human in the loop) and decide whether to approve it.
*/
const CreateMessageRequestSchema = RequestSchema.extend({
	method: literalType("sampling/createMessage"),
	params: BaseRequestParamsSchema.extend({
		messages: arrayType(SamplingMessageSchema),
		systemPrompt: optionalType(stringType()),
		includeContext: optionalType(enumType([
			"none",
			"thisServer",
			"allServers"
		])),
		temperature: optionalType(numberType()),
		maxTokens: numberType().int(),
		stopSequences: optionalType(arrayType(stringType())),
		metadata: optionalType(objectType({}).passthrough()),
		modelPreferences: optionalType(ModelPreferencesSchema)
	})
});
/**
* The client's response to a sampling/create_message request from the server. The client should inform the user before returning the sampled message, to allow them to inspect the response (human in the loop) and decide whether to allow the server to see it.
*/
const CreateMessageResultSchema = ResultSchema.extend({
	model: stringType(),
	stopReason: optionalType(enumType([
		"endTurn",
		"stopSequence",
		"maxTokens"
	]).or(stringType())),
	role: enumType(["user", "assistant"]),
	content: discriminatedUnionType("type", [
		TextContentSchema,
		ImageContentSchema,
		AudioContentSchema
	])
});
/**
* Primitive schema definition for boolean fields.
*/
const BooleanSchemaSchema = objectType({
	type: literalType("boolean"),
	title: optionalType(stringType()),
	description: optionalType(stringType()),
	default: optionalType(booleanType())
}).passthrough();
/**
* Primitive schema definition for string fields.
*/
const StringSchemaSchema = objectType({
	type: literalType("string"),
	title: optionalType(stringType()),
	description: optionalType(stringType()),
	minLength: optionalType(numberType()),
	maxLength: optionalType(numberType()),
	format: optionalType(enumType([
		"email",
		"uri",
		"date",
		"date-time"
	]))
}).passthrough();
/**
* Primitive schema definition for number fields.
*/
const NumberSchemaSchema = objectType({
	type: enumType(["number", "integer"]),
	title: optionalType(stringType()),
	description: optionalType(stringType()),
	minimum: optionalType(numberType()),
	maximum: optionalType(numberType())
}).passthrough();
/**
* Primitive schema definition for enum fields.
*/
const EnumSchemaSchema = objectType({
	type: literalType("string"),
	title: optionalType(stringType()),
	description: optionalType(stringType()),
	enum: arrayType(stringType()),
	enumNames: optionalType(arrayType(stringType()))
}).passthrough();
/**
* Union of all primitive schema definitions.
*/
const PrimitiveSchemaDefinitionSchema = unionType([
	BooleanSchemaSchema,
	StringSchemaSchema,
	NumberSchemaSchema,
	EnumSchemaSchema
]);
/**
* A request from the server to elicit user input via the client.
* The client should present the message and form fields to the user.
*/
const ElicitRequestSchema = RequestSchema.extend({
	method: literalType("elicitation/create"),
	params: BaseRequestParamsSchema.extend({
		message: stringType(),
		requestedSchema: objectType({
			type: literalType("object"),
			properties: recordType(stringType(), PrimitiveSchemaDefinitionSchema),
			required: optionalType(arrayType(stringType()))
		}).passthrough()
	})
});
/**
* The client's response to an elicitation/create request from the server.
*/
const ElicitResultSchema = ResultSchema.extend({
	action: enumType([
		"accept",
		"reject",
		"cancel"
	]),
	content: optionalType(recordType(stringType(), unknownType()))
});
/**
* A reference to a resource or resource template definition.
*/
const ResourceTemplateReferenceSchema = objectType({
	type: literalType("ref/resource"),
	uri: stringType()
}).passthrough();
/**
* Identifies a prompt.
*/
const PromptReferenceSchema = objectType({
	type: literalType("ref/prompt"),
	name: stringType()
}).passthrough();
/**
* A request from the client to the server, to ask for completion options.
*/
const CompleteRequestSchema = RequestSchema.extend({
	method: literalType("completion/complete"),
	params: BaseRequestParamsSchema.extend({
		ref: unionType([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
		argument: objectType({
			name: stringType(),
			value: stringType()
		}).passthrough(),
		context: optionalType(objectType({ arguments: optionalType(recordType(stringType(), stringType())) }))
	})
});
/**
* The server's response to a completion/complete request
*/
const CompleteResultSchema = ResultSchema.extend({ completion: objectType({
	values: arrayType(stringType()).max(100),
	total: optionalType(numberType().int()),
	hasMore: optionalType(booleanType())
}).passthrough() });
/**
* Represents a root directory or file that the server can operate on.
*/
const RootSchema = objectType({
	uri: stringType().startsWith("file://"),
	name: optionalType(stringType()),
	_meta: optionalType(objectType({}).passthrough())
}).passthrough();
/**
* Sent from the server to request a list of root URIs from the client.
*/
const ListRootsRequestSchema = RequestSchema.extend({ method: literalType("roots/list") });
/**
* The client's response to a roots/list request from the server.
*/
const ListRootsResultSchema = ResultSchema.extend({ roots: arrayType(RootSchema) });
/**
* A notification from the client to the server, informing it that the list of roots has changed.
*/
const RootsListChangedNotificationSchema = NotificationSchema.extend({ method: literalType("notifications/roots/list_changed") });
const ClientRequestSchema = unionType([
	PingRequestSchema,
	InitializeRequestSchema,
	CompleteRequestSchema,
	SetLevelRequestSchema,
	GetPromptRequestSchema,
	ListPromptsRequestSchema,
	ListResourcesRequestSchema,
	ListResourceTemplatesRequestSchema,
	ReadResourceRequestSchema,
	SubscribeRequestSchema,
	UnsubscribeRequestSchema,
	CallToolRequestSchema,
	ListToolsRequestSchema
]);
const ClientNotificationSchema = unionType([
	CancelledNotificationSchema,
	ProgressNotificationSchema,
	InitializedNotificationSchema,
	RootsListChangedNotificationSchema
]);
const ClientResultSchema = unionType([
	EmptyResultSchema,
	CreateMessageResultSchema,
	ElicitResultSchema,
	ListRootsResultSchema
]);
const ServerRequestSchema = unionType([
	PingRequestSchema,
	CreateMessageRequestSchema,
	ElicitRequestSchema,
	ListRootsRequestSchema
]);
const ServerNotificationSchema = unionType([
	CancelledNotificationSchema,
	ProgressNotificationSchema,
	LoggingMessageNotificationSchema,
	ResourceUpdatedNotificationSchema,
	ResourceListChangedNotificationSchema,
	ToolListChangedNotificationSchema,
	PromptListChangedNotificationSchema
]);
const ServerResultSchema = unionType([
	EmptyResultSchema,
	InitializeResultSchema,
	CompleteResultSchema,
	GetPromptResultSchema,
	ListPromptsResultSchema,
	ListResourcesResultSchema,
	ListResourceTemplatesResultSchema,
	ReadResourceResultSchema,
	CallToolResultSchema,
	ListToolsResultSchema
]);
var McpError = class extends Error {
	constructor(code, message, data) {
		super(`MCP error ${code}: ${message}`);
		this.code = code;
		this.data = data;
		this.name = "McpError";
	}
};
var HTTPException = class extends Error {
	res;
	status;
	constructor(status = 500, options) {
		super(options?.message, { cause: options?.cause });
		this.res = options?.res;
		this.status = status;
	}
	getResponse() {
		if (this.res) {
			const newResponse = new Response(this.res.body, {
				status: this.status,
				headers: this.res.headers
			});
			return newResponse;
		}
		return new Response(this.message, { status: this.status });
	}
};
var StreamingApi = class {
	writer;
	encoder;
	writable;
	abortSubscribers = [];
	responseReadable;
	aborted = false;
	closed = false;
	constructor(writable, _readable) {
		this.writable = writable;
		this.writer = writable.getWriter();
		this.encoder = new TextEncoder();
		const reader = _readable.getReader();
		this.abortSubscribers.push(async () => {
			await reader.cancel();
		});
		this.responseReadable = new ReadableStream({
			async pull(controller) {
				const { done, value } = await reader.read();
				done ? controller.close() : controller.enqueue(value);
			},
			cancel: () => {
				this.abort();
			}
		});
	}
	async write(input) {
		try {
			if (typeof input === "string") input = this.encoder.encode(input);
			await this.writer.write(input);
		} catch {}
		return this;
	}
	async writeln(input) {
		await this.write(input + "\n");
		return this;
	}
	sleep(ms) {
		return new Promise((res) => setTimeout(res, ms));
	}
	async close() {
		try {
			await this.writer.close();
		} catch {}
		this.closed = true;
	}
	async pipe(body) {
		this.writer.releaseLock();
		await body.pipeTo(this.writable, { preventClose: true });
		this.writer = this.writable.getWriter();
	}
	onAbort(listener) {
		this.abortSubscribers.push(listener);
	}
	abort() {
		if (!this.aborted) {
			this.aborted = true;
			this.abortSubscribers.forEach((subscriber) => subscriber());
		}
	}
};
var HtmlEscapedCallbackPhase = {
	Stringify: 1,
	BeforeStream: 2,
	Stream: 3
};
var raw = (value, callbacks) => {
	const escapedString = new String(value);
	escapedString.isEscaped = true;
	escapedString.callbacks = callbacks;
	return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
	if (typeof str === "object" && !(str instanceof String)) {
		if (!(str instanceof Promise)) str = str.toString();
		if (str instanceof Promise) str = await str;
	}
	const callbacks = str.callbacks;
	if (!callbacks?.length) return Promise.resolve(str);
	if (buffer) buffer[0] += str;
	else buffer = [str];
	const resStr = Promise.all(callbacks.map((c) => c({
		phase,
		buffer,
		context
	}))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
	if (preserveCallbacks) return raw(await resStr, callbacks);
	else return resStr;
};
var SSEStreamingApi = class extends StreamingApi {
	constructor(writable, readable) {
		super(writable, readable);
	}
	async writeSSE(message) {
		const data = await resolveCallback(message.data, HtmlEscapedCallbackPhase.Stringify, false, {});
		const dataLines = data.split("\n").map((line) => {
			return `data: ${line}`;
		}).join("\n");
		const sseData = [
			message.event && `event: ${message.event}`,
			dataLines,
			message.id && `id: ${message.id}`,
			message.retry && `retry: ${message.retry}`
		].filter(Boolean).join("\n") + "\n\n";
		await this.write(sseData);
	}
};
var GET_MATCH_RESULT = Symbol();
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
	const { all = false, dot = false } = options;
	const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
	const contentType = headers.get("Content-Type");
	if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) return parseFormData(request, {
		all,
		dot
	});
	return {};
};
async function parseFormData(request, options) {
	const formData = await request.formData();
	if (formData) return convertFormDataToBodyData(formData, options);
	return {};
}
function convertFormDataToBodyData(formData, options) {
	const form = /* @__PURE__ */ Object.create(null);
	formData.forEach((value, key) => {
		const shouldParseAllValues = options.all || key.endsWith("[]");
		if (!shouldParseAllValues) form[key] = value;
		else handleParsingAllValues(form, key, value);
	});
	if (options.dot) Object.entries(form).forEach(([key, value]) => {
		const shouldParseDotValues = key.includes(".");
		if (shouldParseDotValues) {
			handleParsingNestedValues(form, key, value);
			delete form[key];
		}
	});
	return form;
}
var handleParsingAllValues = (form, key, value) => {
	if (form[key] !== void 0) if (Array.isArray(form[key])) form[key].push(value);
	else form[key] = [form[key], value];
	else if (!key.endsWith("[]")) form[key] = value;
	else form[key] = [value];
};
var handleParsingNestedValues = (form, key, value) => {
	let nestedForm = form;
	const keys = key.split(".");
	keys.forEach((key2, index) => {
		if (index === keys.length - 1) nestedForm[key2] = value;
		else {
			if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) nestedForm[key2] = /* @__PURE__ */ Object.create(null);
			nestedForm = nestedForm[key2];
		}
	});
};
var tryDecode = (str, decoder) => {
	try {
		return decoder(str);
	} catch {
		return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
			try {
				return decoder(match);
			} catch {
				return match;
			}
		});
	}
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
	const url = request.url;
	const start = url.indexOf("/", url.charCodeAt(9) === 58 ? 13 : 8);
	let i = start;
	for (; i < url.length; i++) {
		const charCode = url.charCodeAt(i);
		if (charCode === 37) {
			const queryIndex = url.indexOf("?", i);
			const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
			return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
		} else if (charCode === 63) break;
	}
	return url.slice(start, i);
};
var getPathNoStrict = (request) => {
	const result = getPath(request);
	return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
	if (rest.length) sub = mergePath(sub, ...rest);
	return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var _decodeURI = (value) => {
	if (!/[%+]/.test(value)) return value;
	if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
	return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
	let encoded;
	if (!multiple && key && !/[%+]/.test(key)) {
		let keyIndex2 = url.indexOf(`?${key}`, 8);
		if (keyIndex2 === -1) keyIndex2 = url.indexOf(`&${key}`, 8);
		while (keyIndex2 !== -1) {
			const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
			if (trailingKeyCode === 61) {
				const valueIndex = keyIndex2 + key.length + 2;
				const endIndex = url.indexOf("&", valueIndex);
				return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
			} else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) return "";
			keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
		}
		encoded = /[%+]/.test(url);
		if (!encoded) return void 0;
	}
	const results = {};
	encoded ??= /[%+]/.test(url);
	let keyIndex = url.indexOf("?", 8);
	while (keyIndex !== -1) {
		const nextKeyIndex = url.indexOf("&", keyIndex + 1);
		let valueIndex = url.indexOf("=", keyIndex);
		if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
		let name$1 = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
		if (encoded) name$1 = _decodeURI(name$1);
		keyIndex = nextKeyIndex;
		if (name$1 === "") continue;
		let value;
		if (valueIndex === -1) value = "";
		else {
			value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
			if (encoded) value = _decodeURI(value);
		}
		if (multiple) {
			if (!(results[name$1] && Array.isArray(results[name$1]))) results[name$1] = [];
			results[name$1].push(value);
		} else results[name$1] ??= value;
	}
	return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
	return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
	raw;
	#validatedData;
	#matchResult;
	routeIndex = 0;
	path;
	bodyCache = {};
	constructor(request, path = "/", matchResult = [[]]) {
		this.raw = request;
		this.path = path;
		this.#matchResult = matchResult;
		this.#validatedData = {};
	}
	param(key) {
		return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
	}
	#getDecodedParam(key) {
		const paramKey = this.#matchResult[0][this.routeIndex][1][key];
		const param = this.#getParamValue(paramKey);
		return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
	}
	#getAllDecodedParams() {
		const decoded = {};
		const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
		for (const key of keys) {
			const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
			if (value && typeof value === "string") decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
		}
		return decoded;
	}
	#getParamValue(paramKey) {
		return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
	}
	query(key) {
		return getQueryParam(this.url, key);
	}
	queries(key) {
		return getQueryParams(this.url, key);
	}
	header(name$1) {
		if (name$1) return this.raw.headers.get(name$1) ?? void 0;
		const headerData = {};
		this.raw.headers.forEach((value, key) => {
			headerData[key] = value;
		});
		return headerData;
	}
	async parseBody(options) {
		return this.bodyCache.parsedBody ??= await parseBody(this, options);
	}
	#cachedBody = (key) => {
		const { bodyCache, raw: raw$1 } = this;
		const cachedBody = bodyCache[key];
		if (cachedBody) return cachedBody;
		const anyCachedKey = Object.keys(bodyCache)[0];
		if (anyCachedKey) return bodyCache[anyCachedKey].then((body) => {
			if (anyCachedKey === "json") body = JSON.stringify(body);
			return new Response(body)[key]();
		});
		return bodyCache[key] = raw$1[key]();
	};
	json() {
		return this.#cachedBody("json");
	}
	text() {
		return this.#cachedBody("text");
	}
	arrayBuffer() {
		return this.#cachedBody("arrayBuffer");
	}
	blob() {
		return this.#cachedBody("blob");
	}
	formData() {
		return this.#cachedBody("formData");
	}
	addValidatedData(target, data) {
		this.#validatedData[target] = data;
	}
	valid(target) {
		return this.#validatedData[target];
	}
	get url() {
		return this.raw.url;
	}
	get method() {
		return this.raw.method;
	}
	get [GET_MATCH_RESULT]() {
		return this.#matchResult;
	}
	get matchedRoutes() {
		return this.#matchResult[0].map(([[, route]]) => route);
	}
	get routePath() {
		return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
	}
};
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
	return {
		"Content-Type": contentType,
		...headers
	};
};
var Context = class {
	#rawRequest;
	#req;
	env = {};
	#var;
	finalized = false;
	error;
	#status;
	#executionCtx;
	#res;
	#layout;
	#renderer;
	#notFoundHandler;
	#preparedHeaders;
	#matchResult;
	#path;
	constructor(req, options) {
		this.#rawRequest = req;
		if (options) {
			this.#executionCtx = options.executionCtx;
			this.env = options.env;
			this.#notFoundHandler = options.notFoundHandler;
			this.#path = options.path;
			this.#matchResult = options.matchResult;
		}
	}
	get req() {
		this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
		return this.#req;
	}
	get event() {
		if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
		else throw Error("This context has no FetchEvent");
	}
	get executionCtx() {
		if (this.#executionCtx) return this.#executionCtx;
		else throw Error("This context has no ExecutionContext");
	}
	get res() {
		return this.#res ||= new Response(null, { headers: this.#preparedHeaders ??= new Headers() });
	}
	set res(_res) {
		if (this.#res && _res) {
			_res = new Response(_res.body, _res);
			for (const [k, v] of this.#res.headers.entries()) {
				if (k === "content-type") continue;
				if (k === "set-cookie") {
					const cookies = this.#res.headers.getSetCookie();
					_res.headers.delete("set-cookie");
					for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
				} else _res.headers.set(k, v);
			}
		}
		this.#res = _res;
		this.finalized = true;
	}
	render = (...args) => {
		this.#renderer ??= (content) => this.html(content);
		return this.#renderer(...args);
	};
	setLayout = (layout) => this.#layout = layout;
	getLayout = () => this.#layout;
	setRenderer = (renderer) => {
		this.#renderer = renderer;
	};
	header = (name$1, value, options) => {
		if (this.finalized) this.#res = new Response(this.#res.body, this.#res);
		const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
		if (value === void 0) headers.delete(name$1);
		else if (options?.append) headers.append(name$1, value);
		else headers.set(name$1, value);
	};
	status = (status) => {
		this.#status = status;
	};
	set = (key, value) => {
		this.#var ??= /* @__PURE__ */ new Map();
		this.#var.set(key, value);
	};
	get = (key) => {
		return this.#var ? this.#var.get(key) : void 0;
	};
	get var() {
		if (!this.#var) return {};
		return Object.fromEntries(this.#var);
	}
	#newResponse(data, arg, headers) {
		const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
		if (typeof arg === "object" && "headers" in arg) {
			const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
			for (const [key, value] of argHeaders) if (key.toLowerCase() === "set-cookie") responseHeaders.append(key, value);
			else responseHeaders.set(key, value);
		}
		if (headers) for (const [k, v] of Object.entries(headers)) if (typeof v === "string") responseHeaders.set(k, v);
		else {
			responseHeaders.delete(k);
			for (const v2 of v) responseHeaders.append(k, v2);
		}
		const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
		return new Response(data, {
			status,
			headers: responseHeaders
		});
	}
	newResponse = (...args) => this.#newResponse(...args);
	body = (data, arg, headers) => this.#newResponse(data, arg, headers);
	text = (text, arg, headers) => {
		return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
	};
	json = (object, arg, headers) => {
		return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
	};
	html = (html, arg, headers) => {
		const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
		return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
	};
	redirect = (location, status) => {
		this.header("Location", String(location));
		return this.newResponse(null, status ?? 302);
	};
	notFound = () => {
		this.#notFoundHandler ??= () => new Response();
		return this.#notFoundHandler(this);
	};
};
var isOldBunVersion = () => {
	const version$1 = typeof Bun !== "undefined" ? Bun.version : void 0;
	if (version$1 === void 0) return false;
	const result = version$1.startsWith("1.1") || version$1.startsWith("1.0") || version$1.startsWith("0.");
	isOldBunVersion = () => result;
	return result;
};
var run = async (stream, cb, onError) => {
	try {
		await cb(stream);
	} catch (e) {
		if (e instanceof Error && onError) {
			await onError(e, stream);
			await stream.writeSSE({
				event: "error",
				data: e.message
			});
		} else console.error(e);
	}
};
var contextStash = /* @__PURE__ */ new WeakMap();
var streamSSE = (c, cb, onError) => {
	const { readable, writable } = new TransformStream();
	const stream = new SSEStreamingApi(writable, readable);
	if (isOldBunVersion()) c.req.raw.signal.addEventListener("abort", () => {
		if (!stream.closed) stream.abort();
	});
	contextStash.set(stream.responseReadable, c);
	c.header("Transfer-Encoding", "chunked");
	c.header("Content-Type", "text/event-stream");
	c.header("Cache-Control", "no-cache");
	c.header("Connection", "keep-alive");
	run(stream, cb, onError);
	return c.newResponse(stream.responseReadable);
};
var StreamableHTTPTransport = class {
	#started = false;
	#initialized = false;
	#onsessioninitialized;
	#sessionIdGenerator;
	#eventStore;
	#enableJsonResponse = false;
	#standaloneSseStreamId = "_GET_stream";
	#streamMapping = /* @__PURE__ */ new Map();
	#requestToStreamMapping = /* @__PURE__ */ new Map();
	#requestResponseMap = /* @__PURE__ */ new Map();
	sessionId;
	onclose;
	onerror;
	onmessage;
	constructor(options) {
		this.#sessionIdGenerator = options?.sessionIdGenerator;
		this.#enableJsonResponse = options?.enableJsonResponse ?? false;
		this.#eventStore = options?.eventStore;
		this.#onsessioninitialized = options?.onsessioninitialized;
	}
	/**
	* Starts the transport. This is required by the Transport interface but is a no-op
	* for the Streamable HTTP transport as connections are managed per-request.
	*/
	async start() {
		if (this.#started) throw new Error("Transport already started");
		this.#started = true;
	}
	/**
	* Handles an incoming HTTP request, whether GET or POST
	*/
	async handleRequest(ctx, parsedBody) {
		switch (ctx.req.method) {
			case "GET": return this.handleGetRequest(ctx);
			case "POST": return this.handlePostRequest(ctx, parsedBody);
			case "DELETE": return this.handleDeleteRequest(ctx);
			default: return this.handleUnsupportedRequest(ctx);
		}
	}
	/**
	* Handles GET requests for SSE stream
	*/
	async handleGetRequest(ctx) {
		try {
			const acceptHeader = ctx.req.header("Accept");
			if (!acceptHeader?.includes("text/event-stream")) throw new HTTPException(406, { res: Response.json({
				jsonrpc: "2.0",
				error: {
					code: -32e3,
					message: "Not Acceptable: Client must accept text/event-stream"
				},
				id: null
			}) });
			this.validateSession(ctx);
			if (this.sessionId !== void 0) ctx.header("mcp-session-id", this.sessionId);
			let streamId = this.#standaloneSseStreamId;
			if (this.#eventStore) {
				const lastEventId = ctx.req.header("last-event-id");
				if (lastEventId) streamId = (stream) => this.#eventStore.replayEventsAfter(lastEventId, { send: async (eventId, message) => {
					try {
						await stream.writeSSE({
							id: eventId,
							event: "message",
							data: JSON.stringify(message)
						});
					} catch {
						this.onerror?.(/* @__PURE__ */ new Error("Failed replay events"));
						throw new HTTPException(500, { message: "Failed replay events" });
					}
				} });
			}
			if (typeof streamId === "string" && this.#streamMapping.get(streamId) !== void 0) throw new HTTPException(409, { res: Response.json({
				jsonrpc: "2.0",
				error: {
					code: -32e3,
					message: "Conflict: Only one SSE stream is allowed per session"
				},
				id: null
			}) });
			return streamSSE(ctx, async (stream) => {
				const resolvedStreamId = typeof streamId === "string" ? streamId : await streamId(stream);
				this.#streamMapping.set(resolvedStreamId, {
					ctx,
					stream
				});
				const keepAlive = setInterval(() => {
					if (!stream.closed) stream.writeSSE({
						data: "",
						event: "ping"
					}).catch(() => clearInterval(keepAlive));
				}, 3e4);
				stream.onAbort(() => {
					this.#streamMapping.delete(resolvedStreamId);
					clearInterval(keepAlive);
				});
			});
		} catch (error) {
			if (error instanceof HTTPException) throw error;
			this.onerror?.(error);
			throw new HTTPException(400, { res: Response.json({
				jsonrpc: "2.0",
				error: {
					code: -32700,
					message: "Parse error",
					data: String(error)
				},
				id: null
			}) });
		}
	}
	/**
	* Handles POST requests containing JSON-RPC messages
	*/
	async handlePostRequest(ctx, parsedBody) {
		try {
			const acceptHeader = ctx.req.header("Accept");
			if (!acceptHeader?.includes("application/json") || !acceptHeader.includes("text/event-stream")) throw new HTTPException(406, { res: Response.json({
				jsonrpc: "2.0",
				error: {
					code: -32e3,
					message: "Not Acceptable: Client must accept both application/json and text/event-stream"
				},
				id: null
			}) });
			const ct = ctx.req.header("Content-Type");
			if (!ct?.includes("application/json")) throw new HTTPException(415, { res: Response.json({
				jsonrpc: "2.0",
				error: {
					code: -32e3,
					message: "Unsupported Media Type: Content-Type must be application/json"
				},
				id: null
			}) });
			const authInfo = ctx.get("auth");
			let rawMessage = parsedBody;
			if (rawMessage === void 0) rawMessage = await ctx.req.json();
			let messages;
			if (Array.isArray(rawMessage)) messages = rawMessage.map((msg) => JSONRPCMessageSchema.parse(msg));
			else messages = [JSONRPCMessageSchema.parse(rawMessage)];
			const isInitializationRequest = messages.some(isInitializeRequest);
			if (isInitializationRequest) {
				if (this.#initialized && this.sessionId !== void 0) throw new HTTPException(400, { res: Response.json({
					jsonrpc: "2.0",
					error: {
						code: -32600,
						message: "Invalid Request: Server already initialized"
					},
					id: null
				}) });
				if (messages.length > 1) throw new HTTPException(400, { res: Response.json({
					jsonrpc: "2.0",
					error: {
						code: -32600,
						message: "Invalid Request: Only one initialization request is allowed"
					},
					id: null
				}) });
				this.sessionId = this.#sessionIdGenerator?.();
				this.#initialized = true;
				if (this.sessionId && this.#onsessioninitialized) this.#onsessioninitialized(this.sessionId);
			}
			if (!isInitializationRequest) this.validateSession(ctx);
			const hasRequests = messages.some(isJSONRPCRequest);
			if (!hasRequests) {
				for (const message of messages) this.onmessage?.(message, { authInfo });
				return ctx.body(null, 202);
			}
			if (hasRequests) {
				const streamId = crypto.randomUUID();
				if (!this.#enableJsonResponse && this.sessionId !== void 0) ctx.header("mcp-session-id", this.sessionId);
				if (this.#enableJsonResponse) {
					const result = await new Promise((resolve$4) => {
						for (const message of messages) if (isJSONRPCRequest(message)) {
							this.#streamMapping.set(streamId, { ctx: {
								header: ctx.header,
								json: resolve$4
							} });
							this.#requestToStreamMapping.set(message.id, streamId);
						}
						for (const message of messages) this.onmessage?.(message, { authInfo });
					});
					return ctx.json(result);
				}
				return streamSSE(ctx, async (stream) => {
					for (const message of messages) if (isJSONRPCRequest(message)) {
						this.#streamMapping.set(streamId, {
							ctx,
							stream
						});
						this.#requestToStreamMapping.set(message.id, streamId);
					}
					stream.onAbort(() => {
						this.#streamMapping.delete(streamId);
					});
					for (const message of messages) this.onmessage?.(message, { authInfo });
				});
			}
		} catch (error) {
			if (error instanceof HTTPException) throw error;
			this.onerror?.(error);
			throw new HTTPException(400, { res: Response.json({
				jsonrpc: "2.0",
				error: {
					code: -32700,
					message: "Parse error",
					data: String(error)
				},
				id: null
			}) });
		}
	}
	/**
	* Handles DELETE requests to terminate sessions
	*/
	async handleDeleteRequest(ctx) {
		this.validateSession(ctx);
		await this.close();
		return ctx.body(null, 200);
	}
	/**
	* Handles unsupported requests (PUT, PATCH, etc.)
	*/
	handleUnsupportedRequest(ctx) {
		return ctx.json({
			jsonrpc: "2.0",
			error: {
				code: -32e3,
				message: "Method not allowed."
			},
			id: null
		}, {
			status: 405,
			headers: { Allow: "GET, POST, DELETE" }
		});
	}
	/**
	* Validates session ID for non-initialization requests
	* Returns true if the session is valid, false otherwise
	*/
	validateSession(ctx) {
		if (this.#sessionIdGenerator === void 0) return true;
		if (!this.#initialized) throw new HTTPException(400, { res: Response.json({
			jsonrpc: "2.0",
			error: {
				code: -32e3,
				message: "Bad Request: Server not initialized"
			},
			id: null
		}) });
		const sessionId = ctx.req.header("mcp-session-id");
		if (!sessionId) throw new HTTPException(400, { res: Response.json({
			jsonrpc: "2.0",
			error: {
				code: -32e3,
				message: "Bad Request: Mcp-Session-Id header is required"
			},
			id: null
		}) });
		if (Array.isArray(sessionId)) throw new HTTPException(400, { res: Response.json({
			jsonrpc: "2.0",
			error: {
				code: -32e3,
				message: "Bad Request: Mcp-Session-Id header must be a single value"
			},
			id: null
		}) });
		if (sessionId !== this.sessionId) throw new HTTPException(404, { res: Response.json({
			jsonrpc: "2.0",
			error: {
				code: -32001,
				message: "Session not found"
			},
			id: null
		}) });
		return true;
	}
	async close() {
		for (const { stream } of this.#streamMapping.values()) stream?.close();
		this.#streamMapping.clear();
		this.#requestResponseMap.clear();
		this.onclose?.();
	}
	async send(message, options) {
		let requestId = options?.relatedRequestId;
		if (isJSONRPCResponse(message) || isJSONRPCError(message)) requestId = message.id;
		if (requestId === void 0) {
			if (isJSONRPCResponse(message) || isJSONRPCError(message)) throw new Error("Cannot send a response on a standalone SSE stream unless resuming a previous client request");
			const standaloneSse = this.#streamMapping.get(this.#standaloneSseStreamId);
			if (standaloneSse === void 0) return;
			let eventId;
			if (this.#eventStore) eventId = await this.#eventStore.storeEvent(this.#standaloneSseStreamId, message);
			return standaloneSse.stream?.writeSSE({
				id: eventId,
				event: "message",
				data: JSON.stringify(message)
			});
		}
		const streamId = this.#requestToStreamMapping.get(requestId);
		const response = this.#streamMapping.get(streamId);
		if (!streamId) throw new Error(`No connection established for request ID: ${String(requestId)}`);
		if (!this.#enableJsonResponse) {
			let eventId;
			if (this.#eventStore) eventId = await this.#eventStore.storeEvent(streamId, message);
			if (response) await response.stream?.writeSSE({
				id: eventId,
				event: "message",
				data: JSON.stringify(message)
			});
		}
		if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
			this.#requestResponseMap.set(requestId, message);
			const relatedIds = Array.from(this.#requestToStreamMapping.entries()).filter(([, streamId2]) => this.#streamMapping.get(streamId2) === response).map(([id]) => id);
			const allResponsesReady = relatedIds.every((id) => this.#requestResponseMap.has(id));
			if (allResponsesReady) {
				if (!response) throw new Error(`No connection established for request ID: ${String(requestId)}`);
				if (this.#enableJsonResponse) {
					if (this.sessionId !== void 0) response.ctx.header("mcp-session-id", this.sessionId);
					const responses = relatedIds.map((id) => this.#requestResponseMap.get(id));
					response.ctx.json(responses.length === 1 ? responses[0] : responses);
					return;
				} else response.stream?.close();
				for (const id of relatedIds) {
					this.#requestResponseMap.delete(id);
					this.#requestToStreamMapping.delete(id);
				}
			}
		}
	}
};
/**
* The default request timeout, in miliseconds.
*/
const DEFAULT_REQUEST_TIMEOUT_MSEC = 6e4;
/**
* Implements MCP protocol framing on top of a pluggable transport, including
* features like request/response linking, notifications, and progress.
*/
var Protocol = class {
	constructor(_options) {
		this._options = _options;
		this._requestMessageId = 0;
		this._requestHandlers = /* @__PURE__ */ new Map();
		this._requestHandlerAbortControllers = /* @__PURE__ */ new Map();
		this._notificationHandlers = /* @__PURE__ */ new Map();
		this._responseHandlers = /* @__PURE__ */ new Map();
		this._progressHandlers = /* @__PURE__ */ new Map();
		this._timeoutInfo = /* @__PURE__ */ new Map();
		this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
			const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
			controller === null || controller === void 0 || controller.abort(notification.params.reason);
		});
		this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
			this._onprogress(notification);
		});
		this.setRequestHandler(PingRequestSchema, (_request) => ({}));
	}
	_setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
		this._timeoutInfo.set(messageId, {
			timeoutId: setTimeout(onTimeout, timeout),
			startTime: Date.now(),
			timeout,
			maxTotalTimeout,
			resetTimeoutOnProgress,
			onTimeout
		});
	}
	_resetTimeout(messageId) {
		const info = this._timeoutInfo.get(messageId);
		if (!info) return false;
		const totalElapsed = Date.now() - info.startTime;
		if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
			this._timeoutInfo.delete(messageId);
			throw new McpError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
				maxTotalTimeout: info.maxTotalTimeout,
				totalElapsed
			});
		}
		clearTimeout(info.timeoutId);
		info.timeoutId = setTimeout(info.onTimeout, info.timeout);
		return true;
	}
	_cleanupTimeout(messageId) {
		const info = this._timeoutInfo.get(messageId);
		if (info) {
			clearTimeout(info.timeoutId);
			this._timeoutInfo.delete(messageId);
		}
	}
	/**
	* Attaches to the given transport, starts it, and starts listening for messages.
	*
	* The Protocol object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
	*/
	async connect(transport) {
		var _a, _b, _c;
		this._transport = transport;
		const _onclose = (_a = this.transport) === null || _a === void 0 ? void 0 : _a.onclose;
		this._transport.onclose = () => {
			_onclose === null || _onclose === void 0 || _onclose();
			this._onclose();
		};
		const _onerror = (_b = this.transport) === null || _b === void 0 ? void 0 : _b.onerror;
		this._transport.onerror = (error) => {
			_onerror === null || _onerror === void 0 || _onerror(error);
			this._onerror(error);
		};
		const _onmessage = (_c = this._transport) === null || _c === void 0 ? void 0 : _c.onmessage;
		this._transport.onmessage = (message, extra) => {
			_onmessage === null || _onmessage === void 0 || _onmessage(message, extra);
			if (isJSONRPCResponse(message) || isJSONRPCError(message)) this._onresponse(message);
			else if (isJSONRPCRequest(message)) this._onrequest(message, extra);
			else if (isJSONRPCNotification(message)) this._onnotification(message);
			else this._onerror(/* @__PURE__ */ new Error(`Unknown message type: ${JSON.stringify(message)}`));
		};
		await this._transport.start();
	}
	_onclose() {
		var _a;
		const responseHandlers = this._responseHandlers;
		this._responseHandlers = /* @__PURE__ */ new Map();
		this._progressHandlers.clear();
		this._transport = void 0;
		(_a = this.onclose) === null || _a === void 0 || _a.call(this);
		const error = new McpError(ErrorCode.ConnectionClosed, "Connection closed");
		for (const handler of responseHandlers.values()) handler(error);
	}
	_onerror(error) {
		var _a;
		(_a = this.onerror) === null || _a === void 0 || _a.call(this, error);
	}
	_onnotification(notification) {
		var _a;
		const handler = (_a = this._notificationHandlers.get(notification.method)) !== null && _a !== void 0 ? _a : this.fallbackNotificationHandler;
		if (handler === void 0) return;
		Promise.resolve().then(() => handler(notification)).catch((error) => this._onerror(/* @__PURE__ */ new Error(`Uncaught error in notification handler: ${error}`)));
	}
	_onrequest(request, extra) {
		var _a, _b, _c, _d;
		const handler = (_a = this._requestHandlers.get(request.method)) !== null && _a !== void 0 ? _a : this.fallbackRequestHandler;
		if (handler === void 0) {
			(_b = this._transport) === null || _b === void 0 || _b.send({
				jsonrpc: "2.0",
				id: request.id,
				error: {
					code: ErrorCode.MethodNotFound,
					message: "Method not found"
				}
			}).catch((error) => this._onerror(/* @__PURE__ */ new Error(`Failed to send an error response: ${error}`)));
			return;
		}
		const abortController = new AbortController();
		this._requestHandlerAbortControllers.set(request.id, abortController);
		const fullExtra = {
			signal: abortController.signal,
			sessionId: (_c = this._transport) === null || _c === void 0 ? void 0 : _c.sessionId,
			_meta: (_d = request.params) === null || _d === void 0 ? void 0 : _d._meta,
			sendNotification: (notification) => this.notification(notification, { relatedRequestId: request.id }),
			sendRequest: (r, resultSchema, options) => this.request(r, resultSchema, {
				...options,
				relatedRequestId: request.id
			}),
			authInfo: extra === null || extra === void 0 ? void 0 : extra.authInfo,
			requestId: request.id,
			requestInfo: extra === null || extra === void 0 ? void 0 : extra.requestInfo
		};
		Promise.resolve().then(() => handler(request, fullExtra)).then((result) => {
			var _a$1;
			if (abortController.signal.aborted) return;
			return (_a$1 = this._transport) === null || _a$1 === void 0 ? void 0 : _a$1.send({
				result,
				jsonrpc: "2.0",
				id: request.id
			});
		}, (error) => {
			var _a$1, _b$1;
			if (abortController.signal.aborted) return;
			return (_a$1 = this._transport) === null || _a$1 === void 0 ? void 0 : _a$1.send({
				jsonrpc: "2.0",
				id: request.id,
				error: {
					code: Number.isSafeInteger(error["code"]) ? error["code"] : ErrorCode.InternalError,
					message: (_b$1 = error.message) !== null && _b$1 !== void 0 ? _b$1 : "Internal error"
				}
			});
		}).catch((error) => this._onerror(/* @__PURE__ */ new Error(`Failed to send response: ${error}`))).finally(() => {
			this._requestHandlerAbortControllers.delete(request.id);
		});
	}
	_onprogress(notification) {
		const { progressToken,...params } = notification.params;
		const messageId = Number(progressToken);
		const handler = this._progressHandlers.get(messageId);
		if (!handler) {
			this._onerror(/* @__PURE__ */ new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
			return;
		}
		const responseHandler = this._responseHandlers.get(messageId);
		const timeoutInfo = this._timeoutInfo.get(messageId);
		if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) try {
			this._resetTimeout(messageId);
		} catch (error) {
			responseHandler(error);
			return;
		}
		handler(params);
	}
	_onresponse(response) {
		const messageId = Number(response.id);
		const handler = this._responseHandlers.get(messageId);
		if (handler === void 0) {
			this._onerror(/* @__PURE__ */ new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
			return;
		}
		this._responseHandlers.delete(messageId);
		this._progressHandlers.delete(messageId);
		this._cleanupTimeout(messageId);
		if (isJSONRPCResponse(response)) handler(response);
		else {
			const error = new McpError(response.error.code, response.error.message, response.error.data);
			handler(error);
		}
	}
	get transport() {
		return this._transport;
	}
	/**
	* Closes the connection.
	*/
	async close() {
		var _a;
		await ((_a = this._transport) === null || _a === void 0 ? void 0 : _a.close());
	}
	/**
	* Sends a request and wait for a response.
	*
	* Do not use this method to emit notifications! Use notification() instead.
	*/
	request(request, resultSchema, options) {
		const { relatedRequestId, resumptionToken, onresumptiontoken } = options !== null && options !== void 0 ? options : {};
		return new Promise((resolve$4, reject) => {
			var _a, _b, _c, _d, _e, _f;
			if (!this._transport) {
				reject(/* @__PURE__ */ new Error("Not connected"));
				return;
			}
			if (((_a = this._options) === null || _a === void 0 ? void 0 : _a.enforceStrictCapabilities) === true) this.assertCapabilityForMethod(request.method);
			(_b = options === null || options === void 0 ? void 0 : options.signal) === null || _b === void 0 || _b.throwIfAborted();
			const messageId = this._requestMessageId++;
			const jsonrpcRequest = {
				...request,
				jsonrpc: "2.0",
				id: messageId
			};
			if (options === null || options === void 0 ? void 0 : options.onprogress) {
				this._progressHandlers.set(messageId, options.onprogress);
				jsonrpcRequest.params = {
					...request.params,
					_meta: {
						...((_c = request.params) === null || _c === void 0 ? void 0 : _c._meta) || {},
						progressToken: messageId
					}
				};
			}
			const cancel = (reason) => {
				var _a$1;
				this._responseHandlers.delete(messageId);
				this._progressHandlers.delete(messageId);
				this._cleanupTimeout(messageId);
				(_a$1 = this._transport) === null || _a$1 === void 0 || _a$1.send({
					jsonrpc: "2.0",
					method: "notifications/cancelled",
					params: {
						requestId: messageId,
						reason: String(reason)
					}
				}, {
					relatedRequestId,
					resumptionToken,
					onresumptiontoken
				}).catch((error) => this._onerror(/* @__PURE__ */ new Error(`Failed to send cancellation: ${error}`)));
				reject(reason);
			};
			this._responseHandlers.set(messageId, (response) => {
				var _a$1;
				if ((_a$1 = options === null || options === void 0 ? void 0 : options.signal) === null || _a$1 === void 0 ? void 0 : _a$1.aborted) return;
				if (response instanceof Error) return reject(response);
				try {
					const result = resultSchema.parse(response.result);
					resolve$4(result);
				} catch (error) {
					reject(error);
				}
			});
			(_d = options === null || options === void 0 ? void 0 : options.signal) === null || _d === void 0 || _d.addEventListener("abort", () => {
				var _a$1;
				cancel((_a$1 = options === null || options === void 0 ? void 0 : options.signal) === null || _a$1 === void 0 ? void 0 : _a$1.reason);
			});
			const timeout = (_e = options === null || options === void 0 ? void 0 : options.timeout) !== null && _e !== void 0 ? _e : DEFAULT_REQUEST_TIMEOUT_MSEC;
			const timeoutHandler = () => cancel(new McpError(ErrorCode.RequestTimeout, "Request timed out", { timeout }));
			this._setupTimeout(messageId, timeout, options === null || options === void 0 ? void 0 : options.maxTotalTimeout, timeoutHandler, (_f = options === null || options === void 0 ? void 0 : options.resetTimeoutOnProgress) !== null && _f !== void 0 ? _f : false);
			this._transport.send(jsonrpcRequest, {
				relatedRequestId,
				resumptionToken,
				onresumptiontoken
			}).catch((error) => {
				this._cleanupTimeout(messageId);
				reject(error);
			});
		});
	}
	/**
	* Emits a notification, which is a one-way message that does not expect a response.
	*/
	async notification(notification, options) {
		if (!this._transport) throw new Error("Not connected");
		this.assertNotificationCapability(notification.method);
		const jsonrpcNotification = {
			...notification,
			jsonrpc: "2.0"
		};
		await this._transport.send(jsonrpcNotification, options);
	}
	/**
	* Registers a handler to invoke when this protocol object receives a request with the given method.
	*
	* Note that this will replace any previous request handler for the same method.
	*/
	setRequestHandler(requestSchema, handler) {
		const method = requestSchema.shape.method.value;
		this.assertRequestHandlerCapability(method);
		this._requestHandlers.set(method, (request, extra) => {
			return Promise.resolve(handler(requestSchema.parse(request), extra));
		});
	}
	/**
	* Removes the request handler for the given method.
	*/
	removeRequestHandler(method) {
		this._requestHandlers.delete(method);
	}
	/**
	* Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
	*/
	assertCanSetRequestHandler(method) {
		if (this._requestHandlers.has(method)) throw new Error(`A request handler for ${method} already exists, which would be overridden`);
	}
	/**
	* Registers a handler to invoke when this protocol object receives a notification with the given method.
	*
	* Note that this will replace any previous notification handler for the same method.
	*/
	setNotificationHandler(notificationSchema, handler) {
		this._notificationHandlers.set(notificationSchema.shape.method.value, (notification) => Promise.resolve(handler(notificationSchema.parse(notification))));
	}
	/**
	* Removes the notification handler for the given method.
	*/
	removeNotificationHandler(method) {
		this._notificationHandlers.delete(method);
	}
};
function mergeCapabilities(base, additional) {
	return Object.entries(additional).reduce((acc, [key, value]) => {
		if (value && typeof value === "object") acc[key] = acc[key] ? {
			...acc[key],
			...value
		} : value;
		else acc[key] = value;
		return acc;
	}, { ...base });
}
var require_uri_all = __commonJSMin((exports, module) => {
	/** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
	(function(global, factory) {
		typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : factory(global.URI = global.URI || {});
	})(void 0, function(exports$1) {
		"use strict";
		function merge() {
			for (var _len = arguments.length, sets = Array(_len), _key = 0; _key < _len; _key++) sets[_key] = arguments[_key];
			if (sets.length > 1) {
				sets[0] = sets[0].slice(0, -1);
				var xl = sets.length - 1;
				for (var x = 1; x < xl; ++x) sets[x] = sets[x].slice(1, -1);
				sets[xl] = sets[xl].slice(1);
				return sets.join("");
			} else return sets[0];
		}
		function subexp(str) {
			return "(?:" + str + ")";
		}
		function typeOf(o) {
			return o === void 0 ? "undefined" : o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase();
		}
		function toUpperCase(str) {
			return str.toUpperCase();
		}
		function toArray(obj) {
			return obj !== void 0 && obj !== null ? obj instanceof Array ? obj : typeof obj.length !== "number" || obj.split || obj.setInterval || obj.call ? [obj] : Array.prototype.slice.call(obj) : [];
		}
		function assign(target, source) {
			var obj = target;
			if (source) for (var key in source) obj[key] = source[key];
			return obj;
		}
		function buildExps(isIRI$1) {
			var ALPHA$$ = "[A-Za-z]", CR$ = "[\\x0D]", DIGIT$$ = "[0-9]", DQUOTE$$ = "[\\x22]", HEXDIG$$$1 = merge(DIGIT$$, "[A-Fa-f]"), LF$$ = "[\\x0A]", SP$$ = "[\\x20]", PCT_ENCODED$$1 = subexp(subexp("%[EFef]" + HEXDIG$$$1 + "%" + HEXDIG$$$1 + HEXDIG$$$1 + "%" + HEXDIG$$$1 + HEXDIG$$$1) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$$1 + "%" + HEXDIG$$$1 + HEXDIG$$$1) + "|" + subexp("%" + HEXDIG$$$1 + HEXDIG$$$1)), GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]", SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]", RESERVED$$ = merge(GEN_DELIMS$$, SUB_DELIMS$$), UCSCHAR$$ = isIRI$1 ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]", IPRIVATE$$ = isIRI$1 ? "[\\uE000-\\uF8FF]" : "[]", UNRESERVED$$$1 = merge(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$), SCHEME$ = subexp(ALPHA$$ + merge(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*"), USERINFO$ = subexp(subexp(PCT_ENCODED$$1 + "|" + merge(UNRESERVED$$$1, SUB_DELIMS$$, "[\\:]")) + "*"), DEC_OCTET$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("[1-9]" + DIGIT$$) + "|" + DIGIT$$), DEC_OCTET_RELAXED$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("0?[1-9]" + DIGIT$$) + "|0?0?" + DIGIT$$), IPV4ADDRESS$ = subexp(DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$), H16$ = subexp(HEXDIG$$$1 + "{1,4}"), LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$), IPV6ADDRESS1$ = subexp(subexp(H16$ + "\\:") + "{6}" + LS32$), IPV6ADDRESS2$ = subexp("\\:\\:" + subexp(H16$ + "\\:") + "{5}" + LS32$), IPV6ADDRESS3$ = subexp(subexp(H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{4}" + LS32$), IPV6ADDRESS4$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,1}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{3}" + LS32$), IPV6ADDRESS5$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,2}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{2}" + LS32$), IPV6ADDRESS6$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,3}" + H16$) + "?\\:\\:" + H16$ + "\\:" + LS32$), IPV6ADDRESS7$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,4}" + H16$) + "?\\:\\:" + LS32$), IPV6ADDRESS8$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,5}" + H16$) + "?\\:\\:" + H16$), IPV6ADDRESS9$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,6}" + H16$) + "?\\:\\:"), IPV6ADDRESS$ = subexp([
				IPV6ADDRESS1$,
				IPV6ADDRESS2$,
				IPV6ADDRESS3$,
				IPV6ADDRESS4$,
				IPV6ADDRESS5$,
				IPV6ADDRESS6$,
				IPV6ADDRESS7$,
				IPV6ADDRESS8$,
				IPV6ADDRESS9$
			].join("|")), ZONEID$ = subexp(subexp(UNRESERVED$$$1 + "|" + PCT_ENCODED$$1) + "+"), IPV6ADDRZ$ = subexp(IPV6ADDRESS$ + "\\%25" + ZONEID$), IPV6ADDRZ_RELAXED$ = subexp(IPV6ADDRESS$ + subexp("\\%25|\\%(?!" + HEXDIG$$$1 + "{2})") + ZONEID$), IPVFUTURE$ = subexp("[vV]" + HEXDIG$$$1 + "+\\." + merge(UNRESERVED$$$1, SUB_DELIMS$$, "[\\:]") + "+"), IP_LITERAL$ = subexp("\\[" + subexp(IPV6ADDRZ_RELAXED$ + "|" + IPV6ADDRESS$ + "|" + IPVFUTURE$) + "\\]"), REG_NAME$ = subexp(subexp(PCT_ENCODED$$1 + "|" + merge(UNRESERVED$$$1, SUB_DELIMS$$)) + "*"), HOST$ = subexp(IP_LITERAL$ + "|" + IPV4ADDRESS$ + "(?!" + REG_NAME$ + ")|" + REG_NAME$), PORT$ = subexp(DIGIT$$ + "*"), AUTHORITY$ = subexp(subexp(USERINFO$ + "@") + "?" + HOST$ + subexp("\\:" + PORT$) + "?"), PCHAR$ = subexp(PCT_ENCODED$$1 + "|" + merge(UNRESERVED$$$1, SUB_DELIMS$$, "[\\:\\@]")), SEGMENT$ = subexp(PCHAR$ + "*"), SEGMENT_NZ$ = subexp(PCHAR$ + "+"), SEGMENT_NZ_NC$ = subexp(subexp(PCT_ENCODED$$1 + "|" + merge(UNRESERVED$$$1, SUB_DELIMS$$, "[\\@]")) + "+"), PATH_ABEMPTY$ = subexp(subexp("\\/" + SEGMENT$) + "*"), PATH_ABSOLUTE$ = subexp("\\/" + subexp(SEGMENT_NZ$ + PATH_ABEMPTY$) + "?"), PATH_NOSCHEME$ = subexp(SEGMENT_NZ_NC$ + PATH_ABEMPTY$), PATH_ROOTLESS$ = subexp(SEGMENT_NZ$ + PATH_ABEMPTY$), PATH_EMPTY$ = "(?!" + PCHAR$ + ")", PATH$ = subexp(PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$), QUERY$ = subexp(subexp(PCHAR$ + "|" + merge("[\\/\\?]", IPRIVATE$$)) + "*"), FRAGMENT$ = subexp(subexp(PCHAR$ + "|[\\/\\?]") + "*"), HIER_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$), URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"), RELATIVE_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$), RELATIVE$ = subexp(RELATIVE_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"), URI_REFERENCE$ = subexp(URI$ + "|" + RELATIVE$), ABSOLUTE_URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?"), GENERIC_REF$ = "^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", RELATIVE_REF$ = "^(){0}" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", ABSOLUTE_REF$ = "^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?$", SAMEDOC_REF$ = "^" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", AUTHORITY_REF$ = "^" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?$";
			return {
				NOT_SCHEME: new RegExp(merge("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
				NOT_USERINFO: new RegExp(merge("[^\\%\\:]", UNRESERVED$$$1, SUB_DELIMS$$), "g"),
				NOT_HOST: new RegExp(merge("[^\\%\\[\\]\\:]", UNRESERVED$$$1, SUB_DELIMS$$), "g"),
				NOT_PATH: new RegExp(merge("[^\\%\\/\\:\\@]", UNRESERVED$$$1, SUB_DELIMS$$), "g"),
				NOT_PATH_NOSCHEME: new RegExp(merge("[^\\%\\/\\@]", UNRESERVED$$$1, SUB_DELIMS$$), "g"),
				NOT_QUERY: new RegExp(merge("[^\\%]", UNRESERVED$$$1, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
				NOT_FRAGMENT: new RegExp(merge("[^\\%]", UNRESERVED$$$1, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
				ESCAPE: new RegExp(merge("[^]", UNRESERVED$$$1, SUB_DELIMS$$), "g"),
				UNRESERVED: new RegExp(UNRESERVED$$$1, "g"),
				OTHER_CHARS: new RegExp(merge("[^\\%]", UNRESERVED$$$1, RESERVED$$), "g"),
				PCT_ENCODED: new RegExp(PCT_ENCODED$$1, "g"),
				IPV4ADDRESS: /* @__PURE__ */ new RegExp("^(" + IPV4ADDRESS$ + ")$"),
				IPV6ADDRESS: /* @__PURE__ */ new RegExp("^\\[?(" + IPV6ADDRESS$ + ")" + subexp(subexp("\\%25|\\%(?!" + HEXDIG$$$1 + "{2})") + "(" + ZONEID$ + ")") + "?\\]?$")
			};
		}
		var URI_PROTOCOL = buildExps(false);
		var IRI_PROTOCOL = buildExps(true);
		var slicedToArray = function() {
			function sliceIterator(arr, i) {
				var _arr = [];
				var _n = true;
				var _d = false;
				var _e = void 0;
				try {
					for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
						_arr.push(_s.value);
						if (i && _arr.length === i) break;
					}
				} catch (err) {
					_d = true;
					_e = err;
				} finally {
					try {
						if (!_n && _i["return"]) _i["return"]();
					} finally {
						if (_d) throw _e;
					}
				}
				return _arr;
			}
			return function(arr, i) {
				if (Array.isArray(arr)) return arr;
				else if (Symbol.iterator in Object(arr)) return sliceIterator(arr, i);
				else throw new TypeError("Invalid attempt to destructure non-iterable instance");
			};
		}();
		var toConsumableArray = function(arr) {
			if (Array.isArray(arr)) {
				for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];
				return arr2;
			} else return Array.from(arr);
		};
		/** Highest positive signed 32-bit float value */
		var maxInt = 2147483647;
		/** Bootstring parameters */
		var base = 36;
		var tMin = 1;
		var tMax = 26;
		var skew = 38;
		var damp = 700;
		var initialBias = 72;
		var initialN = 128;
		var delimiter = "-";
		/** Regular expressions */
		var regexPunycode = /^xn--/;
		var regexNonASCII = /[^\0-\x7E]/;
		var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
		/** Error messages */
		var errors = {
			"overflow": "Overflow: input needs wider integers to process",
			"not-basic": "Illegal input >= 0x80 (not a basic code point)",
			"invalid-input": "Invalid input"
		};
		/** Convenience shortcuts */
		var baseMinusTMin = base - tMin;
		var floor = Math.floor;
		var stringFromCharCode = String.fromCharCode;
		/**
		* A generic error utility function.
		* @private
		* @param {String} type The error type.
		* @returns {Error} Throws a `RangeError` with the applicable error message.
		*/
		function error$1(type) {
			throw new RangeError(errors[type]);
		}
		/**
		* A generic `Array#map` utility function.
		* @private
		* @param {Array} array The array to iterate over.
		* @param {Function} callback The function that gets called for every array
		* item.
		* @returns {Array} A new array of values returned by the callback function.
		*/
		function map(array, fn) {
			var result = [];
			var length = array.length;
			while (length--) result[length] = fn(array[length]);
			return result;
		}
		/**
		* A simple `Array#map`-like wrapper to work with domain name strings or email
		* addresses.
		* @private
		* @param {String} domain The domain name or email address.
		* @param {Function} callback The function that gets called for every
		* character.
		* @returns {Array} A new string of characters returned by the callback
		* function.
		*/
		function mapDomain(string, fn) {
			var parts = string.split("@");
			var result = "";
			if (parts.length > 1) {
				result = parts[0] + "@";
				string = parts[1];
			}
			string = string.replace(regexSeparators, ".");
			var labels = string.split(".");
			var encoded = map(labels, fn).join(".");
			return result + encoded;
		}
		/**
		* Creates an array containing the numeric code points of each Unicode
		* character in the string. While JavaScript uses UCS-2 internally,
		* this function will convert a pair of surrogate halves (each of which
		* UCS-2 exposes as separate characters) into a single code point,
		* matching UTF-16.
		* @see `punycode.ucs2.encode`
		* @see <https://mathiasbynens.be/notes/javascript-encoding>
		* @memberOf punycode.ucs2
		* @name decode
		* @param {String} string The Unicode input string (UCS-2).
		* @returns {Array} The new array of code points.
		*/
		function ucs2decode(string) {
			var output = [];
			var counter = 0;
			var length = string.length;
			while (counter < length) {
				var value = string.charCodeAt(counter++);
				if (value >= 55296 && value <= 56319 && counter < length) {
					var extra = string.charCodeAt(counter++);
					if ((extra & 64512) == 56320) output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
					else {
						output.push(value);
						counter--;
					}
				} else output.push(value);
			}
			return output;
		}
		/**
		* Creates a string based on an array of numeric code points.
		* @see `punycode.ucs2.decode`
		* @memberOf punycode.ucs2
		* @name encode
		* @param {Array} codePoints The array of numeric code points.
		* @returns {String} The new Unicode string (UCS-2).
		*/
		var ucs2encode = function ucs2encode$1(array) {
			return String.fromCodePoint.apply(String, toConsumableArray(array));
		};
		/**
		* Converts a basic code point into a digit/integer.
		* @see `digitToBasic()`
		* @private
		* @param {Number} codePoint The basic numeric code point value.
		* @returns {Number} The numeric value of a basic code point (for use in
		* representing integers) in the range `0` to `base - 1`, or `base` if
		* the code point does not represent a value.
		*/
		var basicToDigit = function basicToDigit$1(codePoint) {
			if (codePoint - 48 < 10) return codePoint - 22;
			if (codePoint - 65 < 26) return codePoint - 65;
			if (codePoint - 97 < 26) return codePoint - 97;
			return base;
		};
		/**
		* Converts a digit/integer into a basic code point.
		* @see `basicToDigit()`
		* @private
		* @param {Number} digit The numeric value of a basic code point.
		* @returns {Number} The basic code point whose value (when used for
		* representing integers) is `digit`, which needs to be in the range
		* `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		* used; else, the lowercase form is used. The behavior is undefined
		* if `flag` is non-zero and `digit` has no uppercase form.
		*/
		var digitToBasic = function digitToBasic$1(digit, flag) {
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		};
		/**
		* Bias adaptation function as per section 3.4 of RFC 3492.
		* https://tools.ietf.org/html/rfc3492#section-3.4
		* @private
		*/
		var adapt = function adapt$1(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (; delta > baseMinusTMin * tMax >> 1; k += base) delta = floor(delta / baseMinusTMin);
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		};
		/**
		* Converts a Punycode string of ASCII-only symbols to a string of Unicode
		* symbols.
		* @memberOf punycode
		* @param {String} input The Punycode string of ASCII-only symbols.
		* @returns {String} The resulting string of Unicode symbols.
		*/
		var decode = function decode$1(input) {
			var output = [];
			var inputLength = input.length;
			var i = 0;
			var n = initialN;
			var bias = initialBias;
			var basic = input.lastIndexOf(delimiter);
			if (basic < 0) basic = 0;
			for (var j = 0; j < basic; ++j) {
				if (input.charCodeAt(j) >= 128) error$1("not-basic");
				output.push(input.charCodeAt(j));
			}
			for (var index = basic > 0 ? basic + 1 : 0; index < inputLength;) {
				var oldi = i;
				for (var w = 1, k = base;; k += base) {
					if (index >= inputLength) error$1("invalid-input");
					var digit = basicToDigit(input.charCodeAt(index++));
					if (digit >= base || digit > floor((maxInt - i) / w)) error$1("overflow");
					i += digit * w;
					var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
					if (digit < t) break;
					var baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) error$1("overflow");
					w *= baseMinusT;
				}
				var out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);
				if (floor(i / out) > maxInt - n) error$1("overflow");
				n += floor(i / out);
				i %= out;
				output.splice(i++, 0, n);
			}
			return String.fromCodePoint.apply(String, output);
		};
		/**
		* Converts a string of Unicode symbols (e.g. a domain name label) to a
		* Punycode string of ASCII-only symbols.
		* @memberOf punycode
		* @param {String} input The string of Unicode symbols.
		* @returns {String} The resulting Punycode string of ASCII-only symbols.
		*/
		var encode = function encode$1(input) {
			var output = [];
			input = ucs2decode(input);
			var inputLength = input.length;
			var n = initialN;
			var delta = 0;
			var bias = initialBias;
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = void 0;
			try {
				for (var _iterator = input[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var _currentValue2 = _step.value;
					if (_currentValue2 < 128) output.push(stringFromCharCode(_currentValue2));
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) _iterator.return();
				} finally {
					if (_didIteratorError) throw _iteratorError;
				}
			}
			var basicLength = output.length;
			var handledCPCount = basicLength;
			if (basicLength) output.push(delimiter);
			while (handledCPCount < inputLength) {
				var m = maxInt;
				var _iteratorNormalCompletion2 = true;
				var _didIteratorError2 = false;
				var _iteratorError2 = void 0;
				try {
					for (var _iterator2 = input[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
						var currentValue = _step2.value;
						if (currentValue >= n && currentValue < m) m = currentValue;
					}
				} catch (err) {
					_didIteratorError2 = true;
					_iteratorError2 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion2 && _iterator2.return) _iterator2.return();
					} finally {
						if (_didIteratorError2) throw _iteratorError2;
					}
				}
				var handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) error$1("overflow");
				delta += (m - n) * handledCPCountPlusOne;
				n = m;
				var _iteratorNormalCompletion3 = true;
				var _didIteratorError3 = false;
				var _iteratorError3 = void 0;
				try {
					for (var _iterator3 = input[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
						var _currentValue = _step3.value;
						if (_currentValue < n && ++delta > maxInt) error$1("overflow");
						if (_currentValue == n) {
							var q = delta;
							for (var k = base;; k += base) {
								var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
								if (q < t) break;
								var qMinusT = q - t;
								var baseMinusT = base - t;
								output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
								q = floor(qMinusT / baseMinusT);
							}
							output.push(stringFromCharCode(digitToBasic(q, 0)));
							bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
							delta = 0;
							++handledCPCount;
						}
					}
				} catch (err) {
					_didIteratorError3 = true;
					_iteratorError3 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion3 && _iterator3.return) _iterator3.return();
					} finally {
						if (_didIteratorError3) throw _iteratorError3;
					}
				}
				++delta;
				++n;
			}
			return output.join("");
		};
		/**
		* Converts a Punycode string representing a domain name or an email address
		* to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		* it doesn't matter if you call it on a string that has already been
		* converted to Unicode.
		* @memberOf punycode
		* @param {String} input The Punycoded domain name or email address to
		* convert to Unicode.
		* @returns {String} The Unicode representation of the given Punycode
		* string.
		*/
		var toUnicode = function toUnicode$1(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
			});
		};
		/**
		* Converts a Unicode string representing a domain name or an email address to
		* Punycode. Only the non-ASCII parts of the domain name will be converted,
		* i.e. it doesn't matter if you call it with a domain that's already in
		* ASCII.
		* @memberOf punycode
		* @param {String} input The domain name or email address to convert, as a
		* Unicode string.
		* @returns {String} The Punycode representation of the given domain name or
		* email address.
		*/
		var toASCII = function toASCII$1(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
			});
		};
		/** Define the public API */
		var punycode = {
			"version": "2.1.0",
			"ucs2": {
				"decode": ucs2decode,
				"encode": ucs2encode
			},
			"decode": decode,
			"encode": encode,
			"toASCII": toASCII,
			"toUnicode": toUnicode
		};
		/**
		* URI.js
		*
		* @fileoverview An RFC 3986 compliant, scheme extendable URI parsing/validating/resolving library for JavaScript.
		* @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
		* @see http://github.com/garycourt/uri-js
		*/
		/**
		* Copyright 2011 Gary Court. All rights reserved.
		*
		* Redistribution and use in source and binary forms, with or without modification, are
		* permitted provided that the following conditions are met:
		*
		*    1. Redistributions of source code must retain the above copyright notice, this list of
		*       conditions and the following disclaimer.
		*
		*    2. Redistributions in binary form must reproduce the above copyright notice, this list
		*       of conditions and the following disclaimer in the documentation and/or other materials
		*       provided with the distribution.
		*
		* THIS SOFTWARE IS PROVIDED BY GARY COURT ``AS IS'' AND ANY EXPRESS OR IMPLIED
		* WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
		* FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GARY COURT OR
		* CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
		* CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
		* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
		* ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
		* NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
		* ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
		*
		* The views and conclusions contained in the software and documentation are those of the
		* authors and should not be interpreted as representing official policies, either expressed
		* or implied, of Gary Court.
		*/
		var SCHEMES = {};
		function pctEncChar(chr) {
			var c = chr.charCodeAt(0);
			var e = void 0;
			if (c < 16) e = "%0" + c.toString(16).toUpperCase();
			else if (c < 128) e = "%" + c.toString(16).toUpperCase();
			else if (c < 2048) e = "%" + (c >> 6 | 192).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
			else e = "%" + (c >> 12 | 224).toString(16).toUpperCase() + "%" + (c >> 6 & 63 | 128).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
			return e;
		}
		function pctDecChars(str) {
			var newStr = "";
			var i = 0;
			var il = str.length;
			while (i < il) {
				var c = parseInt(str.substr(i + 1, 2), 16);
				if (c < 128) {
					newStr += String.fromCharCode(c);
					i += 3;
				} else if (c >= 194 && c < 224) {
					if (il - i >= 6) {
						var c2 = parseInt(str.substr(i + 4, 2), 16);
						newStr += String.fromCharCode((c & 31) << 6 | c2 & 63);
					} else newStr += str.substr(i, 6);
					i += 6;
				} else if (c >= 224) {
					if (il - i >= 9) {
						var _c = parseInt(str.substr(i + 4, 2), 16);
						var c3 = parseInt(str.substr(i + 7, 2), 16);
						newStr += String.fromCharCode((c & 15) << 12 | (_c & 63) << 6 | c3 & 63);
					} else newStr += str.substr(i, 9);
					i += 9;
				} else {
					newStr += str.substr(i, 3);
					i += 3;
				}
			}
			return newStr;
		}
		function _normalizeComponentEncoding(components, protocol) {
			function decodeUnreserved$1(str) {
				var decStr = pctDecChars(str);
				return !decStr.match(protocol.UNRESERVED) ? str : decStr;
			}
			if (components.scheme) components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved$1).toLowerCase().replace(protocol.NOT_SCHEME, "");
			if (components.userinfo !== void 0) components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved$1).replace(protocol.NOT_USERINFO, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
			if (components.host !== void 0) components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved$1).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
			if (components.path !== void 0) components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved$1).replace(components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
			if (components.query !== void 0) components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved$1).replace(protocol.NOT_QUERY, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
			if (components.fragment !== void 0) components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved$1).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
			return components;
		}
		function _stripLeadingZeros(str) {
			return str.replace(/^0*(.*)/, "$1") || "0";
		}
		function _normalizeIPv4(host, protocol) {
			var matches = host.match(protocol.IPV4ADDRESS) || [];
			var _matches = slicedToArray(matches, 2), address = _matches[1];
			if (address) return address.split(".").map(_stripLeadingZeros).join(".");
			else return host;
		}
		function _normalizeIPv6(host, protocol) {
			var matches = host.match(protocol.IPV6ADDRESS) || [];
			var _matches2 = slicedToArray(matches, 3), address = _matches2[1], zone = _matches2[2];
			if (address) {
				var _address$toLowerCase$ = address.toLowerCase().split("::").reverse(), _address$toLowerCase$2 = slicedToArray(_address$toLowerCase$, 2), last = _address$toLowerCase$2[0], first = _address$toLowerCase$2[1];
				var firstFields = first ? first.split(":").map(_stripLeadingZeros) : [];
				var lastFields = last.split(":").map(_stripLeadingZeros);
				var isLastFieldIPv4Address = protocol.IPV4ADDRESS.test(lastFields[lastFields.length - 1]);
				var fieldCount = isLastFieldIPv4Address ? 7 : 8;
				var lastFieldsStart = lastFields.length - fieldCount;
				var fields = Array(fieldCount);
				for (var x = 0; x < fieldCount; ++x) fields[x] = firstFields[x] || lastFields[lastFieldsStart + x] || "";
				if (isLastFieldIPv4Address) fields[fieldCount - 1] = _normalizeIPv4(fields[fieldCount - 1], protocol);
				var allZeroFields = fields.reduce(function(acc, field, index) {
					if (!field || field === "0") {
						var lastLongest = acc[acc.length - 1];
						if (lastLongest && lastLongest.index + lastLongest.length === index) lastLongest.length++;
						else acc.push({
							index,
							length: 1
						});
					}
					return acc;
				}, []);
				var longestZeroFields = allZeroFields.sort(function(a, b) {
					return b.length - a.length;
				})[0];
				var newHost = void 0;
				if (longestZeroFields && longestZeroFields.length > 1) {
					var newFirst = fields.slice(0, longestZeroFields.index);
					var newLast = fields.slice(longestZeroFields.index + longestZeroFields.length);
					newHost = newFirst.join(":") + "::" + newLast.join(":");
				} else newHost = fields.join(":");
				if (zone) newHost += "%" + zone;
				return newHost;
			} else return host;
		}
		var URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i;
		var NO_MATCH_IS_UNDEFINED = "".match(/(){0}/)[1] === void 0;
		function parse(uriString) {
			var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
			var components = {};
			var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
			if (options.reference === "suffix") uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
			var matches = uriString.match(URI_PARSE);
			if (matches) {
				if (NO_MATCH_IS_UNDEFINED) {
					components.scheme = matches[1];
					components.userinfo = matches[3];
					components.host = matches[4];
					components.port = parseInt(matches[5], 10);
					components.path = matches[6] || "";
					components.query = matches[7];
					components.fragment = matches[8];
					if (isNaN(components.port)) components.port = matches[5];
				} else {
					components.scheme = matches[1] || void 0;
					components.userinfo = uriString.indexOf("@") !== -1 ? matches[3] : void 0;
					components.host = uriString.indexOf("//") !== -1 ? matches[4] : void 0;
					components.port = parseInt(matches[5], 10);
					components.path = matches[6] || "";
					components.query = uriString.indexOf("?") !== -1 ? matches[7] : void 0;
					components.fragment = uriString.indexOf("#") !== -1 ? matches[8] : void 0;
					if (isNaN(components.port)) components.port = uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : void 0;
				}
				if (components.host) components.host = _normalizeIPv6(_normalizeIPv4(components.host, protocol), protocol);
				if (components.scheme === void 0 && components.userinfo === void 0 && components.host === void 0 && components.port === void 0 && !components.path && components.query === void 0) components.reference = "same-document";
				else if (components.scheme === void 0) components.reference = "relative";
				else if (components.fragment === void 0) components.reference = "absolute";
				else components.reference = "uri";
				if (options.reference && options.reference !== "suffix" && options.reference !== components.reference) components.error = components.error || "URI is not a " + options.reference + " reference.";
				var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
				if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
					if (components.host && (options.domainHost || schemeHandler && schemeHandler.domainHost)) try {
						components.host = punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());
					} catch (e) {
						components.error = components.error || "Host's domain name can not be converted to ASCII via punycode: " + e;
					}
					_normalizeComponentEncoding(components, URI_PROTOCOL);
				} else _normalizeComponentEncoding(components, protocol);
				if (schemeHandler && schemeHandler.parse) schemeHandler.parse(components, options);
			} else components.error = components.error || "URI can not be parsed.";
			return components;
		}
		function _recomposeAuthority(components, options) {
			var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
			var uriTokens = [];
			if (components.userinfo !== void 0) {
				uriTokens.push(components.userinfo);
				uriTokens.push("@");
			}
			if (components.host !== void 0) uriTokens.push(_normalizeIPv6(_normalizeIPv4(String(components.host), protocol), protocol).replace(protocol.IPV6ADDRESS, function(_, $1, $2) {
				return "[" + $1 + ($2 ? "%25" + $2 : "") + "]";
			}));
			if (typeof components.port === "number" || typeof components.port === "string") {
				uriTokens.push(":");
				uriTokens.push(String(components.port));
			}
			return uriTokens.length ? uriTokens.join("") : void 0;
		}
		var RDS1 = /^\.\.?\//;
		var RDS2 = /^\/\.(\/|$)/;
		var RDS3 = /^\/\.\.(\/|$)/;
		var RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/;
		function removeDotSegments(input) {
			var output = [];
			while (input.length) if (input.match(RDS1)) input = input.replace(RDS1, "");
			else if (input.match(RDS2)) input = input.replace(RDS2, "/");
			else if (input.match(RDS3)) {
				input = input.replace(RDS3, "/");
				output.pop();
			} else if (input === "." || input === "..") input = "";
			else {
				var im = input.match(RDS5);
				if (im) {
					var s = im[0];
					input = input.slice(s.length);
					output.push(s);
				} else throw new Error("Unexpected dot segment condition");
			}
			return output.join("");
		}
		function serialize(components) {
			var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
			var protocol = options.iri ? IRI_PROTOCOL : URI_PROTOCOL;
			var uriTokens = [];
			var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
			if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options);
			if (components.host) {
				if (protocol.IPV6ADDRESS.test(components.host)) {} else if (options.domainHost || schemeHandler && schemeHandler.domainHost) try {
					components.host = !options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host);
				} catch (e) {
					components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
				}
			}
			_normalizeComponentEncoding(components, protocol);
			if (options.reference !== "suffix" && components.scheme) {
				uriTokens.push(components.scheme);
				uriTokens.push(":");
			}
			var authority = _recomposeAuthority(components, options);
			if (authority !== void 0) {
				if (options.reference !== "suffix") uriTokens.push("//");
				uriTokens.push(authority);
				if (components.path && components.path.charAt(0) !== "/") uriTokens.push("/");
			}
			if (components.path !== void 0) {
				var s = components.path;
				if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) s = removeDotSegments(s);
				if (authority === void 0) s = s.replace(/^\/\//, "/%2F");
				uriTokens.push(s);
			}
			if (components.query !== void 0) {
				uriTokens.push("?");
				uriTokens.push(components.query);
			}
			if (components.fragment !== void 0) {
				uriTokens.push("#");
				uriTokens.push(components.fragment);
			}
			return uriTokens.join("");
		}
		function resolveComponents(base$1, relative) {
			var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
			var skipNormalization = arguments[3];
			var target = {};
			if (!skipNormalization) {
				base$1 = parse(serialize(base$1, options), options);
				relative = parse(serialize(relative, options), options);
			}
			options = options || {};
			if (!options.tolerant && relative.scheme) {
				target.scheme = relative.scheme;
				target.userinfo = relative.userinfo;
				target.host = relative.host;
				target.port = relative.port;
				target.path = removeDotSegments(relative.path || "");
				target.query = relative.query;
			} else {
				if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
					target.userinfo = relative.userinfo;
					target.host = relative.host;
					target.port = relative.port;
					target.path = removeDotSegments(relative.path || "");
					target.query = relative.query;
				} else {
					if (!relative.path) {
						target.path = base$1.path;
						if (relative.query !== void 0) target.query = relative.query;
						else target.query = base$1.query;
					} else {
						if (relative.path.charAt(0) === "/") target.path = removeDotSegments(relative.path);
						else {
							if ((base$1.userinfo !== void 0 || base$1.host !== void 0 || base$1.port !== void 0) && !base$1.path) target.path = "/" + relative.path;
							else if (!base$1.path) target.path = relative.path;
							else target.path = base$1.path.slice(0, base$1.path.lastIndexOf("/") + 1) + relative.path;
							target.path = removeDotSegments(target.path);
						}
						target.query = relative.query;
					}
					target.userinfo = base$1.userinfo;
					target.host = base$1.host;
					target.port = base$1.port;
				}
				target.scheme = base$1.scheme;
			}
			target.fragment = relative.fragment;
			return target;
		}
		function resolve$4(baseURI, relativeURI, options) {
			var schemelessOptions = assign({ scheme: "null" }, options);
			return serialize(resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true), schemelessOptions);
		}
		function normalize(uri$1, options) {
			if (typeof uri$1 === "string") uri$1 = serialize(parse(uri$1, options), options);
			else if (typeOf(uri$1) === "object") uri$1 = parse(serialize(uri$1, options), options);
			return uri$1;
		}
		function equal$2(uriA, uriB, options) {
			if (typeof uriA === "string") uriA = serialize(parse(uriA, options), options);
			else if (typeOf(uriA) === "object") uriA = serialize(uriA, options);
			if (typeof uriB === "string") uriB = serialize(parse(uriB, options), options);
			else if (typeOf(uriB) === "object") uriB = serialize(uriB, options);
			return uriA === uriB;
		}
		function escapeComponent(str, options) {
			return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE, pctEncChar);
		}
		function unescapeComponent(str, options) {
			return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED, pctDecChars);
		}
		var handler = {
			scheme: "http",
			domainHost: true,
			parse: function parse$1(components, options) {
				if (!components.host) components.error = components.error || "HTTP URIs must have a host.";
				return components;
			},
			serialize: function serialize$1(components, options) {
				var secure = String(components.scheme).toLowerCase() === "https";
				if (components.port === (secure ? 443 : 80) || components.port === "") components.port = void 0;
				if (!components.path) components.path = "/";
				return components;
			}
		};
		var handler$1 = {
			scheme: "https",
			domainHost: handler.domainHost,
			parse: handler.parse,
			serialize: handler.serialize
		};
		function isSecure(wsComponents) {
			return typeof wsComponents.secure === "boolean" ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
		}
		var handler$2 = {
			scheme: "ws",
			domainHost: true,
			parse: function parse$1(components, options) {
				var wsComponents = components;
				wsComponents.secure = isSecure(wsComponents);
				wsComponents.resourceName = (wsComponents.path || "/") + (wsComponents.query ? "?" + wsComponents.query : "");
				wsComponents.path = void 0;
				wsComponents.query = void 0;
				return wsComponents;
			},
			serialize: function serialize$1(wsComponents, options) {
				if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") wsComponents.port = void 0;
				if (typeof wsComponents.secure === "boolean") {
					wsComponents.scheme = wsComponents.secure ? "wss" : "ws";
					wsComponents.secure = void 0;
				}
				if (wsComponents.resourceName) {
					var _wsComponents$resourc = wsComponents.resourceName.split("?"), _wsComponents$resourc2 = slicedToArray(_wsComponents$resourc, 2), path = _wsComponents$resourc2[0], query = _wsComponents$resourc2[1];
					wsComponents.path = path && path !== "/" ? path : void 0;
					wsComponents.query = query;
					wsComponents.resourceName = void 0;
				}
				wsComponents.fragment = void 0;
				return wsComponents;
			}
		};
		var handler$3 = {
			scheme: "wss",
			domainHost: handler$2.domainHost,
			parse: handler$2.parse,
			serialize: handler$2.serialize
		};
		var O = {};
		var isIRI = true;
		var UNRESERVED$$ = "[A-Za-z0-9\\-\\.\\_\\~" + (isIRI ? "\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF" : "") + "]";
		var HEXDIG$$ = "[0-9A-Fa-f]";
		var PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$));
		var ATEXT$$ = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]";
		var QTEXT$$ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]";
		var VCHAR$$ = merge(QTEXT$$, "[\\\"\\\\]");
		var SOME_DELIMS$$ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]";
		var UNRESERVED = new RegExp(UNRESERVED$$, "g");
		var PCT_ENCODED = new RegExp(PCT_ENCODED$, "g");
		var NOT_LOCAL_PART = new RegExp(merge("[^]", ATEXT$$, "[\\.]", "[\\\"]", VCHAR$$), "g");
		var NOT_HFNAME = new RegExp(merge("[^]", UNRESERVED$$, SOME_DELIMS$$), "g");
		var NOT_HFVALUE = NOT_HFNAME;
		function decodeUnreserved(str) {
			var decStr = pctDecChars(str);
			return !decStr.match(UNRESERVED) ? str : decStr;
		}
		var handler$4 = {
			scheme: "mailto",
			parse: function parse$$1(components, options) {
				var mailtoComponents = components;
				var to = mailtoComponents.to = mailtoComponents.path ? mailtoComponents.path.split(",") : [];
				mailtoComponents.path = void 0;
				if (mailtoComponents.query) {
					var unknownHeaders = false;
					var headers = {};
					var hfields = mailtoComponents.query.split("&");
					for (var x = 0, xl = hfields.length; x < xl; ++x) {
						var hfield = hfields[x].split("=");
						switch (hfield[0]) {
							case "to":
								var toAddrs = hfield[1].split(",");
								for (var _x = 0, _xl = toAddrs.length; _x < _xl; ++_x) to.push(toAddrs[_x]);
								break;
							case "subject":
								mailtoComponents.subject = unescapeComponent(hfield[1], options);
								break;
							case "body":
								mailtoComponents.body = unescapeComponent(hfield[1], options);
								break;
							default:
								unknownHeaders = true;
								headers[unescapeComponent(hfield[0], options)] = unescapeComponent(hfield[1], options);
								break;
						}
					}
					if (unknownHeaders) mailtoComponents.headers = headers;
				}
				mailtoComponents.query = void 0;
				for (var _x2 = 0, _xl2 = to.length; _x2 < _xl2; ++_x2) {
					var addr = to[_x2].split("@");
					addr[0] = unescapeComponent(addr[0]);
					if (!options.unicodeSupport) try {
						addr[1] = punycode.toASCII(unescapeComponent(addr[1], options).toLowerCase());
					} catch (e) {
						mailtoComponents.error = mailtoComponents.error || "Email address's domain name can not be converted to ASCII via punycode: " + e;
					}
					else addr[1] = unescapeComponent(addr[1], options).toLowerCase();
					to[_x2] = addr.join("@");
				}
				return mailtoComponents;
			},
			serialize: function serialize$$1(mailtoComponents, options) {
				var components = mailtoComponents;
				var to = toArray(mailtoComponents.to);
				if (to) {
					for (var x = 0, xl = to.length; x < xl; ++x) {
						var toAddr = String(to[x]);
						var atIdx = toAddr.lastIndexOf("@");
						var localPart = toAddr.slice(0, atIdx).replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_LOCAL_PART, pctEncChar);
						var domain = toAddr.slice(atIdx + 1);
						try {
							domain = !options.iri ? punycode.toASCII(unescapeComponent(domain, options).toLowerCase()) : punycode.toUnicode(domain);
						} catch (e) {
							components.error = components.error || "Email address's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
						}
						to[x] = localPart + "@" + domain;
					}
					components.path = to.join(",");
				}
				var headers = mailtoComponents.headers = mailtoComponents.headers || {};
				if (mailtoComponents.subject) headers["subject"] = mailtoComponents.subject;
				if (mailtoComponents.body) headers["body"] = mailtoComponents.body;
				var fields = [];
				for (var name$1 in headers) if (headers[name$1] !== O[name$1]) fields.push(name$1.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFNAME, pctEncChar) + "=" + headers[name$1].replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFVALUE, pctEncChar));
				if (fields.length) components.query = fields.join("&");
				return components;
			}
		};
		var URN_PARSE = /^([^\:]+)\:(.*)/;
		var handler$5 = {
			scheme: "urn",
			parse: function parse$$1(components, options) {
				var matches = components.path && components.path.match(URN_PARSE);
				var urnComponents = components;
				if (matches) {
					var scheme = options.scheme || urnComponents.scheme || "urn";
					var nid = matches[1].toLowerCase();
					var nss = matches[2];
					var urnScheme = scheme + ":" + (options.nid || nid);
					var schemeHandler = SCHEMES[urnScheme];
					urnComponents.nid = nid;
					urnComponents.nss = nss;
					urnComponents.path = void 0;
					if (schemeHandler) urnComponents = schemeHandler.parse(urnComponents, options);
				} else urnComponents.error = urnComponents.error || "URN can not be parsed.";
				return urnComponents;
			},
			serialize: function serialize$$1(urnComponents, options) {
				var scheme = options.scheme || urnComponents.scheme || "urn";
				var nid = urnComponents.nid;
				var urnScheme = scheme + ":" + (options.nid || nid);
				var schemeHandler = SCHEMES[urnScheme];
				if (schemeHandler) urnComponents = schemeHandler.serialize(urnComponents, options);
				var uriComponents = urnComponents;
				var nss = urnComponents.nss;
				uriComponents.path = (nid || options.nid) + ":" + nss;
				return uriComponents;
			}
		};
		var UUID$1 = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;
		var handler$6 = {
			scheme: "urn:uuid",
			parse: function parse$1(urnComponents, options) {
				var uuidComponents = urnComponents;
				uuidComponents.uuid = uuidComponents.nss;
				uuidComponents.nss = void 0;
				if (!options.tolerant && (!uuidComponents.uuid || !uuidComponents.uuid.match(UUID$1))) uuidComponents.error = uuidComponents.error || "UUID is not valid.";
				return uuidComponents;
			},
			serialize: function serialize$1(uuidComponents, options) {
				var urnComponents = uuidComponents;
				urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
				return urnComponents;
			}
		};
		SCHEMES[handler.scheme] = handler;
		SCHEMES[handler$1.scheme] = handler$1;
		SCHEMES[handler$2.scheme] = handler$2;
		SCHEMES[handler$3.scheme] = handler$3;
		SCHEMES[handler$4.scheme] = handler$4;
		SCHEMES[handler$5.scheme] = handler$5;
		SCHEMES[handler$6.scheme] = handler$6;
		exports$1.SCHEMES = SCHEMES;
		exports$1.pctEncChar = pctEncChar;
		exports$1.pctDecChars = pctDecChars;
		exports$1.parse = parse;
		exports$1.removeDotSegments = removeDotSegments;
		exports$1.serialize = serialize;
		exports$1.resolveComponents = resolveComponents;
		exports$1.resolve = resolve$4;
		exports$1.normalize = normalize;
		exports$1.equal = equal$2;
		exports$1.escapeComponent = escapeComponent;
		exports$1.unescapeComponent = unescapeComponent;
		Object.defineProperty(exports$1, "__esModule", { value: true });
	});
});
var require_fast_deep_equal = __commonJSMin((exports, module) => {
	module.exports = function equal$2(a, b) {
		if (a === b) return true;
		if (a && b && typeof a == "object" && typeof b == "object") {
			if (a.constructor !== b.constructor) return false;
			var length, i, keys;
			if (Array.isArray(a)) {
				length = a.length;
				if (length != b.length) return false;
				for (i = length; i-- !== 0;) if (!equal$2(a[i], b[i])) return false;
				return true;
			}
			if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
			if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
			if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
			keys = Object.keys(a);
			length = keys.length;
			if (length !== Object.keys(b).length) return false;
			for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
			for (i = length; i-- !== 0;) {
				var key = keys[i];
				if (!equal$2(a[key], b[key])) return false;
			}
			return true;
		}
		return a !== a && b !== b;
	};
});
var require_ucs2length = __commonJSMin((exports, module) => {
	module.exports = function ucs2length$1(str) {
		var length = 0, len = str.length, pos = 0, value;
		while (pos < len) {
			length++;
			value = str.charCodeAt(pos++);
			if (value >= 55296 && value <= 56319 && pos < len) {
				value = str.charCodeAt(pos);
				if ((value & 64512) == 56320) pos++;
			}
		}
		return length;
	};
});
var require_util = __commonJSMin((exports, module) => {
	module.exports = {
		copy,
		checkDataType,
		checkDataTypes,
		coerceToTypes,
		toHash: toHash$1,
		getProperty,
		escapeQuotes,
		equal: require_fast_deep_equal(),
		ucs2length: require_ucs2length(),
		varOccurences,
		varReplace,
		schemaHasRules,
		schemaHasRulesExcept,
		schemaUnknownRules,
		toQuotedString,
		getPathExpr,
		getPath: getPath$1,
		getData,
		unescapeFragment,
		unescapeJsonPointer,
		escapeFragment,
		escapeJsonPointer
	};
	function copy(o, to) {
		to = to || {};
		for (var key in o) to[key] = o[key];
		return to;
	}
	function checkDataType(dataType, data, strictNumbers, negate) {
		var EQUAL = negate ? " !== " : " === ", AND = negate ? " || " : " && ", OK = negate ? "!" : "", NOT = negate ? "" : "!";
		switch (dataType) {
			case "null": return data + EQUAL + "null";
			case "array": return OK + "Array.isArray(" + data + ")";
			case "object": return "(" + OK + data + AND + "typeof " + data + EQUAL + "\"object\"" + AND + NOT + "Array.isArray(" + data + "))";
			case "integer": return "(typeof " + data + EQUAL + "\"number\"" + AND + NOT + "(" + data + " % 1)" + AND + data + EQUAL + data + (strictNumbers ? AND + OK + "isFinite(" + data + ")" : "") + ")";
			case "number": return "(typeof " + data + EQUAL + "\"" + dataType + "\"" + (strictNumbers ? AND + OK + "isFinite(" + data + ")" : "") + ")";
			default: return "typeof " + data + EQUAL + "\"" + dataType + "\"";
		}
	}
	function checkDataTypes(dataTypes, data, strictNumbers) {
		switch (dataTypes.length) {
			case 1: return checkDataType(dataTypes[0], data, strictNumbers, true);
			default:
				var code = "";
				var types = toHash$1(dataTypes);
				if (types.array && types.object) {
					code = types.null ? "(" : "(!" + data + " || ";
					code += "typeof " + data + " !== \"object\")";
					delete types.null;
					delete types.array;
					delete types.object;
				}
				if (types.number) delete types.integer;
				for (var t in types) code += (code ? " && " : "") + checkDataType(t, data, strictNumbers, true);
				return code;
		}
	}
	var COERCE_TO_TYPES = toHash$1([
		"string",
		"number",
		"integer",
		"boolean",
		"null"
	]);
	function coerceToTypes(optionCoerceTypes, dataTypes) {
		if (Array.isArray(dataTypes)) {
			var types = [];
			for (var i = 0; i < dataTypes.length; i++) {
				var t = dataTypes[i];
				if (COERCE_TO_TYPES[t]) types[types.length] = t;
				else if (optionCoerceTypes === "array" && t === "array") types[types.length] = t;
			}
			if (types.length) return types;
		} else if (COERCE_TO_TYPES[dataTypes]) return [dataTypes];
		else if (optionCoerceTypes === "array" && dataTypes === "array") return ["array"];
	}
	function toHash$1(arr) {
		var hash = {};
		for (var i = 0; i < arr.length; i++) hash[arr[i]] = true;
		return hash;
	}
	var IDENTIFIER$1 = /^[a-z$_][a-z$_0-9]*$/i;
	var SINGLE_QUOTE = /'|\\/g;
	function getProperty(key) {
		return typeof key == "number" ? "[" + key + "]" : IDENTIFIER$1.test(key) ? "." + key : "['" + escapeQuotes(key) + "']";
	}
	function escapeQuotes(str) {
		return str.replace(SINGLE_QUOTE, "\\$&").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\f/g, "\\f").replace(/\t/g, "\\t");
	}
	function varOccurences(str, dataVar) {
		dataVar += "[^0-9]";
		var matches = str.match(new RegExp(dataVar, "g"));
		return matches ? matches.length : 0;
	}
	function varReplace(str, dataVar, expr) {
		dataVar += "([^0-9])";
		expr = expr.replace(/\$/g, "$$$$");
		return str.replace(new RegExp(dataVar, "g"), expr + "$1");
	}
	function schemaHasRules(schema, rules$1) {
		if (typeof schema == "boolean") return !schema;
		for (var key in schema) if (rules$1[key]) return true;
	}
	function schemaHasRulesExcept(schema, rules$1, exceptKeyword) {
		if (typeof schema == "boolean") return !schema && exceptKeyword != "not";
		for (var key in schema) if (key != exceptKeyword && rules$1[key]) return true;
	}
	function schemaUnknownRules(schema, rules$1) {
		if (typeof schema == "boolean") return;
		for (var key in schema) if (!rules$1[key]) return key;
	}
	function toQuotedString(str) {
		return "'" + escapeQuotes(str) + "'";
	}
	function getPathExpr(currentPath, expr, jsonPointers, isNumber) {
		var path = jsonPointers ? "'/' + " + expr + (isNumber ? "" : ".replace(/~/g, '~0').replace(/\\//g, '~1')") : isNumber ? "'[' + " + expr + " + ']'" : "'[\\'' + " + expr + " + '\\']'";
		return joinPaths(currentPath, path);
	}
	function getPath$1(currentPath, prop, jsonPointers) {
		var path = jsonPointers ? toQuotedString("/" + escapeJsonPointer(prop)) : toQuotedString(getProperty(prop));
		return joinPaths(currentPath, path);
	}
	var JSON_POINTER$1 = /^\/(?:[^~]|~0|~1)*$/;
	var RELATIVE_JSON_POINTER$1 = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
	function getData($data, lvl, paths) {
		var up, jsonPointer, data, matches;
		if ($data === "") return "rootData";
		if ($data[0] == "/") {
			if (!JSON_POINTER$1.test($data)) throw new Error("Invalid JSON-pointer: " + $data);
			jsonPointer = $data;
			data = "rootData";
		} else {
			matches = $data.match(RELATIVE_JSON_POINTER$1);
			if (!matches) throw new Error("Invalid JSON-pointer: " + $data);
			up = +matches[1];
			jsonPointer = matches[2];
			if (jsonPointer == "#") {
				if (up >= lvl) throw new Error("Cannot access property/index " + up + " levels up, current level is " + lvl);
				return paths[lvl - up];
			}
			if (up > lvl) throw new Error("Cannot access data " + up + " levels up, current level is " + lvl);
			data = "data" + (lvl - up || "");
			if (!jsonPointer) return data;
		}
		var expr = data;
		var segments = jsonPointer.split("/");
		for (var i = 0; i < segments.length; i++) {
			var segment = segments[i];
			if (segment) {
				data += getProperty(unescapeJsonPointer(segment));
				expr += " && " + data;
			}
		}
		return expr;
	}
	function joinPaths(a, b) {
		if (a == "\"\"") return b;
		return (a + " + " + b).replace(/([^\\])' \+ '/g, "$1");
	}
	function unescapeFragment(str) {
		return unescapeJsonPointer(decodeURIComponent(str));
	}
	function escapeFragment(str) {
		return encodeURIComponent(escapeJsonPointer(str));
	}
	function escapeJsonPointer(str) {
		return str.replace(/~/g, "~0").replace(/\//g, "~1");
	}
	function unescapeJsonPointer(str) {
		return str.replace(/~1/g, "/").replace(/~0/g, "~");
	}
});
var require_schema_obj = __commonJSMin((exports, module) => {
	var util$4 = require_util();
	module.exports = SchemaObject$2;
	function SchemaObject$2(obj) {
		util$4.copy(obj, this);
	}
});
var require_json_schema_traverse = __commonJSMin((exports, module) => {
	var traverse$1 = module.exports = function(schema, opts, cb) {
		if (typeof opts == "function") {
			cb = opts;
			opts = {};
		}
		cb = opts.cb || cb;
		var pre = typeof cb == "function" ? cb : cb.pre || function() {};
		var post = cb.post || function() {};
		_traverse(opts, pre, post, schema, "", schema);
	};
	traverse$1.keywords = {
		additionalItems: true,
		items: true,
		contains: true,
		additionalProperties: true,
		propertyNames: true,
		not: true
	};
	traverse$1.arrayKeywords = {
		items: true,
		allOf: true,
		anyOf: true,
		oneOf: true
	};
	traverse$1.propsKeywords = {
		definitions: true,
		properties: true,
		patternProperties: true,
		dependencies: true
	};
	traverse$1.skipKeywords = {
		default: true,
		enum: true,
		const: true,
		required: true,
		maximum: true,
		minimum: true,
		exclusiveMaximum: true,
		exclusiveMinimum: true,
		multipleOf: true,
		maxLength: true,
		minLength: true,
		pattern: true,
		format: true,
		maxItems: true,
		minItems: true,
		uniqueItems: true,
		maxProperties: true,
		minProperties: true
	};
	function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
		if (schema && typeof schema == "object" && !Array.isArray(schema)) {
			pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
			for (var key in schema) {
				var sch = schema[key];
				if (Array.isArray(sch)) {
					if (key in traverse$1.arrayKeywords) for (var i = 0; i < sch.length; i++) _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
				} else if (key in traverse$1.propsKeywords) {
					if (sch && typeof sch == "object") for (var prop in sch) _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
				} else if (key in traverse$1.keywords || opts.allKeys && !(key in traverse$1.skipKeywords)) _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
			}
			post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
		}
	}
	function escapeJsonPtr(str) {
		return str.replace(/~/g, "~0").replace(/\//g, "~1");
	}
});
var require_resolve = __commonJSMin((exports, module) => {
	var URI$1 = require_uri_all(), equal$1 = require_fast_deep_equal(), util$3 = require_util(), SchemaObject$1 = require_schema_obj(), traverse = require_json_schema_traverse();
	module.exports = resolve$3;
	resolve$3.normalizeId = normalizeId;
	resolve$3.fullPath = getFullPath;
	resolve$3.url = resolveUrl;
	resolve$3.ids = resolveIds;
	resolve$3.inlineRef = inlineRef;
	resolve$3.schema = resolveSchema;
	/**
	* [resolve and compile the references ($ref)]
	* @this   Ajv
	* @param  {Function} compile reference to schema compilation funciton (localCompile)
	* @param  {Object} root object with information about the root schema for the current schema
	* @param  {String} ref reference to resolve
	* @return {Object|Function} schema object (if the schema can be inlined) or validation function
	*/
	function resolve$3(compile$2, root, ref) {
		var refVal = this._refs[ref];
		if (typeof refVal == "string") if (this._refs[refVal]) refVal = this._refs[refVal];
		else return resolve$3.call(this, compile$2, root, refVal);
		refVal = refVal || this._schemas[ref];
		if (refVal instanceof SchemaObject$1) return inlineRef(refVal.schema, this._opts.inlineRefs) ? refVal.schema : refVal.validate || this._compile(refVal);
		var res = resolveSchema.call(this, root, ref);
		var schema, v, baseId;
		if (res) {
			schema = res.schema;
			root = res.root;
			baseId = res.baseId;
		}
		if (schema instanceof SchemaObject$1) v = schema.validate || compile$2.call(this, schema.schema, root, void 0, baseId);
		else if (schema !== void 0) v = inlineRef(schema, this._opts.inlineRefs) ? schema : compile$2.call(this, schema, root, void 0, baseId);
		return v;
	}
	/**
	* Resolve schema, its root and baseId
	* @this Ajv
	* @param  {Object} root root object with properties schema, refVal, refs
	* @param  {String} ref  reference to resolve
	* @return {Object} object with properties schema, root, baseId
	*/
	function resolveSchema(root, ref) {
		var p = URI$1.parse(ref), refPath = _getFullPath(p), baseId = getFullPath(this._getId(root.schema));
		if (Object.keys(root.schema).length === 0 || refPath !== baseId) {
			var id = normalizeId(refPath);
			var refVal = this._refs[id];
			if (typeof refVal == "string") return resolveRecursive.call(this, root, refVal, p);
			else if (refVal instanceof SchemaObject$1) {
				if (!refVal.validate) this._compile(refVal);
				root = refVal;
			} else {
				refVal = this._schemas[id];
				if (refVal instanceof SchemaObject$1) {
					if (!refVal.validate) this._compile(refVal);
					if (id == normalizeId(ref)) return {
						schema: refVal,
						root,
						baseId
					};
					root = refVal;
				} else return;
			}
			if (!root.schema) return;
			baseId = getFullPath(this._getId(root.schema));
		}
		return getJsonPointer.call(this, p, baseId, root.schema, root);
	}
	function resolveRecursive(root, ref, parsedRef) {
		var res = resolveSchema.call(this, root, ref);
		if (res) {
			var schema = res.schema;
			var baseId = res.baseId;
			root = res.root;
			var id = this._getId(schema);
			if (id) baseId = resolveUrl(baseId, id);
			return getJsonPointer.call(this, parsedRef, baseId, schema, root);
		}
	}
	var PREVENT_SCOPE_CHANGE = util$3.toHash([
		"properties",
		"patternProperties",
		"enum",
		"dependencies",
		"definitions"
	]);
	function getJsonPointer(parsedRef, baseId, schema, root) {
		parsedRef.fragment = parsedRef.fragment || "";
		if (parsedRef.fragment.slice(0, 1) != "/") return;
		var parts = parsedRef.fragment.split("/");
		for (var i = 1; i < parts.length; i++) {
			var part = parts[i];
			if (part) {
				part = util$3.unescapeFragment(part);
				schema = schema[part];
				if (schema === void 0) break;
				var id;
				if (!PREVENT_SCOPE_CHANGE[part]) {
					id = this._getId(schema);
					if (id) baseId = resolveUrl(baseId, id);
					if (schema.$ref) {
						var $ref = resolveUrl(baseId, schema.$ref);
						var res = resolveSchema.call(this, root, $ref);
						if (res) {
							schema = res.schema;
							root = res.root;
							baseId = res.baseId;
						}
					}
				}
			}
		}
		if (schema !== void 0 && schema !== root.schema) return {
			schema,
			root,
			baseId
		};
	}
	var SIMPLE_INLINED = util$3.toHash([
		"type",
		"format",
		"pattern",
		"maxLength",
		"minLength",
		"maxProperties",
		"minProperties",
		"maxItems",
		"minItems",
		"maximum",
		"minimum",
		"uniqueItems",
		"multipleOf",
		"required",
		"enum"
	]);
	function inlineRef(schema, limit) {
		if (limit === false) return false;
		if (limit === void 0 || limit === true) return checkNoRef(schema);
		else if (limit) return countKeys(schema) <= limit;
	}
	function checkNoRef(schema) {
		var item;
		if (Array.isArray(schema)) for (var i = 0; i < schema.length; i++) {
			item = schema[i];
			if (typeof item == "object" && !checkNoRef(item)) return false;
		}
		else for (var key in schema) {
			if (key == "$ref") return false;
			item = schema[key];
			if (typeof item == "object" && !checkNoRef(item)) return false;
		}
		return true;
	}
	function countKeys(schema) {
		var count = 0, item;
		if (Array.isArray(schema)) for (var i = 0; i < schema.length; i++) {
			item = schema[i];
			if (typeof item == "object") count += countKeys(item);
			if (count == Infinity) return Infinity;
		}
		else for (var key in schema) {
			if (key == "$ref") return Infinity;
			if (SIMPLE_INLINED[key]) count++;
			else {
				item = schema[key];
				if (typeof item == "object") count += countKeys(item) + 1;
				if (count == Infinity) return Infinity;
			}
		}
		return count;
	}
	function getFullPath(id, normalize) {
		if (normalize !== false) id = normalizeId(id);
		var p = URI$1.parse(id);
		return _getFullPath(p);
	}
	function _getFullPath(p) {
		return URI$1.serialize(p).split("#")[0] + "#";
	}
	var TRAILING_SLASH_HASH = /#\/?$/;
	function normalizeId(id) {
		return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
	}
	function resolveUrl(baseId, id) {
		id = normalizeId(id);
		return URI$1.resolve(baseId, id);
	}
	function resolveIds(schema) {
		var schemaId = normalizeId(this._getId(schema));
		var baseIds = { "": schemaId };
		var fullPaths = { "": getFullPath(schemaId, false) };
		var localRefs = {};
		var self = this;
		traverse(schema, { allKeys: true }, function(sch, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
			if (jsonPtr === "") return;
			var id = self._getId(sch);
			var baseId = baseIds[parentJsonPtr];
			var fullPath = fullPaths[parentJsonPtr] + "/" + parentKeyword;
			if (keyIndex !== void 0) fullPath += "/" + (typeof keyIndex == "number" ? keyIndex : util$3.escapeFragment(keyIndex));
			if (typeof id == "string") {
				id = baseId = normalizeId(baseId ? URI$1.resolve(baseId, id) : id);
				var refVal = self._refs[id];
				if (typeof refVal == "string") refVal = self._refs[refVal];
				if (refVal && refVal.schema) {
					if (!equal$1(sch, refVal.schema)) throw new Error("id \"" + id + "\" resolves to more than one schema");
				} else if (id != normalizeId(fullPath)) if (id[0] == "#") {
					if (localRefs[id] && !equal$1(sch, localRefs[id])) throw new Error("id \"" + id + "\" resolves to more than one schema");
					localRefs[id] = sch;
				} else self._refs[id] = fullPath;
			}
			baseIds[jsonPtr] = baseId;
			fullPaths[jsonPtr] = fullPath;
		});
		return localRefs;
	}
});
var require_error_classes = __commonJSMin((exports, module) => {
	var resolve$2 = require_resolve();
	module.exports = {
		Validation: errorSubclass(ValidationError$1),
		MissingRef: errorSubclass(MissingRefError$1)
	};
	function ValidationError$1(errors) {
		this.message = "validation failed";
		this.errors = errors;
		this.ajv = this.validation = true;
	}
	MissingRefError$1.message = function(baseId, ref) {
		return "can't resolve reference " + ref + " from id " + baseId;
	};
	function MissingRefError$1(baseId, ref, message) {
		this.message = message || MissingRefError$1.message(baseId, ref);
		this.missingRef = resolve$2.url(baseId, ref);
		this.missingSchema = resolve$2.normalizeId(resolve$2.fullPath(this.missingRef));
	}
	function errorSubclass(Subclass) {
		Subclass.prototype = Object.create(Error.prototype);
		Subclass.prototype.constructor = Subclass;
		return Subclass;
	}
});
var require_fast_json_stable_stringify = __commonJSMin((exports, module) => {
	module.exports = function(data, opts) {
		if (!opts) opts = {};
		if (typeof opts === "function") opts = { cmp: opts };
		var cycles = typeof opts.cycles === "boolean" ? opts.cycles : false;
		var cmp = opts.cmp && function(f) {
			return function(node) {
				return function(a, b) {
					var aobj = {
						key: a,
						value: node[a]
					};
					var bobj = {
						key: b,
						value: node[b]
					};
					return f(aobj, bobj);
				};
			};
		}(opts.cmp);
		var seen = [];
		return function stringify(node) {
			if (node && node.toJSON && typeof node.toJSON === "function") node = node.toJSON();
			if (node === void 0) return;
			if (typeof node == "number") return isFinite(node) ? "" + node : "null";
			if (typeof node !== "object") return JSON.stringify(node);
			var i, out;
			if (Array.isArray(node)) {
				out = "[";
				for (i = 0; i < node.length; i++) {
					if (i) out += ",";
					out += stringify(node[i]) || "null";
				}
				return out + "]";
			}
			if (node === null) return "null";
			if (seen.indexOf(node) !== -1) {
				if (cycles) return JSON.stringify("__cycle__");
				throw new TypeError("Converting circular structure to JSON");
			}
			var seenIndex = seen.push(node) - 1;
			var keys = Object.keys(node).sort(cmp && cmp(node));
			out = "";
			for (i = 0; i < keys.length; i++) {
				var key = keys[i];
				var value = stringify(node[key]);
				if (!value) continue;
				if (out) out += ",";
				out += JSON.stringify(key) + ":" + value;
			}
			seen.splice(seenIndex, 1);
			return "{" + out + "}";
		}(data);
	};
});
var require_validate = __commonJSMin((exports, module) => {
	module.exports = function generate_validate(it, $keyword, $ruleType) {
		var out = "";
		var $async = it.schema.$async === true, $refKeywords = it.util.schemaHasRulesExcept(it.schema, it.RULES.all, "$ref"), $id = it.self._getId(it.schema);
		if (it.opts.strictKeywords) {
			var $unknownKwd = it.util.schemaUnknownRules(it.schema, it.RULES.keywords);
			if ($unknownKwd) {
				var $keywordsMsg = "unknown keyword: " + $unknownKwd;
				if (it.opts.strictKeywords === "log") it.logger.warn($keywordsMsg);
				else throw new Error($keywordsMsg);
			}
		}
		if (it.isTop) {
			out += " var validate = ";
			if ($async) {
				it.async = true;
				out += "async ";
			}
			out += "function(data, dataPath, parentData, parentDataProperty, rootData) { 'use strict'; ";
			if ($id && (it.opts.sourceCode || it.opts.processCode)) out += " " + ("/*# sourceURL=" + $id + " */") + " ";
		}
		if (typeof it.schema == "boolean" || !($refKeywords || it.schema.$ref)) {
			var $keyword = "false schema";
			var $lvl = it.level;
			var $dataLvl = it.dataLevel;
			var $schema = it.schema[$keyword];
			var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
			var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
			var $breakOnError = !it.opts.allErrors;
			var $errorKeyword;
			var $data = "data" + ($dataLvl || "");
			var $valid = "valid" + $lvl;
			if (it.schema === false) {
				if (it.isTop) $breakOnError = true;
				else out += " var " + $valid + " = false; ";
				var $$outStack = $$outStack || [];
				$$outStack.push(out);
				out = "";
				if (it.createErrors !== false) {
					out += " { keyword: '" + ($errorKeyword || "false schema") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
					if (it.opts.messages !== false) out += " , message: 'boolean schema is false' ";
					if (it.opts.verbose) out += " , schema: false , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
					out += " } ";
				} else out += " {} ";
				var __err = out;
				out = $$outStack.pop();
				if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
				if (it.async) out += " throw new ValidationError([" + __err + "]); ";
				else out += " validate.errors = [" + __err + "]; return false; ";
				else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			} else if (it.isTop) if ($async) out += " return data; ";
			else out += " validate.errors = null; return true; ";
			else out += " var " + $valid + " = true; ";
			if (it.isTop) out += " }; return validate; ";
			return out;
		}
		if (it.isTop) {
			var $top = it.isTop, $lvl = it.level = 0, $dataLvl = it.dataLevel = 0, $data = "data";
			it.rootId = it.resolve.fullPath(it.self._getId(it.root.schema));
			it.baseId = it.baseId || it.rootId;
			delete it.isTop;
			it.dataPathArr = [""];
			if (it.schema.default !== void 0 && it.opts.useDefaults && it.opts.strictDefaults) {
				var $defaultMsg = "default is ignored in the schema root";
				if (it.opts.strictDefaults === "log") it.logger.warn($defaultMsg);
				else throw new Error($defaultMsg);
			}
			out += " var vErrors = null; ";
			out += " var errors = 0;     ";
			out += " if (rootData === undefined) rootData = data; ";
		} else {
			var $lvl = it.level, $dataLvl = it.dataLevel, $data = "data" + ($dataLvl || "");
			if ($id) it.baseId = it.resolve.url(it.baseId, $id);
			if ($async && !it.async) throw new Error("async schema in sync schema");
			out += " var errs_" + $lvl + " = errors;";
		}
		var $valid = "valid" + $lvl, $breakOnError = !it.opts.allErrors, $closingBraces1 = "", $closingBraces2 = "";
		var $errorKeyword;
		var $typeSchema = it.schema.type, $typeIsArray = Array.isArray($typeSchema);
		if ($typeSchema && it.opts.nullable && it.schema.nullable === true) {
			if ($typeIsArray) {
				if ($typeSchema.indexOf("null") == -1) $typeSchema = $typeSchema.concat("null");
			} else if ($typeSchema != "null") {
				$typeSchema = [$typeSchema, "null"];
				$typeIsArray = true;
			}
		}
		if ($typeIsArray && $typeSchema.length == 1) {
			$typeSchema = $typeSchema[0];
			$typeIsArray = false;
		}
		if (it.schema.$ref && $refKeywords) {
			if (it.opts.extendRefs == "fail") throw new Error("$ref: validation keywords used in schema at path \"" + it.errSchemaPath + "\" (see option extendRefs)");
			else if (it.opts.extendRefs !== true) {
				$refKeywords = false;
				it.logger.warn("$ref: keywords ignored in schema at path \"" + it.errSchemaPath + "\"");
			}
		}
		if (it.schema.$comment && it.opts.$comment) out += " " + it.RULES.all.$comment.code(it, "$comment");
		if ($typeSchema) {
			if (it.opts.coerceTypes) var $coerceToTypes = it.util.coerceToTypes(it.opts.coerceTypes, $typeSchema);
			var $rulesGroup = it.RULES.types[$typeSchema];
			if ($coerceToTypes || $typeIsArray || $rulesGroup === true || $rulesGroup && !$shouldUseGroup($rulesGroup)) {
				var $schemaPath = it.schemaPath + ".type", $errSchemaPath = it.errSchemaPath + "/type";
				var $schemaPath = it.schemaPath + ".type", $errSchemaPath = it.errSchemaPath + "/type", $method = $typeIsArray ? "checkDataTypes" : "checkDataType";
				out += " if (" + it.util[$method]($typeSchema, $data, it.opts.strictNumbers, true) + ") { ";
				if ($coerceToTypes) {
					var $dataType = "dataType" + $lvl, $coerced = "coerced" + $lvl;
					out += " var " + $dataType + " = typeof " + $data + "; var " + $coerced + " = undefined; ";
					if (it.opts.coerceTypes == "array") out += " if (" + $dataType + " == 'object' && Array.isArray(" + $data + ") && " + $data + ".length == 1) { " + $data + " = " + $data + "[0]; " + $dataType + " = typeof " + $data + "; if (" + it.util.checkDataType(it.schema.type, $data, it.opts.strictNumbers) + ") " + $coerced + " = " + $data + "; } ";
					out += " if (" + $coerced + " !== undefined) ; ";
					var arr1 = $coerceToTypes;
					if (arr1) {
						var $type, $i = -1, l1 = arr1.length - 1;
						while ($i < l1) {
							$type = arr1[$i += 1];
							if ($type == "string") out += " else if (" + $dataType + " == 'number' || " + $dataType + " == 'boolean') " + $coerced + " = '' + " + $data + "; else if (" + $data + " === null) " + $coerced + " = ''; ";
							else if ($type == "number" || $type == "integer") {
								out += " else if (" + $dataType + " == 'boolean' || " + $data + " === null || (" + $dataType + " == 'string' && " + $data + " && " + $data + " == +" + $data + " ";
								if ($type == "integer") out += " && !(" + $data + " % 1)";
								out += ")) " + $coerced + " = +" + $data + "; ";
							} else if ($type == "boolean") out += " else if (" + $data + " === 'false' || " + $data + " === 0 || " + $data + " === null) " + $coerced + " = false; else if (" + $data + " === 'true' || " + $data + " === 1) " + $coerced + " = true; ";
							else if ($type == "null") out += " else if (" + $data + " === '' || " + $data + " === 0 || " + $data + " === false) " + $coerced + " = null; ";
							else if (it.opts.coerceTypes == "array" && $type == "array") out += " else if (" + $dataType + " == 'string' || " + $dataType + " == 'number' || " + $dataType + " == 'boolean' || " + $data + " == null) " + $coerced + " = [" + $data + "]; ";
						}
					}
					out += " else {   ";
					var $$outStack = $$outStack || [];
					$$outStack.push(out);
					out = "";
					if (it.createErrors !== false) {
						out += " { keyword: '" + ($errorKeyword || "type") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { type: '";
						if ($typeIsArray) out += "" + $typeSchema.join(",");
						else out += "" + $typeSchema;
						out += "' } ";
						if (it.opts.messages !== false) {
							out += " , message: 'should be ";
							if ($typeIsArray) out += "" + $typeSchema.join(",");
							else out += "" + $typeSchema;
							out += "' ";
						}
						if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
						out += " } ";
					} else out += " {} ";
					var __err = out;
					out = $$outStack.pop();
					if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
					if (it.async) out += " throw new ValidationError([" + __err + "]); ";
					else out += " validate.errors = [" + __err + "]; return false; ";
					else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
					out += " } if (" + $coerced + " !== undefined) {  ";
					var $parentData = $dataLvl ? "data" + ($dataLvl - 1 || "") : "parentData", $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : "parentDataProperty";
					out += " " + $data + " = " + $coerced + "; ";
					if (!$dataLvl) out += "if (" + $parentData + " !== undefined)";
					out += " " + $parentData + "[" + $parentDataProperty + "] = " + $coerced + "; } ";
				} else {
					var $$outStack = $$outStack || [];
					$$outStack.push(out);
					out = "";
					if (it.createErrors !== false) {
						out += " { keyword: '" + ($errorKeyword || "type") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { type: '";
						if ($typeIsArray) out += "" + $typeSchema.join(",");
						else out += "" + $typeSchema;
						out += "' } ";
						if (it.opts.messages !== false) {
							out += " , message: 'should be ";
							if ($typeIsArray) out += "" + $typeSchema.join(",");
							else out += "" + $typeSchema;
							out += "' ";
						}
						if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
						out += " } ";
					} else out += " {} ";
					var __err = out;
					out = $$outStack.pop();
					if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
					if (it.async) out += " throw new ValidationError([" + __err + "]); ";
					else out += " validate.errors = [" + __err + "]; return false; ";
					else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
				}
				out += " } ";
			}
		}
		if (it.schema.$ref && !$refKeywords) {
			out += " " + it.RULES.all.$ref.code(it, "$ref") + " ";
			if ($breakOnError) {
				out += " } if (errors === ";
				if ($top) out += "0";
				else out += "errs_" + $lvl;
				out += ") { ";
				$closingBraces2 += "}";
			}
		} else {
			var arr2 = it.RULES;
			if (arr2) {
				var $rulesGroup, i2 = -1, l2 = arr2.length - 1;
				while (i2 < l2) {
					$rulesGroup = arr2[i2 += 1];
					if ($shouldUseGroup($rulesGroup)) {
						if ($rulesGroup.type) out += " if (" + it.util.checkDataType($rulesGroup.type, $data, it.opts.strictNumbers) + ") { ";
						if (it.opts.useDefaults) {
							if ($rulesGroup.type == "object" && it.schema.properties) {
								var $schema = it.schema.properties, $schemaKeys = Object.keys($schema);
								var arr3 = $schemaKeys;
								if (arr3) {
									var $propertyKey, i3 = -1, l3 = arr3.length - 1;
									while (i3 < l3) {
										$propertyKey = arr3[i3 += 1];
										var $sch = $schema[$propertyKey];
										if ($sch.default !== void 0) {
											var $passData = $data + it.util.getProperty($propertyKey);
											if (it.compositeRule) {
												if (it.opts.strictDefaults) {
													var $defaultMsg = "default is ignored for: " + $passData;
													if (it.opts.strictDefaults === "log") it.logger.warn($defaultMsg);
													else throw new Error($defaultMsg);
												}
											} else {
												out += " if (" + $passData + " === undefined ";
												if (it.opts.useDefaults == "empty") out += " || " + $passData + " === null || " + $passData + " === '' ";
												out += " ) " + $passData + " = ";
												if (it.opts.useDefaults == "shared") out += " " + it.useDefault($sch.default) + " ";
												else out += " " + JSON.stringify($sch.default) + " ";
												out += "; ";
											}
										}
									}
								}
							} else if ($rulesGroup.type == "array" && Array.isArray(it.schema.items)) {
								var arr4 = it.schema.items;
								if (arr4) {
									var $sch, $i = -1, l4 = arr4.length - 1;
									while ($i < l4) {
										$sch = arr4[$i += 1];
										if ($sch.default !== void 0) {
											var $passData = $data + "[" + $i + "]";
											if (it.compositeRule) {
												if (it.opts.strictDefaults) {
													var $defaultMsg = "default is ignored for: " + $passData;
													if (it.opts.strictDefaults === "log") it.logger.warn($defaultMsg);
													else throw new Error($defaultMsg);
												}
											} else {
												out += " if (" + $passData + " === undefined ";
												if (it.opts.useDefaults == "empty") out += " || " + $passData + " === null || " + $passData + " === '' ";
												out += " ) " + $passData + " = ";
												if (it.opts.useDefaults == "shared") out += " " + it.useDefault($sch.default) + " ";
												else out += " " + JSON.stringify($sch.default) + " ";
												out += "; ";
											}
										}
									}
								}
							}
						}
						var arr5 = $rulesGroup.rules;
						if (arr5) {
							var $rule, i5 = -1, l5 = arr5.length - 1;
							while (i5 < l5) {
								$rule = arr5[i5 += 1];
								if ($shouldUseRule($rule)) {
									var $code = $rule.code(it, $rule.keyword, $rulesGroup.type);
									if ($code) {
										out += " " + $code + " ";
										if ($breakOnError) $closingBraces1 += "}";
									}
								}
							}
						}
						if ($breakOnError) {
							out += " " + $closingBraces1 + " ";
							$closingBraces1 = "";
						}
						if ($rulesGroup.type) {
							out += " } ";
							if ($typeSchema && $typeSchema === $rulesGroup.type && !$coerceToTypes) {
								out += " else { ";
								var $schemaPath = it.schemaPath + ".type", $errSchemaPath = it.errSchemaPath + "/type";
								var $$outStack = $$outStack || [];
								$$outStack.push(out);
								out = "";
								if (it.createErrors !== false) {
									out += " { keyword: '" + ($errorKeyword || "type") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { type: '";
									if ($typeIsArray) out += "" + $typeSchema.join(",");
									else out += "" + $typeSchema;
									out += "' } ";
									if (it.opts.messages !== false) {
										out += " , message: 'should be ";
										if ($typeIsArray) out += "" + $typeSchema.join(",");
										else out += "" + $typeSchema;
										out += "' ";
									}
									if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
									out += " } ";
								} else out += " {} ";
								var __err = out;
								out = $$outStack.pop();
								if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
								if (it.async) out += " throw new ValidationError([" + __err + "]); ";
								else out += " validate.errors = [" + __err + "]; return false; ";
								else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
								out += " } ";
							}
						}
						if ($breakOnError) {
							out += " if (errors === ";
							if ($top) out += "0";
							else out += "errs_" + $lvl;
							out += ") { ";
							$closingBraces2 += "}";
						}
					}
				}
			}
		}
		if ($breakOnError) out += " " + $closingBraces2 + " ";
		if ($top) {
			if ($async) {
				out += " if (errors === 0) return data;           ";
				out += " else throw new ValidationError(vErrors); ";
			} else {
				out += " validate.errors = vErrors; ";
				out += " return errors === 0;       ";
			}
			out += " }; return validate;";
		} else out += " var " + $valid + " = errors === errs_" + $lvl + ";";
		function $shouldUseGroup($rulesGroup$1) {
			var rules$1 = $rulesGroup$1.rules;
			for (var i = 0; i < rules$1.length; i++) if ($shouldUseRule(rules$1[i])) return true;
		}
		function $shouldUseRule($rule$1) {
			return it.schema[$rule$1.keyword] !== void 0 || $rule$1.implements && $ruleImplementsSomeKeyword($rule$1);
		}
		function $ruleImplementsSomeKeyword($rule$1) {
			var impl = $rule$1.implements;
			for (var i = 0; i < impl.length; i++) if (it.schema[impl[i]] !== void 0) return true;
		}
		return out;
	};
});
var require_compile = __commonJSMin((exports, module) => {
	var resolve$1 = require_resolve(), util$2 = require_util(), errorClasses$1 = require_error_classes(), stableStringify$1 = require_fast_json_stable_stringify();
	var validateGenerator = require_validate();
	/**
	* Functions below are used inside compiled validations function
	*/
	var ucs2length = util$2.ucs2length;
	var equal = require_fast_deep_equal();
	var ValidationError = errorClasses$1.Validation;
	module.exports = compile$1;
	/**
	* Compiles schema to validation function
	* @this   Ajv
	* @param  {Object} schema schema object
	* @param  {Object} root object with information about the root schema for this schema
	* @param  {Object} localRefs the hash of local references inside the schema (created by resolve.id), used for inline resolution
	* @param  {String} baseId base ID for IDs in the schema
	* @return {Function} validation function
	*/
	function compile$1(schema, root, localRefs, baseId) {
		var self = this, opts = this._opts, refVal = [void 0], refs = {}, patterns = [], patternsHash = {}, defaults = [], defaultsHash = {}, customRules = [];
		root = root || {
			schema,
			refVal,
			refs
		};
		var c = checkCompiling.call(this, schema, root, baseId);
		var compilation = this._compilations[c.index];
		if (c.compiling) return compilation.callValidate = callValidate;
		var formats$2 = this._formats;
		var RULES = this.RULES;
		try {
			var v = localCompile(schema, root, localRefs, baseId);
			compilation.validate = v;
			var cv = compilation.callValidate;
			if (cv) {
				cv.schema = v.schema;
				cv.errors = null;
				cv.refs = v.refs;
				cv.refVal = v.refVal;
				cv.root = v.root;
				cv.$async = v.$async;
				if (opts.sourceCode) cv.source = v.source;
			}
			return v;
		} finally {
			endCompiling.call(this, schema, root, baseId);
		}
		function callValidate() {
			var validate$1 = compilation.validate;
			var result = validate$1.apply(this, arguments);
			callValidate.errors = validate$1.errors;
			return result;
		}
		function localCompile(_schema, _root, localRefs$1, baseId$1) {
			var isRoot = !_root || _root && _root.schema == _schema;
			if (_root.schema != root.schema) return compile$1.call(self, _schema, _root, localRefs$1, baseId$1);
			var $async = _schema.$async === true;
			var sourceCode = validateGenerator({
				isTop: true,
				schema: _schema,
				isRoot,
				baseId: baseId$1,
				root: _root,
				schemaPath: "",
				errSchemaPath: "#",
				errorPath: "\"\"",
				MissingRefError: errorClasses$1.MissingRef,
				RULES,
				validate: validateGenerator,
				util: util$2,
				resolve: resolve$1,
				resolveRef,
				usePattern,
				useDefault,
				useCustomRule,
				opts,
				formats: formats$2,
				logger: self.logger,
				self
			});
			sourceCode = vars(refVal, refValCode) + vars(patterns, patternCode) + vars(defaults, defaultCode) + vars(customRules, customRuleCode$1) + sourceCode;
			if (opts.processCode) sourceCode = opts.processCode(sourceCode, _schema);
			var validate$1;
			try {
				var makeValidate = new Function("self", "RULES", "formats", "root", "refVal", "defaults", "customRules", "equal", "ucs2length", "ValidationError", sourceCode);
				validate$1 = makeValidate(self, RULES, formats$2, root, refVal, defaults, customRules, equal, ucs2length, ValidationError);
				refVal[0] = validate$1;
			} catch (e) {
				self.logger.error("Error compiling schema, function code:", sourceCode);
				throw e;
			}
			validate$1.schema = _schema;
			validate$1.errors = null;
			validate$1.refs = refs;
			validate$1.refVal = refVal;
			validate$1.root = isRoot ? validate$1 : _root;
			if ($async) validate$1.$async = true;
			if (opts.sourceCode === true) validate$1.source = {
				code: sourceCode,
				patterns,
				defaults
			};
			return validate$1;
		}
		function resolveRef(baseId$1, ref, isRoot) {
			ref = resolve$1.url(baseId$1, ref);
			var refIndex = refs[ref];
			var _refVal, refCode;
			if (refIndex !== void 0) {
				_refVal = refVal[refIndex];
				refCode = "refVal[" + refIndex + "]";
				return resolvedRef(_refVal, refCode);
			}
			if (!isRoot && root.refs) {
				var rootRefId = root.refs[ref];
				if (rootRefId !== void 0) {
					_refVal = root.refVal[rootRefId];
					refCode = addLocalRef(ref, _refVal);
					return resolvedRef(_refVal, refCode);
				}
			}
			refCode = addLocalRef(ref);
			var v$1 = resolve$1.call(self, localCompile, root, ref);
			if (v$1 === void 0) {
				var localSchema = localRefs && localRefs[ref];
				if (localSchema) v$1 = resolve$1.inlineRef(localSchema, opts.inlineRefs) ? localSchema : compile$1.call(self, localSchema, root, localRefs, baseId$1);
			}
			if (v$1 === void 0) removeLocalRef(ref);
			else {
				replaceLocalRef(ref, v$1);
				return resolvedRef(v$1, refCode);
			}
		}
		function addLocalRef(ref, v$1) {
			var refId = refVal.length;
			refVal[refId] = v$1;
			refs[ref] = refId;
			return "refVal" + refId;
		}
		function removeLocalRef(ref) {
			delete refs[ref];
		}
		function replaceLocalRef(ref, v$1) {
			var refId = refs[ref];
			refVal[refId] = v$1;
		}
		function resolvedRef(refVal$1, code) {
			return typeof refVal$1 == "object" || typeof refVal$1 == "boolean" ? {
				code,
				schema: refVal$1,
				inline: true
			} : {
				code,
				$async: refVal$1 && !!refVal$1.$async
			};
		}
		function usePattern(regexStr) {
			var index = patternsHash[regexStr];
			if (index === void 0) {
				index = patternsHash[regexStr] = patterns.length;
				patterns[index] = regexStr;
			}
			return "pattern" + index;
		}
		function useDefault(value) {
			switch (typeof value) {
				case "boolean":
				case "number": return "" + value;
				case "string": return util$2.toQuotedString(value);
				case "object":
					if (value === null) return "null";
					var valueStr = stableStringify$1(value);
					var index = defaultsHash[valueStr];
					if (index === void 0) {
						index = defaultsHash[valueStr] = defaults.length;
						defaults[index] = value;
					}
					return "default" + index;
			}
		}
		function useCustomRule(rule, schema$1, parentSchema, it) {
			if (self._opts.validateSchema !== false) {
				var deps = rule.definition.dependencies;
				if (deps && !deps.every(function(keyword) {
					return Object.prototype.hasOwnProperty.call(parentSchema, keyword);
				})) throw new Error("parent schema must have all required keywords: " + deps.join(","));
				var validateSchema$1 = rule.definition.validateSchema;
				if (validateSchema$1) {
					var valid = validateSchema$1(schema$1);
					if (!valid) {
						var message = "keyword schema is invalid: " + self.errorsText(validateSchema$1.errors);
						if (self._opts.validateSchema == "log") self.logger.error(message);
						else throw new Error(message);
					}
				}
			}
			var compile$2 = rule.definition.compile, inline = rule.definition.inline, macro = rule.definition.macro;
			var validate$1;
			if (compile$2) validate$1 = compile$2.call(self, schema$1, parentSchema, it);
			else if (macro) {
				validate$1 = macro.call(self, schema$1, parentSchema, it);
				if (opts.validateSchema !== false) self.validateSchema(validate$1, true);
			} else if (inline) validate$1 = inline.call(self, it, rule.keyword, schema$1, parentSchema);
			else {
				validate$1 = rule.definition.validate;
				if (!validate$1) return;
			}
			if (validate$1 === void 0) throw new Error("custom keyword \"" + rule.keyword + "\"failed to compile");
			var index = customRules.length;
			customRules[index] = validate$1;
			return {
				code: "customRule" + index,
				validate: validate$1
			};
		}
	}
	/**
	* Checks if the schema is currently compiled
	* @this   Ajv
	* @param  {Object} schema schema to compile
	* @param  {Object} root root object
	* @param  {String} baseId base schema ID
	* @return {Object} object with properties "index" (compilation index) and "compiling" (boolean)
	*/
	function checkCompiling(schema, root, baseId) {
		var index = compIndex.call(this, schema, root, baseId);
		if (index >= 0) return {
			index,
			compiling: true
		};
		index = this._compilations.length;
		this._compilations[index] = {
			schema,
			root,
			baseId
		};
		return {
			index,
			compiling: false
		};
	}
	/**
	* Removes the schema from the currently compiled list
	* @this   Ajv
	* @param  {Object} schema schema to compile
	* @param  {Object} root root object
	* @param  {String} baseId base schema ID
	*/
	function endCompiling(schema, root, baseId) {
		var i = compIndex.call(this, schema, root, baseId);
		if (i >= 0) this._compilations.splice(i, 1);
	}
	/**
	* Index of schema compilation in the currently compiled list
	* @this   Ajv
	* @param  {Object} schema schema to compile
	* @param  {Object} root root object
	* @param  {String} baseId base schema ID
	* @return {Integer} compilation index
	*/
	function compIndex(schema, root, baseId) {
		for (var i = 0; i < this._compilations.length; i++) {
			var c = this._compilations[i];
			if (c.schema == schema && c.root == root && c.baseId == baseId) return i;
		}
		return -1;
	}
	function patternCode(i, patterns) {
		return "var pattern" + i + " = new RegExp(" + util$2.toQuotedString(patterns[i]) + ");";
	}
	function defaultCode(i) {
		return "var default" + i + " = defaults[" + i + "];";
	}
	function refValCode(i, refVal) {
		return refVal[i] === void 0 ? "" : "var refVal" + i + " = refVal[" + i + "];";
	}
	function customRuleCode$1(i) {
		return "var customRule" + i + " = customRules[" + i + "];";
	}
	function vars(arr, statement) {
		if (!arr.length) return "";
		var code = "";
		for (var i = 0; i < arr.length; i++) code += statement(i, arr);
		return code;
	}
});
var require_cache = __commonJSMin((exports, module) => {
	var Cache$1 = module.exports = function Cache$2() {
		this._cache = {};
	};
	Cache$1.prototype.put = function Cache_put(key, value) {
		this._cache[key] = value;
	};
	Cache$1.prototype.get = function Cache_get(key) {
		return this._cache[key];
	};
	Cache$1.prototype.del = function Cache_del(key) {
		delete this._cache[key];
	};
	Cache$1.prototype.clear = function Cache_clear() {
		this._cache = {};
	};
});
var require_formats = __commonJSMin((exports, module) => {
	var util$1 = require_util();
	var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
	var DAYS = [
		0,
		31,
		28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	];
	var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
	var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
	var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
	var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
	var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
	var URL$1 = /^(?:(?:http[s\u017F]?|ftp):\/\/)(?:(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+(?::(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?@)?(?:(?!10(?:\.[0-9]{1,3}){3})(?!127(?:\.[0-9]{1,3}){3})(?!169\.254(?:\.[0-9]{1,3}){2})(?!192\.168(?:\.[0-9]{1,3}){2})(?!172\.(?:1[6-9]|2[0-9]|3[01])(?:\.[0-9]{1,3}){2})(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])(?:\.(?:1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])){2}(?:\.(?:[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|25[0-4]))|(?:(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)(?:\.(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)*(?:\.(?:(?:[a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]){2,})))(?::[0-9]{2,5})?(?:\/(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?$/i;
	var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
	var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
	var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
	var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
	module.exports = formats$1;
	function formats$1(mode) {
		mode = mode == "full" ? "full" : "fast";
		return util$1.copy(formats$1[mode]);
	}
	formats$1.fast = {
		date: /^\d\d\d\d-[0-1]\d-[0-3]\d$/,
		time: /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
		"date-time": /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
		uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
		"uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
		"uri-template": URITEMPLATE,
		url: URL$1,
		email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
		hostname: HOSTNAME,
		ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
		ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
		regex,
		uuid: UUID,
		"json-pointer": JSON_POINTER,
		"json-pointer-uri-fragment": JSON_POINTER_URI_FRAGMENT,
		"relative-json-pointer": RELATIVE_JSON_POINTER
	};
	formats$1.full = {
		date,
		time,
		"date-time": date_time,
		uri,
		"uri-reference": URIREF,
		"uri-template": URITEMPLATE,
		url: URL$1,
		email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
		hostname: HOSTNAME,
		ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
		ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
		regex,
		uuid: UUID,
		"json-pointer": JSON_POINTER,
		"json-pointer-uri-fragment": JSON_POINTER_URI_FRAGMENT,
		"relative-json-pointer": RELATIVE_JSON_POINTER
	};
	function isLeapYear(year) {
		return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	}
	function date(str) {
		var matches = str.match(DATE);
		if (!matches) return false;
		var year = +matches[1];
		var month = +matches[2];
		var day = +matches[3];
		return month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
	}
	function time(str, full) {
		var matches = str.match(TIME);
		if (!matches) return false;
		var hour = matches[1];
		var minute = matches[2];
		var second = matches[3];
		var timeZone = matches[5];
		return (hour <= 23 && minute <= 59 && second <= 59 || hour == 23 && minute == 59 && second == 60) && (!full || timeZone);
	}
	var DATE_TIME_SEPARATOR = /t|\s/i;
	function date_time(str) {
		var dateTime = str.split(DATE_TIME_SEPARATOR);
		return dateTime.length == 2 && date(dateTime[0]) && time(dateTime[1], true);
	}
	var NOT_URI_FRAGMENT = /\/|:/;
	function uri(str) {
		return NOT_URI_FRAGMENT.test(str) && URI.test(str);
	}
	var Z_ANCHOR = /[^\\]\\Z/;
	function regex(str) {
		if (Z_ANCHOR.test(str)) return false;
		try {
			new RegExp(str);
			return true;
		} catch (e) {
			return false;
		}
	}
});
var require_ref = __commonJSMin((exports, module) => {
	module.exports = function generate_ref(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $async, $refCode;
		if ($schema == "#" || $schema == "#/") if (it.isRoot) {
			$async = it.async;
			$refCode = "validate";
		} else {
			$async = it.root.schema.$async === true;
			$refCode = "root.refVal[0]";
		}
		else {
			var $refVal = it.resolveRef(it.baseId, $schema, it.isRoot);
			if ($refVal === void 0) {
				var $message = it.MissingRefError.message(it.baseId, $schema);
				if (it.opts.missingRefs == "fail") {
					it.logger.error($message);
					var $$outStack = $$outStack || [];
					$$outStack.push(out);
					out = "";
					if (it.createErrors !== false) {
						out += " { keyword: '$ref' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { ref: '" + it.util.escapeQuotes($schema) + "' } ";
						if (it.opts.messages !== false) out += " , message: 'can\\'t resolve reference " + it.util.escapeQuotes($schema) + "' ";
						if (it.opts.verbose) out += " , schema: " + it.util.toQuotedString($schema) + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
						out += " } ";
					} else out += " {} ";
					var __err = out;
					out = $$outStack.pop();
					if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
					if (it.async) out += " throw new ValidationError([" + __err + "]); ";
					else out += " validate.errors = [" + __err + "]; return false; ";
					else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
					if ($breakOnError) out += " if (false) { ";
				} else if (it.opts.missingRefs == "ignore") {
					it.logger.warn($message);
					if ($breakOnError) out += " if (true) { ";
				} else throw new it.MissingRefError(it.baseId, $schema, $message);
			} else if ($refVal.inline) {
				var $it = it.util.copy(it);
				$it.level++;
				var $nextValid = "valid" + $it.level;
				$it.schema = $refVal.schema;
				$it.schemaPath = "";
				$it.errSchemaPath = $schema;
				var $code = it.validate($it).replace(/validate\.schema/g, $refVal.code);
				out += " " + $code + " ";
				if ($breakOnError) out += " if (" + $nextValid + ") { ";
			} else {
				$async = $refVal.$async === true || it.async && $refVal.$async !== false;
				$refCode = $refVal.code;
			}
		}
		if ($refCode) {
			var $$outStack = $$outStack || [];
			$$outStack.push(out);
			out = "";
			if (it.opts.passContext) out += " " + $refCode + ".call(this, ";
			else out += " " + $refCode + "( ";
			out += " " + $data + ", (dataPath || '')";
			if (it.errorPath != "\"\"") out += " + " + it.errorPath;
			var $parentData = $dataLvl ? "data" + ($dataLvl - 1 || "") : "parentData", $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : "parentDataProperty";
			out += " , " + $parentData + " , " + $parentDataProperty + ", rootData)  ";
			var __callValidate = out;
			out = $$outStack.pop();
			if ($async) {
				if (!it.async) throw new Error("async schema referenced by sync schema");
				if ($breakOnError) out += " var " + $valid + "; ";
				out += " try { await " + __callValidate + "; ";
				if ($breakOnError) out += " " + $valid + " = true; ";
				out += " } catch (e) { if (!(e instanceof ValidationError)) throw e; if (vErrors === null) vErrors = e.errors; else vErrors = vErrors.concat(e.errors); errors = vErrors.length; ";
				if ($breakOnError) out += " " + $valid + " = false; ";
				out += " } ";
				if ($breakOnError) out += " if (" + $valid + ") { ";
			} else {
				out += " if (!" + __callValidate + ") { if (vErrors === null) vErrors = " + $refCode + ".errors; else vErrors = vErrors.concat(" + $refCode + ".errors); errors = vErrors.length; } ";
				if ($breakOnError) out += " else { ";
			}
		}
		return out;
	};
});
var require_allOf = __commonJSMin((exports, module) => {
	module.exports = function generate_allOf(it, $keyword, $ruleType) {
		var out = " ";
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $it = it.util.copy(it);
		var $closingBraces = "";
		$it.level++;
		var $nextValid = "valid" + $it.level;
		var $currentBaseId = $it.baseId, $allSchemasEmpty = true;
		var arr1 = $schema;
		if (arr1) {
			var $sch, $i = -1, l1 = arr1.length - 1;
			while ($i < l1) {
				$sch = arr1[$i += 1];
				if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
					$allSchemasEmpty = false;
					$it.schema = $sch;
					$it.schemaPath = $schemaPath + "[" + $i + "]";
					$it.errSchemaPath = $errSchemaPath + "/" + $i;
					out += "  " + it.validate($it) + " ";
					$it.baseId = $currentBaseId;
					if ($breakOnError) {
						out += " if (" + $nextValid + ") { ";
						$closingBraces += "}";
					}
				}
			}
		}
		if ($breakOnError) if ($allSchemasEmpty) out += " if (true) { ";
		else out += " " + $closingBraces.slice(0, -1) + " ";
		return out;
	};
});
var require_anyOf = __commonJSMin((exports, module) => {
	module.exports = function generate_anyOf(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		var $closingBraces = "";
		$it.level++;
		var $nextValid = "valid" + $it.level;
		var $noEmptySchema = $schema.every(function($sch$1) {
			return it.opts.strictKeywords ? typeof $sch$1 == "object" && Object.keys($sch$1).length > 0 || $sch$1 === false : it.util.schemaHasRules($sch$1, it.RULES.all);
		});
		if ($noEmptySchema) {
			var $currentBaseId = $it.baseId;
			out += " var " + $errs + " = errors; var " + $valid + " = false;  ";
			var $wasComposite = it.compositeRule;
			it.compositeRule = $it.compositeRule = true;
			var arr1 = $schema;
			if (arr1) {
				var $sch, $i = -1, l1 = arr1.length - 1;
				while ($i < l1) {
					$sch = arr1[$i += 1];
					$it.schema = $sch;
					$it.schemaPath = $schemaPath + "[" + $i + "]";
					$it.errSchemaPath = $errSchemaPath + "/" + $i;
					out += "  " + it.validate($it) + " ";
					$it.baseId = $currentBaseId;
					out += " " + $valid + " = " + $valid + " || " + $nextValid + "; if (!" + $valid + ") { ";
					$closingBraces += "}";
				}
			}
			it.compositeRule = $it.compositeRule = $wasComposite;
			out += " " + $closingBraces + " if (!" + $valid + ") {   var err =   ";
			if (it.createErrors !== false) {
				out += " { keyword: 'anyOf' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
				if (it.opts.messages !== false) out += " , message: 'should match some schema in anyOf' ";
				if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
				out += " } ";
			} else out += " {} ";
			out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
			if (it.async) out += " throw new ValidationError(vErrors); ";
			else out += " validate.errors = vErrors; return false; ";
			out += " } else {  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; } ";
			if (it.opts.allErrors) out += " } ";
		} else if ($breakOnError) out += " if (true) { ";
		return out;
	};
});
var require_comment = __commonJSMin((exports, module) => {
	module.exports = function generate_comment(it, $keyword, $ruleType) {
		var out = " ";
		var $schema = it.schema[$keyword];
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $comment = it.util.toQuotedString($schema);
		if (it.opts.$comment === true) out += " console.log(" + $comment + ");";
		else if (typeof it.opts.$comment == "function") out += " self._opts.$comment(" + $comment + ", " + it.util.toQuotedString($errSchemaPath) + ", validate.root.schema);";
		return out;
	};
});
var require_const = __commonJSMin((exports, module) => {
	module.exports = function generate_const(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		if (!$isData) out += " var schema" + $lvl + " = validate.schema" + $schemaPath + ";";
		out += "var " + $valid + " = equal(" + $data + ", schema" + $lvl + "); if (!" + $valid + ") {   ";
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: 'const' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { allowedValue: schema" + $lvl + " } ";
			if (it.opts.messages !== false) out += " , message: 'should be equal to constant' ";
			if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += " }";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require_contains = __commonJSMin((exports, module) => {
	module.exports = function generate_contains(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		var $closingBraces = "";
		$it.level++;
		var $nextValid = "valid" + $it.level;
		var $idx = "i" + $lvl, $dataNxt = $it.dataLevel = it.dataLevel + 1, $nextData = "data" + $dataNxt, $currentBaseId = it.baseId, $nonEmptySchema = it.opts.strictKeywords ? typeof $schema == "object" && Object.keys($schema).length > 0 || $schema === false : it.util.schemaHasRules($schema, it.RULES.all);
		out += "var " + $errs + " = errors;var " + $valid + ";";
		if ($nonEmptySchema) {
			var $wasComposite = it.compositeRule;
			it.compositeRule = $it.compositeRule = true;
			$it.schema = $schema;
			$it.schemaPath = $schemaPath;
			$it.errSchemaPath = $errSchemaPath;
			out += " var " + $nextValid + " = false; for (var " + $idx + " = 0; " + $idx + " < " + $data + ".length; " + $idx + "++) { ";
			$it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
			var $passData = $data + "[" + $idx + "]";
			$it.dataPathArr[$dataNxt] = $idx;
			var $code = it.validate($it);
			$it.baseId = $currentBaseId;
			if (it.util.varOccurences($code, $nextData) < 2) out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
			else out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
			out += " if (" + $nextValid + ") break; }  ";
			it.compositeRule = $it.compositeRule = $wasComposite;
			out += " " + $closingBraces + " if (!" + $nextValid + ") {";
		} else out += " if (" + $data + ".length == 0) {";
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: 'contains' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
			if (it.opts.messages !== false) out += " , message: 'should contain a valid item' ";
			if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += " } else { ";
		if ($nonEmptySchema) out += "  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; } ";
		if (it.opts.allErrors) out += " } ";
		return out;
	};
});
var require_dependencies = __commonJSMin((exports, module) => {
	module.exports = function generate_dependencies(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		var $closingBraces = "";
		$it.level++;
		var $nextValid = "valid" + $it.level;
		var $schemaDeps = {}, $propertyDeps = {}, $ownProperties = it.opts.ownProperties;
		for ($property in $schema) {
			if ($property == "__proto__") continue;
			var $sch = $schema[$property];
			var $deps = Array.isArray($sch) ? $propertyDeps : $schemaDeps;
			$deps[$property] = $sch;
		}
		out += "var " + $errs + " = errors;";
		var $currentErrorPath = it.errorPath;
		out += "var missing" + $lvl + ";";
		for (var $property in $propertyDeps) {
			$deps = $propertyDeps[$property];
			if ($deps.length) {
				out += " if ( " + $data + it.util.getProperty($property) + " !== undefined ";
				if ($ownProperties) out += " && Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($property) + "') ";
				if ($breakOnError) {
					out += " && ( ";
					var arr1 = $deps;
					if (arr1) {
						var $propertyKey, $i = -1, l1 = arr1.length - 1;
						while ($i < l1) {
							$propertyKey = arr1[$i += 1];
							if ($i) out += " || ";
							var $prop = it.util.getProperty($propertyKey), $useData = $data + $prop;
							out += " ( ( " + $useData + " === undefined ";
							if ($ownProperties) out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
							out += ") && (missing" + $lvl + " = " + it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop) + ") ) ";
						}
					}
					out += ")) {  ";
					var $propertyPath = "missing" + $lvl, $missingProperty = "' + " + $propertyPath + " + '";
					if (it.opts._errorDataPathProperty) it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + " + " + $propertyPath;
					var $$outStack = $$outStack || [];
					$$outStack.push(out);
					out = "";
					if (it.createErrors !== false) {
						out += " { keyword: 'dependencies' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { property: '" + it.util.escapeQuotes($property) + "', missingProperty: '" + $missingProperty + "', depsCount: " + $deps.length + ", deps: '" + it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", ")) + "' } ";
						if (it.opts.messages !== false) {
							out += " , message: 'should have ";
							if ($deps.length == 1) out += "property " + it.util.escapeQuotes($deps[0]);
							else out += "properties " + it.util.escapeQuotes($deps.join(", "));
							out += " when property " + it.util.escapeQuotes($property) + " is present' ";
						}
						if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
						out += " } ";
					} else out += " {} ";
					var __err = out;
					out = $$outStack.pop();
					if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
					if (it.async) out += " throw new ValidationError([" + __err + "]); ";
					else out += " validate.errors = [" + __err + "]; return false; ";
					else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
				} else {
					out += " ) { ";
					var arr2 = $deps;
					if (arr2) {
						var $propertyKey, i2 = -1, l2 = arr2.length - 1;
						while (i2 < l2) {
							$propertyKey = arr2[i2 += 1];
							var $prop = it.util.getProperty($propertyKey), $missingProperty = it.util.escapeQuotes($propertyKey), $useData = $data + $prop;
							if (it.opts._errorDataPathProperty) it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
							out += " if ( " + $useData + " === undefined ";
							if ($ownProperties) out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
							out += ") {  var err =   ";
							if (it.createErrors !== false) {
								out += " { keyword: 'dependencies' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { property: '" + it.util.escapeQuotes($property) + "', missingProperty: '" + $missingProperty + "', depsCount: " + $deps.length + ", deps: '" + it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", ")) + "' } ";
								if (it.opts.messages !== false) {
									out += " , message: 'should have ";
									if ($deps.length == 1) out += "property " + it.util.escapeQuotes($deps[0]);
									else out += "properties " + it.util.escapeQuotes($deps.join(", "));
									out += " when property " + it.util.escapeQuotes($property) + " is present' ";
								}
								if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
								out += " } ";
							} else out += " {} ";
							out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ";
						}
					}
				}
				out += " }   ";
				if ($breakOnError) {
					$closingBraces += "}";
					out += " else { ";
				}
			}
		}
		it.errorPath = $currentErrorPath;
		var $currentBaseId = $it.baseId;
		for (var $property in $schemaDeps) {
			var $sch = $schemaDeps[$property];
			if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
				out += " " + $nextValid + " = true; if ( " + $data + it.util.getProperty($property) + " !== undefined ";
				if ($ownProperties) out += " && Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($property) + "') ";
				out += ") { ";
				$it.schema = $sch;
				$it.schemaPath = $schemaPath + it.util.getProperty($property);
				$it.errSchemaPath = $errSchemaPath + "/" + it.util.escapeFragment($property);
				out += "  " + it.validate($it) + " ";
				$it.baseId = $currentBaseId;
				out += " }  ";
				if ($breakOnError) {
					out += " if (" + $nextValid + ") { ";
					$closingBraces += "}";
				}
			}
		}
		if ($breakOnError) out += "   " + $closingBraces + " if (" + $errs + " == errors) {";
		return out;
	};
});
var require_enum = __commonJSMin((exports, module) => {
	module.exports = function generate_enum(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		var $i = "i" + $lvl, $vSchema = "schema" + $lvl;
		if (!$isData) out += " var " + $vSchema + " = validate.schema" + $schemaPath + ";";
		out += "var " + $valid + ";";
		if ($isData) out += " if (schema" + $lvl + " === undefined) " + $valid + " = true; else if (!Array.isArray(schema" + $lvl + ")) " + $valid + " = false; else {";
		out += "" + $valid + " = false;for (var " + $i + "=0; " + $i + "<" + $vSchema + ".length; " + $i + "++) if (equal(" + $data + ", " + $vSchema + "[" + $i + "])) { " + $valid + " = true; break; }";
		if ($isData) out += "  }  ";
		out += " if (!" + $valid + ") {   ";
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: 'enum' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { allowedValues: schema" + $lvl + " } ";
			if (it.opts.messages !== false) out += " , message: 'should be equal to one of the allowed values' ";
			if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += " }";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require_format = __commonJSMin((exports, module) => {
	module.exports = function generate_format(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		if (it.opts.format === false) {
			if ($breakOnError) out += " if (true) { ";
			return out;
		}
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		var $unknownFormats = it.opts.unknownFormats, $allowUnknown = Array.isArray($unknownFormats);
		if ($isData) {
			var $format = "format" + $lvl, $isObject = "isObject" + $lvl, $formatType = "formatType" + $lvl;
			out += " var " + $format + " = formats[" + $schemaValue + "]; var " + $isObject + " = typeof " + $format + " == 'object' && !(" + $format + " instanceof RegExp) && " + $format + ".validate; var " + $formatType + " = " + $isObject + " && " + $format + ".type || 'string'; if (" + $isObject + ") { ";
			if (it.async) out += " var async" + $lvl + " = " + $format + ".async; ";
			out += " " + $format + " = " + $format + ".validate; } if (  ";
			if ($isData) out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'string') || ";
			out += " (";
			if ($unknownFormats != "ignore") {
				out += " (" + $schemaValue + " && !" + $format + " ";
				if ($allowUnknown) out += " && self._opts.unknownFormats.indexOf(" + $schemaValue + ") == -1 ";
				out += ") || ";
			}
			out += " (" + $format + " && " + $formatType + " == '" + $ruleType + "' && !(typeof " + $format + " == 'function' ? ";
			if (it.async) out += " (async" + $lvl + " ? await " + $format + "(" + $data + ") : " + $format + "(" + $data + ")) ";
			else out += " " + $format + "(" + $data + ") ";
			out += " : " + $format + ".test(" + $data + "))))) {";
		} else {
			var $format = it.formats[$schema];
			if (!$format) if ($unknownFormats == "ignore") {
				it.logger.warn("unknown format \"" + $schema + "\" ignored in schema at path \"" + it.errSchemaPath + "\"");
				if ($breakOnError) out += " if (true) { ";
				return out;
			} else if ($allowUnknown && $unknownFormats.indexOf($schema) >= 0) {
				if ($breakOnError) out += " if (true) { ";
				return out;
			} else throw new Error("unknown format \"" + $schema + "\" is used in schema at path \"" + it.errSchemaPath + "\"");
			var $isObject = typeof $format == "object" && !($format instanceof RegExp) && $format.validate;
			var $formatType = $isObject && $format.type || "string";
			if ($isObject) {
				var $async = $format.async === true;
				$format = $format.validate;
			}
			if ($formatType != $ruleType) {
				if ($breakOnError) out += " if (true) { ";
				return out;
			}
			if ($async) {
				if (!it.async) throw new Error("async format in sync schema");
				var $formatRef = "formats" + it.util.getProperty($schema) + ".validate";
				out += " if (!(await " + $formatRef + "(" + $data + "))) { ";
			} else {
				out += " if (! ";
				var $formatRef = "formats" + it.util.getProperty($schema);
				if ($isObject) $formatRef += ".validate";
				if (typeof $format == "function") out += " " + $formatRef + "(" + $data + ") ";
				else out += " " + $formatRef + ".test(" + $data + ") ";
				out += ") { ";
			}
		}
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: 'format' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { format:  ";
			if ($isData) out += "" + $schemaValue;
			else out += "" + it.util.toQuotedString($schema);
			out += "  } ";
			if (it.opts.messages !== false) {
				out += " , message: 'should match format \"";
				if ($isData) out += "' + " + $schemaValue + " + '";
				else out += "" + it.util.escapeQuotes($schema);
				out += "\"' ";
			}
			if (it.opts.verbose) {
				out += " , schema:  ";
				if ($isData) out += "validate.schema" + $schemaPath;
				else out += "" + it.util.toQuotedString($schema);
				out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			}
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += " } ";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require_if = __commonJSMin((exports, module) => {
	module.exports = function generate_if(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		$it.level++;
		var $nextValid = "valid" + $it.level;
		var $thenSch = it.schema["then"], $elseSch = it.schema["else"], $thenPresent = $thenSch !== void 0 && (it.opts.strictKeywords ? typeof $thenSch == "object" && Object.keys($thenSch).length > 0 || $thenSch === false : it.util.schemaHasRules($thenSch, it.RULES.all)), $elsePresent = $elseSch !== void 0 && (it.opts.strictKeywords ? typeof $elseSch == "object" && Object.keys($elseSch).length > 0 || $elseSch === false : it.util.schemaHasRules($elseSch, it.RULES.all)), $currentBaseId = $it.baseId;
		if ($thenPresent || $elsePresent) {
			var $ifClause;
			$it.createErrors = false;
			$it.schema = $schema;
			$it.schemaPath = $schemaPath;
			$it.errSchemaPath = $errSchemaPath;
			out += " var " + $errs + " = errors; var " + $valid + " = true;  ";
			var $wasComposite = it.compositeRule;
			it.compositeRule = $it.compositeRule = true;
			out += "  " + it.validate($it) + " ";
			$it.baseId = $currentBaseId;
			$it.createErrors = true;
			out += "  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; }  ";
			it.compositeRule = $it.compositeRule = $wasComposite;
			if ($thenPresent) {
				out += " if (" + $nextValid + ") {  ";
				$it.schema = it.schema["then"];
				$it.schemaPath = it.schemaPath + ".then";
				$it.errSchemaPath = it.errSchemaPath + "/then";
				out += "  " + it.validate($it) + " ";
				$it.baseId = $currentBaseId;
				out += " " + $valid + " = " + $nextValid + "; ";
				if ($thenPresent && $elsePresent) {
					$ifClause = "ifClause" + $lvl;
					out += " var " + $ifClause + " = 'then'; ";
				} else $ifClause = "'then'";
				out += " } ";
				if ($elsePresent) out += " else { ";
			} else out += " if (!" + $nextValid + ") { ";
			if ($elsePresent) {
				$it.schema = it.schema["else"];
				$it.schemaPath = it.schemaPath + ".else";
				$it.errSchemaPath = it.errSchemaPath + "/else";
				out += "  " + it.validate($it) + " ";
				$it.baseId = $currentBaseId;
				out += " " + $valid + " = " + $nextValid + "; ";
				if ($thenPresent && $elsePresent) {
					$ifClause = "ifClause" + $lvl;
					out += " var " + $ifClause + " = 'else'; ";
				} else $ifClause = "'else'";
				out += " } ";
			}
			out += " if (!" + $valid + ") {   var err =   ";
			if (it.createErrors !== false) {
				out += " { keyword: 'if' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { failingKeyword: " + $ifClause + " } ";
				if (it.opts.messages !== false) out += " , message: 'should match \"' + " + $ifClause + " + '\" schema' ";
				if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
				out += " } ";
			} else out += " {} ";
			out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
			if (it.async) out += " throw new ValidationError(vErrors); ";
			else out += " validate.errors = vErrors; return false; ";
			out += " }   ";
			if ($breakOnError) out += " else { ";
		} else if ($breakOnError) out += " if (true) { ";
		return out;
	};
});
var require_items = __commonJSMin((exports, module) => {
	module.exports = function generate_items(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		var $closingBraces = "";
		$it.level++;
		var $nextValid = "valid" + $it.level;
		var $idx = "i" + $lvl, $dataNxt = $it.dataLevel = it.dataLevel + 1, $nextData = "data" + $dataNxt, $currentBaseId = it.baseId;
		out += "var " + $errs + " = errors;var " + $valid + ";";
		if (Array.isArray($schema)) {
			var $additionalItems = it.schema.additionalItems;
			if ($additionalItems === false) {
				out += " " + $valid + " = " + $data + ".length <= " + $schema.length + "; ";
				var $currErrSchemaPath = $errSchemaPath;
				$errSchemaPath = it.errSchemaPath + "/additionalItems";
				out += "  if (!" + $valid + ") {   ";
				var $$outStack = $$outStack || [];
				$$outStack.push(out);
				out = "";
				if (it.createErrors !== false) {
					out += " { keyword: 'additionalItems' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { limit: " + $schema.length + " } ";
					if (it.opts.messages !== false) out += " , message: 'should NOT have more than " + $schema.length + " items' ";
					if (it.opts.verbose) out += " , schema: false , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
					out += " } ";
				} else out += " {} ";
				var __err = out;
				out = $$outStack.pop();
				if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
				if (it.async) out += " throw new ValidationError([" + __err + "]); ";
				else out += " validate.errors = [" + __err + "]; return false; ";
				else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
				out += " } ";
				$errSchemaPath = $currErrSchemaPath;
				if ($breakOnError) {
					$closingBraces += "}";
					out += " else { ";
				}
			}
			var arr1 = $schema;
			if (arr1) {
				var $sch, $i = -1, l1 = arr1.length - 1;
				while ($i < l1) {
					$sch = arr1[$i += 1];
					if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
						out += " " + $nextValid + " = true; if (" + $data + ".length > " + $i + ") { ";
						var $passData = $data + "[" + $i + "]";
						$it.schema = $sch;
						$it.schemaPath = $schemaPath + "[" + $i + "]";
						$it.errSchemaPath = $errSchemaPath + "/" + $i;
						$it.errorPath = it.util.getPathExpr(it.errorPath, $i, it.opts.jsonPointers, true);
						$it.dataPathArr[$dataNxt] = $i;
						var $code = it.validate($it);
						$it.baseId = $currentBaseId;
						if (it.util.varOccurences($code, $nextData) < 2) out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
						else out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
						out += " }  ";
						if ($breakOnError) {
							out += " if (" + $nextValid + ") { ";
							$closingBraces += "}";
						}
					}
				}
			}
			if (typeof $additionalItems == "object" && (it.opts.strictKeywords ? typeof $additionalItems == "object" && Object.keys($additionalItems).length > 0 || $additionalItems === false : it.util.schemaHasRules($additionalItems, it.RULES.all))) {
				$it.schema = $additionalItems;
				$it.schemaPath = it.schemaPath + ".additionalItems";
				$it.errSchemaPath = it.errSchemaPath + "/additionalItems";
				out += " " + $nextValid + " = true; if (" + $data + ".length > " + $schema.length + ") {  for (var " + $idx + " = " + $schema.length + "; " + $idx + " < " + $data + ".length; " + $idx + "++) { ";
				$it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
				var $passData = $data + "[" + $idx + "]";
				$it.dataPathArr[$dataNxt] = $idx;
				var $code = it.validate($it);
				$it.baseId = $currentBaseId;
				if (it.util.varOccurences($code, $nextData) < 2) out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
				else out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
				if ($breakOnError) out += " if (!" + $nextValid + ") break; ";
				out += " } }  ";
				if ($breakOnError) {
					out += " if (" + $nextValid + ") { ";
					$closingBraces += "}";
				}
			}
		} else if (it.opts.strictKeywords ? typeof $schema == "object" && Object.keys($schema).length > 0 || $schema === false : it.util.schemaHasRules($schema, it.RULES.all)) {
			$it.schema = $schema;
			$it.schemaPath = $schemaPath;
			$it.errSchemaPath = $errSchemaPath;
			out += "  for (var " + $idx + " = 0; " + $idx + " < " + $data + ".length; " + $idx + "++) { ";
			$it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
			var $passData = $data + "[" + $idx + "]";
			$it.dataPathArr[$dataNxt] = $idx;
			var $code = it.validate($it);
			$it.baseId = $currentBaseId;
			if (it.util.varOccurences($code, $nextData) < 2) out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
			else out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
			if ($breakOnError) out += " if (!" + $nextValid + ") break; ";
			out += " }";
		}
		if ($breakOnError) out += " " + $closingBraces + " if (" + $errs + " == errors) {";
		return out;
	};
});
var require__limit = __commonJSMin((exports, module) => {
	module.exports = function generate__limit(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $errorKeyword;
		var $data = "data" + ($dataLvl || "");
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		var $isMax = $keyword == "maximum", $exclusiveKeyword = $isMax ? "exclusiveMaximum" : "exclusiveMinimum", $schemaExcl = it.schema[$exclusiveKeyword], $isDataExcl = it.opts.$data && $schemaExcl && $schemaExcl.$data, $op = $isMax ? "<" : ">", $notOp = $isMax ? ">" : "<", $errorKeyword = void 0;
		if (!($isData || typeof $schema == "number" || $schema === void 0)) throw new Error($keyword + " must be number");
		if (!($isDataExcl || $schemaExcl === void 0 || typeof $schemaExcl == "number" || typeof $schemaExcl == "boolean")) throw new Error($exclusiveKeyword + " must be number or boolean");
		if ($isDataExcl) {
			var $schemaValueExcl = it.util.getData($schemaExcl.$data, $dataLvl, it.dataPathArr), $exclusive = "exclusive" + $lvl, $exclType = "exclType" + $lvl, $exclIsNumber = "exclIsNumber" + $lvl, $opExpr = "op" + $lvl, $opStr = "' + " + $opExpr + " + '";
			out += " var schemaExcl" + $lvl + " = " + $schemaValueExcl + "; ";
			$schemaValueExcl = "schemaExcl" + $lvl;
			out += " var " + $exclusive + "; var " + $exclType + " = typeof " + $schemaValueExcl + "; if (" + $exclType + " != 'boolean' && " + $exclType + " != 'undefined' && " + $exclType + " != 'number') { ";
			var $errorKeyword = $exclusiveKeyword;
			var $$outStack = $$outStack || [];
			$$outStack.push(out);
			out = "";
			if (it.createErrors !== false) {
				out += " { keyword: '" + ($errorKeyword || "_exclusiveLimit") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
				if (it.opts.messages !== false) out += " , message: '" + $exclusiveKeyword + " should be boolean' ";
				if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
				out += " } ";
			} else out += " {} ";
			var __err = out;
			out = $$outStack.pop();
			if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
			if (it.async) out += " throw new ValidationError([" + __err + "]); ";
			else out += " validate.errors = [" + __err + "]; return false; ";
			else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			out += " } else if ( ";
			if ($isData) out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
			out += " " + $exclType + " == 'number' ? ( (" + $exclusive + " = " + $schemaValue + " === undefined || " + $schemaValueExcl + " " + $op + "= " + $schemaValue + ") ? " + $data + " " + $notOp + "= " + $schemaValueExcl + " : " + $data + " " + $notOp + " " + $schemaValue + " ) : ( (" + $exclusive + " = " + $schemaValueExcl + " === true) ? " + $data + " " + $notOp + "= " + $schemaValue + " : " + $data + " " + $notOp + " " + $schemaValue + " ) || " + $data + " !== " + $data + ") { var op" + $lvl + " = " + $exclusive + " ? '" + $op + "' : '" + $op + "='; ";
			if ($schema === void 0) {
				$errorKeyword = $exclusiveKeyword;
				$errSchemaPath = it.errSchemaPath + "/" + $exclusiveKeyword;
				$schemaValue = $schemaValueExcl;
				$isData = $isDataExcl;
			}
		} else {
			var $exclIsNumber = typeof $schemaExcl == "number", $opStr = $op;
			if ($exclIsNumber && $isData) {
				var $opExpr = "'" + $opStr + "'";
				out += " if ( ";
				if ($isData) out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
				out += " ( " + $schemaValue + " === undefined || " + $schemaExcl + " " + $op + "= " + $schemaValue + " ? " + $data + " " + $notOp + "= " + $schemaExcl + " : " + $data + " " + $notOp + " " + $schemaValue + " ) || " + $data + " !== " + $data + ") { ";
			} else {
				if ($exclIsNumber && $schema === void 0) {
					$exclusive = true;
					$errorKeyword = $exclusiveKeyword;
					$errSchemaPath = it.errSchemaPath + "/" + $exclusiveKeyword;
					$schemaValue = $schemaExcl;
					$notOp += "=";
				} else {
					if ($exclIsNumber) $schemaValue = Math[$isMax ? "min" : "max"]($schemaExcl, $schema);
					if ($schemaExcl === ($exclIsNumber ? $schemaValue : true)) {
						$exclusive = true;
						$errorKeyword = $exclusiveKeyword;
						$errSchemaPath = it.errSchemaPath + "/" + $exclusiveKeyword;
						$notOp += "=";
					} else {
						$exclusive = false;
						$opStr += "=";
					}
				}
				var $opExpr = "'" + $opStr + "'";
				out += " if ( ";
				if ($isData) out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
				out += " " + $data + " " + $notOp + " " + $schemaValue + " || " + $data + " !== " + $data + ") { ";
			}
		}
		$errorKeyword = $errorKeyword || $keyword;
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: '" + ($errorKeyword || "_limit") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { comparison: " + $opExpr + ", limit: " + $schemaValue + ", exclusive: " + $exclusive + " } ";
			if (it.opts.messages !== false) {
				out += " , message: 'should be " + $opStr + " ";
				if ($isData) out += "' + " + $schemaValue;
				else out += "" + $schemaValue + "'";
			}
			if (it.opts.verbose) {
				out += " , schema:  ";
				if ($isData) out += "validate.schema" + $schemaPath;
				else out += "" + $schema;
				out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			}
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += " } ";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require__limitItems = __commonJSMin((exports, module) => {
	module.exports = function generate__limitItems(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $errorKeyword;
		var $data = "data" + ($dataLvl || "");
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		if (!($isData || typeof $schema == "number")) throw new Error($keyword + " must be number");
		var $op = $keyword == "maxItems" ? ">" : "<";
		out += "if ( ";
		if ($isData) out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
		out += " " + $data + ".length " + $op + " " + $schemaValue + ") { ";
		var $errorKeyword = $keyword;
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: '" + ($errorKeyword || "_limitItems") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { limit: " + $schemaValue + " } ";
			if (it.opts.messages !== false) {
				out += " , message: 'should NOT have ";
				if ($keyword == "maxItems") out += "more";
				else out += "fewer";
				out += " than ";
				if ($isData) out += "' + " + $schemaValue + " + '";
				else out += "" + $schema;
				out += " items' ";
			}
			if (it.opts.verbose) {
				out += " , schema:  ";
				if ($isData) out += "validate.schema" + $schemaPath;
				else out += "" + $schema;
				out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			}
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += "} ";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require__limitLength = __commonJSMin((exports, module) => {
	module.exports = function generate__limitLength(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $errorKeyword;
		var $data = "data" + ($dataLvl || "");
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		if (!($isData || typeof $schema == "number")) throw new Error($keyword + " must be number");
		var $op = $keyword == "maxLength" ? ">" : "<";
		out += "if ( ";
		if ($isData) out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
		if (it.opts.unicode === false) out += " " + $data + ".length ";
		else out += " ucs2length(" + $data + ") ";
		out += " " + $op + " " + $schemaValue + ") { ";
		var $errorKeyword = $keyword;
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: '" + ($errorKeyword || "_limitLength") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { limit: " + $schemaValue + " } ";
			if (it.opts.messages !== false) {
				out += " , message: 'should NOT be ";
				if ($keyword == "maxLength") out += "longer";
				else out += "shorter";
				out += " than ";
				if ($isData) out += "' + " + $schemaValue + " + '";
				else out += "" + $schema;
				out += " characters' ";
			}
			if (it.opts.verbose) {
				out += " , schema:  ";
				if ($isData) out += "validate.schema" + $schemaPath;
				else out += "" + $schema;
				out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			}
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += "} ";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require__limitProperties = __commonJSMin((exports, module) => {
	module.exports = function generate__limitProperties(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $errorKeyword;
		var $data = "data" + ($dataLvl || "");
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		if (!($isData || typeof $schema == "number")) throw new Error($keyword + " must be number");
		var $op = $keyword == "maxProperties" ? ">" : "<";
		out += "if ( ";
		if ($isData) out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
		out += " Object.keys(" + $data + ").length " + $op + " " + $schemaValue + ") { ";
		var $errorKeyword = $keyword;
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: '" + ($errorKeyword || "_limitProperties") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { limit: " + $schemaValue + " } ";
			if (it.opts.messages !== false) {
				out += " , message: 'should NOT have ";
				if ($keyword == "maxProperties") out += "more";
				else out += "fewer";
				out += " than ";
				if ($isData) out += "' + " + $schemaValue + " + '";
				else out += "" + $schema;
				out += " properties' ";
			}
			if (it.opts.verbose) {
				out += " , schema:  ";
				if ($isData) out += "validate.schema" + $schemaPath;
				else out += "" + $schema;
				out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			}
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += "} ";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require_multipleOf = __commonJSMin((exports, module) => {
	module.exports = function generate_multipleOf(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		if (!($isData || typeof $schema == "number")) throw new Error($keyword + " must be number");
		out += "var division" + $lvl + ";if (";
		if ($isData) out += " " + $schemaValue + " !== undefined && ( typeof " + $schemaValue + " != 'number' || ";
		out += " (division" + $lvl + " = " + $data + " / " + $schemaValue + ", ";
		if (it.opts.multipleOfPrecision) out += " Math.abs(Math.round(division" + $lvl + ") - division" + $lvl + ") > 1e-" + it.opts.multipleOfPrecision + " ";
		else out += " division" + $lvl + " !== parseInt(division" + $lvl + ") ";
		out += " ) ";
		if ($isData) out += "  )  ";
		out += " ) {   ";
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: 'multipleOf' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { multipleOf: " + $schemaValue + " } ";
			if (it.opts.messages !== false) {
				out += " , message: 'should be multiple of ";
				if ($isData) out += "' + " + $schemaValue;
				else out += "" + $schemaValue + "'";
			}
			if (it.opts.verbose) {
				out += " , schema:  ";
				if ($isData) out += "validate.schema" + $schemaPath;
				else out += "" + $schema;
				out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			}
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += "} ";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require_not = __commonJSMin((exports, module) => {
	module.exports = function generate_not(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		$it.level++;
		var $nextValid = "valid" + $it.level;
		if (it.opts.strictKeywords ? typeof $schema == "object" && Object.keys($schema).length > 0 || $schema === false : it.util.schemaHasRules($schema, it.RULES.all)) {
			$it.schema = $schema;
			$it.schemaPath = $schemaPath;
			$it.errSchemaPath = $errSchemaPath;
			out += " var " + $errs + " = errors;  ";
			var $wasComposite = it.compositeRule;
			it.compositeRule = $it.compositeRule = true;
			$it.createErrors = false;
			var $allErrorsOption;
			if ($it.opts.allErrors) {
				$allErrorsOption = $it.opts.allErrors;
				$it.opts.allErrors = false;
			}
			out += " " + it.validate($it) + " ";
			$it.createErrors = true;
			if ($allErrorsOption) $it.opts.allErrors = $allErrorsOption;
			it.compositeRule = $it.compositeRule = $wasComposite;
			out += " if (" + $nextValid + ") {   ";
			var $$outStack = $$outStack || [];
			$$outStack.push(out);
			out = "";
			if (it.createErrors !== false) {
				out += " { keyword: 'not' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
				if (it.opts.messages !== false) out += " , message: 'should NOT be valid' ";
				if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
				out += " } ";
			} else out += " {} ";
			var __err = out;
			out = $$outStack.pop();
			if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
			if (it.async) out += " throw new ValidationError([" + __err + "]); ";
			else out += " validate.errors = [" + __err + "]; return false; ";
			else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			out += " } else {  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; } ";
			if (it.opts.allErrors) out += " } ";
		} else {
			out += "  var err =   ";
			if (it.createErrors !== false) {
				out += " { keyword: 'not' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
				if (it.opts.messages !== false) out += " , message: 'should NOT be valid' ";
				if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
				out += " } ";
			} else out += " {} ";
			out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			if ($breakOnError) out += " if (false) { ";
		}
		return out;
	};
});
var require_oneOf = __commonJSMin((exports, module) => {
	module.exports = function generate_oneOf(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		var $closingBraces = "";
		$it.level++;
		var $nextValid = "valid" + $it.level;
		var $currentBaseId = $it.baseId, $prevValid = "prevValid" + $lvl, $passingSchemas = "passingSchemas" + $lvl;
		out += "var " + $errs + " = errors , " + $prevValid + " = false , " + $valid + " = false , " + $passingSchemas + " = null; ";
		var $wasComposite = it.compositeRule;
		it.compositeRule = $it.compositeRule = true;
		var arr1 = $schema;
		if (arr1) {
			var $sch, $i = -1, l1 = arr1.length - 1;
			while ($i < l1) {
				$sch = arr1[$i += 1];
				if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
					$it.schema = $sch;
					$it.schemaPath = $schemaPath + "[" + $i + "]";
					$it.errSchemaPath = $errSchemaPath + "/" + $i;
					out += "  " + it.validate($it) + " ";
					$it.baseId = $currentBaseId;
				} else out += " var " + $nextValid + " = true; ";
				if ($i) {
					out += " if (" + $nextValid + " && " + $prevValid + ") { " + $valid + " = false; " + $passingSchemas + " = [" + $passingSchemas + ", " + $i + "]; } else { ";
					$closingBraces += "}";
				}
				out += " if (" + $nextValid + ") { " + $valid + " = " + $prevValid + " = true; " + $passingSchemas + " = " + $i + "; }";
			}
		}
		it.compositeRule = $it.compositeRule = $wasComposite;
		out += "" + $closingBraces + "if (!" + $valid + ") {   var err =   ";
		if (it.createErrors !== false) {
			out += " { keyword: 'oneOf' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { passingSchemas: " + $passingSchemas + " } ";
			if (it.opts.messages !== false) out += " , message: 'should match exactly one schema in oneOf' ";
			if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			out += " } ";
		} else out += " {} ";
		out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError(vErrors); ";
		else out += " validate.errors = vErrors; return false; ";
		out += "} else {  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; }";
		if (it.opts.allErrors) out += " } ";
		return out;
	};
});
var require_pattern = __commonJSMin((exports, module) => {
	module.exports = function generate_pattern(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		var $regexp = $isData ? "(new RegExp(" + $schemaValue + "))" : it.usePattern($schema);
		out += "if ( ";
		if ($isData) out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'string') || ";
		out += " !" + $regexp + ".test(" + $data + ") ) {   ";
		var $$outStack = $$outStack || [];
		$$outStack.push(out);
		out = "";
		if (it.createErrors !== false) {
			out += " { keyword: 'pattern' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { pattern:  ";
			if ($isData) out += "" + $schemaValue;
			else out += "" + it.util.toQuotedString($schema);
			out += "  } ";
			if (it.opts.messages !== false) {
				out += " , message: 'should match pattern \"";
				if ($isData) out += "' + " + $schemaValue + " + '";
				else out += "" + it.util.escapeQuotes($schema);
				out += "\"' ";
			}
			if (it.opts.verbose) {
				out += " , schema:  ";
				if ($isData) out += "validate.schema" + $schemaPath;
				else out += "" + it.util.toQuotedString($schema);
				out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
			}
			out += " } ";
		} else out += " {} ";
		var __err = out;
		out = $$outStack.pop();
		if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
		if (it.async) out += " throw new ValidationError([" + __err + "]); ";
		else out += " validate.errors = [" + __err + "]; return false; ";
		else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
		out += "} ";
		if ($breakOnError) out += " else { ";
		return out;
	};
});
var require_properties = __commonJSMin((exports, module) => {
	module.exports = function generate_properties(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		var $closingBraces = "";
		$it.level++;
		var $nextValid = "valid" + $it.level;
		var $key = "key" + $lvl, $idx = "idx" + $lvl, $dataNxt = $it.dataLevel = it.dataLevel + 1, $nextData = "data" + $dataNxt, $dataProperties = "dataProperties" + $lvl;
		var $schemaKeys = Object.keys($schema || {}).filter(notProto), $pProperties = it.schema.patternProperties || {}, $pPropertyKeys = Object.keys($pProperties).filter(notProto), $aProperties = it.schema.additionalProperties, $someProperties = $schemaKeys.length || $pPropertyKeys.length, $noAdditional = $aProperties === false, $additionalIsSchema = typeof $aProperties == "object" && Object.keys($aProperties).length, $removeAdditional = it.opts.removeAdditional, $checkAdditional = $noAdditional || $additionalIsSchema || $removeAdditional, $ownProperties = it.opts.ownProperties, $currentBaseId = it.baseId;
		var $required = it.schema.required;
		if ($required && !(it.opts.$data && $required.$data) && $required.length < it.opts.loopRequired) var $requiredHash = it.util.toHash($required);
		function notProto(p) {
			return p !== "__proto__";
		}
		out += "var " + $errs + " = errors;var " + $nextValid + " = true;";
		if ($ownProperties) out += " var " + $dataProperties + " = undefined;";
		if ($checkAdditional) {
			if ($ownProperties) out += " " + $dataProperties + " = " + $dataProperties + " || Object.keys(" + $data + "); for (var " + $idx + "=0; " + $idx + "<" + $dataProperties + ".length; " + $idx + "++) { var " + $key + " = " + $dataProperties + "[" + $idx + "]; ";
			else out += " for (var " + $key + " in " + $data + ") { ";
			if ($someProperties) {
				out += " var isAdditional" + $lvl + " = !(false ";
				if ($schemaKeys.length) if ($schemaKeys.length > 8) out += " || validate.schema" + $schemaPath + ".hasOwnProperty(" + $key + ") ";
				else {
					var arr1 = $schemaKeys;
					if (arr1) {
						var $propertyKey, i1 = -1, l1 = arr1.length - 1;
						while (i1 < l1) {
							$propertyKey = arr1[i1 += 1];
							out += " || " + $key + " == " + it.util.toQuotedString($propertyKey) + " ";
						}
					}
				}
				if ($pPropertyKeys.length) {
					var arr2 = $pPropertyKeys;
					if (arr2) {
						var $pProperty, $i = -1, l2 = arr2.length - 1;
						while ($i < l2) {
							$pProperty = arr2[$i += 1];
							out += " || " + it.usePattern($pProperty) + ".test(" + $key + ") ";
						}
					}
				}
				out += " ); if (isAdditional" + $lvl + ") { ";
			}
			if ($removeAdditional == "all") out += " delete " + $data + "[" + $key + "]; ";
			else {
				var $currentErrorPath = it.errorPath;
				var $additionalProperty = "' + " + $key + " + '";
				if (it.opts._errorDataPathProperty) it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
				if ($noAdditional) if ($removeAdditional) out += " delete " + $data + "[" + $key + "]; ";
				else {
					out += " " + $nextValid + " = false; ";
					var $currErrSchemaPath = $errSchemaPath;
					$errSchemaPath = it.errSchemaPath + "/additionalProperties";
					var $$outStack = $$outStack || [];
					$$outStack.push(out);
					out = "";
					if (it.createErrors !== false) {
						out += " { keyword: 'additionalProperties' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { additionalProperty: '" + $additionalProperty + "' } ";
						if (it.opts.messages !== false) {
							out += " , message: '";
							if (it.opts._errorDataPathProperty) out += "is an invalid additional property";
							else out += "should NOT have additional properties";
							out += "' ";
						}
						if (it.opts.verbose) out += " , schema: false , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
						out += " } ";
					} else out += " {} ";
					var __err = out;
					out = $$outStack.pop();
					if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
					if (it.async) out += " throw new ValidationError([" + __err + "]); ";
					else out += " validate.errors = [" + __err + "]; return false; ";
					else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
					$errSchemaPath = $currErrSchemaPath;
					if ($breakOnError) out += " break; ";
				}
				else if ($additionalIsSchema) if ($removeAdditional == "failing") {
					out += " var " + $errs + " = errors;  ";
					var $wasComposite = it.compositeRule;
					it.compositeRule = $it.compositeRule = true;
					$it.schema = $aProperties;
					$it.schemaPath = it.schemaPath + ".additionalProperties";
					$it.errSchemaPath = it.errSchemaPath + "/additionalProperties";
					$it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
					var $passData = $data + "[" + $key + "]";
					$it.dataPathArr[$dataNxt] = $key;
					var $code = it.validate($it);
					$it.baseId = $currentBaseId;
					if (it.util.varOccurences($code, $nextData) < 2) out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
					else out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
					out += " if (!" + $nextValid + ") { errors = " + $errs + "; if (validate.errors !== null) { if (errors) validate.errors.length = errors; else validate.errors = null; } delete " + $data + "[" + $key + "]; }  ";
					it.compositeRule = $it.compositeRule = $wasComposite;
				} else {
					$it.schema = $aProperties;
					$it.schemaPath = it.schemaPath + ".additionalProperties";
					$it.errSchemaPath = it.errSchemaPath + "/additionalProperties";
					$it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
					var $passData = $data + "[" + $key + "]";
					$it.dataPathArr[$dataNxt] = $key;
					var $code = it.validate($it);
					$it.baseId = $currentBaseId;
					if (it.util.varOccurences($code, $nextData) < 2) out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
					else out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
					if ($breakOnError) out += " if (!" + $nextValid + ") break; ";
				}
				it.errorPath = $currentErrorPath;
			}
			if ($someProperties) out += " } ";
			out += " }  ";
			if ($breakOnError) {
				out += " if (" + $nextValid + ") { ";
				$closingBraces += "}";
			}
		}
		var $useDefaults = it.opts.useDefaults && !it.compositeRule;
		if ($schemaKeys.length) {
			var arr3 = $schemaKeys;
			if (arr3) {
				var $propertyKey, i3 = -1, l3 = arr3.length - 1;
				while (i3 < l3) {
					$propertyKey = arr3[i3 += 1];
					var $sch = $schema[$propertyKey];
					if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
						var $prop = it.util.getProperty($propertyKey), $passData = $data + $prop, $hasDefault = $useDefaults && $sch.default !== void 0;
						$it.schema = $sch;
						$it.schemaPath = $schemaPath + $prop;
						$it.errSchemaPath = $errSchemaPath + "/" + it.util.escapeFragment($propertyKey);
						$it.errorPath = it.util.getPath(it.errorPath, $propertyKey, it.opts.jsonPointers);
						$it.dataPathArr[$dataNxt] = it.util.toQuotedString($propertyKey);
						var $code = it.validate($it);
						$it.baseId = $currentBaseId;
						if (it.util.varOccurences($code, $nextData) < 2) {
							$code = it.util.varReplace($code, $nextData, $passData);
							var $useData = $passData;
						} else {
							var $useData = $nextData;
							out += " var " + $nextData + " = " + $passData + "; ";
						}
						if ($hasDefault) out += " " + $code + " ";
						else {
							if ($requiredHash && $requiredHash[$propertyKey]) {
								out += " if ( " + $useData + " === undefined ";
								if ($ownProperties) out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
								out += ") { " + $nextValid + " = false; ";
								var $currentErrorPath = it.errorPath, $currErrSchemaPath = $errSchemaPath, $missingProperty = it.util.escapeQuotes($propertyKey);
								if (it.opts._errorDataPathProperty) it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
								$errSchemaPath = it.errSchemaPath + "/required";
								var $$outStack = $$outStack || [];
								$$outStack.push(out);
								out = "";
								if (it.createErrors !== false) {
									out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
									if (it.opts.messages !== false) {
										out += " , message: '";
										if (it.opts._errorDataPathProperty) out += "is a required property";
										else out += "should have required property \\'" + $missingProperty + "\\'";
										out += "' ";
									}
									if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
									out += " } ";
								} else out += " {} ";
								var __err = out;
								out = $$outStack.pop();
								if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
								if (it.async) out += " throw new ValidationError([" + __err + "]); ";
								else out += " validate.errors = [" + __err + "]; return false; ";
								else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
								$errSchemaPath = $currErrSchemaPath;
								it.errorPath = $currentErrorPath;
								out += " } else { ";
							} else if ($breakOnError) {
								out += " if ( " + $useData + " === undefined ";
								if ($ownProperties) out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
								out += ") { " + $nextValid + " = true; } else { ";
							} else {
								out += " if (" + $useData + " !== undefined ";
								if ($ownProperties) out += " &&   Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
								out += " ) { ";
							}
							out += " " + $code + " } ";
						}
					}
					if ($breakOnError) {
						out += " if (" + $nextValid + ") { ";
						$closingBraces += "}";
					}
				}
			}
		}
		if ($pPropertyKeys.length) {
			var arr4 = $pPropertyKeys;
			if (arr4) {
				var $pProperty, i4 = -1, l4 = arr4.length - 1;
				while (i4 < l4) {
					$pProperty = arr4[i4 += 1];
					var $sch = $pProperties[$pProperty];
					if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
						$it.schema = $sch;
						$it.schemaPath = it.schemaPath + ".patternProperties" + it.util.getProperty($pProperty);
						$it.errSchemaPath = it.errSchemaPath + "/patternProperties/" + it.util.escapeFragment($pProperty);
						if ($ownProperties) out += " " + $dataProperties + " = " + $dataProperties + " || Object.keys(" + $data + "); for (var " + $idx + "=0; " + $idx + "<" + $dataProperties + ".length; " + $idx + "++) { var " + $key + " = " + $dataProperties + "[" + $idx + "]; ";
						else out += " for (var " + $key + " in " + $data + ") { ";
						out += " if (" + it.usePattern($pProperty) + ".test(" + $key + ")) { ";
						$it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
						var $passData = $data + "[" + $key + "]";
						$it.dataPathArr[$dataNxt] = $key;
						var $code = it.validate($it);
						$it.baseId = $currentBaseId;
						if (it.util.varOccurences($code, $nextData) < 2) out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
						else out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
						if ($breakOnError) out += " if (!" + $nextValid + ") break; ";
						out += " } ";
						if ($breakOnError) out += " else " + $nextValid + " = true; ";
						out += " }  ";
						if ($breakOnError) {
							out += " if (" + $nextValid + ") { ";
							$closingBraces += "}";
						}
					}
				}
			}
		}
		if ($breakOnError) out += " " + $closingBraces + " if (" + $errs + " == errors) {";
		return out;
	};
});
var require_propertyNames = __commonJSMin((exports, module) => {
	module.exports = function generate_propertyNames(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $errs = "errs__" + $lvl;
		var $it = it.util.copy(it);
		var $closingBraces = "";
		$it.level++;
		var $nextValid = "valid" + $it.level;
		out += "var " + $errs + " = errors;";
		if (it.opts.strictKeywords ? typeof $schema == "object" && Object.keys($schema).length > 0 || $schema === false : it.util.schemaHasRules($schema, it.RULES.all)) {
			$it.schema = $schema;
			$it.schemaPath = $schemaPath;
			$it.errSchemaPath = $errSchemaPath;
			var $key = "key" + $lvl, $idx = "idx" + $lvl, $i = "i" + $lvl, $invalidName = "' + " + $key + " + '", $dataNxt = $it.dataLevel = it.dataLevel + 1, $nextData = "data" + $dataNxt, $dataProperties = "dataProperties" + $lvl, $ownProperties = it.opts.ownProperties, $currentBaseId = it.baseId;
			if ($ownProperties) out += " var " + $dataProperties + " = undefined; ";
			if ($ownProperties) out += " " + $dataProperties + " = " + $dataProperties + " || Object.keys(" + $data + "); for (var " + $idx + "=0; " + $idx + "<" + $dataProperties + ".length; " + $idx + "++) { var " + $key + " = " + $dataProperties + "[" + $idx + "]; ";
			else out += " for (var " + $key + " in " + $data + ") { ";
			out += " var startErrs" + $lvl + " = errors; ";
			var $passData = $key;
			var $wasComposite = it.compositeRule;
			it.compositeRule = $it.compositeRule = true;
			var $code = it.validate($it);
			$it.baseId = $currentBaseId;
			if (it.util.varOccurences($code, $nextData) < 2) out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
			else out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
			it.compositeRule = $it.compositeRule = $wasComposite;
			out += " if (!" + $nextValid + ") { for (var " + $i + "=startErrs" + $lvl + "; " + $i + "<errors; " + $i + "++) { vErrors[" + $i + "].propertyName = " + $key + "; }   var err =   ";
			if (it.createErrors !== false) {
				out += " { keyword: 'propertyNames' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { propertyName: '" + $invalidName + "' } ";
				if (it.opts.messages !== false) out += " , message: 'property name \\'" + $invalidName + "\\' is invalid' ";
				if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
				out += " } ";
			} else out += " {} ";
			out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
			if (it.async) out += " throw new ValidationError(vErrors); ";
			else out += " validate.errors = vErrors; return false; ";
			if ($breakOnError) out += " break; ";
			out += " } }";
		}
		if ($breakOnError) out += " " + $closingBraces + " if (" + $errs + " == errors) {";
		return out;
	};
});
var require_required = __commonJSMin((exports, module) => {
	module.exports = function generate_required(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		var $vSchema = "schema" + $lvl;
		if (!$isData) if ($schema.length < it.opts.loopRequired && it.schema.properties && Object.keys(it.schema.properties).length) {
			var $required = [];
			var arr1 = $schema;
			if (arr1) {
				var $property, i1 = -1, l1 = arr1.length - 1;
				while (i1 < l1) {
					$property = arr1[i1 += 1];
					var $propertySch = it.schema.properties[$property];
					if (!($propertySch && (it.opts.strictKeywords ? typeof $propertySch == "object" && Object.keys($propertySch).length > 0 || $propertySch === false : it.util.schemaHasRules($propertySch, it.RULES.all)))) $required[$required.length] = $property;
				}
			}
		} else var $required = $schema;
		if ($isData || $required.length) {
			var $currentErrorPath = it.errorPath, $loopRequired = $isData || $required.length >= it.opts.loopRequired, $ownProperties = it.opts.ownProperties;
			if ($breakOnError) {
				out += " var missing" + $lvl + "; ";
				if ($loopRequired) {
					if (!$isData) out += " var " + $vSchema + " = validate.schema" + $schemaPath + "; ";
					var $i = "i" + $lvl, $propertyPath = "schema" + $lvl + "[" + $i + "]", $missingProperty = "' + " + $propertyPath + " + '";
					if (it.opts._errorDataPathProperty) it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
					out += " var " + $valid + " = true; ";
					if ($isData) out += " if (schema" + $lvl + " === undefined) " + $valid + " = true; else if (!Array.isArray(schema" + $lvl + ")) " + $valid + " = false; else {";
					out += " for (var " + $i + " = 0; " + $i + " < " + $vSchema + ".length; " + $i + "++) { " + $valid + " = " + $data + "[" + $vSchema + "[" + $i + "]] !== undefined ";
					if ($ownProperties) out += " &&   Object.prototype.hasOwnProperty.call(" + $data + ", " + $vSchema + "[" + $i + "]) ";
					out += "; if (!" + $valid + ") break; } ";
					if ($isData) out += "  }  ";
					out += "  if (!" + $valid + ") {   ";
					var $$outStack = $$outStack || [];
					$$outStack.push(out);
					out = "";
					if (it.createErrors !== false) {
						out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
						if (it.opts.messages !== false) {
							out += " , message: '";
							if (it.opts._errorDataPathProperty) out += "is a required property";
							else out += "should have required property \\'" + $missingProperty + "\\'";
							out += "' ";
						}
						if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
						out += " } ";
					} else out += " {} ";
					var __err = out;
					out = $$outStack.pop();
					if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
					if (it.async) out += " throw new ValidationError([" + __err + "]); ";
					else out += " validate.errors = [" + __err + "]; return false; ";
					else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
					out += " } else { ";
				} else {
					out += " if ( ";
					var arr2 = $required;
					if (arr2) {
						var $propertyKey, $i = -1, l2 = arr2.length - 1;
						while ($i < l2) {
							$propertyKey = arr2[$i += 1];
							if ($i) out += " || ";
							var $prop = it.util.getProperty($propertyKey), $useData = $data + $prop;
							out += " ( ( " + $useData + " === undefined ";
							if ($ownProperties) out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
							out += ") && (missing" + $lvl + " = " + it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop) + ") ) ";
						}
					}
					out += ") {  ";
					var $propertyPath = "missing" + $lvl, $missingProperty = "' + " + $propertyPath + " + '";
					if (it.opts._errorDataPathProperty) it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + " + " + $propertyPath;
					var $$outStack = $$outStack || [];
					$$outStack.push(out);
					out = "";
					if (it.createErrors !== false) {
						out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
						if (it.opts.messages !== false) {
							out += " , message: '";
							if (it.opts._errorDataPathProperty) out += "is a required property";
							else out += "should have required property \\'" + $missingProperty + "\\'";
							out += "' ";
						}
						if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
						out += " } ";
					} else out += " {} ";
					var __err = out;
					out = $$outStack.pop();
					if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
					if (it.async) out += " throw new ValidationError([" + __err + "]); ";
					else out += " validate.errors = [" + __err + "]; return false; ";
					else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
					out += " } else { ";
				}
			} else if ($loopRequired) {
				if (!$isData) out += " var " + $vSchema + " = validate.schema" + $schemaPath + "; ";
				var $i = "i" + $lvl, $propertyPath = "schema" + $lvl + "[" + $i + "]", $missingProperty = "' + " + $propertyPath + " + '";
				if (it.opts._errorDataPathProperty) it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
				if ($isData) {
					out += " if (" + $vSchema + " && !Array.isArray(" + $vSchema + ")) {  var err =   ";
					if (it.createErrors !== false) {
						out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
						if (it.opts.messages !== false) {
							out += " , message: '";
							if (it.opts._errorDataPathProperty) out += "is a required property";
							else out += "should have required property \\'" + $missingProperty + "\\'";
							out += "' ";
						}
						if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
						out += " } ";
					} else out += " {} ";
					out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } else if (" + $vSchema + " !== undefined) { ";
				}
				out += " for (var " + $i + " = 0; " + $i + " < " + $vSchema + ".length; " + $i + "++) { if (" + $data + "[" + $vSchema + "[" + $i + "]] === undefined ";
				if ($ownProperties) out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", " + $vSchema + "[" + $i + "]) ";
				out += ") {  var err =   ";
				if (it.createErrors !== false) {
					out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
					if (it.opts.messages !== false) {
						out += " , message: '";
						if (it.opts._errorDataPathProperty) out += "is a required property";
						else out += "should have required property \\'" + $missingProperty + "\\'";
						out += "' ";
					}
					if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
					out += " } ";
				} else out += " {} ";
				out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } } ";
				if ($isData) out += "  }  ";
			} else {
				var arr3 = $required;
				if (arr3) {
					var $propertyKey, i3 = -1, l3 = arr3.length - 1;
					while (i3 < l3) {
						$propertyKey = arr3[i3 += 1];
						var $prop = it.util.getProperty($propertyKey), $missingProperty = it.util.escapeQuotes($propertyKey), $useData = $data + $prop;
						if (it.opts._errorDataPathProperty) it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
						out += " if ( " + $useData + " === undefined ";
						if ($ownProperties) out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
						out += ") {  var err =   ";
						if (it.createErrors !== false) {
							out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
							if (it.opts.messages !== false) {
								out += " , message: '";
								if (it.opts._errorDataPathProperty) out += "is a required property";
								else out += "should have required property \\'" + $missingProperty + "\\'";
								out += "' ";
							}
							if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
							out += " } ";
						} else out += " {} ";
						out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ";
					}
				}
			}
			it.errorPath = $currentErrorPath;
		} else if ($breakOnError) out += " if (true) {";
		return out;
	};
});
var require_uniqueItems = __commonJSMin((exports, module) => {
	module.exports = function generate_uniqueItems(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		if (($schema || $isData) && it.opts.uniqueItems !== false) {
			if ($isData) out += " var " + $valid + "; if (" + $schemaValue + " === false || " + $schemaValue + " === undefined) " + $valid + " = true; else if (typeof " + $schemaValue + " != 'boolean') " + $valid + " = false; else { ";
			out += " var i = " + $data + ".length , " + $valid + " = true , j; if (i > 1) { ";
			var $itemType = it.schema.items && it.schema.items.type, $typeIsArray = Array.isArray($itemType);
			if (!$itemType || $itemType == "object" || $itemType == "array" || $typeIsArray && ($itemType.indexOf("object") >= 0 || $itemType.indexOf("array") >= 0)) out += " outer: for (;i--;) { for (j = i; j--;) { if (equal(" + $data + "[i], " + $data + "[j])) { " + $valid + " = false; break outer; } } } ";
			else {
				out += " var itemIndices = {}, item; for (;i--;) { var item = " + $data + "[i]; ";
				var $method = "checkDataType" + ($typeIsArray ? "s" : "");
				out += " if (" + it.util[$method]($itemType, "item", it.opts.strictNumbers, true) + ") continue; ";
				if ($typeIsArray) out += " if (typeof item == 'string') item = '\"' + item; ";
				out += " if (typeof itemIndices[item] == 'number') { " + $valid + " = false; j = itemIndices[item]; break; } itemIndices[item] = i; } ";
			}
			out += " } ";
			if ($isData) out += "  }  ";
			out += " if (!" + $valid + ") {   ";
			var $$outStack = $$outStack || [];
			$$outStack.push(out);
			out = "";
			if (it.createErrors !== false) {
				out += " { keyword: 'uniqueItems' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { i: i, j: j } ";
				if (it.opts.messages !== false) out += " , message: 'should NOT have duplicate items (items ## ' + j + ' and ' + i + ' are identical)' ";
				if (it.opts.verbose) {
					out += " , schema:  ";
					if ($isData) out += "validate.schema" + $schemaPath;
					else out += "" + $schema;
					out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
				}
				out += " } ";
			} else out += " {} ";
			var __err = out;
			out = $$outStack.pop();
			if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
			if (it.async) out += " throw new ValidationError([" + __err + "]); ";
			else out += " validate.errors = [" + __err + "]; return false; ";
			else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			out += " } ";
			if ($breakOnError) out += " else { ";
		} else if ($breakOnError) out += " if (true) { ";
		return out;
	};
});
var require_dotjs = __commonJSMin((exports, module) => {
	module.exports = {
		"$ref": require_ref(),
		allOf: require_allOf(),
		anyOf: require_anyOf(),
		"$comment": require_comment(),
		const: require_const(),
		contains: require_contains(),
		dependencies: require_dependencies(),
		"enum": require_enum(),
		format: require_format(),
		"if": require_if(),
		items: require_items(),
		maximum: require__limit(),
		minimum: require__limit(),
		maxItems: require__limitItems(),
		minItems: require__limitItems(),
		maxLength: require__limitLength(),
		minLength: require__limitLength(),
		maxProperties: require__limitProperties(),
		minProperties: require__limitProperties(),
		multipleOf: require_multipleOf(),
		not: require_not(),
		oneOf: require_oneOf(),
		pattern: require_pattern(),
		properties: require_properties(),
		propertyNames: require_propertyNames(),
		required: require_required(),
		uniqueItems: require_uniqueItems(),
		validate: require_validate()
	};
});
var require_rules = __commonJSMin((exports, module) => {
	var ruleModules = require_dotjs(), toHash = require_util().toHash;
	module.exports = function rules$1() {
		var RULES = [
			{
				type: "number",
				rules: [
					{ "maximum": ["exclusiveMaximum"] },
					{ "minimum": ["exclusiveMinimum"] },
					"multipleOf",
					"format"
				]
			},
			{
				type: "string",
				rules: [
					"maxLength",
					"minLength",
					"pattern",
					"format"
				]
			},
			{
				type: "array",
				rules: [
					"maxItems",
					"minItems",
					"items",
					"contains",
					"uniqueItems"
				]
			},
			{
				type: "object",
				rules: [
					"maxProperties",
					"minProperties",
					"required",
					"dependencies",
					"propertyNames",
					{ "properties": ["additionalProperties", "patternProperties"] }
				]
			},
			{ rules: [
				"$ref",
				"const",
				"enum",
				"not",
				"anyOf",
				"oneOf",
				"allOf",
				"if"
			] }
		];
		var ALL = ["type", "$comment"];
		var KEYWORDS$1 = [
			"$schema",
			"$id",
			"id",
			"$data",
			"$async",
			"title",
			"description",
			"default",
			"definitions",
			"examples",
			"readOnly",
			"writeOnly",
			"contentMediaType",
			"contentEncoding",
			"additionalItems",
			"then",
			"else"
		];
		var TYPES = [
			"number",
			"integer",
			"string",
			"array",
			"object",
			"boolean",
			"null"
		];
		RULES.all = toHash(ALL);
		RULES.types = toHash(TYPES);
		RULES.forEach(function(group) {
			group.rules = group.rules.map(function(keyword) {
				var implKeywords;
				if (typeof keyword == "object") {
					var key = Object.keys(keyword)[0];
					implKeywords = keyword[key];
					keyword = key;
					implKeywords.forEach(function(k) {
						ALL.push(k);
						RULES.all[k] = true;
					});
				}
				ALL.push(keyword);
				var rule = RULES.all[keyword] = {
					keyword,
					code: ruleModules[keyword],
					implements: implKeywords
				};
				return rule;
			});
			RULES.all.$comment = {
				keyword: "$comment",
				code: ruleModules.$comment
			};
			if (group.type) RULES.types[group.type] = group;
		});
		RULES.keywords = toHash(ALL.concat(KEYWORDS$1));
		RULES.custom = {};
		return RULES;
	};
});
var require_data$1 = __commonJSMin((exports, module) => {
	var KEYWORDS = [
		"multipleOf",
		"maximum",
		"exclusiveMaximum",
		"minimum",
		"exclusiveMinimum",
		"maxLength",
		"minLength",
		"pattern",
		"additionalItems",
		"maxItems",
		"minItems",
		"uniqueItems",
		"maxProperties",
		"minProperties",
		"required",
		"additionalProperties",
		"enum",
		"format",
		"const"
	];
	module.exports = function(metaSchema$1, keywordsJsonPointers) {
		for (var i = 0; i < keywordsJsonPointers.length; i++) {
			metaSchema$1 = JSON.parse(JSON.stringify(metaSchema$1));
			var segments = keywordsJsonPointers[i].split("/");
			var keywords = metaSchema$1;
			var j;
			for (j = 1; j < segments.length; j++) keywords = keywords[segments[j]];
			for (j = 0; j < KEYWORDS.length; j++) {
				var key = KEYWORDS[j];
				var schema = keywords[key];
				if (schema) keywords[key] = { anyOf: [schema, { $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#" }] };
			}
		}
		return metaSchema$1;
	};
});
var require_async = __commonJSMin((exports, module) => {
	var MissingRefError = require_error_classes().MissingRef;
	module.exports = compileAsync;
	/**
	* Creates validating function for passed schema with asynchronous loading of missing schemas.
	* `loadSchema` option should be a function that accepts schema uri and returns promise that resolves with the schema.
	* @this  Ajv
	* @param {Object}   schema schema object
	* @param {Boolean}  meta optional true to compile meta-schema; this parameter can be skipped
	* @param {Function} callback an optional node-style callback, it is called with 2 parameters: error (or null) and validating function.
	* @return {Promise} promise that resolves with a validating function.
	*/
	function compileAsync(schema, meta, callback) {
		var self = this;
		if (typeof this._opts.loadSchema != "function") throw new Error("options.loadSchema should be a function");
		if (typeof meta == "function") {
			callback = meta;
			meta = void 0;
		}
		var p = loadMetaSchemaOf(schema).then(function() {
			var schemaObj = self._addSchema(schema, void 0, meta);
			return schemaObj.validate || _compileAsync(schemaObj);
		});
		if (callback) p.then(function(v) {
			callback(null, v);
		}, callback);
		return p;
		function loadMetaSchemaOf(sch) {
			var $schema = sch.$schema;
			return $schema && !self.getSchema($schema) ? compileAsync.call(self, { $ref: $schema }, true) : Promise.resolve();
		}
		function _compileAsync(schemaObj) {
			try {
				return self._compile(schemaObj);
			} catch (e) {
				if (e instanceof MissingRefError) return loadMissingSchema(e);
				throw e;
			}
			function loadMissingSchema(e) {
				var ref = e.missingSchema;
				if (added(ref)) throw new Error("Schema " + ref + " is loaded but " + e.missingRef + " cannot be resolved");
				var schemaPromise = self._loadingSchemas[ref];
				if (!schemaPromise) {
					schemaPromise = self._loadingSchemas[ref] = self._opts.loadSchema(ref);
					schemaPromise.then(removePromise, removePromise);
				}
				return schemaPromise.then(function(sch) {
					if (!added(ref)) return loadMetaSchemaOf(sch).then(function() {
						if (!added(ref)) self.addSchema(sch, ref, void 0, meta);
					});
				}).then(function() {
					return _compileAsync(schemaObj);
				});
				function removePromise() {
					delete self._loadingSchemas[ref];
				}
				function added(ref$1) {
					return self._refs[ref$1] || self._schemas[ref$1];
				}
			}
		}
	}
});
var require_custom = __commonJSMin((exports, module) => {
	module.exports = function generate_custom(it, $keyword, $ruleType) {
		var out = " ";
		var $lvl = it.level;
		var $dataLvl = it.dataLevel;
		var $schema = it.schema[$keyword];
		var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
		var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
		var $breakOnError = !it.opts.allErrors;
		var $errorKeyword;
		var $data = "data" + ($dataLvl || "");
		var $valid = "valid" + $lvl;
		var $errs = "errs__" + $lvl;
		var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
		if ($isData) {
			out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
			$schemaValue = "schema" + $lvl;
		} else $schemaValue = $schema;
		var $rule = this, $definition = "definition" + $lvl, $rDef = $rule.definition, $closingBraces = "";
		var $compile, $inline, $macro, $ruleValidate, $validateCode;
		if ($isData && $rDef.$data) {
			$validateCode = "keywordValidate" + $lvl;
			var $validateSchema = $rDef.validateSchema;
			out += " var " + $definition + " = RULES.custom['" + $keyword + "'].definition; var " + $validateCode + " = " + $definition + ".validate;";
		} else {
			$ruleValidate = it.useCustomRule($rule, $schema, it.schema, it);
			if (!$ruleValidate) return;
			$schemaValue = "validate.schema" + $schemaPath;
			$validateCode = $ruleValidate.code;
			$compile = $rDef.compile;
			$inline = $rDef.inline;
			$macro = $rDef.macro;
		}
		var $ruleErrs = $validateCode + ".errors", $i = "i" + $lvl, $ruleErr = "ruleErr" + $lvl, $asyncKeyword = $rDef.async;
		if ($asyncKeyword && !it.async) throw new Error("async keyword in sync schema");
		if (!($inline || $macro)) out += "" + $ruleErrs + " = null;";
		out += "var " + $errs + " = errors;var " + $valid + ";";
		if ($isData && $rDef.$data) {
			$closingBraces += "}";
			out += " if (" + $schemaValue + " === undefined) { " + $valid + " = true; } else { ";
			if ($validateSchema) {
				$closingBraces += "}";
				out += " " + $valid + " = " + $definition + ".validateSchema(" + $schemaValue + "); if (" + $valid + ") { ";
			}
		}
		if ($inline) if ($rDef.statements) out += " " + $ruleValidate.validate + " ";
		else out += " " + $valid + " = " + $ruleValidate.validate + "; ";
		else if ($macro) {
			var $it = it.util.copy(it);
			var $closingBraces = "";
			$it.level++;
			var $nextValid = "valid" + $it.level;
			$it.schema = $ruleValidate.validate;
			$it.schemaPath = "";
			var $wasComposite = it.compositeRule;
			it.compositeRule = $it.compositeRule = true;
			var $code = it.validate($it).replace(/validate\.schema/g, $validateCode);
			it.compositeRule = $it.compositeRule = $wasComposite;
			out += " " + $code;
		} else {
			var $$outStack = $$outStack || [];
			$$outStack.push(out);
			out = "";
			out += "  " + $validateCode + ".call( ";
			if (it.opts.passContext) out += "this";
			else out += "self";
			if ($compile || $rDef.schema === false) out += " , " + $data + " ";
			else out += " , " + $schemaValue + " , " + $data + " , validate.schema" + it.schemaPath + " ";
			out += " , (dataPath || '')";
			if (it.errorPath != "\"\"") out += " + " + it.errorPath;
			var $parentData = $dataLvl ? "data" + ($dataLvl - 1 || "") : "parentData", $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : "parentDataProperty";
			out += " , " + $parentData + " , " + $parentDataProperty + " , rootData )  ";
			var def_callRuleValidate = out;
			out = $$outStack.pop();
			if ($rDef.errors === false) {
				out += " " + $valid + " = ";
				if ($asyncKeyword) out += "await ";
				out += "" + def_callRuleValidate + "; ";
			} else if ($asyncKeyword) {
				$ruleErrs = "customErrors" + $lvl;
				out += " var " + $ruleErrs + " = null; try { " + $valid + " = await " + def_callRuleValidate + "; } catch (e) { " + $valid + " = false; if (e instanceof ValidationError) " + $ruleErrs + " = e.errors; else throw e; } ";
			} else out += " " + $ruleErrs + " = null; " + $valid + " = " + def_callRuleValidate + "; ";
		}
		if ($rDef.modifying) out += " if (" + $parentData + ") " + $data + " = " + $parentData + "[" + $parentDataProperty + "];";
		out += "" + $closingBraces;
		if ($rDef.valid) {
			if ($breakOnError) out += " if (true) { ";
		} else {
			out += " if ( ";
			if ($rDef.valid === void 0) {
				out += " !";
				if ($macro) out += "" + $nextValid;
				else out += "" + $valid;
			} else out += " " + !$rDef.valid + " ";
			out += ") { ";
			$errorKeyword = $rule.keyword;
			var $$outStack = $$outStack || [];
			$$outStack.push(out);
			out = "";
			var $$outStack = $$outStack || [];
			$$outStack.push(out);
			out = "";
			if (it.createErrors !== false) {
				out += " { keyword: '" + ($errorKeyword || "custom") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { keyword: '" + $rule.keyword + "' } ";
				if (it.opts.messages !== false) out += " , message: 'should pass \"" + $rule.keyword + "\" keyword validation' ";
				if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
				out += " } ";
			} else out += " {} ";
			var __err = out;
			out = $$outStack.pop();
			if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
			if (it.async) out += " throw new ValidationError([" + __err + "]); ";
			else out += " validate.errors = [" + __err + "]; return false; ";
			else out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
			var def_customError = out;
			out = $$outStack.pop();
			if ($inline) if ($rDef.errors) {
				if ($rDef.errors != "full") {
					out += "  for (var " + $i + "=" + $errs + "; " + $i + "<errors; " + $i + "++) { var " + $ruleErr + " = vErrors[" + $i + "]; if (" + $ruleErr + ".dataPath === undefined) " + $ruleErr + ".dataPath = (dataPath || '') + " + it.errorPath + "; if (" + $ruleErr + ".schemaPath === undefined) { " + $ruleErr + ".schemaPath = \"" + $errSchemaPath + "\"; } ";
					if (it.opts.verbose) out += " " + $ruleErr + ".schema = " + $schemaValue + "; " + $ruleErr + ".data = " + $data + "; ";
					out += " } ";
				}
			} else if ($rDef.errors === false) out += " " + def_customError + " ";
			else {
				out += " if (" + $errs + " == errors) { " + def_customError + " } else {  for (var " + $i + "=" + $errs + "; " + $i + "<errors; " + $i + "++) { var " + $ruleErr + " = vErrors[" + $i + "]; if (" + $ruleErr + ".dataPath === undefined) " + $ruleErr + ".dataPath = (dataPath || '') + " + it.errorPath + "; if (" + $ruleErr + ".schemaPath === undefined) { " + $ruleErr + ".schemaPath = \"" + $errSchemaPath + "\"; } ";
				if (it.opts.verbose) out += " " + $ruleErr + ".schema = " + $schemaValue + "; " + $ruleErr + ".data = " + $data + "; ";
				out += " } } ";
			}
			else if ($macro) {
				out += "   var err =   ";
				if (it.createErrors !== false) {
					out += " { keyword: '" + ($errorKeyword || "custom") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { keyword: '" + $rule.keyword + "' } ";
					if (it.opts.messages !== false) out += " , message: 'should pass \"" + $rule.keyword + "\" keyword validation' ";
					if (it.opts.verbose) out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
					out += " } ";
				} else out += " {} ";
				out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
				if (!it.compositeRule && $breakOnError)
 /* istanbul ignore if */
				if (it.async) out += " throw new ValidationError(vErrors); ";
				else out += " validate.errors = vErrors; return false; ";
			} else if ($rDef.errors === false) out += " " + def_customError + " ";
			else {
				out += " if (Array.isArray(" + $ruleErrs + ")) { if (vErrors === null) vErrors = " + $ruleErrs + "; else vErrors = vErrors.concat(" + $ruleErrs + "); errors = vErrors.length;  for (var " + $i + "=" + $errs + "; " + $i + "<errors; " + $i + "++) { var " + $ruleErr + " = vErrors[" + $i + "]; if (" + $ruleErr + ".dataPath === undefined) " + $ruleErr + ".dataPath = (dataPath || '') + " + it.errorPath + ";  " + $ruleErr + ".schemaPath = \"" + $errSchemaPath + "\";  ";
				if (it.opts.verbose) out += " " + $ruleErr + ".schema = " + $schemaValue + "; " + $ruleErr + ".data = " + $data + "; ";
				out += " } } else { " + def_customError + " } ";
			}
			out += " } ";
			if ($breakOnError) out += " else { ";
		}
		return out;
	};
});
var require_json_schema_draft_07 = __commonJSMin((exports, module) => {
	module.exports = {
		"$schema": "http://json-schema.org/draft-07/schema#",
		"$id": "http://json-schema.org/draft-07/schema#",
		"title": "Core schema meta-schema",
		"definitions": {
			"schemaArray": {
				"type": "array",
				"minItems": 1,
				"items": { "$ref": "#" }
			},
			"nonNegativeInteger": {
				"type": "integer",
				"minimum": 0
			},
			"nonNegativeIntegerDefault0": { "allOf": [{ "$ref": "#/definitions/nonNegativeInteger" }, { "default": 0 }] },
			"simpleTypes": { "enum": [
				"array",
				"boolean",
				"integer",
				"null",
				"number",
				"object",
				"string"
			] },
			"stringArray": {
				"type": "array",
				"items": { "type": "string" },
				"uniqueItems": true,
				"default": []
			}
		},
		"type": ["object", "boolean"],
		"properties": {
			"$id": {
				"type": "string",
				"format": "uri-reference"
			},
			"$schema": {
				"type": "string",
				"format": "uri"
			},
			"$ref": {
				"type": "string",
				"format": "uri-reference"
			},
			"$comment": { "type": "string" },
			"title": { "type": "string" },
			"description": { "type": "string" },
			"default": true,
			"readOnly": {
				"type": "boolean",
				"default": false
			},
			"examples": {
				"type": "array",
				"items": true
			},
			"multipleOf": {
				"type": "number",
				"exclusiveMinimum": 0
			},
			"maximum": { "type": "number" },
			"exclusiveMaximum": { "type": "number" },
			"minimum": { "type": "number" },
			"exclusiveMinimum": { "type": "number" },
			"maxLength": { "$ref": "#/definitions/nonNegativeInteger" },
			"minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
			"pattern": {
				"type": "string",
				"format": "regex"
			},
			"additionalItems": { "$ref": "#" },
			"items": {
				"anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/schemaArray" }],
				"default": true
			},
			"maxItems": { "$ref": "#/definitions/nonNegativeInteger" },
			"minItems": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
			"uniqueItems": {
				"type": "boolean",
				"default": false
			},
			"contains": { "$ref": "#" },
			"maxProperties": { "$ref": "#/definitions/nonNegativeInteger" },
			"minProperties": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
			"required": { "$ref": "#/definitions/stringArray" },
			"additionalProperties": { "$ref": "#" },
			"definitions": {
				"type": "object",
				"additionalProperties": { "$ref": "#" },
				"default": {}
			},
			"properties": {
				"type": "object",
				"additionalProperties": { "$ref": "#" },
				"default": {}
			},
			"patternProperties": {
				"type": "object",
				"additionalProperties": { "$ref": "#" },
				"propertyNames": { "format": "regex" },
				"default": {}
			},
			"dependencies": {
				"type": "object",
				"additionalProperties": { "anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/stringArray" }] }
			},
			"propertyNames": { "$ref": "#" },
			"const": true,
			"enum": {
				"type": "array",
				"items": true,
				"minItems": 1,
				"uniqueItems": true
			},
			"type": { "anyOf": [{ "$ref": "#/definitions/simpleTypes" }, {
				"type": "array",
				"items": { "$ref": "#/definitions/simpleTypes" },
				"minItems": 1,
				"uniqueItems": true
			}] },
			"format": { "type": "string" },
			"contentMediaType": { "type": "string" },
			"contentEncoding": { "type": "string" },
			"if": { "$ref": "#" },
			"then": { "$ref": "#" },
			"else": { "$ref": "#" },
			"allOf": { "$ref": "#/definitions/schemaArray" },
			"anyOf": { "$ref": "#/definitions/schemaArray" },
			"oneOf": { "$ref": "#/definitions/schemaArray" },
			"not": { "$ref": "#" }
		},
		"default": true
	};
});
var require_definition_schema = __commonJSMin((exports, module) => {
	var metaSchema = require_json_schema_draft_07();
	module.exports = {
		$id: "https://github.com/ajv-validator/ajv/blob/master/lib/definition_schema.js",
		definitions: { simpleTypes: metaSchema.definitions.simpleTypes },
		type: "object",
		dependencies: {
			schema: ["validate"],
			$data: ["validate"],
			statements: ["inline"],
			valid: { not: { required: ["macro"] } }
		},
		properties: {
			type: metaSchema.properties.type,
			schema: { type: "boolean" },
			statements: { type: "boolean" },
			dependencies: {
				type: "array",
				items: { type: "string" }
			},
			metaSchema: { type: "object" },
			modifying: { type: "boolean" },
			valid: { type: "boolean" },
			$data: { type: "boolean" },
			async: { type: "boolean" },
			errors: { anyOf: [{ type: "boolean" }, { const: "full" }] }
		}
	};
});
var require_keyword = __commonJSMin((exports, module) => {
	var IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i;
	var customRuleCode = require_custom();
	var definitionSchema = require_definition_schema();
	module.exports = {
		add: addKeyword,
		get: getKeyword,
		remove: removeKeyword,
		validate: validateKeyword
	};
	/**
	* Define custom keyword
	* @this  Ajv
	* @param {String} keyword custom keyword, should be unique (including different from all standard, custom and macro keywords).
	* @param {Object} definition keyword definition object with properties `type` (type(s) which the keyword applies to), `validate` or `compile`.
	* @return {Ajv} this for method chaining
	*/
	function addKeyword(keyword, definition) {
		var RULES = this.RULES;
		if (RULES.keywords[keyword]) throw new Error("Keyword " + keyword + " is already defined");
		if (!IDENTIFIER.test(keyword)) throw new Error("Keyword " + keyword + " is not a valid identifier");
		if (definition) {
			this.validateKeyword(definition, true);
			var dataType = definition.type;
			if (Array.isArray(dataType)) for (var i = 0; i < dataType.length; i++) _addRule(keyword, dataType[i], definition);
			else _addRule(keyword, dataType, definition);
			var metaSchema$1 = definition.metaSchema;
			if (metaSchema$1) {
				if (definition.$data && this._opts.$data) metaSchema$1 = { anyOf: [metaSchema$1, { "$ref": "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#" }] };
				definition.validateSchema = this.compile(metaSchema$1, true);
			}
		}
		RULES.keywords[keyword] = RULES.all[keyword] = true;
		function _addRule(keyword$1, dataType$1, definition$1) {
			var ruleGroup;
			for (var i$1 = 0; i$1 < RULES.length; i$1++) {
				var rg = RULES[i$1];
				if (rg.type == dataType$1) {
					ruleGroup = rg;
					break;
				}
			}
			if (!ruleGroup) {
				ruleGroup = {
					type: dataType$1,
					rules: []
				};
				RULES.push(ruleGroup);
			}
			var rule = {
				keyword: keyword$1,
				definition: definition$1,
				custom: true,
				code: customRuleCode,
				implements: definition$1.implements
			};
			ruleGroup.rules.push(rule);
			RULES.custom[keyword$1] = rule;
		}
		return this;
	}
	/**
	* Get keyword
	* @this  Ajv
	* @param {String} keyword pre-defined or custom keyword.
	* @return {Object|Boolean} custom keyword definition, `true` if it is a predefined keyword, `false` otherwise.
	*/
	function getKeyword(keyword) {
		var rule = this.RULES.custom[keyword];
		return rule ? rule.definition : this.RULES.keywords[keyword] || false;
	}
	/**
	* Remove keyword
	* @this  Ajv
	* @param {String} keyword pre-defined or custom keyword.
	* @return {Ajv} this for method chaining
	*/
	function removeKeyword(keyword) {
		var RULES = this.RULES;
		delete RULES.keywords[keyword];
		delete RULES.all[keyword];
		delete RULES.custom[keyword];
		for (var i = 0; i < RULES.length; i++) {
			var rules$1 = RULES[i].rules;
			for (var j = 0; j < rules$1.length; j++) if (rules$1[j].keyword == keyword) {
				rules$1.splice(j, 1);
				break;
			}
		}
		return this;
	}
	/**
	* Validate keyword definition
	* @this  Ajv
	* @param {Object} definition keyword definition object.
	* @param {Boolean} throwError true to throw exception if definition is invalid
	* @return {boolean} validation result
	*/
	function validateKeyword(definition, throwError) {
		validateKeyword.errors = null;
		var v = this._validateKeyword = this._validateKeyword || this.compile(definitionSchema, true);
		if (v(definition)) return true;
		validateKeyword.errors = v.errors;
		if (throwError) throw new Error("custom keyword definition is invalid: " + this.errorsText(v.errors));
		else return false;
	}
});
var require_data = __commonJSMin((exports, module) => {
	module.exports = {
		"$schema": "http://json-schema.org/draft-07/schema#",
		"$id": "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
		"description": "Meta-schema for $data reference (JSON Schema extension proposal)",
		"type": "object",
		"required": ["$data"],
		"properties": { "$data": {
			"type": "string",
			"anyOf": [{ "format": "relative-json-pointer" }, { "format": "json-pointer" }]
		} },
		"additionalProperties": false
	};
});
var require_ajv = __commonJSMin((exports, module) => {
	var compileSchema = require_compile(), resolve = require_resolve(), Cache = require_cache(), SchemaObject = require_schema_obj(), stableStringify = require_fast_json_stable_stringify(), formats = require_formats(), rules = require_rules(), $dataMetaSchema = require_data$1(), util = require_util();
	module.exports = Ajv$2;
	Ajv$2.prototype.validate = validate;
	Ajv$2.prototype.compile = compile;
	Ajv$2.prototype.addSchema = addSchema;
	Ajv$2.prototype.addMetaSchema = addMetaSchema;
	Ajv$2.prototype.validateSchema = validateSchema;
	Ajv$2.prototype.getSchema = getSchema;
	Ajv$2.prototype.removeSchema = removeSchema;
	Ajv$2.prototype.addFormat = addFormat$1;
	Ajv$2.prototype.errorsText = errorsText;
	Ajv$2.prototype._addSchema = _addSchema;
	Ajv$2.prototype._compile = _compile;
	Ajv$2.prototype.compileAsync = require_async();
	var customKeyword = require_keyword();
	Ajv$2.prototype.addKeyword = customKeyword.add;
	Ajv$2.prototype.getKeyword = customKeyword.get;
	Ajv$2.prototype.removeKeyword = customKeyword.remove;
	Ajv$2.prototype.validateKeyword = customKeyword.validate;
	var errorClasses = require_error_classes();
	Ajv$2.ValidationError = errorClasses.Validation;
	Ajv$2.MissingRefError = errorClasses.MissingRef;
	Ajv$2.$dataMetaSchema = $dataMetaSchema;
	var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
	var META_IGNORE_OPTIONS = [
		"removeAdditional",
		"useDefaults",
		"coerceTypes",
		"strictDefaults"
	];
	var META_SUPPORT_DATA = ["/properties"];
	/**
	* Creates validator instance.
	* Usage: `Ajv(opts)`
	* @param {Object} opts optional options
	* @return {Object} ajv instance
	*/
	function Ajv$2(opts) {
		if (!(this instanceof Ajv$2)) return new Ajv$2(opts);
		opts = this._opts = util.copy(opts) || {};
		setLogger(this);
		this._schemas = {};
		this._refs = {};
		this._fragments = {};
		this._formats = formats(opts.format);
		this._cache = opts.cache || new Cache();
		this._loadingSchemas = {};
		this._compilations = [];
		this.RULES = rules();
		this._getId = chooseGetId(opts);
		opts.loopRequired = opts.loopRequired || Infinity;
		if (opts.errorDataPath == "property") opts._errorDataPathProperty = true;
		if (opts.serialize === void 0) opts.serialize = stableStringify;
		this._metaOpts = getMetaSchemaOptions(this);
		if (opts.formats) addInitialFormats(this);
		if (opts.keywords) addInitialKeywords(this);
		addDefaultMetaSchema(this);
		if (typeof opts.meta == "object") this.addMetaSchema(opts.meta);
		if (opts.nullable) this.addKeyword("nullable", { metaSchema: { type: "boolean" } });
		addInitialSchemas(this);
	}
	/**
	* Validate data using schema
	* Schema will be compiled and cached (using serialized JSON as key. [fast-json-stable-stringify](https://github.com/epoberezkin/fast-json-stable-stringify) is used to serialize.
	* @this   Ajv
	* @param  {String|Object} schemaKeyRef key, ref or schema object
	* @param  {Any} data to be validated
	* @return {Boolean} validation result. Errors from the last validation will be available in `ajv.errors` (and also in compiled schema: `schema.errors`).
	*/
	function validate(schemaKeyRef, data) {
		var v;
		if (typeof schemaKeyRef == "string") {
			v = this.getSchema(schemaKeyRef);
			if (!v) throw new Error("no schema with key or ref \"" + schemaKeyRef + "\"");
		} else {
			var schemaObj = this._addSchema(schemaKeyRef);
			v = schemaObj.validate || this._compile(schemaObj);
		}
		var valid = v(data);
		if (v.$async !== true) this.errors = v.errors;
		return valid;
	}
	/**
	* Create validating function for passed schema.
	* @this   Ajv
	* @param  {Object} schema schema object
	* @param  {Boolean} _meta true if schema is a meta-schema. Used internally to compile meta schemas of custom keywords.
	* @return {Function} validating function
	*/
	function compile(schema, _meta) {
		var schemaObj = this._addSchema(schema, void 0, _meta);
		return schemaObj.validate || this._compile(schemaObj);
	}
	/**
	* Adds schema to the instance.
	* @this   Ajv
	* @param {Object|Array} schema schema or array of schemas. If array is passed, `key` and other parameters will be ignored.
	* @param {String} key Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
	* @param {Boolean} _skipValidation true to skip schema validation. Used internally, option validateSchema should be used instead.
	* @param {Boolean} _meta true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
	* @return {Ajv} this for method chaining
	*/
	function addSchema(schema, key, _skipValidation, _meta) {
		if (Array.isArray(schema)) {
			for (var i = 0; i < schema.length; i++) this.addSchema(schema[i], void 0, _skipValidation, _meta);
			return this;
		}
		var id = this._getId(schema);
		if (id !== void 0 && typeof id != "string") throw new Error("schema id must be string");
		key = resolve.normalizeId(key || id);
		checkUnique(this, key);
		this._schemas[key] = this._addSchema(schema, _skipValidation, _meta, true);
		return this;
	}
	/**
	* Add schema that will be used to validate other schemas
	* options in META_IGNORE_OPTIONS are alway set to false
	* @this   Ajv
	* @param {Object} schema schema object
	* @param {String} key optional schema key
	* @param {Boolean} skipValidation true to skip schema validation, can be used to override validateSchema option for meta-schema
	* @return {Ajv} this for method chaining
	*/
	function addMetaSchema(schema, key, skipValidation) {
		this.addSchema(schema, key, skipValidation, true);
		return this;
	}
	/**
	* Validate schema
	* @this   Ajv
	* @param {Object} schema schema to validate
	* @param {Boolean} throwOrLogError pass true to throw (or log) an error if invalid
	* @return {Boolean} true if schema is valid
	*/
	function validateSchema(schema, throwOrLogError) {
		var $schema = schema.$schema;
		if ($schema !== void 0 && typeof $schema != "string") throw new Error("$schema must be a string");
		$schema = $schema || this._opts.defaultMeta || defaultMeta(this);
		if (!$schema) {
			this.logger.warn("meta-schema not available");
			this.errors = null;
			return true;
		}
		var valid = this.validate($schema, schema);
		if (!valid && throwOrLogError) {
			var message = "schema is invalid: " + this.errorsText();
			if (this._opts.validateSchema == "log") this.logger.error(message);
			else throw new Error(message);
		}
		return valid;
	}
	function defaultMeta(self) {
		var meta = self._opts.meta;
		self._opts.defaultMeta = typeof meta == "object" ? self._getId(meta) || meta : self.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0;
		return self._opts.defaultMeta;
	}
	/**
	* Get compiled schema from the instance by `key` or `ref`.
	* @this   Ajv
	* @param  {String} keyRef `key` that was passed to `addSchema` or full schema reference (`schema.id` or resolved id).
	* @return {Function} schema validating function (with property `schema`).
	*/
	function getSchema(keyRef) {
		var schemaObj = _getSchemaObj(this, keyRef);
		switch (typeof schemaObj) {
			case "object": return schemaObj.validate || this._compile(schemaObj);
			case "string": return this.getSchema(schemaObj);
			case "undefined": return _getSchemaFragment(this, keyRef);
		}
	}
	function _getSchemaFragment(self, ref) {
		var res = resolve.schema.call(self, { schema: {} }, ref);
		if (res) {
			var schema = res.schema, root = res.root, baseId = res.baseId;
			var v = compileSchema.call(self, schema, root, void 0, baseId);
			self._fragments[ref] = new SchemaObject({
				ref,
				fragment: true,
				schema,
				root,
				baseId,
				validate: v
			});
			return v;
		}
	}
	function _getSchemaObj(self, keyRef) {
		keyRef = resolve.normalizeId(keyRef);
		return self._schemas[keyRef] || self._refs[keyRef] || self._fragments[keyRef];
	}
	/**
	* Remove cached schema(s).
	* If no parameter is passed all schemas but meta-schemas are removed.
	* If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
	* Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
	* @this   Ajv
	* @param  {String|Object|RegExp} schemaKeyRef key, ref, pattern to match key/ref or schema object
	* @return {Ajv} this for method chaining
	*/
	function removeSchema(schemaKeyRef) {
		if (schemaKeyRef instanceof RegExp) {
			_removeAllSchemas(this, this._schemas, schemaKeyRef);
			_removeAllSchemas(this, this._refs, schemaKeyRef);
			return this;
		}
		switch (typeof schemaKeyRef) {
			case "undefined":
				_removeAllSchemas(this, this._schemas);
				_removeAllSchemas(this, this._refs);
				this._cache.clear();
				return this;
			case "string":
				var schemaObj = _getSchemaObj(this, schemaKeyRef);
				if (schemaObj) this._cache.del(schemaObj.cacheKey);
				delete this._schemas[schemaKeyRef];
				delete this._refs[schemaKeyRef];
				return this;
			case "object":
				var serialize = this._opts.serialize;
				var cacheKey = serialize ? serialize(schemaKeyRef) : schemaKeyRef;
				this._cache.del(cacheKey);
				var id = this._getId(schemaKeyRef);
				if (id) {
					id = resolve.normalizeId(id);
					delete this._schemas[id];
					delete this._refs[id];
				}
		}
		return this;
	}
	function _removeAllSchemas(self, schemas, regex$1) {
		for (var keyRef in schemas) {
			var schemaObj = schemas[keyRef];
			if (!schemaObj.meta && (!regex$1 || regex$1.test(keyRef))) {
				self._cache.del(schemaObj.cacheKey);
				delete schemas[keyRef];
			}
		}
	}
	function _addSchema(schema, skipValidation, meta, shouldAddSchema) {
		if (typeof schema != "object" && typeof schema != "boolean") throw new Error("schema should be object or boolean");
		var serialize = this._opts.serialize;
		var cacheKey = serialize ? serialize(schema) : schema;
		var cached = this._cache.get(cacheKey);
		if (cached) return cached;
		shouldAddSchema = shouldAddSchema || this._opts.addUsedSchema !== false;
		var id = resolve.normalizeId(this._getId(schema));
		if (id && shouldAddSchema) checkUnique(this, id);
		var willValidate = this._opts.validateSchema !== false && !skipValidation;
		var recursiveMeta;
		if (willValidate && !(recursiveMeta = id && id == resolve.normalizeId(schema.$schema))) this.validateSchema(schema, true);
		var localRefs = resolve.ids.call(this, schema);
		var schemaObj = new SchemaObject({
			id,
			schema,
			localRefs,
			cacheKey,
			meta
		});
		if (id[0] != "#" && shouldAddSchema) this._refs[id] = schemaObj;
		this._cache.put(cacheKey, schemaObj);
		if (willValidate && recursiveMeta) this.validateSchema(schema, true);
		return schemaObj;
	}
	function _compile(schemaObj, root) {
		if (schemaObj.compiling) {
			schemaObj.validate = callValidate;
			callValidate.schema = schemaObj.schema;
			callValidate.errors = null;
			callValidate.root = root ? root : callValidate;
			if (schemaObj.schema.$async === true) callValidate.$async = true;
			return callValidate;
		}
		schemaObj.compiling = true;
		var currentOpts;
		if (schemaObj.meta) {
			currentOpts = this._opts;
			this._opts = this._metaOpts;
		}
		var v;
		try {
			v = compileSchema.call(this, schemaObj.schema, root, schemaObj.localRefs);
		} catch (e) {
			delete schemaObj.validate;
			throw e;
		} finally {
			schemaObj.compiling = false;
			if (schemaObj.meta) this._opts = currentOpts;
		}
		schemaObj.validate = v;
		schemaObj.refs = v.refs;
		schemaObj.refVal = v.refVal;
		schemaObj.root = v.root;
		return v;
		function callValidate() {
			var _validate = schemaObj.validate;
			var result = _validate.apply(this, arguments);
			callValidate.errors = _validate.errors;
			return result;
		}
	}
	function chooseGetId(opts) {
		switch (opts.schemaId) {
			case "auto": return _get$IdOrId;
			case "id": return _getId;
			default: return _get$Id;
		}
	}
	function _getId(schema) {
		if (schema.$id) this.logger.warn("schema $id ignored", schema.$id);
		return schema.id;
	}
	function _get$Id(schema) {
		if (schema.id) this.logger.warn("schema id ignored", schema.id);
		return schema.$id;
	}
	function _get$IdOrId(schema) {
		if (schema.$id && schema.id && schema.$id != schema.id) throw new Error("schema $id is different from id");
		return schema.$id || schema.id;
	}
	/**
	* Convert array of error message objects to string
	* @this   Ajv
	* @param  {Array<Object>} errors optional array of validation errors, if not passed errors from the instance are used.
	* @param  {Object} options optional options with properties `separator` and `dataVar`.
	* @return {String} human readable string with all errors descriptions
	*/
	function errorsText(errors, options) {
		errors = errors || this.errors;
		if (!errors) return "No errors";
		options = options || {};
		var separator = options.separator === void 0 ? ", " : options.separator;
		var dataVar = options.dataVar === void 0 ? "data" : options.dataVar;
		var text = "";
		for (var i = 0; i < errors.length; i++) {
			var e = errors[i];
			if (e) text += dataVar + e.dataPath + " " + e.message + separator;
		}
		return text.slice(0, -separator.length);
	}
	/**
	* Add custom format
	* @this   Ajv
	* @param {String} name format name
	* @param {String|RegExp|Function} format string is converted to RegExp; function should return boolean (true when valid)
	* @return {Ajv} this for method chaining
	*/
	function addFormat$1(name$1, format) {
		if (typeof format == "string") format = new RegExp(format);
		this._formats[name$1] = format;
		return this;
	}
	function addDefaultMetaSchema(self) {
		var $dataSchema;
		if (self._opts.$data) {
			$dataSchema = require_data();
			self.addMetaSchema($dataSchema, $dataSchema.$id, true);
		}
		if (self._opts.meta === false) return;
		var metaSchema$1 = require_json_schema_draft_07();
		if (self._opts.$data) metaSchema$1 = $dataMetaSchema(metaSchema$1, META_SUPPORT_DATA);
		self.addMetaSchema(metaSchema$1, META_SCHEMA_ID, true);
		self._refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
	}
	function addInitialSchemas(self) {
		var optsSchemas = self._opts.schemas;
		if (!optsSchemas) return;
		if (Array.isArray(optsSchemas)) self.addSchema(optsSchemas);
		else for (var key in optsSchemas) self.addSchema(optsSchemas[key], key);
	}
	function addInitialFormats(self) {
		for (var name$1 in self._opts.formats) {
			var format = self._opts.formats[name$1];
			self.addFormat(name$1, format);
		}
	}
	function addInitialKeywords(self) {
		for (var name$1 in self._opts.keywords) {
			var keyword = self._opts.keywords[name$1];
			self.addKeyword(name$1, keyword);
		}
	}
	function checkUnique(self, id) {
		if (self._schemas[id] || self._refs[id]) throw new Error("schema with key or id \"" + id + "\" already exists");
	}
	function getMetaSchemaOptions(self) {
		var metaOpts = util.copy(self._opts);
		for (var i = 0; i < META_IGNORE_OPTIONS.length; i++) delete metaOpts[META_IGNORE_OPTIONS[i]];
		return metaOpts;
	}
	function setLogger(self) {
		var logger = self._opts.logger;
		if (logger === false) self.logger = {
			log: noop,
			warn: noop,
			error: noop
		};
		else {
			if (logger === void 0) logger = console;
			if (!(typeof logger == "object" && logger.log && logger.warn && logger.error)) throw new Error("logger must implement log, warn and error methods");
			self.logger = logger;
		}
	}
	function noop() {}
});
var import_ajv$1 = __toESM(require_ajv(), 1);
var import_ajv = __toESM(require_ajv(), 1);
/**
* An MCP server on top of a pluggable transport.
*
* This server will automatically respond to the initialization flow as initiated from the client.
*
* To use with custom types, extend the base Request/Notification/Result types and pass them as type parameters:
*
* ```typescript
* // Custom schemas
* const CustomRequestSchema = RequestSchema.extend({...})
* const CustomNotificationSchema = NotificationSchema.extend({...})
* const CustomResultSchema = ResultSchema.extend({...})
*
* // Type aliases
* type CustomRequest = z.infer<typeof CustomRequestSchema>
* type CustomNotification = z.infer<typeof CustomNotificationSchema>
* type CustomResult = z.infer<typeof CustomResultSchema>
*
* // Create typed server
* const server = new Server<CustomRequest, CustomNotification, CustomResult>({
*   name: "CustomServer",
*   version: "1.0.0"
* })
* ```
*/
var Server = class extends Protocol {
	/**
	* Initializes this server with the given name and version information.
	*/
	constructor(_serverInfo, options) {
		var _a;
		super(options);
		this._serverInfo = _serverInfo;
		this._capabilities = (_a = options === null || options === void 0 ? void 0 : options.capabilities) !== null && _a !== void 0 ? _a : {};
		this._instructions = options === null || options === void 0 ? void 0 : options.instructions;
		this.setRequestHandler(InitializeRequestSchema, (request) => this._oninitialize(request));
		this.setNotificationHandler(InitializedNotificationSchema, () => {
			var _a$1;
			return (_a$1 = this.oninitialized) === null || _a$1 === void 0 ? void 0 : _a$1.call(this);
		});
	}
	/**
	* Registers new capabilities. This can only be called before connecting to a transport.
	*
	* The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
	*/
	registerCapabilities(capabilities) {
		if (this.transport) throw new Error("Cannot register capabilities after connecting to transport");
		this._capabilities = mergeCapabilities(this._capabilities, capabilities);
	}
	assertCapabilityForMethod(method) {
		var _a, _b, _c;
		switch (method) {
			case "sampling/createMessage":
				if (!((_a = this._clientCapabilities) === null || _a === void 0 ? void 0 : _a.sampling)) throw new Error(`Client does not support sampling (required for ${method})`);
				break;
			case "elicitation/create":
				if (!((_b = this._clientCapabilities) === null || _b === void 0 ? void 0 : _b.elicitation)) throw new Error(`Client does not support elicitation (required for ${method})`);
				break;
			case "roots/list":
				if (!((_c = this._clientCapabilities) === null || _c === void 0 ? void 0 : _c.roots)) throw new Error(`Client does not support listing roots (required for ${method})`);
				break;
			case "ping": break;
		}
	}
	assertNotificationCapability(method) {
		switch (method) {
			case "notifications/message":
				if (!this._capabilities.logging) throw new Error(`Server does not support logging (required for ${method})`);
				break;
			case "notifications/resources/updated":
			case "notifications/resources/list_changed":
				if (!this._capabilities.resources) throw new Error(`Server does not support notifying about resources (required for ${method})`);
				break;
			case "notifications/tools/list_changed":
				if (!this._capabilities.tools) throw new Error(`Server does not support notifying of tool list changes (required for ${method})`);
				break;
			case "notifications/prompts/list_changed":
				if (!this._capabilities.prompts) throw new Error(`Server does not support notifying of prompt list changes (required for ${method})`);
				break;
			case "notifications/cancelled": break;
			case "notifications/progress": break;
		}
	}
	assertRequestHandlerCapability(method) {
		switch (method) {
			case "sampling/createMessage":
				if (!this._capabilities.sampling) throw new Error(`Server does not support sampling (required for ${method})`);
				break;
			case "logging/setLevel":
				if (!this._capabilities.logging) throw new Error(`Server does not support logging (required for ${method})`);
				break;
			case "prompts/get":
			case "prompts/list":
				if (!this._capabilities.prompts) throw new Error(`Server does not support prompts (required for ${method})`);
				break;
			case "resources/list":
			case "resources/templates/list":
			case "resources/read":
				if (!this._capabilities.resources) throw new Error(`Server does not support resources (required for ${method})`);
				break;
			case "tools/call":
			case "tools/list":
				if (!this._capabilities.tools) throw new Error(`Server does not support tools (required for ${method})`);
				break;
			case "ping":
			case "initialize": break;
		}
	}
	async _oninitialize(request) {
		const requestedVersion = request.params.protocolVersion;
		this._clientCapabilities = request.params.capabilities;
		this._clientVersion = request.params.clientInfo;
		const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion) ? requestedVersion : LATEST_PROTOCOL_VERSION;
		return {
			protocolVersion,
			capabilities: this.getCapabilities(),
			serverInfo: this._serverInfo,
			...this._instructions && { instructions: this._instructions }
		};
	}
	/**
	* After initialization has completed, this will be populated with the client's reported capabilities.
	*/
	getClientCapabilities() {
		return this._clientCapabilities;
	}
	/**
	* After initialization has completed, this will be populated with information about the client's name and version.
	*/
	getClientVersion() {
		return this._clientVersion;
	}
	getCapabilities() {
		return this._capabilities;
	}
	async ping() {
		return this.request({ method: "ping" }, EmptyResultSchema);
	}
	async createMessage(params, options) {
		return this.request({
			method: "sampling/createMessage",
			params
		}, CreateMessageResultSchema, options);
	}
	async elicitInput(params, options) {
		const result = await this.request({
			method: "elicitation/create",
			params
		}, ElicitResultSchema, options);
		if (result.action === "accept" && result.content) try {
			const ajv = new import_ajv.default();
			const validate$1 = ajv.compile(params.requestedSchema);
			const isValid = validate$1(result.content);
			if (!isValid) throw new McpError(ErrorCode.InvalidParams, `Elicitation response content does not match requested schema: ${ajv.errorsText(validate$1.errors)}`);
		} catch (error) {
			if (error instanceof McpError) throw error;
			throw new McpError(ErrorCode.InternalError, `Error validating elicitation response: ${error}`);
		}
		return result;
	}
	async listRoots(params, options) {
		return this.request({
			method: "roots/list",
			params
		}, ListRootsResultSchema, options);
	}
	async sendLoggingMessage(params) {
		return this.notification({
			method: "notifications/message",
			params
		});
	}
	async sendResourceUpdated(params) {
		return this.notification({
			method: "notifications/resources/updated",
			params
		});
	}
	async sendResourceListChanged() {
		return this.notification({ method: "notifications/resources/list_changed" });
	}
	async sendToolListChanged() {
		return this.notification({ method: "notifications/tools/list_changed" });
	}
	async sendPromptListChanged() {
		return this.notification({ method: "notifications/prompts/list_changed" });
	}
};
const ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
const defaultOptions$1 = {
	name: void 0,
	$refStrategy: "root",
	basePath: ["#"],
	effectStrategy: "input",
	pipeStrategy: "all",
	dateStrategy: "format:date-time",
	mapStrategy: "entries",
	removeAdditionalStrategy: "passthrough",
	allowedAdditionalProperties: true,
	rejectedAdditionalProperties: false,
	definitionPath: "definitions",
	target: "jsonSchema7",
	strictUnions: false,
	definitions: {},
	errorMessages: false,
	markdownDescription: false,
	patternStrategy: "escape",
	applyRegexFlags: false,
	emailStrategy: "format:email",
	base64Strategy: "contentEncoding:base64",
	nameStrategy: "ref",
	openAiAnyTypeName: "OpenAiAnyType"
};
const getDefaultOptions = (options) => typeof options === "string" ? {
	...defaultOptions$1,
	name: options
} : {
	...defaultOptions$1,
	...options
};
const getRefs = (options) => {
	const _options = getDefaultOptions(options);
	const currentPath = _options.name !== void 0 ? [
		..._options.basePath,
		_options.definitionPath,
		_options.name
	] : _options.basePath;
	return {
		..._options,
		flags: { hasReferencedOpenAiAnyType: false },
		currentPath,
		propertyPath: void 0,
		seen: new Map(Object.entries(_options.definitions).map(([name$1, def]) => [def._def, {
			def: def._def,
			path: [
				..._options.basePath,
				_options.definitionPath,
				name$1
			],
			jsonSchema: void 0
		}]))
	};
};
function addErrorMessage(res, key, errorMessage, refs) {
	if (!refs?.errorMessages) return;
	if (errorMessage) res.errorMessage = {
		...res.errorMessage,
		[key]: errorMessage
	};
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
	res[key] = value;
	addErrorMessage(res, key, errorMessage, refs);
}
const getRelativePath = (pathA, pathB) => {
	let i = 0;
	for (; i < pathA.length && i < pathB.length; i++) if (pathA[i] !== pathB[i]) break;
	return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};
function parseAnyDef(refs) {
	if (refs.target !== "openAi") return {};
	const anyDefinitionPath = [
		...refs.basePath,
		refs.definitionPath,
		refs.openAiAnyTypeName
	];
	refs.flags.hasReferencedOpenAiAnyType = true;
	return { $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/") };
}
function parseArrayDef(def, refs) {
	const res = { type: "array" };
	if (def.type?._def && def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny) res.items = parseDef(def.type._def, {
		...refs,
		currentPath: [...refs.currentPath, "items"]
	});
	if (def.minLength) setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs);
	if (def.maxLength) setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
	if (def.exactLength) {
		setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
		setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
	}
	return res;
}
function parseBigintDef(def, refs) {
	const res = {
		type: "integer",
		format: "int64"
	};
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "min":
			if (refs.target === "jsonSchema7") if (check.inclusive) setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
			else setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
			else {
				if (!check.inclusive) res.exclusiveMinimum = true;
				setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
			}
			break;
		case "max":
			if (refs.target === "jsonSchema7") if (check.inclusive) setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
			else setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
			else {
				if (!check.inclusive) res.exclusiveMaximum = true;
				setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
			}
			break;
		case "multipleOf":
			setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
			break;
	}
	return res;
}
function parseBooleanDef() {
	return { type: "boolean" };
}
function parseBrandedDef(_def, refs) {
	return parseDef(_def.type._def, refs);
}
const parseCatchDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
function parseDateDef(def, refs, overrideDateStrategy) {
	const strategy = overrideDateStrategy ?? refs.dateStrategy;
	if (Array.isArray(strategy)) return { anyOf: strategy.map((item, i) => parseDateDef(def, refs, item)) };
	switch (strategy) {
		case "string":
		case "format:date-time": return {
			type: "string",
			format: "date-time"
		};
		case "format:date": return {
			type: "string",
			format: "date"
		};
		case "integer": return integerDateParser(def, refs);
	}
}
const integerDateParser = (def, refs) => {
	const res = {
		type: "integer",
		format: "unix-time"
	};
	if (refs.target === "openApi3") return res;
	for (const check of def.checks) switch (check.kind) {
		case "min":
			setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
			break;
		case "max":
			setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
			break;
	}
	return res;
};
function parseDefaultDef(_def, refs) {
	return {
		...parseDef(_def.innerType._def, refs),
		default: _def.defaultValue()
	};
}
function parseEffectsDef(_def, refs) {
	return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}
function parseEnumDef(def) {
	return {
		type: "string",
		enum: Array.from(def.values)
	};
}
const isJsonSchema7AllOfType = (type) => {
	if ("type" in type && type.type === "string") return false;
	return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
	const allOf = [parseDef(def.left._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"0"
		]
	}), parseDef(def.right._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"1"
		]
	})].filter((x) => !!x);
	let unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: false } : void 0;
	const mergedAllOf = [];
	allOf.forEach((schema) => {
		if (isJsonSchema7AllOfType(schema)) {
			mergedAllOf.push(...schema.allOf);
			if (schema.unevaluatedProperties === void 0) unevaluatedProperties = void 0;
		} else {
			let nestedSchema = schema;
			if ("additionalProperties" in schema && schema.additionalProperties === false) {
				const { additionalProperties,...rest } = schema;
				nestedSchema = rest;
			} else unevaluatedProperties = void 0;
			mergedAllOf.push(nestedSchema);
		}
	});
	return mergedAllOf.length ? {
		allOf: mergedAllOf,
		...unevaluatedProperties
	} : void 0;
}
function parseLiteralDef(def, refs) {
	const parsedType = typeof def.value;
	if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") return { type: Array.isArray(def.value) ? "array" : "object" };
	if (refs.target === "openApi3") return {
		type: parsedType === "bigint" ? "integer" : parsedType,
		enum: [def.value]
	};
	return {
		type: parsedType === "bigint" ? "integer" : parsedType,
		const: def.value
	};
}
let emojiRegex = void 0;
/**
* Generated from the regular expressions found here as of 2024-05-22:
* https://github.com/colinhacks/zod/blob/master/src/types.ts.
*
* Expressions with /i flag have been changed accordingly.
*/
const zodPatterns = {
	cuid: /^[cC][^\s-]{8,}$/,
	cuid2: /^[0-9a-z]+$/,
	ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
	email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
	emoji: () => {
		if (emojiRegex === void 0) emojiRegex = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
		return emojiRegex;
	},
	uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
	ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
	ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
	ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
	ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
	base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
	base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
	nanoid: /^[a-zA-Z0-9_-]{21}$/,
	jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
	const res = { type: "string" };
	if (def.checks) for (const check of def.checks) switch (check.kind) {
		case "min":
			setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
			break;
		case "max":
			setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
			break;
		case "email":
			switch (refs.emailStrategy) {
				case "format:email":
					addFormat(res, "email", check.message, refs);
					break;
				case "format:idn-email":
					addFormat(res, "idn-email", check.message, refs);
					break;
				case "pattern:zod":
					addPattern(res, zodPatterns.email, check.message, refs);
					break;
			}
			break;
		case "url":
			addFormat(res, "uri", check.message, refs);
			break;
		case "uuid":
			addFormat(res, "uuid", check.message, refs);
			break;
		case "regex":
			addPattern(res, check.regex, check.message, refs);
			break;
		case "cuid":
			addPattern(res, zodPatterns.cuid, check.message, refs);
			break;
		case "cuid2":
			addPattern(res, zodPatterns.cuid2, check.message, refs);
			break;
		case "startsWith":
			addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
			break;
		case "endsWith":
			addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
			break;
		case "datetime":
			addFormat(res, "date-time", check.message, refs);
			break;
		case "date":
			addFormat(res, "date", check.message, refs);
			break;
		case "time":
			addFormat(res, "time", check.message, refs);
			break;
		case "duration":
			addFormat(res, "duration", check.message, refs);
			break;
		case "length":
			setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
			setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
			break;
		case "includes": {
			addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
			break;
		}
		case "ip": {
			if (check.version !== "v6") addFormat(res, "ipv4", check.message, refs);
			if (check.version !== "v4") addFormat(res, "ipv6", check.message, refs);
			break;
		}
		case "base64url":
			addPattern(res, zodPatterns.base64url, check.message, refs);
			break;
		case "jwt":
			addPattern(res, zodPatterns.jwt, check.message, refs);
			break;
		case "cidr": {
			if (check.version !== "v6") addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
			if (check.version !== "v4") addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
			break;
		}
		case "emoji":
			addPattern(res, zodPatterns.emoji(), check.message, refs);
			break;
		case "ulid": {
			addPattern(res, zodPatterns.ulid, check.message, refs);
			break;
		}
		case "base64": {
			switch (refs.base64Strategy) {
				case "format:binary": {
					addFormat(res, "binary", check.message, refs);
					break;
				}
				case "contentEncoding:base64": {
					setResponseValueAndErrors(res, "contentEncoding", "base64", check.message, refs);
					break;
				}
				case "pattern:zod": {
					addPattern(res, zodPatterns.base64, check.message, refs);
					break;
				}
			}
			break;
		}
		case "nanoid": addPattern(res, zodPatterns.nanoid, check.message, refs);
		case "toLowerCase":
		case "toUpperCase":
		case "trim": break;
		default:
 /* c8 ignore next */
		((_) => {})(check);
	}
	return res;
}
function escapeLiteralCheckValue(literal, refs) {
	return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
const ALPHA_NUMERIC = /* @__PURE__ */ new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
	let result = "";
	for (let i = 0; i < source.length; i++) {
		if (!ALPHA_NUMERIC.has(source[i])) result += "\\";
		result += source[i];
	}
	return result;
}
function addFormat(schema, value, message, refs) {
	if (schema.format || schema.anyOf?.some((x) => x.format)) {
		if (!schema.anyOf) schema.anyOf = [];
		if (schema.format) {
			schema.anyOf.push({
				format: schema.format,
				...schema.errorMessage && refs.errorMessages && { errorMessage: { format: schema.errorMessage.format } }
			});
			delete schema.format;
			if (schema.errorMessage) {
				delete schema.errorMessage.format;
				if (Object.keys(schema.errorMessage).length === 0) delete schema.errorMessage;
			}
		}
		schema.anyOf.push({
			format: value,
			...message && refs.errorMessages && { errorMessage: { format: message } }
		});
	} else setResponseValueAndErrors(schema, "format", value, message, refs);
}
function addPattern(schema, regex$1, message, refs) {
	if (schema.pattern || schema.allOf?.some((x) => x.pattern)) {
		if (!schema.allOf) schema.allOf = [];
		if (schema.pattern) {
			schema.allOf.push({
				pattern: schema.pattern,
				...schema.errorMessage && refs.errorMessages && { errorMessage: { pattern: schema.errorMessage.pattern } }
			});
			delete schema.pattern;
			if (schema.errorMessage) {
				delete schema.errorMessage.pattern;
				if (Object.keys(schema.errorMessage).length === 0) delete schema.errorMessage;
			}
		}
		schema.allOf.push({
			pattern: stringifyRegExpWithFlags(regex$1, refs),
			...message && refs.errorMessages && { errorMessage: { pattern: message } }
		});
	} else setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex$1, refs), message, refs);
}
function stringifyRegExpWithFlags(regex$1, refs) {
	if (!refs.applyRegexFlags || !regex$1.flags) return regex$1.source;
	const flags = {
		i: regex$1.flags.includes("i"),
		m: regex$1.flags.includes("m"),
		s: regex$1.flags.includes("s")
	};
	const source = flags.i ? regex$1.source.toLowerCase() : regex$1.source;
	let pattern = "";
	let isEscaped = false;
	let inCharGroup = false;
	let inCharRange = false;
	for (let i = 0; i < source.length; i++) {
		if (isEscaped) {
			pattern += source[i];
			isEscaped = false;
			continue;
		}
		if (flags.i) {
			if (inCharGroup) {
				if (source[i].match(/[a-z]/)) {
					if (inCharRange) {
						pattern += source[i];
						pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
						inCharRange = false;
					} else if (source[i + 1] === "-" && source[i + 2]?.match(/[a-z]/)) {
						pattern += source[i];
						inCharRange = true;
					} else pattern += `${source[i]}${source[i].toUpperCase()}`;
					continue;
				}
			} else if (source[i].match(/[a-z]/)) {
				pattern += `[${source[i]}${source[i].toUpperCase()}]`;
				continue;
			}
		}
		if (flags.m) {
			if (source[i] === "^") {
				pattern += `(^|(?<=[\r\n]))`;
				continue;
			} else if (source[i] === "$") {
				pattern += `($|(?=[\r\n]))`;
				continue;
			}
		}
		if (flags.s && source[i] === ".") {
			pattern += inCharGroup ? `${source[i]}\r\n` : `[${source[i]}\r\n]`;
			continue;
		}
		pattern += source[i];
		if (source[i] === "\\") isEscaped = true;
		else if (inCharGroup && source[i] === "]") inCharGroup = false;
		else if (!inCharGroup && source[i] === "[") inCharGroup = true;
	}
	try {
		new RegExp(pattern);
	} catch {
		console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
		return regex$1.source;
	}
	return pattern;
}
function parseRecordDef(def, refs) {
	if (refs.target === "openAi") console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead.");
	if (refs.target === "openApi3" && def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) return {
		type: "object",
		required: def.keyType._def.values,
		properties: def.keyType._def.values.reduce((acc, key) => ({
			...acc,
			[key]: parseDef(def.valueType._def, {
				...refs,
				currentPath: [
					...refs.currentPath,
					"properties",
					key
				]
			}) ?? parseAnyDef(refs)
		}), {}),
		additionalProperties: refs.rejectedAdditionalProperties
	};
	const schema = {
		type: "object",
		additionalProperties: parseDef(def.valueType._def, {
			...refs,
			currentPath: [...refs.currentPath, "additionalProperties"]
		}) ?? refs.allowedAdditionalProperties
	};
	if (refs.target === "openApi3") return schema;
	if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.checks?.length) {
		const { type,...keyType } = parseStringDef(def.keyType._def, refs);
		return {
			...schema,
			propertyNames: keyType
		};
	} else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) return {
		...schema,
		propertyNames: { enum: def.keyType._def.values }
	};
	else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.type._def.checks?.length) {
		const { type,...keyType } = parseBrandedDef(def.keyType._def, refs);
		return {
			...schema,
			propertyNames: keyType
		};
	}
	return schema;
}
function parseMapDef(def, refs) {
	if (refs.mapStrategy === "record") return parseRecordDef(def, refs);
	const keys = parseDef(def.keyType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"items",
			"items",
			"0"
		]
	}) || parseAnyDef(refs);
	const values = parseDef(def.valueType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"items",
			"items",
			"1"
		]
	}) || parseAnyDef(refs);
	return {
		type: "array",
		maxItems: 125,
		items: {
			type: "array",
			items: [keys, values],
			minItems: 2,
			maxItems: 2
		}
	};
}
function parseNativeEnumDef(def) {
	const object = def.values;
	const actualKeys = Object.keys(def.values).filter((key) => {
		return typeof object[object[key]] !== "number";
	});
	const actualValues = actualKeys.map((key) => object[key]);
	const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
	return {
		type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
		enum: actualValues
	};
}
function parseNeverDef(refs) {
	return refs.target === "openAi" ? void 0 : { not: parseAnyDef({
		...refs,
		currentPath: [...refs.currentPath, "not"]
	}) };
}
function parseNullDef(refs) {
	return refs.target === "openApi3" ? {
		enum: ["null"],
		nullable: true
	} : { type: "null" };
}
const primitiveMappings = {
	ZodString: "string",
	ZodNumber: "number",
	ZodBigInt: "integer",
	ZodBoolean: "boolean",
	ZodNull: "null"
};
function parseUnionDef(def, refs) {
	if (refs.target === "openApi3") return asAnyOf(def, refs);
	const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
	if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
		const types = options.reduce((types$1, x) => {
			const type = primitiveMappings[x._def.typeName];
			return type && !types$1.includes(type) ? [...types$1, type] : types$1;
		}, []);
		return { type: types.length > 1 ? types : types[0] };
	} else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
		const types = options.reduce((acc, x) => {
			const type = typeof x._def.value;
			switch (type) {
				case "string":
				case "number":
				case "boolean": return [...acc, type];
				case "bigint": return [...acc, "integer"];
				case "object": if (x._def.value === null) return [...acc, "null"];
				case "symbol":
				case "undefined":
				case "function":
				default: return acc;
			}
		}, []);
		if (types.length === options.length) {
			const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
			return {
				type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
				enum: options.reduce((acc, x) => {
					return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
				}, [])
			};
		}
	} else if (options.every((x) => x._def.typeName === "ZodEnum")) return {
		type: "string",
		enum: options.reduce((acc, x) => [...acc, ...x._def.values.filter((x$1) => !acc.includes(x$1))], [])
	};
	return asAnyOf(def, refs);
}
const asAnyOf = (def, refs) => {
	const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			`${i}`
		]
	})).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
	return anyOf.length ? { anyOf } : void 0;
};
function parseNullableDef(def, refs) {
	if ([
		"ZodString",
		"ZodNumber",
		"ZodBigInt",
		"ZodBoolean",
		"ZodNull"
	].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
		if (refs.target === "openApi3") return {
			type: primitiveMappings[def.innerType._def.typeName],
			nullable: true
		};
		return { type: [primitiveMappings[def.innerType._def.typeName], "null"] };
	}
	if (refs.target === "openApi3") {
		const base$1 = parseDef(def.innerType._def, {
			...refs,
			currentPath: [...refs.currentPath]
		});
		if (base$1 && "$ref" in base$1) return {
			allOf: [base$1],
			nullable: true
		};
		return base$1 && {
			...base$1,
			nullable: true
		};
	}
	const base = parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"0"
		]
	});
	return base && { anyOf: [base, { type: "null" }] };
}
function parseNumberDef(def, refs) {
	const res = { type: "number" };
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "int":
			res.type = "integer";
			addErrorMessage(res, "type", check.message, refs);
			break;
		case "min":
			if (refs.target === "jsonSchema7") if (check.inclusive) setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
			else setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
			else {
				if (!check.inclusive) res.exclusiveMinimum = true;
				setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
			}
			break;
		case "max":
			if (refs.target === "jsonSchema7") if (check.inclusive) setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
			else setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
			else {
				if (!check.inclusive) res.exclusiveMaximum = true;
				setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
			}
			break;
		case "multipleOf":
			setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
			break;
	}
	return res;
}
function parseObjectDef(def, refs) {
	const forceOptionalIntoNullable = refs.target === "openAi";
	const result = {
		type: "object",
		properties: {}
	};
	const required = [];
	const shape = def.shape();
	for (const propName in shape) {
		let propDef = shape[propName];
		if (propDef === void 0 || propDef._def === void 0) continue;
		let propOptional = safeIsOptional(propDef);
		if (propOptional && forceOptionalIntoNullable) {
			if (propDef._def.typeName === "ZodOptional") propDef = propDef._def.innerType;
			if (!propDef.isNullable()) propDef = propDef.nullable();
			propOptional = false;
		}
		const parsedDef = parseDef(propDef._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"properties",
				propName
			],
			propertyPath: [
				...refs.currentPath,
				"properties",
				propName
			]
		});
		if (parsedDef === void 0) continue;
		result.properties[propName] = parsedDef;
		if (!propOptional) required.push(propName);
	}
	if (required.length) result.required = required;
	const additionalProperties = decideAdditionalProperties(def, refs);
	if (additionalProperties !== void 0) result.additionalProperties = additionalProperties;
	return result;
}
function decideAdditionalProperties(def, refs) {
	if (def.catchall._def.typeName !== "ZodNever") return parseDef(def.catchall._def, {
		...refs,
		currentPath: [...refs.currentPath, "additionalProperties"]
	});
	switch (def.unknownKeys) {
		case "passthrough": return refs.allowedAdditionalProperties;
		case "strict": return refs.rejectedAdditionalProperties;
		case "strip": return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
	}
}
function safeIsOptional(schema) {
	try {
		return schema.isOptional();
	} catch {
		return true;
	}
}
const parseOptionalDef = (def, refs) => {
	if (refs.currentPath.toString() === refs.propertyPath?.toString()) return parseDef(def.innerType._def, refs);
	const innerSchema = parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"1"
		]
	});
	return innerSchema ? { anyOf: [{ not: parseAnyDef(refs) }, innerSchema] } : parseAnyDef(refs);
};
const parsePipelineDef = (def, refs) => {
	if (refs.pipeStrategy === "input") return parseDef(def.in._def, refs);
	else if (refs.pipeStrategy === "output") return parseDef(def.out._def, refs);
	const a = parseDef(def.in._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			"0"
		]
	});
	const b = parseDef(def.out._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"allOf",
			a ? "1" : "0"
		]
	});
	return { allOf: [a, b].filter((x) => x !== void 0) };
};
function parsePromiseDef(def, refs) {
	return parseDef(def.type._def, refs);
}
function parseSetDef(def, refs) {
	const items = parseDef(def.valueType._def, {
		...refs,
		currentPath: [...refs.currentPath, "items"]
	});
	const schema = {
		type: "array",
		uniqueItems: true,
		items
	};
	if (def.minSize) setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs);
	if (def.maxSize) setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
	return schema;
}
function parseTupleDef(def, refs) {
	if (def.rest) return {
		type: "array",
		minItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"items",
				`${i}`
			]
		})).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
		additionalItems: parseDef(def.rest._def, {
			...refs,
			currentPath: [...refs.currentPath, "additionalItems"]
		})
	};
	else return {
		type: "array",
		minItems: def.items.length,
		maxItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, {
			...refs,
			currentPath: [
				...refs.currentPath,
				"items",
				`${i}`
			]
		})).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
	};
}
function parseUndefinedDef(refs) {
	return { not: parseAnyDef(refs) };
}
function parseUnknownDef(refs) {
	return parseAnyDef(refs);
}
const parseReadonlyDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
const selectParser = (def, typeName, refs) => {
	switch (typeName) {
		case ZodFirstPartyTypeKind.ZodString: return parseStringDef(def, refs);
		case ZodFirstPartyTypeKind.ZodNumber: return parseNumberDef(def, refs);
		case ZodFirstPartyTypeKind.ZodObject: return parseObjectDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBigInt: return parseBigintDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBoolean: return parseBooleanDef();
		case ZodFirstPartyTypeKind.ZodDate: return parseDateDef(def, refs);
		case ZodFirstPartyTypeKind.ZodUndefined: return parseUndefinedDef(refs);
		case ZodFirstPartyTypeKind.ZodNull: return parseNullDef(refs);
		case ZodFirstPartyTypeKind.ZodArray: return parseArrayDef(def, refs);
		case ZodFirstPartyTypeKind.ZodUnion:
		case ZodFirstPartyTypeKind.ZodDiscriminatedUnion: return parseUnionDef(def, refs);
		case ZodFirstPartyTypeKind.ZodIntersection: return parseIntersectionDef(def, refs);
		case ZodFirstPartyTypeKind.ZodTuple: return parseTupleDef(def, refs);
		case ZodFirstPartyTypeKind.ZodRecord: return parseRecordDef(def, refs);
		case ZodFirstPartyTypeKind.ZodLiteral: return parseLiteralDef(def, refs);
		case ZodFirstPartyTypeKind.ZodEnum: return parseEnumDef(def);
		case ZodFirstPartyTypeKind.ZodNativeEnum: return parseNativeEnumDef(def);
		case ZodFirstPartyTypeKind.ZodNullable: return parseNullableDef(def, refs);
		case ZodFirstPartyTypeKind.ZodOptional: return parseOptionalDef(def, refs);
		case ZodFirstPartyTypeKind.ZodMap: return parseMapDef(def, refs);
		case ZodFirstPartyTypeKind.ZodSet: return parseSetDef(def, refs);
		case ZodFirstPartyTypeKind.ZodLazy: return () => def.getter()._def;
		case ZodFirstPartyTypeKind.ZodPromise: return parsePromiseDef(def, refs);
		case ZodFirstPartyTypeKind.ZodNaN:
		case ZodFirstPartyTypeKind.ZodNever: return parseNeverDef(refs);
		case ZodFirstPartyTypeKind.ZodEffects: return parseEffectsDef(def, refs);
		case ZodFirstPartyTypeKind.ZodAny: return parseAnyDef(refs);
		case ZodFirstPartyTypeKind.ZodUnknown: return parseUnknownDef(refs);
		case ZodFirstPartyTypeKind.ZodDefault: return parseDefaultDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBranded: return parseBrandedDef(def, refs);
		case ZodFirstPartyTypeKind.ZodReadonly: return parseReadonlyDef(def, refs);
		case ZodFirstPartyTypeKind.ZodCatch: return parseCatchDef(def, refs);
		case ZodFirstPartyTypeKind.ZodPipeline: return parsePipelineDef(def, refs);
		case ZodFirstPartyTypeKind.ZodFunction:
		case ZodFirstPartyTypeKind.ZodVoid:
		case ZodFirstPartyTypeKind.ZodSymbol: return void 0;
		default:
 /* c8 ignore next */
		return ((_) => void 0)(typeName);
	}
};
function parseDef(def, refs, forceResolution = false) {
	const seenItem = refs.seen.get(def);
	if (refs.override) {
		const overrideResult = refs.override?.(def, refs, seenItem, forceResolution);
		if (overrideResult !== ignoreOverride) return overrideResult;
	}
	if (seenItem && !forceResolution) {
		const seenSchema = get$ref(seenItem, refs);
		if (seenSchema !== void 0) return seenSchema;
	}
	const newItem = {
		def,
		path: refs.currentPath,
		jsonSchema: void 0
	};
	refs.seen.set(def, newItem);
	const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
	const jsonSchema = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
	if (jsonSchema) addMeta(def, refs, jsonSchema);
	if (refs.postProcess) {
		const postProcessResult = refs.postProcess(jsonSchema, def, refs);
		newItem.jsonSchema = jsonSchema;
		return postProcessResult;
	}
	newItem.jsonSchema = jsonSchema;
	return jsonSchema;
}
const get$ref = (item, refs) => {
	switch (refs.$refStrategy) {
		case "root": return { $ref: item.path.join("/") };
		case "relative": return { $ref: getRelativePath(refs.currentPath, item.path) };
		case "none":
		case "seen": {
			if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
				console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
				return parseAnyDef(refs);
			}
			return refs.$refStrategy === "seen" ? parseAnyDef(refs) : void 0;
		}
	}
};
const addMeta = (def, refs, jsonSchema) => {
	if (def.description) {
		jsonSchema.description = def.description;
		if (refs.markdownDescription) jsonSchema.markdownDescription = def.description;
	}
	return jsonSchema;
};
const zodToJsonSchema = (schema, options) => {
	const refs = getRefs(options);
	let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name$2, schema$1]) => ({
		...acc,
		[name$2]: parseDef(schema$1._def, {
			...refs,
			currentPath: [
				...refs.basePath,
				refs.definitionPath,
				name$2
			]
		}, true) ?? parseAnyDef(refs)
	}), {}) : void 0;
	const name$1 = typeof options === "string" ? options : options?.nameStrategy === "title" ? void 0 : options?.name;
	const main = parseDef(schema._def, name$1 === void 0 ? refs : {
		...refs,
		currentPath: [
			...refs.basePath,
			refs.definitionPath,
			name$1
		]
	}, false) ?? parseAnyDef(refs);
	const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
	if (title !== void 0) main.title = title;
	if (refs.flags.hasReferencedOpenAiAnyType) {
		if (!definitions) definitions = {};
		if (!definitions[refs.openAiAnyTypeName]) definitions[refs.openAiAnyTypeName] = {
			type: [
				"string",
				"number",
				"integer",
				"boolean",
				"array",
				"null"
			],
			items: { $ref: refs.$refStrategy === "relative" ? "1" : [
				...refs.basePath,
				refs.definitionPath,
				refs.openAiAnyTypeName
			].join("/") }
		};
	}
	const combined = name$1 === void 0 ? definitions ? {
		...main,
		[refs.definitionPath]: definitions
	} : main : {
		$ref: [
			...refs.$refStrategy === "relative" ? [] : refs.basePath,
			refs.definitionPath,
			name$1
		].join("/"),
		[refs.definitionPath]: {
			...definitions,
			[name$1]: main
		}
	};
	if (refs.target === "jsonSchema7") combined.$schema = "http://json-schema.org/draft-07/schema#";
	else if (refs.target === "jsonSchema2019-09" || refs.target === "openAi") combined.$schema = "https://json-schema.org/draft/2019-09/schema#";
	if (refs.target === "openAi" && ("anyOf" in combined || "oneOf" in combined || "allOf" in combined || "type" in combined && Array.isArray(combined.type))) console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property.");
	return combined;
};
var McpZodTypeKind;
(function(McpZodTypeKind$1) {
	McpZodTypeKind$1["Completable"] = "McpCompletable";
})(McpZodTypeKind || (McpZodTypeKind = {}));
var Completable = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const data = ctx.data;
		return this._def.type._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	unwrap() {
		return this._def.type;
	}
};
Completable.create = (type, params) => {
	return new Completable({
		type,
		typeName: McpZodTypeKind.Completable,
		complete: params.complete,
		...processCreateParams(params)
	});
};
function processCreateParams(params) {
	if (!params) return {};
	const { errorMap, invalid_type_error, required_error, description } = params;
	if (errorMap && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
	if (errorMap) return {
		errorMap,
		description
	};
	const customMap = (iss, ctx) => {
		var _a, _b;
		const { message } = params;
		if (iss.code === "invalid_enum_value") return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
		if (typeof ctx.data === "undefined") return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
		if (iss.code !== "invalid_type") return { message: ctx.defaultError };
		return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
	};
	return {
		errorMap: customMap,
		description
	};
}
/**
* High-level MCP server that provides a simpler API for working with resources, tools, and prompts.
* For advanced usage (like sending notifications or setting custom request handlers), use the underlying
* Server instance available via the `server` property.
*/
var McpServer = class {
	constructor(serverInfo, options) {
		this._registeredResources = {};
		this._registeredResourceTemplates = {};
		this._registeredTools = {};
		this._registeredPrompts = {};
		this._toolHandlersInitialized = false;
		this._completionHandlerInitialized = false;
		this._resourceHandlersInitialized = false;
		this._promptHandlersInitialized = false;
		this.server = new Server(serverInfo, options);
	}
	/**
	* Attaches to the given transport, starts it, and starts listening for messages.
	*
	* The `server` object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
	*/
	async connect(transport) {
		return await this.server.connect(transport);
	}
	/**
	* Closes the connection.
	*/
	async close() {
		await this.server.close();
	}
	setToolRequestHandlers() {
		if (this._toolHandlersInitialized) return;
		this.server.assertCanSetRequestHandler(ListToolsRequestSchema.shape.method.value);
		this.server.assertCanSetRequestHandler(CallToolRequestSchema.shape.method.value);
		this.server.registerCapabilities({ tools: { listChanged: true } });
		this.server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: Object.entries(this._registeredTools).filter(([, tool]) => tool.enabled).map(([name$1, tool]) => {
			const toolDefinition = {
				name: name$1,
				title: tool.title,
				description: tool.description,
				inputSchema: tool.inputSchema ? zodToJsonSchema(tool.inputSchema, { strictUnions: true }) : EMPTY_OBJECT_JSON_SCHEMA,
				annotations: tool.annotations
			};
			if (tool.outputSchema) toolDefinition.outputSchema = zodToJsonSchema(tool.outputSchema, { strictUnions: true });
			return toolDefinition;
		}) }));
		this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
			const tool = this._registeredTools[request.params.name];
			if (!tool) throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} not found`);
			if (!tool.enabled) throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} disabled`);
			let result;
			if (tool.inputSchema) {
				const parseResult = await tool.inputSchema.safeParseAsync(request.params.arguments);
				if (!parseResult.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for tool ${request.params.name}: ${parseResult.error.message}`);
				const args = parseResult.data;
				const cb = tool.callback;
				try {
					result = await Promise.resolve(cb(args, extra));
				} catch (error) {
					result = {
						content: [{
							type: "text",
							text: error instanceof Error ? error.message : String(error)
						}],
						isError: true
					};
				}
			} else {
				const cb = tool.callback;
				try {
					result = await Promise.resolve(cb(extra));
				} catch (error) {
					result = {
						content: [{
							type: "text",
							text: error instanceof Error ? error.message : String(error)
						}],
						isError: true
					};
				}
			}
			if (tool.outputSchema && !result.isError) {
				if (!result.structuredContent) throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} has an output schema but no structured content was provided`);
				const parseResult = await tool.outputSchema.safeParseAsync(result.structuredContent);
				if (!parseResult.success) throw new McpError(ErrorCode.InvalidParams, `Invalid structured content for tool ${request.params.name}: ${parseResult.error.message}`);
			}
			return result;
		});
		this._toolHandlersInitialized = true;
	}
	setCompletionRequestHandler() {
		if (this._completionHandlerInitialized) return;
		this.server.assertCanSetRequestHandler(CompleteRequestSchema.shape.method.value);
		this.server.registerCapabilities({ completions: {} });
		this.server.setRequestHandler(CompleteRequestSchema, async (request) => {
			switch (request.params.ref.type) {
				case "ref/prompt": return this.handlePromptCompletion(request, request.params.ref);
				case "ref/resource": return this.handleResourceCompletion(request, request.params.ref);
				default: throw new McpError(ErrorCode.InvalidParams, `Invalid completion reference: ${request.params.ref}`);
			}
		});
		this._completionHandlerInitialized = true;
	}
	async handlePromptCompletion(request, ref) {
		const prompt = this._registeredPrompts[ref.name];
		if (!prompt) throw new McpError(ErrorCode.InvalidParams, `Prompt ${ref.name} not found`);
		if (!prompt.enabled) throw new McpError(ErrorCode.InvalidParams, `Prompt ${ref.name} disabled`);
		if (!prompt.argsSchema) return EMPTY_COMPLETION_RESULT;
		const field = prompt.argsSchema.shape[request.params.argument.name];
		if (!(field instanceof Completable)) return EMPTY_COMPLETION_RESULT;
		const def = field._def;
		const suggestions = await def.complete(request.params.argument.value, request.params.context);
		return createCompletionResult(suggestions);
	}
	async handleResourceCompletion(request, ref) {
		const template = Object.values(this._registeredResourceTemplates).find((t) => t.resourceTemplate.uriTemplate.toString() === ref.uri);
		if (!template) {
			if (this._registeredResources[ref.uri]) return EMPTY_COMPLETION_RESULT;
			throw new McpError(ErrorCode.InvalidParams, `Resource template ${request.params.ref.uri} not found`);
		}
		const completer = template.resourceTemplate.completeCallback(request.params.argument.name);
		if (!completer) return EMPTY_COMPLETION_RESULT;
		const suggestions = await completer(request.params.argument.value, request.params.context);
		return createCompletionResult(suggestions);
	}
	setResourceRequestHandlers() {
		if (this._resourceHandlersInitialized) return;
		this.server.assertCanSetRequestHandler(ListResourcesRequestSchema.shape.method.value);
		this.server.assertCanSetRequestHandler(ListResourceTemplatesRequestSchema.shape.method.value);
		this.server.assertCanSetRequestHandler(ReadResourceRequestSchema.shape.method.value);
		this.server.registerCapabilities({ resources: { listChanged: true } });
		this.server.setRequestHandler(ListResourcesRequestSchema, async (request, extra) => {
			const resources = Object.entries(this._registeredResources).filter(([_, resource]) => resource.enabled).map(([uri$1, resource]) => ({
				uri: uri$1,
				name: resource.name,
				...resource.metadata
			}));
			const templateResources = [];
			for (const template of Object.values(this._registeredResourceTemplates)) {
				if (!template.resourceTemplate.listCallback) continue;
				const result = await template.resourceTemplate.listCallback(extra);
				for (const resource of result.resources) templateResources.push({
					...template.metadata,
					...resource
				});
			}
			return { resources: [...resources, ...templateResources] };
		});
		this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
			const resourceTemplates = Object.entries(this._registeredResourceTemplates).map(([name$1, template]) => ({
				name: name$1,
				uriTemplate: template.resourceTemplate.uriTemplate.toString(),
				...template.metadata
			}));
			return { resourceTemplates };
		});
		this.server.setRequestHandler(ReadResourceRequestSchema, async (request, extra) => {
			const uri$1 = new URL(request.params.uri);
			const resource = this._registeredResources[uri$1.toString()];
			if (resource) {
				if (!resource.enabled) throw new McpError(ErrorCode.InvalidParams, `Resource ${uri$1} disabled`);
				return resource.readCallback(uri$1, extra);
			}
			for (const template of Object.values(this._registeredResourceTemplates)) {
				const variables = template.resourceTemplate.uriTemplate.match(uri$1.toString());
				if (variables) return template.readCallback(uri$1, variables, extra);
			}
			throw new McpError(ErrorCode.InvalidParams, `Resource ${uri$1} not found`);
		});
		this.setCompletionRequestHandler();
		this._resourceHandlersInitialized = true;
	}
	setPromptRequestHandlers() {
		if (this._promptHandlersInitialized) return;
		this.server.assertCanSetRequestHandler(ListPromptsRequestSchema.shape.method.value);
		this.server.assertCanSetRequestHandler(GetPromptRequestSchema.shape.method.value);
		this.server.registerCapabilities({ prompts: { listChanged: true } });
		this.server.setRequestHandler(ListPromptsRequestSchema, () => ({ prompts: Object.entries(this._registeredPrompts).filter(([, prompt]) => prompt.enabled).map(([name$1, prompt]) => {
			return {
				name: name$1,
				title: prompt.title,
				description: prompt.description,
				arguments: prompt.argsSchema ? promptArgumentsFromSchema(prompt.argsSchema) : void 0
			};
		}) }));
		this.server.setRequestHandler(GetPromptRequestSchema, async (request, extra) => {
			const prompt = this._registeredPrompts[request.params.name];
			if (!prompt) throw new McpError(ErrorCode.InvalidParams, `Prompt ${request.params.name} not found`);
			if (!prompt.enabled) throw new McpError(ErrorCode.InvalidParams, `Prompt ${request.params.name} disabled`);
			if (prompt.argsSchema) {
				const parseResult = await prompt.argsSchema.safeParseAsync(request.params.arguments);
				if (!parseResult.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for prompt ${request.params.name}: ${parseResult.error.message}`);
				const args = parseResult.data;
				const cb = prompt.callback;
				return await Promise.resolve(cb(args, extra));
			} else {
				const cb = prompt.callback;
				return await Promise.resolve(cb(extra));
			}
		});
		this.setCompletionRequestHandler();
		this._promptHandlersInitialized = true;
	}
	resource(name$1, uriOrTemplate, ...rest) {
		let metadata;
		if (typeof rest[0] === "object") metadata = rest.shift();
		const readCallback = rest[0];
		if (typeof uriOrTemplate === "string") {
			if (this._registeredResources[uriOrTemplate]) throw new Error(`Resource ${uriOrTemplate} is already registered`);
			const registeredResource = this._createRegisteredResource(name$1, void 0, uriOrTemplate, metadata, readCallback);
			this.setResourceRequestHandlers();
			this.sendResourceListChanged();
			return registeredResource;
		} else {
			if (this._registeredResourceTemplates[name$1]) throw new Error(`Resource template ${name$1} is already registered`);
			const registeredResourceTemplate = this._createRegisteredResourceTemplate(name$1, void 0, uriOrTemplate, metadata, readCallback);
			this.setResourceRequestHandlers();
			this.sendResourceListChanged();
			return registeredResourceTemplate;
		}
	}
	/**
	* Registers a resource with a config object and callback.
	* For static resources, use a URI string. For dynamic resources, use a ResourceTemplate.
	*/
	registerResource(name$1, uriOrTemplate, config, readCallback) {
		if (typeof uriOrTemplate === "string") {
			if (this._registeredResources[uriOrTemplate]) throw new Error(`Resource ${uriOrTemplate} is already registered`);
			const registeredResource = this._createRegisteredResource(name$1, config.title, uriOrTemplate, config, readCallback);
			this.setResourceRequestHandlers();
			this.sendResourceListChanged();
			return registeredResource;
		} else {
			if (this._registeredResourceTemplates[name$1]) throw new Error(`Resource template ${name$1} is already registered`);
			const registeredResourceTemplate = this._createRegisteredResourceTemplate(name$1, config.title, uriOrTemplate, config, readCallback);
			this.setResourceRequestHandlers();
			this.sendResourceListChanged();
			return registeredResourceTemplate;
		}
	}
	_createRegisteredResource(name$1, title, uri$1, metadata, readCallback) {
		const registeredResource = {
			name: name$1,
			title,
			metadata,
			readCallback,
			enabled: true,
			disable: () => registeredResource.update({ enabled: false }),
			enable: () => registeredResource.update({ enabled: true }),
			remove: () => registeredResource.update({ uri: null }),
			update: (updates) => {
				if (typeof updates.uri !== "undefined" && updates.uri !== uri$1) {
					delete this._registeredResources[uri$1];
					if (updates.uri) this._registeredResources[updates.uri] = registeredResource;
				}
				if (typeof updates.name !== "undefined") registeredResource.name = updates.name;
				if (typeof updates.title !== "undefined") registeredResource.title = updates.title;
				if (typeof updates.metadata !== "undefined") registeredResource.metadata = updates.metadata;
				if (typeof updates.callback !== "undefined") registeredResource.readCallback = updates.callback;
				if (typeof updates.enabled !== "undefined") registeredResource.enabled = updates.enabled;
				this.sendResourceListChanged();
			}
		};
		this._registeredResources[uri$1] = registeredResource;
		return registeredResource;
	}
	_createRegisteredResourceTemplate(name$1, title, template, metadata, readCallback) {
		const registeredResourceTemplate = {
			resourceTemplate: template,
			title,
			metadata,
			readCallback,
			enabled: true,
			disable: () => registeredResourceTemplate.update({ enabled: false }),
			enable: () => registeredResourceTemplate.update({ enabled: true }),
			remove: () => registeredResourceTemplate.update({ name: null }),
			update: (updates) => {
				if (typeof updates.name !== "undefined" && updates.name !== name$1) {
					delete this._registeredResourceTemplates[name$1];
					if (updates.name) this._registeredResourceTemplates[updates.name] = registeredResourceTemplate;
				}
				if (typeof updates.title !== "undefined") registeredResourceTemplate.title = updates.title;
				if (typeof updates.template !== "undefined") registeredResourceTemplate.resourceTemplate = updates.template;
				if (typeof updates.metadata !== "undefined") registeredResourceTemplate.metadata = updates.metadata;
				if (typeof updates.callback !== "undefined") registeredResourceTemplate.readCallback = updates.callback;
				if (typeof updates.enabled !== "undefined") registeredResourceTemplate.enabled = updates.enabled;
				this.sendResourceListChanged();
			}
		};
		this._registeredResourceTemplates[name$1] = registeredResourceTemplate;
		return registeredResourceTemplate;
	}
	_createRegisteredPrompt(name$1, title, description, argsSchema, callback) {
		const registeredPrompt = {
			title,
			description,
			argsSchema: argsSchema === void 0 ? void 0 : objectType(argsSchema),
			callback,
			enabled: true,
			disable: () => registeredPrompt.update({ enabled: false }),
			enable: () => registeredPrompt.update({ enabled: true }),
			remove: () => registeredPrompt.update({ name: null }),
			update: (updates) => {
				if (typeof updates.name !== "undefined" && updates.name !== name$1) {
					delete this._registeredPrompts[name$1];
					if (updates.name) this._registeredPrompts[updates.name] = registeredPrompt;
				}
				if (typeof updates.title !== "undefined") registeredPrompt.title = updates.title;
				if (typeof updates.description !== "undefined") registeredPrompt.description = updates.description;
				if (typeof updates.argsSchema !== "undefined") registeredPrompt.argsSchema = objectType(updates.argsSchema);
				if (typeof updates.callback !== "undefined") registeredPrompt.callback = updates.callback;
				if (typeof updates.enabled !== "undefined") registeredPrompt.enabled = updates.enabled;
				this.sendPromptListChanged();
			}
		};
		this._registeredPrompts[name$1] = registeredPrompt;
		return registeredPrompt;
	}
	_createRegisteredTool(name$1, title, description, inputSchema, outputSchema, annotations, callback) {
		const registeredTool = {
			title,
			description,
			inputSchema: inputSchema === void 0 ? void 0 : objectType(inputSchema),
			outputSchema: outputSchema === void 0 ? void 0 : objectType(outputSchema),
			annotations,
			callback,
			enabled: true,
			disable: () => registeredTool.update({ enabled: false }),
			enable: () => registeredTool.update({ enabled: true }),
			remove: () => registeredTool.update({ name: null }),
			update: (updates) => {
				if (typeof updates.name !== "undefined" && updates.name !== name$1) {
					delete this._registeredTools[name$1];
					if (updates.name) this._registeredTools[updates.name] = registeredTool;
				}
				if (typeof updates.title !== "undefined") registeredTool.title = updates.title;
				if (typeof updates.description !== "undefined") registeredTool.description = updates.description;
				if (typeof updates.paramsSchema !== "undefined") registeredTool.inputSchema = objectType(updates.paramsSchema);
				if (typeof updates.callback !== "undefined") registeredTool.callback = updates.callback;
				if (typeof updates.annotations !== "undefined") registeredTool.annotations = updates.annotations;
				if (typeof updates.enabled !== "undefined") registeredTool.enabled = updates.enabled;
				this.sendToolListChanged();
			}
		};
		this._registeredTools[name$1] = registeredTool;
		this.setToolRequestHandlers();
		this.sendToolListChanged();
		return registeredTool;
	}
	/**
	* tool() implementation. Parses arguments passed to overrides defined above.
	*/
	tool(name$1, ...rest) {
		if (this._registeredTools[name$1]) throw new Error(`Tool ${name$1} is already registered`);
		let description;
		let inputSchema;
		let outputSchema;
		let annotations;
		if (typeof rest[0] === "string") description = rest.shift();
		if (rest.length > 1) {
			const firstArg = rest[0];
			if (isZodRawShape(firstArg)) {
				inputSchema = rest.shift();
				if (rest.length > 1 && typeof rest[0] === "object" && rest[0] !== null && !isZodRawShape(rest[0])) annotations = rest.shift();
			} else if (typeof firstArg === "object" && firstArg !== null) annotations = rest.shift();
		}
		const callback = rest[0];
		return this._createRegisteredTool(name$1, void 0, description, inputSchema, outputSchema, annotations, callback);
	}
	/**
	* Registers a tool with a config object and callback.
	*/
	registerTool(name$1, config, cb) {
		if (this._registeredTools[name$1]) throw new Error(`Tool ${name$1} is already registered`);
		const { title, description, inputSchema, outputSchema, annotations } = config;
		return this._createRegisteredTool(name$1, title, description, inputSchema, outputSchema, annotations, cb);
	}
	prompt(name$1, ...rest) {
		if (this._registeredPrompts[name$1]) throw new Error(`Prompt ${name$1} is already registered`);
		let description;
		if (typeof rest[0] === "string") description = rest.shift();
		let argsSchema;
		if (rest.length > 1) argsSchema = rest.shift();
		const cb = rest[0];
		const registeredPrompt = this._createRegisteredPrompt(name$1, void 0, description, argsSchema, cb);
		this.setPromptRequestHandlers();
		this.sendPromptListChanged();
		return registeredPrompt;
	}
	/**
	* Registers a prompt with a config object and callback.
	*/
	registerPrompt(name$1, config, cb) {
		if (this._registeredPrompts[name$1]) throw new Error(`Prompt ${name$1} is already registered`);
		const { title, description, argsSchema } = config;
		const registeredPrompt = this._createRegisteredPrompt(name$1, title, description, argsSchema, cb);
		this.setPromptRequestHandlers();
		this.sendPromptListChanged();
		return registeredPrompt;
	}
	/**
	* Checks if the server is connected to a transport.
	* @returns True if the server is connected
	*/
	isConnected() {
		return this.server.transport !== void 0;
	}
	/**
	* Sends a resource list changed event to the client, if connected.
	*/
	sendResourceListChanged() {
		if (this.isConnected()) this.server.sendResourceListChanged();
	}
	/**
	* Sends a tool list changed event to the client, if connected.
	*/
	sendToolListChanged() {
		if (this.isConnected()) this.server.sendToolListChanged();
	}
	/**
	* Sends a prompt list changed event to the client, if connected.
	*/
	sendPromptListChanged() {
		if (this.isConnected()) this.server.sendPromptListChanged();
	}
};
const EMPTY_OBJECT_JSON_SCHEMA = { type: "object" };
function isZodRawShape(obj) {
	if (typeof obj !== "object" || obj === null) return false;
	const isEmptyObject = Object.keys(obj).length === 0;
	return isEmptyObject || Object.values(obj).some(isZodTypeLike);
}
function isZodTypeLike(value) {
	return value !== null && typeof value === "object" && "parse" in value && typeof value.parse === "function" && "safeParse" in value && typeof value.safeParse === "function";
}
function promptArgumentsFromSchema(schema) {
	return Object.entries(schema.shape).map(([name$1, field]) => ({
		name: name$1,
		description: field.description,
		required: !field.isOptional()
	}));
}
function createCompletionResult(suggestions) {
	return { completion: {
		values: suggestions.slice(0, 100),
		total: suggestions.length,
		hasMore: suggestions.length > 100
	} };
}
const EMPTY_COMPLETION_RESULT = { completion: {
	values: [],
	hasMore: false
} };
/**
* Buffers a continuous stdio stream into discrete JSON-RPC messages.
*/
var ReadBuffer = class {
	append(chunk) {
		this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
	}
	readMessage() {
		if (!this._buffer) return null;
		const index = this._buffer.indexOf("\n");
		if (index === -1) return null;
		const line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
		this._buffer = this._buffer.subarray(index + 1);
		return deserializeMessage(line);
	}
	clear() {
		this._buffer = void 0;
	}
};
function deserializeMessage(line) {
	return JSONRPCMessageSchema.parse(JSON.parse(line));
}
function serializeMessage(message) {
	return JSON.stringify(message) + "\n";
}
/**
* Server transport for stdio: this communicates with a MCP client by reading from the current process' stdin and writing to stdout.
*
* This transport is only available in Node.js environments.
*/
var StdioServerTransport = class {
	constructor(_stdin = process.stdin, _stdout = process.stdout) {
		this._stdin = _stdin;
		this._stdout = _stdout;
		this._readBuffer = new ReadBuffer();
		this._started = false;
		this._ondata = (chunk) => {
			this._readBuffer.append(chunk);
			this.processReadBuffer();
		};
		this._onerror = (error) => {
			var _a;
			(_a = this.onerror) === null || _a === void 0 || _a.call(this, error);
		};
	}
	/**
	* Starts listening for messages on stdin.
	*/
	async start() {
		if (this._started) throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
		this._started = true;
		this._stdin.on("data", this._ondata);
		this._stdin.on("error", this._onerror);
	}
	processReadBuffer() {
		var _a, _b;
		while (true) try {
			const message = this._readBuffer.readMessage();
			if (message === null) break;
			(_a = this.onmessage) === null || _a === void 0 || _a.call(this, message);
		} catch (error) {
			(_b = this.onerror) === null || _b === void 0 || _b.call(this, error);
		}
	}
	async close() {
		var _a;
		this._stdin.off("data", this._ondata);
		this._stdin.off("error", this._onerror);
		const remainingDataListeners = this._stdin.listenerCount("data");
		if (remainingDataListeners === 0) this._stdin.pause();
		this._readBuffer.clear();
		(_a = this.onclose) === null || _a === void 0 || _a.call(this);
	}
	send(message) {
		return new Promise((resolve$4) => {
			const json = serializeMessage(message);
			if (this._stdout.write(json)) resolve$4();
			else this._stdout.once("drain", resolve$4);
		});
	}
};
var compose = (middleware, onError, onNotFound) => {
	return (context, next) => {
		let index = -1;
		return dispatch(0);
		async function dispatch(i) {
			if (i <= index) throw new Error("next() called multiple times");
			index = i;
			let res;
			let isError = false;
			let handler;
			if (middleware[i]) {
				handler = middleware[i][0][0];
				context.req.routeIndex = i;
			} else handler = i === middleware.length && next || void 0;
			if (handler) try {
				res = await handler(context, () => dispatch(i + 1));
			} catch (err) {
				if (err instanceof Error && onError) {
					context.error = err;
					res = await onError(err, context);
					isError = true;
				} else throw err;
			}
			else if (context.finalized === false && onNotFound) res = await onNotFound(context);
			if (res && (context.finalized === false || isError)) context.res = res;
			return context;
		}
	};
};
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = [
	"get",
	"post",
	"put",
	"delete",
	"options",
	"patch"
];
var UnsupportedPathError = class extends Error {};
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";
var notFoundHandler = (c) => {
	return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
	if ("getResponse" in err) {
		const res = err.getResponse();
		return c.newResponse(res.body, res);
	}
	console.error(err);
	return c.text("Internal Server Error", 500);
};
var Hono$1 = class {
	get;
	post;
	put;
	delete;
	options;
	patch;
	all;
	on;
	use;
	router;
	getPath;
	_basePath = "/";
	#path = "/";
	routes = [];
	constructor(options = {}) {
		const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
		allMethods.forEach((method) => {
			this[method] = (args1, ...args) => {
				if (typeof args1 === "string") this.#path = args1;
				else this.#addRoute(method, this.#path, args1);
				args.forEach((handler) => {
					this.#addRoute(method, this.#path, handler);
				});
				return this;
			};
		});
		this.on = (method, path, ...handlers) => {
			for (const p of [path].flat()) {
				this.#path = p;
				for (const m of [method].flat()) handlers.map((handler) => {
					this.#addRoute(m.toUpperCase(), this.#path, handler);
				});
			}
			return this;
		};
		this.use = (arg1, ...handlers) => {
			if (typeof arg1 === "string") this.#path = arg1;
			else {
				this.#path = "*";
				handlers.unshift(arg1);
			}
			handlers.forEach((handler) => {
				this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
			});
			return this;
		};
		const { strict,...optionsWithoutStrict } = options;
		Object.assign(this, optionsWithoutStrict);
		this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
	}
	#clone() {
		const clone = new Hono$1({
			router: this.router,
			getPath: this.getPath
		});
		clone.errorHandler = this.errorHandler;
		clone.#notFoundHandler = this.#notFoundHandler;
		clone.routes = this.routes;
		return clone;
	}
	#notFoundHandler = notFoundHandler;
	errorHandler = errorHandler;
	route(path, app) {
		const subApp = this.basePath(path);
		app.routes.map((r) => {
			let handler;
			if (app.errorHandler === errorHandler) handler = r.handler;
			else {
				handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
				handler[COMPOSED_HANDLER] = r.handler;
			}
			subApp.#addRoute(r.method, r.path, handler);
		});
		return this;
	}
	basePath(path) {
		const subApp = this.#clone();
		subApp._basePath = mergePath(this._basePath, path);
		return subApp;
	}
	onError = (handler) => {
		this.errorHandler = handler;
		return this;
	};
	notFound = (handler) => {
		this.#notFoundHandler = handler;
		return this;
	};
	mount(path, applicationHandler, options) {
		let replaceRequest;
		let optionHandler;
		if (options) if (typeof options === "function") optionHandler = options;
		else {
			optionHandler = options.optionHandler;
			if (options.replaceRequest === false) replaceRequest = (request) => request;
			else replaceRequest = options.replaceRequest;
		}
		const getOptions = optionHandler ? (c) => {
			const options2 = optionHandler(c);
			return Array.isArray(options2) ? options2 : [options2];
		} : (c) => {
			let executionContext = void 0;
			try {
				executionContext = c.executionCtx;
			} catch {}
			return [c.env, executionContext];
		};
		replaceRequest ||= (() => {
			const mergedPath = mergePath(this._basePath, path);
			const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
			return (request) => {
				const url = new URL(request.url);
				url.pathname = url.pathname.slice(pathPrefixLength) || "/";
				return new Request(url, request);
			};
		})();
		const handler = async (c, next) => {
			const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
			if (res) return res;
			await next();
		};
		this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
		return this;
	}
	#addRoute(method, path, handler) {
		method = method.toUpperCase();
		path = mergePath(this._basePath, path);
		const r = {
			basePath: this._basePath,
			path,
			method,
			handler
		};
		this.router.add(method, path, [handler, r]);
		this.routes.push(r);
	}
	#handleError(err, c) {
		if (err instanceof Error) return this.errorHandler(err, c);
		throw err;
	}
	#dispatch(request, executionCtx, env, method) {
		if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
		const path = this.getPath(request, { env });
		const matchResult = this.router.match(method, path);
		const c = new Context(request, {
			path,
			matchResult,
			env,
			executionCtx,
			notFoundHandler: this.#notFoundHandler
		});
		if (matchResult[0].length === 1) {
			let res;
			try {
				res = matchResult[0][0][0][0](c, async () => {
					c.res = await this.#notFoundHandler(c);
				});
			} catch (err) {
				return this.#handleError(err, c);
			}
			return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
		}
		const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
		return (async () => {
			try {
				const context = await composed(c);
				if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
				return context.res;
			} catch (err) {
				return this.#handleError(err, c);
			}
		})();
	}
	fetch = (request, ...rest) => {
		return this.#dispatch(request, rest[1], rest[0], request.method);
	};
	request = (input, requestInit, Env, executionCtx) => {
		if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
		input = input.toString();
		return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
	};
	fire = () => {
		addEventListener("fetch", (event) => {
			event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
		});
	};
};
var emptyParams = /* @__PURE__ */ Object.create(null);
var PatternRouter = class {
	name = "PatternRouter";
	#routes = [];
	add(method, path, handler) {
		const endsWithWildcard = path.at(-1) === "*";
		if (endsWithWildcard) path = path.slice(0, -2);
		if (path.at(-1) === "?") {
			path = path.slice(0, -1);
			this.add(method, path.replace(/\/[^/]+$/, ""), handler);
		}
		const parts = (path.match(/\/?(:\w+(?:{(?:(?:{[\d,]+})|[^}])+})?)|\/?[^\/\?]+/g) || []).map((part) => {
			const match = part.match(/^\/:([^{]+)(?:{(.*)})?/);
			return match ? `/(?<${match[1]}>${match[2] || "[^/]+"})` : part === "/*" ? "/[^/]+" : part.replace(/[.\\+*[^\]$()]/g, "\\$&");
		});
		try {
			this.#routes.push([
				/* @__PURE__ */ new RegExp(`^${parts.join("")}${endsWithWildcard ? "" : "/?$"}`),
				method,
				handler
			]);
		} catch {
			throw new UnsupportedPathError();
		}
	}
	match(method, path) {
		const handlers = [];
		for (let i = 0, len = this.#routes.length; i < len; i++) {
			const [pattern, routeMethod, handler] = this.#routes[i];
			if (routeMethod === method || routeMethod === METHOD_NAME_ALL) {
				const match = pattern.exec(path);
				if (match) handlers.push([handler, match.groups || emptyParams]);
			}
		}
		return [handlers];
	}
};
var Hono = class extends Hono$1 {
	constructor(options = {}) {
		super(options);
		this.router = new PatternRouter();
	}
};
var import_usingCtx = __toESM(require_usingCtx(), 1);
const modelBreakdownSchema = objectType({
	modelName: stringType(),
	inputTokens: numberType(),
	outputTokens: numberType(),
	cacheCreationTokens: numberType().optional(),
	cacheReadTokens: numberType().optional(),
	cost: numberType()
});
const dailyUsageSchema = objectType({
	date: stringType(),
	inputTokens: numberType(),
	outputTokens: numberType(),
	cacheCreationTokens: numberType().optional(),
	cacheReadTokens: numberType().optional(),
	totalTokens: numberType(),
	totalCost: numberType(),
	modelsUsed: arrayType(stringType()),
	modelBreakdowns: arrayType(modelBreakdownSchema)
});
const sessionUsageSchema = objectType({
	sessionId: stringType(),
	inputTokens: numberType(),
	outputTokens: numberType(),
	cacheCreationTokens: numberType().optional(),
	cacheReadTokens: numberType().optional(),
	totalTokens: numberType(),
	totalCost: numberType(),
	lastActivity: stringType(),
	modelsUsed: arrayType(stringType()),
	modelBreakdowns: arrayType(modelBreakdownSchema)
});
const monthlyUsageSchema = objectType({
	month: stringType(),
	inputTokens: numberType(),
	outputTokens: numberType(),
	cacheCreationTokens: numberType().optional(),
	cacheReadTokens: numberType().optional(),
	totalTokens: numberType(),
	totalCost: numberType(),
	modelsUsed: arrayType(stringType()),
	modelBreakdowns: arrayType(modelBreakdownSchema)
});
const blockUsageSchema = objectType({
	id: stringType(),
	startTime: stringType(),
	endTime: stringType().optional(),
	actualEndTime: stringType().optional(),
	isActive: booleanType(),
	isGap: booleanType(),
	entries: numberType(),
	tokenCounts: objectType({
		inputTokens: numberType(),
		outputTokens: numberType(),
		cacheCreationInputTokens: numberType(),
		cacheReadInputTokens: numberType()
	}),
	totalTokens: numberType(),
	costUSD: numberType(),
	models: arrayType(stringType()),
	burnRate: numberType().nullable(),
	projection: unknownType().nullable()
});
const dailyResponseSchema = {
	daily: arrayType(dailyUsageSchema),
	totals: objectType({
		totalInputTokens: numberType().optional(),
		totalOutputTokens: numberType().optional(),
		totalCacheCreationTokens: numberType().optional(),
		totalCacheReadTokens: numberType().optional(),
		totalTokens: numberType().optional(),
		totalCost: numberType().optional(),
		modelsUsed: arrayType(stringType()).optional()
	})
};
const sessionResponseSchema = {
	sessions: arrayType(sessionUsageSchema),
	totals: objectType({
		totalInputTokens: numberType().optional(),
		totalOutputTokens: numberType().optional(),
		totalCacheCreationTokens: numberType().optional(),
		totalCacheReadTokens: numberType().optional(),
		totalTokens: numberType().optional(),
		totalCost: numberType().optional(),
		modelsUsed: arrayType(stringType()).optional()
	})
};
const monthlyResponseSchema = {
	monthly: arrayType(monthlyUsageSchema),
	totals: objectType({
		totalInputTokens: numberType().optional(),
		totalOutputTokens: numberType().optional(),
		totalCacheCreationTokens: numberType().optional(),
		totalCacheReadTokens: numberType().optional(),
		totalTokens: numberType().optional(),
		totalCost: numberType().optional(),
		modelsUsed: arrayType(stringType()).optional()
	})
};
const blocksResponseSchema = { blocks: arrayType(blockUsageSchema) };
/**
* Helper function to transform usage data with totals into JSON output format
*/
function transformUsageDataWithTotals(data, totals, mapper, key) {
	return {
		[key]: data.map(mapper),
		totals: createTotalsObject(totals)
	};
}
/** Default options for the MCP server */
const defaultOptions = { claudePath: (() => {
	const paths = getClaudePaths();
	if (paths.length === 0) throw new Error("No valid Claude path found. Ensure getClaudePaths() returns at least one valid path.");
	return paths[0];
})() };
/**
* Creates an MCP server with tools for showing usage reports.
* Registers tools for daily, session, monthly, and blocks usage data.
*
* @param options - Configuration options for the MCP server
* @param options.claudePath - Path to Claude's data directory
* @returns Configured MCP server instance with registered tools
*/
function createMcpServer({ claudePath } = defaultOptions) {
	const server = new McpServer({
		name,
		version
	});
	const parametersZodSchema = {
		since: filterDateSchema.optional(),
		until: filterDateSchema.optional(),
		mode: enumType([
			"auto",
			"calculate",
			"display"
		]).default("auto").optional()
	};
	server.registerTool("daily", {
		description: "Show usage report grouped by date",
		inputSchema: parametersZodSchema,
		outputSchema: dailyResponseSchema
	}, async (args) => {
		const dailyData = await loadDailyUsageData({
			...args,
			claudePath
		});
		const totals = calculateTotals(dailyData);
		const jsonOutput = transformUsageDataWithTotals(dailyData, totals, (data) => ({
			date: data.date,
			inputTokens: data.inputTokens,
			outputTokens: data.outputTokens,
			cacheCreationTokens: data.cacheCreationTokens,
			cacheReadTokens: data.cacheReadTokens,
			totalTokens: getTotalTokens(data),
			totalCost: data.totalCost,
			modelsUsed: data.modelsUsed,
			modelBreakdowns: data.modelBreakdowns
		}), "daily");
		return {
			content: [{
				type: "text",
				text: JSON.stringify(jsonOutput, null, 2)
			}],
			structuredContent: jsonOutput
		};
	});
	server.registerTool("session", {
		description: "Show usage report grouped by conversation session",
		inputSchema: parametersZodSchema,
		outputSchema: sessionResponseSchema
	}, async (args) => {
		const sessionData = await loadSessionData({
			...args,
			claudePath
		});
		const totals = calculateTotals(sessionData);
		const jsonOutput = transformUsageDataWithTotals(sessionData, totals, (data) => ({
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
		}), "sessions");
		return {
			content: [{
				type: "text",
				text: JSON.stringify(jsonOutput, null, 2)
			}],
			structuredContent: jsonOutput
		};
	});
	server.registerTool("monthly", {
		description: "Show usage report grouped by month",
		inputSchema: parametersZodSchema,
		outputSchema: monthlyResponseSchema
	}, async (args) => {
		const monthlyData = await loadMonthlyUsageData({
			...args,
			claudePath
		});
		const totals = calculateTotals(monthlyData);
		const jsonOutput = transformUsageDataWithTotals(monthlyData, totals, (data) => ({
			month: data.month,
			inputTokens: data.inputTokens,
			outputTokens: data.outputTokens,
			cacheCreationTokens: data.cacheCreationTokens,
			cacheReadTokens: data.cacheReadTokens,
			totalTokens: getTotalTokens(data),
			totalCost: data.totalCost,
			modelsUsed: data.modelsUsed,
			modelBreakdowns: data.modelBreakdowns
		}), "monthly");
		return {
			content: [{
				type: "text",
				text: JSON.stringify(jsonOutput, null, 2)
			}],
			structuredContent: jsonOutput
		};
	});
	server.registerTool("blocks", {
		description: "Show usage report grouped by session billing blocks",
		inputSchema: parametersZodSchema,
		outputSchema: blocksResponseSchema
	}, async (args) => {
		const blocks = await loadSessionBlockData({
			...args,
			claudePath
		});
		const jsonOutput = { blocks: blocks.map((block) => {
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
				burnRate: null,
				projection: null
			};
		}) };
		return {
			content: [{
				type: "text",
				text: JSON.stringify(jsonOutput, null, 2)
			}],
			structuredContent: jsonOutput
		};
	});
	return server;
}
/**
* Start the MCP server with stdio transport.
* Used for traditional MCP client connections via standard input/output.
*
* @param server - The MCP server instance to start
*/
async function startMcpServerStdio(server) {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}
/**
* Create Hono app for MCP HTTP server.
* Provides HTTP transport support for MCP protocol using Hono framework.
* Handles POST requests for MCP communication and returns appropriate errors for other methods.
*
* @param options - Configuration options for the MCP server
* @param options.claudePath - Path to Claude's data directory
* @returns Configured Hono application for HTTP MCP transport
*/
function createMcpHttpApp(options = defaultOptions) {
	const app = new Hono();
	const mcpServer = createMcpServer(options);
	app.all("/", async (c) => {
		const transport = new StreamableHTTPTransport();
		await mcpServer.connect(transport);
		return transport.handleRequest(c);
	});
	return app;
}
export { createMcpHttpApp, createMcpServer, startMcpServerStdio };
