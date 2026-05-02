import {
  PreHook,
  CreateHook,
  UpdateHook,
  DestroyHook,
  RemoveHook,
  PostHook
} from "../hooks.ts";

export type Module = Partial<{
  pre: PreHook;
  create: CreateHook;
  update: UpdateHook;
  destroy: DestroyHook;
  remove: RemoveHook;
  post: PostHook;
}>;
