import { SqlClient } from "effect/unstable/sql";
import { Effect, Layer, Option, pipe, ServiceMap } from "effect";
import type { AccountId } from "./Domain/Account.ts";
import type { GroupId } from "./Domain/Group.ts";
import { Group, GroupNotFound } from "./Domain/Group.ts";
import { policyRequire } from "./Domain/Policy.ts";
import { GroupsRepo } from "./Groups/Repo.ts";
import { SqlLive } from "./Sql.ts";

const make = Effect.gen(function* () {
  const repo = yield* GroupsRepo;
  const sql = yield* SqlClient.SqlClient;

  const create = (ownerId: AccountId, group: typeof Group.jsonCreate.Type) =>
    pipe(
      repo.insert(
        Group.insert.makeUnsafe({
          ...group,
          ownerId,
        }),
      ),
      sql.withTransaction,
      Effect.orDie,
      Effect.withSpan("Groups.create", { attributes: { group } }),
      policyRequire("Group", "create"),
    );

  const update = (
    group: Group,
    update: Partial<typeof Group.jsonUpdate.Type>,
  ) =>
    pipe(
      repo.update(
        Group.update.makeUnsafe({
          ...group,
          ...update,
          updatedAt: undefined,
        }),
      ),
      sql.withTransaction,
      Effect.orDie,
      Effect.withSpan("Groups.update", {
        attributes: { id: group.id, update },
      }),
      policyRequire("Group", "update"),
    );

  const findById = (id: GroupId) =>
    pipe(
      repo.findById(id),
      Effect.withSpan("Groups.findById", { attributes: { id } }),
      policyRequire("Group", "read"),
    );

  const with_ = <A, E, R>(
    id: GroupId,
    f: (group: Group) => Effect.Effect<A, E, R>,
  ): Effect.Effect<A, E | GroupNotFound, R> =>
    pipe(
      repo.findById(id),
      Effect.flatMap((option) =>
        Option.match(option, {
          onNone: () => Effect.fail(new GroupNotFound({ id })),
          onSome: Effect.succeed,
        }),
      ),
      Effect.flatMap(f),
      sql.withTransaction,
      Effect.catchTag("SqlError", (err) => Effect.die(err)),
      Effect.withSpan("Groups.with", { attributes: { id } }),
    );

  return { create, update, findById, with: with_ } as const;
});

export class Groups extends ServiceMap.Service<Groups>()("Groups", {
  make,
}) {
  static layer = Layer.effect(Groups)(make).pipe(
    Layer.provide(Layer.mergeAll(SqlLive, GroupsRepo.layer)),
  );
}
