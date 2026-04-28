import { NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpLive } from "./Http.ts";
import { TracingLive } from "./Tracing.ts";

const MainLayer = Layer.provide(HttpLive, TracingLive);

const program = Layer.launch(MainLayer).pipe(Effect.orDie);

NodeRuntime.runMain(program);
