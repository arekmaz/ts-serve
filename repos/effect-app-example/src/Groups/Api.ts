import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import { Unauthorized } from "../Domain/Policy.ts";
import { Group, GroupIdFromString, GroupNotFound } from "../Domain/Group.ts";

export class GroupsApi extends HttpApiGroup.make("groups")
  .add(
    HttpApiEndpoint.post("create", "/", {
      success: Group.json,
      payload: Group.jsonCreate,
      error: Unauthorized,
    }),
  )
  .add(
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: GroupIdFromString },
      success: Group.json,
      payload: Group.jsonUpdate,
      error: [GroupNotFound, Unauthorized],
    }),
  )
  .prefix("/groups")
  .annotate(OpenApi.Title, "Groups")
  .annotate(OpenApi.Description, "Manage groups") {}
