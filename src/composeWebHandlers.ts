export type WebMiddleware = (request: Request) => Promise<Response | null>;

export function composeWebHandlers(
  ...handlers: ReadonlyArray<WebMiddleware>
): (request: Request) => Promise<Response> {
  return async function handleRequest(request: Request): Promise<Response> {
    for (const handler of handlers) {
      const response = await handler(request);
      if (response !== null) {
        return response;
      }
    }
    return new Response("Not Found", { status: 404 });
  };
}
