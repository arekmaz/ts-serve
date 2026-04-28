import { SqlClient, SqlModel, SqlSchema } from "effect/unstable/sql";
import { Effect, Layer, pipe, ServiceMap } from "effect";
import { Group } from "../Domain/Group.ts";
import { SqlLive } from "../Sql.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const repo = yield* SqlModel.makeRepository(Group, {
    tableName: "groups",
    spanPrefix: "GroupsRepo",
    idColumn: "id",
  });

  const findByIdOptionSchema = SqlSchema.findOneOption({
    Request: Group.fields.id,
    Result: Group,
    execute: (id) => sql`select * from groups where id = ${id}`,
  });

  function findById(id: typeof Group.fields.id.Type) {
    return pipe(
      findByIdOptionSchema(id),
      Effect.orDie,
      Effect.withSpan("GroupsRepo.findById", { attributes: { id } }),
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

export class GroupsRepo extends ServiceMap.Service<GroupsRepo>()(
  "Groups/Repo",
  { make },
) {
  static layer = Layer.effect(GroupsRepo)(make).pipe(Layer.provide(SqlLive));
}
