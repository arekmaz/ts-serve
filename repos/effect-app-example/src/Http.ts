import { Layer } from "effect";
import { HttpMiddleware, HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiSwagger } from "effect/unstable/httpapi";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "http";
import { HttpAccountsLive } from "./Accounts/Http.ts";
import { Api } from "./Api.ts";
import { HttpGroupsLive } from "./Groups/Http.ts";
import { HttpPeopleLive } from "./People/Http.ts";
import { SqlLive } from "./Sql.ts";

const ApiLive = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json",
}).pipe(
  Layer.provide(HttpAccountsLive),
  Layer.provide(HttpGroupsLive),
  Layer.provide(HttpPeopleLive),
);

const SwaggerLive = HttpApiSwagger.layer(Api, { path: "/docs" });

const CorsMiddleware = HttpRouter.middleware(HttpMiddleware.cors()).layer;
const LoggerMiddleware = HttpRouter.middleware(HttpMiddleware.logger).layer;

const AppLayer = Layer.mergeAll(
  ApiLive,
  SwaggerLive,
  CorsMiddleware,
  LoggerMiddleware,
);

export const HttpLive = HttpRouter.serve(AppLayer, {
  middleware: HttpMiddleware.logger,
}).pipe(
  Layer.provide(HttpServer.layerServices),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
  Layer.provide(SqlLive),
);
