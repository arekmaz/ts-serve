import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import { Unauthorized } from "../Domain/Policy.ts";
import { GroupIdFromString, GroupNotFound } from "../Domain/Group.ts";
import {
  Person,
  PersonIdFromString,
  PersonNotFound,
} from "../Domain/Person.ts";

export class PeopleApi extends HttpApiGroup.make("people")
  .prefix("/people")
  .add(
    HttpApiEndpoint.post("create", "/groups/:groupId/people", {
      params: { groupId: GroupIdFromString },
      success: Person.json,
      payload: Person.jsonCreate,
      error: [GroupNotFound, Unauthorized],
    }),
  )
  .add(
    HttpApiEndpoint.get("findById", "/people/:id", {
      params: { id: PersonIdFromString },
      success: Person.json,
      error: [PersonNotFound, Unauthorized],
    }),
  )
  .annotate(OpenApi.Title, "People")
  .annotate(OpenApi.Description, "Manage people") {}
