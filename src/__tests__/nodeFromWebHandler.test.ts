import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { nodeFromWebHandler } from "../nodeFromWebHandler.ts";

function listen(
  handler: ReturnType<typeof nodeFromWebHandler>,
): Promise<{ port: number; close: () => void }> {
  return new Promise(function onResolve(resolve) {
    const server = createServer(handler);
    server.listen(0, function onListening() {
      const addr = server.address();
      if (typeof addr !== "object" || addr === null) {
        throw new Error("unexpected address");
      }
      resolve({ port: addr.port, close: () => server.close() });
    });
  });
}

describe("nodeFromWebHandler", () => {
  it("forwards GET request and returns response", async () => {
    const handler = nodeFromWebHandler(async function echo(req) {
      return new Response(`OK ${req.method} ${new URL(req.url).pathname}`, {
        status: 200,
      });
    });
    const { port, close } = await listen(handler);
    try {
      const res = await fetch(`http://localhost:${port}/hello`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(await res.text(), "OK GET /hello");
    } finally {
      close();
    }
  });

  it("preserves response status codes", async () => {
    const handler = nodeFromWebHandler(async function notFound() {
      return new Response("Not Found", { status: 404 });
    });
    const { port, close } = await listen(handler);
    try {
      const res = await fetch(`http://localhost:${port}/missing`);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(await res.text(), "Not Found");
    } finally {
      close();
    }
  });

  it("preserves response headers", async () => {
    const handler = nodeFromWebHandler(async function withHeaders() {
      return new Response("body", {
        headers: { "x-custom": "test-value", "content-type": "text/plain" },
      });
    });
    const { port, close } = await listen(handler);
    try {
      const res = await fetch(`http://localhost:${port}/`);
      assert.strictEqual(res.headers.get("x-custom"), "test-value");
      assert.strictEqual(res.headers.get("content-type"), "text/plain");
    } finally {
      close();
    }
  });

  it("forwards request headers to the web handler", async () => {
    let receivedAuth = "";
    const handler = nodeFromWebHandler(async function readHeaders(req) {
      receivedAuth = req.headers.get("authorization") ?? "";
      return new Response("ok");
    });
    const { port, close } = await listen(handler);
    try {
      await fetch(`http://localhost:${port}/`, {
        headers: { authorization: "Bearer token123" },
      });
      assert.strictEqual(receivedAuth, "Bearer token123");
    } finally {
      close();
    }
  });

  it("forwards POST body to the web handler", async () => {
    const handler = nodeFromWebHandler(async function echoBody(req) {
      const body = await req.text();
      return new Response(body, { status: 200 });
    });
    const { port, close } = await listen(handler);
    try {
      const res = await fetch(`http://localhost:${port}/`, {
        method: "POST",
        body: "hello from client",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(await res.text(), "hello from client");
    } finally {
      close();
    }
  });

  it("returns 500 when the web handler throws", async () => {
    const handler = nodeFromWebHandler(async function failing() {
      throw new Error("boom");
    });
    const { port, close } = await listen(handler);
    try {
      const res = await fetch(`http://localhost:${port}/`);
      assert.strictEqual(res.status, 500);
      assert.strictEqual(await res.text(), "Internal Server Error");
    } finally {
      close();
    }
  });

  it("handles empty response body", async () => {
    const handler = nodeFromWebHandler(async function noBody() {
      return new Response(null, { status: 204 });
    });
    const { port, close } = await listen(handler);
    try {
      const res = await fetch(`http://localhost:${port}/`);
      assert.strictEqual(res.status, 204);
    } finally {
      close();
    }
  });

  it("decodes query parameters in the forwarded url", async () => {
    let receivedSearch = "";
    const handler = nodeFromWebHandler(async function readQuery(req) {
      receivedSearch = new URL(req.url).search;
      return new Response("ok");
    });
    const { port, close } = await listen(handler);
    try {
      await fetch(`http://localhost:${port}/path?foo=bar&a=1`);
      assert.strictEqual(receivedSearch, "?foo=bar&a=1");
    } finally {
      close();
    }
  });

  it("forwards the correct method for PUT", async () => {
    let receivedMethod = "";
    const handler = nodeFromWebHandler(async function readMethod(req) {
      receivedMethod = req.method;
      const body = await req.text();
      return new Response(body);
    });
    const { port, close } = await listen(handler);
    try {
      const res = await fetch(`http://localhost:${port}/`, {
        method: "PUT",
        body: "data",
      });
      assert.strictEqual(receivedMethod, "PUT");
      assert.strictEqual(await res.text(), "data");
    } finally {
      close();
    }
  });

  it("preserves multiple set-cookie headers", async () => {
    const handler = nodeFromWebHandler(async function cookies() {
      const h = new Headers();
      h.append("set-cookie", "a=1; Path=/");
      h.append("set-cookie", "b=2; Path=/");
      return new Response("ok", { headers: h });
    });
    const { port, close } = await listen(handler);
    try {
      const res = await fetch(`http://localhost:${port}/`);
      const cookies = res.headers.getSetCookie();
      assert.strictEqual(cookies.length, 2);
      assert.ok(cookies.some((c) => c.includes("a=1")));
      assert.ok(cookies.some((c) => c.includes("b=2")));
    } finally {
      close();
    }
  });

  it("provides abort signal that triggers on client disconnect", async () => {
    let signalReceived = false;
    const handler = nodeFromWebHandler(async function slow(req) {
      req.signal.addEventListener("abort", function onAbort() {
        signalReceived = true;
      });
      await new Promise(function wait(resolve) {
        setTimeout(resolve, 500);
      });
      return new Response("ok");
    });
    const { port, close } = await listen(handler);
    try {
      const ac = new AbortController();
      const req = fetch(`http://localhost:${port}/`, { signal: ac.signal });
      await new Promise(function wait(resolve) {
        setTimeout(resolve, 50);
      });
      ac.abort();
      await req.catch(function ignore() {});
      await new Promise(function wait(resolve) {
        setTimeout(resolve, 100);
      });
      assert.strictEqual(signalReceived, true);
    } finally {
      close();
    }
  });
});
