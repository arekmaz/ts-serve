import { describe, it, expect } from "vitest";
import { isSafePath } from "../isSafePath.ts";

describe("isSafePath", () => {
  it("accepts a path within the root", () => {
    expect(isSafePath("/srv/www", "/srv/www/index.html")).toBe(true);
  });

  it("accepts a nested path within the root", () => {
    expect(isSafePath("/srv/www", "/srv/www/assets/style.css")).toBe(true);
  });

  it("rejects a path that traverses above the root", () => {
    expect(isSafePath("/srv/www", "/srv/etc/passwd")).toBe(false);
  });

  it("rejects a path with .. segments", () => {
    expect(isSafePath("/srv/www", "/srv/www/../etc/passwd")).toBe(false);
  });

  it("accepts the root directory itself", () => {
    expect(isSafePath("/srv/www", "/srv/www")).toBe(true);
  });

  it("rejects a path that is a sibling prefix", () => {
    expect(isSafePath("/srv/www", "/srv/www-other/file.txt")).toBe(false);
  });
});
