import { LoadOptions } from "./data-loader-kPO1ovQN.js";
import "./pricing-fetcher-BsD-6blA.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono/tiny";

//#region src/mcp.d.ts

/**
 * Creates an MCP server with tools for showing usage reports.
 * Registers tools for daily, session, monthly, and blocks usage data.
 *
 * @param options - Configuration options for the MCP server
 * @param options.claudePath - Path to Claude's data directory
 * @returns Configured MCP server instance with registered tools
 */
declare function createMcpServer({
  claudePath
}?: LoadOptions): McpServer;
/**
 * Start the MCP server with stdio transport.
 * Used for traditional MCP client connections via standard input/output.
 *
 * @param server - The MCP server instance to start
 */
declare function startMcpServerStdio(server: McpServer): Promise<void>;
/**
 * Create Hono app for MCP HTTP server.
 * Provides HTTP transport support for MCP protocol using Hono framework.
 * Handles POST requests for MCP communication and returns appropriate errors for other methods.
 *
 * @param options - Configuration options for the MCP server
 * @param options.claudePath - Path to Claude's data directory
 * @returns Configured Hono application for HTTP MCP transport
 */
declare function createMcpHttpApp(options?: LoadOptions): Hono;
//#endregion
export { createMcpHttpApp, createMcpServer, startMcpServerStdio };