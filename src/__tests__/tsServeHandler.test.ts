import { describe, it, expect } from "vitest";
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
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    expect(res!.headers.get("content-type")).toBe(
      "application/javascript; charset=utf-8",
    );
    const body = await res!.text();
    expect(body).not.toContain(": boolean");
    expect(body).toContain("function isSafePath");
  });

  it("returns null for non-.ts files", async () => {
    const handler = createTsServeHandler({ root });
    const res = await handler(request("/package.json"));
    expect(res).toBeNull();
  });

  it("returns 404 for missing .ts files", async () => {
    const handler = createTsServeHandler({ root });
    const res = await handler(request("/nonexistent.ts"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(404);
  });

  it("returns null for paths outside the root", async () => {
    const handler = createTsServeHandler({ root: root + "src" });
    const res = await handler(request("/nonexistent-dir/file.html"));
    expect(res).toBeNull();
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
    expect(first).not.toBeNull();
    expect(store.size).toBe(1);

    const second = await handler(request("/isSafePath.ts"));
    expect(second).not.toBeNull();
    const firstBody = await first!.text();
    const secondBody = await second!.text();
    expect(firstBody).toBe(secondBody);
  });
});
