import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTsServeHandler } from "../tsServeHandler.ts";
import type { TsServeCache } from "../tsServeHandler.ts";

const root = new URL("../../", import.meta.url).pathname;

function request(path: string): Request {
  return new Request(`http://localhost${path}`);
}

describe("createTsServeHandler", () => {
  it("serves a .ts file with types erased", async () => {
    const handler = createTsServeHandler({ root: root + "src" });
    const res = await handler(request("/isSafePath.ts"));
    assert.notStrictEqual(res, null);
    assert.strictEqual(res!.status, 200);
    assert.strictEqual(
      res!.headers.get("content-type"),
      "application/javascript; charset=utf-8",
    );
    const body = await res!.text();
    assert.ok(!body.includes(": boolean"));
    assert.ok(body.includes("function isSafePath"));
  });

  it("returns null for non-.ts files", async () => {
    const handler = createTsServeHandler({ root });
    const res = await handler(request("/package.json"));
    assert.strictEqual(res, null);
  });

  it("returns 404 for missing .ts files", async () => {
    const handler = createTsServeHandler({ root });
    const res = await handler(request("/nonexistent.ts"));
    assert.notStrictEqual(res, null);
    assert.strictEqual(res!.status, 404);
  });

  it("returns null for paths outside the root", async () => {
    const handler = createTsServeHandler({ root: root + "src" });
    const res = await handler(request("/nonexistent-dir/file.html"));
    assert.strictEqual(res, null);
  });

  it("uses cache on second request with same source", async () => {
    const store = new Map<string, { source: string; erased: string }>();
    const cache: TsServeCache = {
      get(key) {
        return store.get(key);
      },
      set(key, value) {
        store.set(key, value);
      },
    };
    const handler = createTsServeHandler({ root: root + "src", cache });

    const first = await handler(request("/isSafePath.ts"));
    assert.notStrictEqual(first, null);
    assert.strictEqual(store.size, 1);

    const second = await handler(request("/isSafePath.ts"));
    assert.notStrictEqual(second, null);
    const firstBody = await first!.text();
    const secondBody = await second!.text();
    assert.strictEqual(firstBody, secondBody);
  });
});
