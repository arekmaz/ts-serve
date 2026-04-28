import { Model } from "effect/unstable/schema";
import { Schema, ServiceMap } from "effect";
import { AccessToken } from "./AccessToken.ts";
import { Account, AccountId } from "./Account.ts";
import { Email } from "./Email.ts";

export const UserId = Schema.Number.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const UserIdFromString = Schema.NumberFromString.pipe(
  Schema.decodeTo(UserId),
);

export class User extends Model.Class<User>("User")({
  id: Model.Generated(UserId),
  accountId: Model.GeneratedByApp(AccountId),
  email: Email,
  accessToken: Model.Sensitive(AccessToken),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

export class UserWithSensitive extends Model.Class<UserWithSensitive>(
  "UserWithSensitive",
)({
  ...Model.fields(User),
  accessToken: AccessToken,
  account: Account,
}) {}

export class CurrentUser extends ServiceMap.Service<CurrentUser, User>()(
  "Domain/User/CurrentUser",
) {}

export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { id: UserId },
) {}
