// core
export { htmlDomApi } from "./htmldomapi.ts";
export { init } from "./init.ts";
export { thunk } from "./thunk.ts";
export { vnode } from "./vnode.ts";

export type { DOMAPI } from "./htmldomapi.ts";
export type { Options } from "./init.ts";
export type { ThunkData, Thunk, ThunkFn } from "./thunk.ts";
export type { Key, VNode, VNodeData } from "./vnode.ts";

// helpers
export { attachTo } from "./helpers/attachto.ts";
export { array, primitive } from "./is.ts";
export { toVNode } from "./tovnode.ts";
export { h, fragment } from "./h.ts";

export type { AttachData } from "./helpers/attachto.ts";
export type {
  VNodes,
  VNodeChildElement,
  ArrayOrElement,
  VNodeChildren
} from "./h.ts";

// types
export * from "./hooks.ts";
export type { Module } from "./modules/module.ts";

// modules
export { attributesModule } from "./modules/attributes.ts";
export { classModule } from "./modules/class.ts";
export { datasetModule } from "./modules/dataset.ts";
export { eventListenersModule } from "./modules/eventlisteners.ts";
export { propsModule } from "./modules/props.ts";
export { styleModule } from "./modules/style.ts";
export type { Attrs } from "./modules/attributes.ts";
export type { Classes } from "./modules/class.ts";
export type { Dataset } from "./modules/dataset.ts";
export type { On } from "./modules/eventlisteners.ts";
export type { Props } from "./modules/props.ts";
export type { VNodeStyle } from "./modules/style.ts";


