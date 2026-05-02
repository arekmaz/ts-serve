import { createServer } from "node:http";
import { createTsServeHandler } from "../../src/tsServeHandler.ts";
import { composeWebHandlers } from "../../src/composeWebHandlers.ts";
import { nodeFromWebHandler } from "../../src/nodeFromWebHandler.ts";
import { createStaticHandler } from "../../src/webStaticHandler.ts";
import { handler } from "./backend/handler.ts";

const root = new URL("frontend", import.meta.url).pathname;

const app = composeWebHandlers(
  createTsServeHandler({ root }),
  createStaticHandler(root),
  handler,
);

const port = Number(globalThis.process.env["PORT"] ?? 3001);

createServer(nodeFromWebHandler(app)).listen(port, function onListening() {
  console.log(`http://localhost:${port}`);
});
