import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpServerRequest } from "effect/unstable/http";
import { Effect, Layer, Option, pipe } from "effect";
import { UsersRepo } from "../Accounts/UsersRepo.ts";
import { accessTokenFromString } from "../Domain/AccessToken.ts";
import { Unauthorized } from "../Domain/Policy.ts";
import { policyUse } from "../Domain/Policy.ts";
import { CurrentUser, UserId } from "../Domain/User.ts";
import { Api } from "../Api.ts";
import { Groups } from "../Groups.ts";
import { GroupsPolicy } from "./Policy.ts";

export const HttpGroupsLive = HttpApiBuilder.group(Api, "groups", (handlers) =>
  Effect.gen(function* () {
    const groups = yield* Groups;
    const policy = yield* GroupsPolicy;
    const userRepo = yield* UsersRepo;

    function provideCurrentUser<A, E, R>(
      effect: Effect.Effect<A, E, R | CurrentUser>,
    ): Effect.Effect<
      A,
      E | Unauthorized,
      Exclude<R, CurrentUser> | HttpServerRequest.HttpServerRequest
    > {
      return Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const tokenCookie = request.cookies["token"];

        if (!tokenCookie) {
          return yield* Effect.fail(
            new Unauthorized({
              actorId: -1 as UserId,
              entity: "User",
              action: "read",
            }),
          );
        }

        const unauthorizedError = new Unauthorized({
          actorId: -1 as UserId,
          entity: "User",
          action: "read",
        });

        const userOption = yield* pipe(
          userRepo.findByAccessToken(accessTokenFromString(tokenCookie)),
          Effect.orDie,
          Effect.withSpan("Authentication.cookie"),
        );

        const user = Option.match(userOption, {
          onNone: () => unauthorizedError,
          onSome: (u) => u,
        });

        if (user instanceof Unauthorized) {
          return yield* Effect.fail(user);
        }

        return yield* pipe(effect, Effect.provideService(CurrentUser, user));
      });
    }

    return handlers
      .handle("create", ({ payload }) =>
        provideCurrentUser(
          Effect.gen(function* () {
            const user = yield* CurrentUser;
            return yield* pipe(
              groups.create(user.accountId, payload),
              policyUse(policy.canCreate(payload)),
            );
          }),
        ),
      )
      .handle("update", ({ params, payload }) =>
        provideCurrentUser(
          groups.with(params.id, (group) =>
            pipe(
              groups.update(group, payload),
              policyUse(policy.canUpdate(group)),
            ),
          ),
        ),
      );
  }),
).pipe(
  Layer.provide(Groups.layer),
  Layer.provide(GroupsPolicy.layer),
  Layer.provide(UsersRepo.layer),
);
