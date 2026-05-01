import { html, insert } from "./solid.ts";

type ShadowScopeProps = {
  children: unknown;
};

export function ShadowScope(props: ShadowScopeProps) {
  return html`<div
    ref=${function attachShadow(el: HTMLDivElement) {
      const shadow = el.attachShadow({ mode: "open" });
      const hostStyle = document.createElement("style");
      hostStyle.textContent = ":host { display: contents; }";
      shadow.appendChild(hostStyle);
      insert(shadow, () => props.children);
    }}
  ></div>`;
}
