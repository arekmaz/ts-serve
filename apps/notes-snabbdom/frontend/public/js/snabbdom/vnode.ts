import type { Hooks } from "./hooks.ts";
import type { AttachData } from "./helpers/attachto.ts";
import type { VNodeStyle } from "./modules/style.ts";
import type { On } from "./modules/eventlisteners.ts";
import type { Attrs } from "./modules/attributes.ts";
import type { Classes } from "./modules/class.ts";
import type { Props } from "./modules/props.ts";
import type { Dataset } from "./modules/dataset.ts";

export type Key = PropertyKey;

export interface VNode {
  sel: string | undefined;
  data: VNodeData | undefined;
  children: Array<VNode | string> | undefined;
  elm: Node | undefined;
  text: string | undefined;
  key: Key | undefined;
}

export interface VNodeData<VNodeProps = Props> {
  props?: VNodeProps;
  attrs?: Attrs;
  class?: Classes;
  style?: VNodeStyle;
  dataset?: Dataset;
  on?: On;
  attachData?: AttachData;
  hook?: Hooks;
  key?: Key;
  ns?: string; // for SVGs
  fn?: () => VNode; // for thunks
  args?: any[]; // for thunks
  is?: string; // for custom elements v1
  [key: string]: any; // for any other 3rd party module
}

export function vnode(
  sel: string | undefined,
  data: any | undefined,
  children: Array<VNode | string> | undefined,
  text: string | undefined,
  elm: Element | DocumentFragment | Text | undefined
): VNode {
  const key = data === undefined ? undefined : data.key;
  return { sel, data, children, text, elm, key };
}
