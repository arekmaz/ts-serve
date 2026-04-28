import { Effect, Layer, Option, pipe, ServiceMap } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { AccountsRepo } from "./Accounts/AccountsRepo.ts";
import { UsersRepo } from "./Accounts/UsersRepo.ts";
import type { AccessToken } from "./Domain/AccessToken.ts";
import { accessTokenFromString } from "./Domain/AccessToken.ts";
import { Account } from "./Domain/Account.ts";
import { policyRequire } from "./Domain/Policy.ts";
import type { UserId } from "./Domain/User.ts";
import { User, UserNotFound, UserWithSensitive } from "./Domain/User.ts";
import { SqlLive, SqlTest } from "./Sql.ts";
import { Uuid } from "./Uuid.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const accountRepo = yield* AccountsRepo;
  const userRepo = yield* UsersRepo;
  const uuid = yield* Uuid;

  const createUser = (user: typeof User.jsonCreate.Type) =>
    accountRepo.insert(Account.insert.makeUnsafe({})).pipe(
      Effect.tap((account) => Effect.annotateCurrentSpan("account", account)),
      Effect.bindTo("account"),
      Effect.bind("accessToken", () =>
        uuid.generate.pipe(Effect.map(accessTokenFromString)),
      ),
      Effect.bind("user", ({ accessToken, account }) =>
        userRepo.insert(
          User.insert.makeUnsafe({
            ...user,
            accountId: account.id,
            accessToken,
          }),
        ),
      ),
      Effect.map(
        ({ account, user }) =>
          new UserWithSensitive({
            ...user,
            account,
          }),
      ),
      sql.withTransaction,
      Effect.orDie,
      Effect.withSpan("Accounts.createUser", { attributes: { user } }),
      policyRequire("User", "create"),
    );

  const updateUser = (id: UserId, user: Partial<typeof User.jsonUpdate.Type>) =>
    userRepo.findById(id).pipe(
      Effect.flatMap((option) =>
        Option.match(option, {
          onNone: () => Effect.fail(new UserNotFound({ id })),
          onSome: Effect.succeed,
        }),
      ),
      Effect.andThen((previous) =>
        userRepo.update(
          User.update.makeUnsafe({
            ...previous,
            ...user,
            id,
            updatedAt: undefined,
          }),
        ),
      ),
      sql.withTransaction,
      Effect.catchTag("SqlError", (err) => Effect.die(err)),
      Effect.catchTag("SchemaError", (err) => Effect.die(err)),
      Effect.withSpan("Accounts.updateUser", { attributes: { id, user } }),
      policyRequire("User", "update"),
    );

  const findUserByAccessToken = (apiKey: AccessToken) =>
    pipe(
      userRepo.findByAccessToken(apiKey),
      Effect.withSpan("Accounts.findUserByAccessToken"),
      policyRequire("User", "read"),
    );

  const findUserById = (id: UserId) =>
    pipe(
      userRepo.findById(id),
      Effect.withSpan("Accounts.findUserById", {
        attributes: { id },
      }),
      policyRequire("User", "read"),
    );

  const embellishUser = (user: User) =>
    pipe(
      accountRepo.findById(user.accountId),
      Effect.orDie,
      Effect.flatMap((option) =>
        Option.match(option, {
          onNone: () => Effect.die(`Account not found: ${user.accountId}`),
          onSome: (account) =>
            Effect.succeed(new UserWithSensitive({ ...user, account })),
        }),
      ),
      Effect.withSpan("Accounts.embellishUser", {
        attributes: { id: user.id },
      }),
      policyRequire("User", "readSensitive"),
    );

  return {
    createUser,
    updateUser,
    findUserByAccessToken,
    findUserById,
    embellishUser,
  } as const;
});

export class Accounts extends ServiceMap.Service<Accounts>()("Accounts", {
  make,
}) {
  static layer = Layer.effect(Accounts)(make).pipe(
    Layer.provide(
      Layer.mergeAll(SqlLive, AccountsRepo.layer, UsersRepo.layer, Uuid.layer),
    ),
  );

  static Test = Layer.effect(Accounts)(make).pipe(
    Layer.provide(Layer.mergeAll(SqlTest, Uuid.Test)),
  );
}
