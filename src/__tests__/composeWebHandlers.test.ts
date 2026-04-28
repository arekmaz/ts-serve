import { describe, it, expect } from "vitest";
import { composeWebHandlers } from "../composeWebHandlers.ts";
import type { WebMiddleware } from "../composeWebHandlers.ts";

describe("composeWebHandlers", () => {
  it("returns the response from a single handler", async () => {
    const handler: WebMiddleware = async function greet() {
      return new Response("hello", { status: 200 });
    };
    const app = composeWebHandlers(handler);
    const res = await app(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("hello");
  });

  it("returns 404 when a single handler returns null", async () => {
    const handler: WebMiddleware = async function skip() {
      return null;
    };
    const app = composeWebHandlers(handler);
    const res = await app(new Request("http://localhost/"));
    expect(res.status).toBe(404);
  });

  it("falls through to the second handler when the first returns null", async () => {
    const first: WebMiddleware = async function skip() {
      return null;
    };
    const second: WebMiddleware = async function handle() {
      return new Response("from second", { status: 200 });
    };
    const app = composeWebHandlers(first, second);
    const res = await app(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("from second");
  });

  it("returns 404 when all handlers return null", async () => {
    const a: WebMiddleware = async function skipA() {
      return null;
    };
    const b: WebMiddleware = async function skipB() {
      return null;
    };
    const c: WebMiddleware = async function skipC() {
      return null;
    };
    const app = composeWebHandlers(a, b, c);
    const res = await app(new Request("http://localhost/"));
    expect(res.status).toBe(404);
  });

  it("uses the first matching handler and skips the rest", async () => {
    let secondCalled = false;
    const first: WebMiddleware = async function handle() {
      return new Response("from first");
    };
    const second: WebMiddleware = async function track() {
      secondCalled = true;
      return new Response("from second");
    };
    const app = composeWebHandlers(first, second);
    const res = await app(new Request("http://localhost/"));
    expect(await res.text()).toBe("from first");
    expect(secondCalled).toBe(false);
  });

  it("does not fall through when a handler returns an error response", async () => {
    let secondCalled = false;
    const first: WebMiddleware = async function forbidden() {
      return new Response("Forbidden", { status: 403 });
    };
    const second: WebMiddleware = async function track() {
      secondCalled = true;
      return new Response("ok");
    };
    const app = composeWebHandlers(first, second);
    const res = await app(new Request("http://localhost/"));
    expect(res.status).toBe(403);
    expect(secondCalled).toBe(false);
  });

  it("passes the request through to each handler", async () => {
    const first: WebMiddleware = async function onlyTs(req) {
      if (new URL(req.url).pathname.endsWith(".ts")) {
        return new Response("typescript");
      }
      return null;
    };
    const second: WebMiddleware = async function catchAll() {
      return new Response("static");
    };
    const app = composeWebHandlers(first, second);

    const tsRes = await app(new Request("http://localhost/app.ts"));
    expect(await tsRes.text()).toBe("typescript");

    const otherRes = await app(new Request("http://localhost/style.css"));
    expect(await otherRes.text()).toBe("static");
  });
});
