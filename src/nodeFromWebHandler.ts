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
    const body = hasBody ? readBody(req) : null;

    const init: RequestInitWithDuplex = {
      method,
      headers,
      body,
      duplex: hasBody ? "half" : undefined,
    };
    const request = new Request(url, init);

    handler(request).then(
      function onResponse(response: Response): void {
        writeResponse(res, response);
      },
      function onError(): void {
        res.writeHead(500, { "content-type": "text/plain" });
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
        res.write(value, pump);
      },
      function onError(): void {
        res.end();
      },
    );
  }
}
