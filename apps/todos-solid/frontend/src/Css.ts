import { createEffect, html } from "./solid.ts";

type CssProps = {
  children: string | (() => string);
  unscoped?: boolean;
};

function resolve(value: string | (() => string)): string {
  if (typeof value === "function") {
    return resolve(value());
  }
  return value || "";
}

export function Css(props: CssProps) {
  const unscoped = props.unscoped === true;

  return html`<style
    ref=${function initStyle(el: HTMLStyleElement) {
      createEffect(function syncCss() {
        const css = resolve(props.children);
        el.textContent = unscoped ? css : `@scope { ${css} }`;
      });
    }}
  ></style>`;
}
