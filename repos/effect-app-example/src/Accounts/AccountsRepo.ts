import { SqlClient, SqlModel, SqlSchema } from "effect/unstable/sql";
import { Effect, Layer, pipe, ServiceMap } from "effect";
import { Account } from "../Domain/Account.ts";
import { makeTestLayer } from "../lib/Layer.ts";
import { SqlLive } from "../Sql.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const repo = yield* SqlModel.makeRepository(Account, {
    tableName: "accounts",
    spanPrefix: "AccountsRepo",
    idColumn: "id",
  });

  const findByIdOptionSchema = SqlSchema.findOneOption({
    Request: Account.fields.id,
    Result: Account,
    execute: (id) => sql`select * from accounts where id = ${id}`,
  });

  function findById(id: typeof Account.fields.id.Type) {
    return pipe(
      findByIdOptionSchema(id),
      Effect.orDie,
      Effect.withSpan("AccountsRepo.findById", { attributes: { id } }),
    );
  }

  return {
    insert: repo.insert,
    insertVoid: repo.insertVoid,
    update: repo.update,
    updateVoid: repo.updateVoid,
    delete: repo.delete,
    findById,
  } as const;
});

export class AccountsRepo extends ServiceMap.Service<AccountsRepo>()(
  "Accounts/AccountsRepo",
  { make },
) {
  static layer = Layer.effect(AccountsRepo)(make).pipe(Layer.provide(SqlLive));
  static Test = makeTestLayer(AccountsRepo)({});
}
