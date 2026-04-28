import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpServerRequest } from "effect/unstable/http";
import { Effect, Layer, Option, pipe } from "effect";
import { UsersRepo } from "../Accounts/UsersRepo.ts";
import { accessTokenFromString } from "../Domain/AccessToken.ts";
import { PersonNotFound } from "../Domain/Person.ts";
import { Unauthorized, policyUse } from "../Domain/Policy.ts";
import { CurrentUser, UserId } from "../Domain/User.ts";
import { Api } from "../Api.ts";
import { Groups } from "../Groups.ts";
import { People } from "../People.ts";
import { PeoplePolicy } from "./Policy.ts";

export const HttpPeopleLive = HttpApiBuilder.group(Api, "people", (handlers) =>
  Effect.gen(function* () {
    const groups = yield* Groups;
    const people = yield* People;
    const policy = yield* PeoplePolicy;
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
      .handle("create", ({ params, payload }) =>
        provideCurrentUser(
          groups.with(params.groupId, (group) =>
            pipe(
              people.create(group.id, payload),
              policyUse(policy.canCreate(group.id, payload)),
            ),
          ),
        ),
      )
      .handle("findById", ({ params }) =>
        provideCurrentUser(
          pipe(
            people.findById(params.id),
            Effect.flatMap((option) =>
              Option.match(option, {
                onNone: () =>
                  Effect.fail(new PersonNotFound({ id: params.id })),
                onSome: Effect.succeed,
              }),
            ),
            policyUse(policy.canRead(params.id)),
          ),
        ),
      );
  }),
).pipe(
  Layer.provide(Groups.layer),
  Layer.provide(People.layer),
  Layer.provide(PeoplePolicy.layer),
  Layer.provide(UsersRepo.layer),
);
