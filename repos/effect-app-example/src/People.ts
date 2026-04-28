import { SqlClient } from "effect/unstable/sql";
import { Effect, Layer, Option, pipe, ServiceMap } from "effect";
import type { GroupId } from "./Domain/Group.ts";
import type { PersonId } from "./Domain/Person.ts";
import { Person, PersonNotFound } from "./Domain/Person.ts";
import { policyRequire } from "./Domain/Policy.ts";
import { PeopleRepo } from "./People/Repo.ts";
import { SqlLive } from "./Sql.ts";

const make = Effect.gen(function* () {
  const repo = yield* PeopleRepo;
  const sql = yield* SqlClient.SqlClient;

  const create = (groupId: GroupId, person: typeof Person.jsonCreate.Type) =>
    pipe(
      repo.insert(
        Person.insert.makeUnsafe({
          ...person,
          groupId,
        }),
      ),
      sql.withTransaction,
      Effect.orDie,
      Effect.withSpan("People.create", { attributes: { person, groupId } }),
      policyRequire("Person", "create"),
    );

  const findById = (id: PersonId) =>
    pipe(
      repo.findById(id),
      Effect.withSpan("People.findById", { attributes: { id } }),
      policyRequire("Person", "read"),
    );

  const with_ = <B, E, R>(
    id: PersonId,
    f: (person: Person) => Effect.Effect<B, E, R>,
  ): Effect.Effect<B, E | PersonNotFound, R> =>
    pipe(
      repo.findById(id),
      Effect.flatMap((option) =>
        Option.match(option, {
          onNone: () => Effect.fail(new PersonNotFound({ id })),
          onSome: Effect.succeed,
        }),
      ),
      Effect.flatMap(f),
      sql.withTransaction,
      Effect.catchTag("SqlError", (e) => Effect.die(e)),
      Effect.withSpan("People.with", { attributes: { id } }),
    );

  return { create, findById, with: with_ } as const;
});

export class People extends ServiceMap.Service<People>()("People", {
  make,
}) {
  static layer = Layer.effect(People)(make).pipe(
    Layer.provide(Layer.mergeAll(SqlLive, PeopleRepo.layer)),
  );
}
