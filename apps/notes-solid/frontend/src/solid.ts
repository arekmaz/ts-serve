export {
  createSignal,
  createMemo,
  createEffect,
  onCleanup,
  For,
  Switch,
  Match,
  Show,
} from "solid-js";
export { render, insert } from "solid-js/web";
import h from "solid-js/h";
import htm from "htm";
export const html = htm.bind(h);
export {
  QueryClient,
  QueryClientProvider,
  createQuery,
  createMutation,
} from "@tanstack/solid-query";
