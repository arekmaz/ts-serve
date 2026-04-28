import { describe, it, expect } from "vitest";
import { createStaticHandler } from "../webStaticHandler.ts";

const root = new URL("../../", import.meta.url).pathname;

function request(path: string): Request {
  return new Request(`http://localhost${path}`);
}

describe("createStaticHandler", () => {
  it("serves a static file with correct content-type", async () => {
    const handler = createStaticHandler(root);
    const res = await handler(request("/package.json"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    expect(res!.headers.get("content-type")).toBe("application/json; charset=utf-8");
    const body = await res!.text();
    expect(body).toContain('"name": "ts-serve"');
  });

  it("returns null for missing files", async () => {
    const handler = createStaticHandler(root);
    const res = await handler(request("/nonexistent.txt"));
    expect(res).toBeNull();
  });

  it("returns null for files that do not exist", async () => {
    const handler = createStaticHandler(root + "src");
    const res = await handler(request("/does-not-exist.css"));
    expect(res).toBeNull();
  });

  it("serves / as index.html", async () => {
    const handler = createStaticHandler(root + "apps/todos/frontend");
    const res = await handler(request("/"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    expect(res!.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });

  it("falls back to application/octet-stream for unknown extensions", async () => {
    const handler = createStaticHandler(root);
    const res = await handler(request("/.gitignore"));
    expect(res).not.toBeNull();
    expect(res!.headers.get("content-type")).toBe("application/octet-stream");
  });

  it("handles percent-encoded paths", async () => {
    const handler = createStaticHandler(root);
    const res = await handler(request("/package.json"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
  });
});
