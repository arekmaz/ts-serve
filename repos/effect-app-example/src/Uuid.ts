import { Effect, Layer, ServiceMap } from "effect";
import { randomUUID } from "node:crypto";

const make = Effect.sync(() => {
  return {
    generate: Effect.sync(() => randomUUID()),
  } as const;
});

export class Uuid extends ServiceMap.Service<Uuid>()("Uuid", {
  make,
}) {
  static layer = Layer.effect(Uuid)(make);

  static Test = Layer.succeed(Uuid, {
    generate: Effect.succeed("test-uuid-d-d-d" as const),
  });
}
