import { Model } from "effect/unstable/schema";
import { Schema } from "effect";
import { AccountId } from "./Account.ts";

export const GroupId = Schema.Number.pipe(Schema.brand("GroupId"));
export type GroupId = typeof GroupId.Type;

export const GroupIdFromString = Schema.NumberFromString.pipe(
  Schema.decodeTo(GroupId),
);

export class Group extends Model.Class<Group>("Group")({
  id: Model.Generated(GroupId),
  ownerId: Model.GeneratedByApp(AccountId),
  name: Schema.Trimmed.pipe(Schema.check(Schema.isNonEmpty())),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

export class GroupNotFound extends Schema.TaggedErrorClass<GroupNotFound>()(
  "GroupNotFound",
  { id: GroupId },
) {}
