import { Model } from "effect/unstable/schema";
import { Schema } from "effect";
import { GroupId } from "./Group.ts";

export const PersonId = Schema.Number.pipe(Schema.brand("PersonId"));
export type PersonId = typeof PersonId.Type;

export const PersonIdFromString = Schema.NumberFromString.pipe(
  Schema.decodeTo(PersonId),
);

export class Person extends Model.Class<Person>("Person")({
  id: Model.Generated(PersonId),
  groupId: Model.GeneratedByApp(GroupId),
  firstName: Schema.Trimmed.pipe(Schema.check(Schema.isNonEmpty())),
  lastName: Schema.Trimmed.pipe(Schema.check(Schema.isNonEmpty())),
  dateOfBirth: Model.FieldOption(Model.Date),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

export class PersonNotFound extends Schema.TaggedErrorClass<PersonNotFound>()(
  "PersonNotFound",
  {
    id: PersonId,
  },
) {}
