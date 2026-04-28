import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { isSafePath } from "./isSafePath.ts";
import type { WebMiddleware } from "./composeWebHandlers.ts";

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export function createStaticHandler(root: string): WebMiddleware {
  const resolved = resolve(root);

  return async function serveStaticFile(
    request: Request,
  ): Promise<Response | null> {
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const filePath = resolve(
      resolved,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );

    if (!isSafePath(resolved, filePath)) {
      return new Response("Forbidden", { status: 403 });
    }

    let content: ArrayBuffer;
    try {
      const buf = await readFile(filePath);
      content = buf.buffer.slice(
        buf.byteOffset,
        buf.byteOffset + buf.byteLength,
      );
    } catch {
      return null;
    }

    const ext = extname(filePath);
    const contentType = contentTypes[ext] ?? "application/octet-stream";
    return new Response(content, { headers: { "content-type": contentType } });
  };
}
