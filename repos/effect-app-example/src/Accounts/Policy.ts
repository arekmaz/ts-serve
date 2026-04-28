import { Effect, Layer, ServiceMap } from "effect";
import { policy } from "../Domain/Policy.ts";
import type { UserId } from "../Domain/User.ts";

const make = Effect.gen(function* () {
  const canUpdate = (toUpdate: UserId) =>
    policy("User", "update", (actor) => Effect.succeed(actor.id === toUpdate));

  const canRead = (toRead: UserId) =>
    policy("User", "read", (actor) => Effect.succeed(actor.id === toRead));

  const canReadSensitive = (toRead: UserId) =>
    policy("User", "readSensitive", (actor) =>
      Effect.succeed(actor.id === toRead),
    );

  return { canUpdate, canRead, canReadSensitive } as const;
});

export class AccountsPolicy extends ServiceMap.Service<AccountsPolicy>()(
  "Accounts/Policy",
  {
    make,
  },
) {
  static layer = Layer.effect(AccountsPolicy)(make);
}
