import { readFile } from "node:fs/promises"
import { resolve, relative } from "node:path"
import { eraseTypes } from "./eraser.ts"

type HandlerOptions = {
  root: string
}

export function createHandler(options: HandlerOptions): (request: Request) => Promise<Response> {
  const root = resolve(options.root)

  return async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url, "http://localhost")
    const pathname = decodeURIComponent(url.pathname)
    const filePath = resolve(root, "." + pathname)
    const rel = relative(root, filePath)

    if (rel.startsWith("..") || resolve(root, rel) !== filePath) {
      return new Response("Forbidden", { status: 403 })
    }

    if (!filePath.endsWith(".ts")) {
      return new Response("Not Found", { status: 404 })
    }

    let source: string
    try {
      source = await readFile(filePath, "utf-8")
    } catch {
      return new Response("Not Found", { status: 404 })
    }

    const erased = eraseTypes(source)
    return new Response(erased, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
      },
    })
  }
}
