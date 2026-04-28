import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpServerRequest } from "effect/unstable/http";
import { Effect, Layer, Option, pipe } from "effect";
import { Accounts } from "../Accounts.ts";
import { Api } from "../Api.ts";
import { accessTokenFromString } from "../Domain/AccessToken.ts";
import { policyUse, Unauthorized, withSystemActor } from "../Domain/Policy.ts";
import { CurrentUser, UserId, UserNotFound } from "../Domain/User.ts";
import { AuthCookieSecurity } from "./Api.ts";
import { AccountsPolicy } from "./Policy.ts";
import { UsersRepo } from "./UsersRepo.ts";

export const HttpAccountsLive = HttpApiBuilder.group(
  Api,
  "accounts",
  (handlers) =>
    Effect.gen(function* () {
      const accounts = yield* Accounts;
      const policy = yield* AccountsPolicy;
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
        .handle("updateUser", ({ params, payload }) =>
          provideCurrentUser(
            pipe(
              accounts.updateUser(params.id, payload),
              policyUse(policy.canUpdate(params.id)),
            ),
          ),
        )
        .handle("getUserMe", () =>
          provideCurrentUser(
            Effect.gen(function* () {
              const user = yield* CurrentUser;
              return yield* pipe(accounts.embellishUser(user), withSystemActor);
            }),
          ),
        )
        .handle("getUser", ({ params }) =>
          provideCurrentUser(
            pipe(
              accounts.findUserById(params.id),
              Effect.flatMap((option) =>
                Option.match(option, {
                  onNone: () =>
                    Effect.fail(new UserNotFound({ id: params.id })),
                  onSome: Effect.succeed,
                }),
              ),
              policyUse(policy.canRead(params.id)),
            ),
          ),
        )
        .handle("createUser", ({ payload }) =>
          accounts.createUser(payload).pipe(
            withSystemActor,
            Effect.tap((user) =>
              HttpApiBuilder.securitySetCookie(
                AuthCookieSecurity,
                user.accessToken,
              ),
            ),
          ),
        );
    }),
).pipe(
  Layer.provide(Accounts.layer),
  Layer.provide(AccountsPolicy.layer),
  Layer.provide(UsersRepo.layer),
);
