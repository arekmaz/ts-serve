import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStaticHandler } from "../webStaticHandler.ts";

const root = new URL("../../", import.meta.url).pathname;

function request(path: string): Request {
  return new Request(`http://localhost${path}`);
}

describe("createStaticHandler", () => {
  it("serves a static file with correct content-type", async () => {
    const handler = createStaticHandler(root);
    const res = await handler(request("/package.json"));
    assert.notStrictEqual(res, null);
    assert.strictEqual(res!.status, 200);
    assert.strictEqual(res!.headers.get("content-type"), "application/json; charset=utf-8");
    const body = await res!.text();
    assert.ok(body.includes('"name": "ts-serve"'));
  });

  it("returns null for missing files", async () => {
    const handler = createStaticHandler(root);
    const res = await handler(request("/nonexistent.txt"));
    assert.strictEqual(res, null);
  });

  it("returns null for files that do not exist", async () => {
    const handler = createStaticHandler(root + "src");
    const res = await handler(request("/does-not-exist.css"));
    assert.strictEqual(res, null);
  });

  it("serves / as index.html", async () => {
    const handler = createStaticHandler(root + "apps/todos/frontend");
    const res = await handler(request("/"));
    assert.notStrictEqual(res, null);
    assert.strictEqual(res!.status, 200);
    assert.strictEqual(res!.headers.get("content-type"), "text/html; charset=utf-8");
  });

  it("falls back to application/octet-stream for unknown extensions", async () => {
    const handler = createStaticHandler(root);
    const res = await handler(request("/.gitignore"));
    assert.notStrictEqual(res, null);
    assert.strictEqual(res!.headers.get("content-type"), "application/octet-stream");
  });

  it("handles percent-encoded paths", async () => {
    const handler = createStaticHandler(root);
    const res = await handler(request("/package.json"));
    assert.notStrictEqual(res, null);
    assert.strictEqual(res!.status, 200);
  });
});
