import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { eraseTsTypes } from "./eraseTsTypes.ts";
import { isSafePath } from "./isSafePath.ts";

type TsServeCacheEntry = { source: string; erased: string };

export type TsServeCache = {
  get(key: string): TsServeCacheEntry | undefined;
  set(key: string, value: TsServeCacheEntry): void;
};

type TsServeOptions = {
  root: string;
  cache?: TsServeCache;
};

export function createTsServeHandler(
  options: TsServeOptions,
): (request: Request) => Promise<Response | null> {
  const root = resolve(options.root);
  const cache = options.cache;

  return async function serveTsFile(
    request: Request,
  ): Promise<Response | null> {
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const filePath = resolve(root, "." + pathname);

    if (!isSafePath(root, filePath)) {
      return new Response("Forbidden", { status: 403 });
    }

    if (!filePath.endsWith(".ts")) {
      return null;
    }

    let source: string;
    try {
      source = await readFile(filePath, "utf-8");
    } catch {
      return new Response("Not Found", { status: 404 });
    }

    const cached = cache?.get(filePath);
    if (cached && cached.source === source) {
      return new Response(cached.erased, {
        headers: { "content-type": "application/javascript; charset=utf-8" },
      });
    }

    const erased = eraseTsTypes(source);
    cache?.set(filePath, { source, erased });
    return new Response(erased, {
      headers: { "content-type": "application/javascript; charset=utf-8" },
    });
  };
}
