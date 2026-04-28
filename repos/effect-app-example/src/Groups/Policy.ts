import { Effect, Layer, ServiceMap } from "effect";
import type { Group } from "../Domain/Group.ts";
import { policy } from "../Domain/Policy.ts";

const make = Effect.gen(function* () {
  const canCreate = (_group: typeof Group.jsonCreate.Type) =>
    policy("Group", "create", (_actor) => Effect.succeed(true));

  const canUpdate = (group: Group) =>
    policy("Group", "update", (actor) =>
      Effect.succeed(group.ownerId === actor.accountId),
    );

  return { canCreate, canUpdate } as const;
});

export class GroupsPolicy extends ServiceMap.Service<GroupsPolicy>()(
  "Groups/Policy",
  {
    make,
  },
) {
  static readonly layer = Layer.effect(GroupsPolicy)(make);
}
