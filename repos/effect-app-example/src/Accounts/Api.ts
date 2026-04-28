import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSecurity,
  OpenApi,
} from "effect/unstable/httpapi";
import { Unauthorized } from "../Domain/Policy.ts";
import {
  User,
  UserIdFromString,
  UserNotFound,
  UserWithSensitive,
} from "../Domain/User.ts";

export class AccountsApi extends HttpApiGroup.make("accounts")
  .add(
    HttpApiEndpoint.patch("updateUser", "/users/:id", {
      params: { id: UserIdFromString },
      success: User.json,
      error: [UserNotFound, Unauthorized],
      payload: User.jsonUpdate,
    }),
  )
  .add(
    HttpApiEndpoint.get("getUserMe", "/users/me", {
      success: UserWithSensitive.json,
      error: Unauthorized,
    }),
  )
  .add(
    HttpApiEndpoint.get("getUser", "/users/:id", {
      params: { id: UserIdFromString },
      success: User.json,
      error: [UserNotFound, Unauthorized],
    }),
  )
  .add(
    HttpApiEndpoint.post("createUser", "/users", {
      success: UserWithSensitive.json,
      payload: User.jsonCreate,
    }),
  )
  .annotate(OpenApi.Title, "Accounts")
  .annotate(OpenApi.Description, "Manage user accounts") {}

export const AuthCookieSecurity = HttpApiSecurity.apiKey({
  in: "cookie",
  key: "token",
});
