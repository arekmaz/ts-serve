import type { IncomingMessage, ServerResponse } from "node:http";

type WebHandler = (request: Request) => Promise<Response>;

type RequestInitWithDuplex = RequestInit & { duplex?: "half" };

export function nodeFromWebHandler(
  handler: WebHandler,
): (req: IncomingMessage, res: ServerResponse) => void {
  return function handleNodeRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): void {
    const url = new URL(
      req.url ?? "/",
      `http://${req.headers.host ?? "localhost"}`,
    );

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        for (const v of value) {
          headers.append(key, v);
        }
        continue;
      }
      headers.set(key, value);
    }

    const method = req.method ?? "GET";
    const hasBody = method !== "GET" && method !== "HEAD";

    const abortController = new AbortController();
    req.on("close", function onClose(): void {
      abortController.abort();
    });

    const body = hasBody ? readBody(req) : null;

    const init: RequestInitWithDuplex = {
      method,
      headers,
      body,
      duplex: hasBody ? "half" : undefined,
      signal: abortController.signal,
    };
    const request = new Request(url, init);

    handler(request).then(
      function onResponse(response: Response): void {
        writeResponse(res, response);
      },
      function onError(): void {
        if (!res.headersSent) {
          res.writeHead(500, { "content-type": "text/plain" });
        }
        res.end("Internal Server Error");
      },
    );
  };
}

function readBody(req: IncomingMessage): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller: ReadableStreamDefaultController<Uint8Array>): void {
      req.on("data", function onData(chunk: Buffer): void {
        controller.enqueue(new Uint8Array(chunk));
      });
      req.on("end", function onEnd(): void {
        controller.close();
      });
      req.on("error", function onError(err: Error): void {
        controller.error(err);
      });
    },
  });
}

function writeResponse(res: ServerResponse, response: Response): void {
  const headers: Record<string, string | Array<string>> = {};
  response.headers.forEach(function collectHeader(
    value: string,
    key: string,
  ): void {
    if (key === "set-cookie") {
      return;
    }
    const existing = headers[key];
    if (existing === undefined) {
      headers[key] = value;
      return;
    }
    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }
    headers[key] = [existing, value];
  });

  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) {
    headers["set-cookie"] = cookies;
  }

  res.writeHead(response.status, headers);

  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();
  pump();

  function pump(): void {
    reader.read().then(
      function onRead({ done, value }): void {
        if (done) {
          res.end();
          return;
        }
        if (!res.write(value)) {
          res.once("drain", pump);
          return;
        }
        pump();
      },
      function onError(): void {
        res.end();
      },
    );
  }
}
