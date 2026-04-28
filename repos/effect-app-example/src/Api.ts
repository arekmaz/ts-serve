import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { AccountsApi } from "./Accounts/Api.ts";
import { GroupsApi } from "./Groups/Api.ts";
import { PeopleApi } from "./People/Api.ts";

export class Api extends HttpApi.make("api")
  .add(AccountsApi)
  .add(GroupsApi)
  .add(PeopleApi)
  .annotate(OpenApi.Title, "Groups API") {}
