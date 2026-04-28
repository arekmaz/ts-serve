import { describe, it, expect } from "vitest";
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
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("OK GET /hello");
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
      expect(res.status).toBe(404);
      expect(await res.text()).toBe("Not Found");
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
      expect(res.headers.get("x-custom")).toBe("test-value");
      expect(res.headers.get("content-type")).toBe("text/plain");
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
      expect(receivedAuth).toBe("Bearer token123");
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
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("hello from client");
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
      expect(res.status).toBe(500);
      expect(await res.text()).toBe("Internal Server Error");
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
      expect(res.status).toBe(204);
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
      expect(receivedSearch).toBe("?foo=bar&a=1");
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
      expect(receivedMethod).toBe("PUT");
      expect(await res.text()).toBe("data");
    } finally {
      close();
    }
  });
});
