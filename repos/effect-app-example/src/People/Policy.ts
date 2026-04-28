import { Effect, Layer, pipe, ServiceMap } from "effect";
import type { GroupId } from "../Domain/Group.ts";
import type { Person, PersonId } from "../Domain/Person.ts";
import { policy, policyCompose, Unauthorized } from "../Domain/Policy.ts";
import { Groups } from "../Groups.ts";
import { GroupsPolicy } from "../Groups/Policy.ts";
import { People } from "../People.ts";

const make = Effect.gen(function* () {
  const groupsPolicy = yield* GroupsPolicy;
  const groups = yield* Groups;
  const people = yield* People;

  const canCreate = (
    groupId: GroupId,
    _person: typeof Person.jsonCreate.Type,
  ) =>
    Unauthorized.refail(
      "Person",
      "create",
    )(
      groups.with(groupId, (group) =>
        pipe(
          groupsPolicy.canUpdate(group),
          policyCompose(
            policy("Person", "create", (_actor) => Effect.succeed(true)),
          ),
        ),
      ),
    );

  const canRead = (id: PersonId) =>
    Unauthorized.refail(
      "Person",
      "read",
    )(
      people.with(id, (person) =>
        groups.with(person.groupId, (group) =>
          pipe(
            groupsPolicy.canUpdate(group),
            policyCompose(
              policy("Person", "read", (_actor) => Effect.succeed(true)),
            ),
          ),
        ),
      ),
    );

  return { canCreate, canRead } as const;
});

export class PeoplePolicy extends ServiceMap.Service<PeoplePolicy>()(
  "People/Policy",
  {
    make,
  },
) {
  static readonly layer = Layer.effect(PeoplePolicy)(make).pipe(
    Layer.provide(
      Layer.mergeAll(GroupsPolicy.layer, Groups.layer, People.layer),
    ),
  );
}
