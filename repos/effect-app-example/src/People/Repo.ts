import { SqlClient, SqlModel, SqlSchema } from "effect/unstable/sql";
import { Effect, Layer, pipe, ServiceMap } from "effect";
import { Person } from "../Domain/Person.ts";
import { SqlLive } from "../Sql.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const repo = yield* SqlModel.makeRepository(Person, {
    tableName: "people",
    spanPrefix: "PeopleRepo",
    idColumn: "id",
  });

  const findByIdOptionSchema = SqlSchema.findOneOption({
    Request: Person.fields.id,
    Result: Person,
    execute: (id) => sql`select * from people where id = ${id}`,
  });

  function findById(id: typeof Person.fields.id.Type) {
    return pipe(
      findByIdOptionSchema(id),
      Effect.orDie,
      Effect.withSpan("PeopleRepo.findById", { attributes: { id } }),
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

export class PeopleRepo extends ServiceMap.Service<PeopleRepo>()(
  "People/Repo",
  { make },
) {
  static layer = Layer.effect(PeopleRepo)(make).pipe(Layer.provide(SqlLive));
}
