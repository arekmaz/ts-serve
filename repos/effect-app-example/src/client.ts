import { Cookies, HttpClient } from "effect/unstable/http";
import { HttpApiClient } from "effect/unstable/httpapi";
import { NodeHttpClient, NodeRuntime } from "@effect/platform-node";
import { Effect, Ref } from "effect";
import { Api } from "./Api.ts";
import { Email } from "./Domain/Email.ts";

const program = Effect.gen(function* () {
  const cookies = yield* Ref.make(Cookies.empty);
  const client = yield* HttpApiClient.make(Api, {
    baseUrl: "http://localhost:3000",
    transformClient: HttpClient.withCookiesRef(cookies),
  });
  const user = yield* client.accounts.createUser({
    payload: {
      email: "joe2.bloggs@example.com" as Email,
    },
  });
  console.log({ user });
  const me = yield* client.accounts.getUserMe();
  console.log({ me });
});

NodeRuntime.runMain(Effect.provide(program, NodeHttpClient.layerUndici));
