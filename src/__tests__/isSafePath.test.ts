import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSafePath } from "../isSafePath.ts";

describe("isSafePath", () => {
  it("accepts a path within the root", () => {
    assert.strictEqual(isSafePath("/srv/www", "/srv/www/index.html"), true);
  });

  it("accepts a nested path within the root", () => {
    assert.strictEqual(isSafePath("/srv/www", "/srv/www/assets/style.css"), true);
  });

  it("rejects a path that traverses above the root", () => {
    assert.strictEqual(isSafePath("/srv/www", "/srv/etc/passwd"), false);
  });

  it("rejects a path with .. segments", () => {
    assert.strictEqual(isSafePath("/srv/www", "/srv/www/../etc/passwd"), false);
  });

  it("accepts the root directory itself", () => {
    assert.strictEqual(isSafePath("/srv/www", "/srv/www"), true);
  });

  it("rejects a path that is a sibling prefix", () => {
    assert.strictEqual(isSafePath("/srv/www", "/srv/www-other/file.txt"), false);
  });
});
