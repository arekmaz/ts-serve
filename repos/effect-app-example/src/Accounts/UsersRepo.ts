import { SqlClient, SqlModel, SqlSchema } from "effect/unstable/sql";
import { Effect, Layer, pipe, ServiceMap } from "effect";
import { AccessToken } from "../Domain/AccessToken.ts";
import { User } from "../Domain/User.ts";
import { makeTestLayer } from "../lib/Layer.ts";
import { SqlLive } from "../Sql.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const repo = yield* SqlModel.makeRepository(User, {
    tableName: "users",
    spanPrefix: "UsersRepo",
    idColumn: "id",
  });

  const findByIdOptionSchema = SqlSchema.findOneOption({
    Request: User.fields.id,
    Result: User,
    execute: (id) => sql`select * from users where id = ${id}`,
  });

  const findByAccessTokenSchema = SqlSchema.findOneOption({
    Request: AccessToken,
    Result: User,
    execute: (key) => sql`select * from users where accessToken = ${key}`,
  });
  function findByAccessToken(apiKey: AccessToken) {
    return pipe(
      findByAccessTokenSchema(apiKey),
      Effect.orDie,
      Effect.withSpan("UsersRepo.findByAccessToken"),
    );
  }

  function findById(id: typeof User.fields.id.Type) {
    return pipe(
      findByIdOptionSchema(id),
      Effect.orDie,
      Effect.withSpan("UsersRepo.findById", { attributes: { id } }),
    );
  }

  return {
    insert: repo.insert,
    insertVoid: repo.insertVoid,
    update: repo.update,
    updateVoid: repo.updateVoid,
    delete: repo.delete,
    findById,
    findByAccessToken,
  } as const;
});

export class UsersRepo extends ServiceMap.Service<UsersRepo>()(
  "Accounts/UsersRepo",
  { make },
) {
  static layer = Layer.effect(UsersRepo)(make).pipe(Layer.provide(SqlLive));
  static Test = makeTestLayer(UsersRepo)({});
}
