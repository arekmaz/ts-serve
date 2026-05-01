import { createSignal, html } from "./solid.ts";
import { Css } from "./Css.ts";

type AddNoteProps = {
  onAdd: (title: string) => void;
};

export function AddNote(props: AddNoteProps) {
  const [input, setInput] = createSignal("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    const title = input().trim();
    if (!title) {
      return;
    }
    props.onAdd(title);
    setInput("");
  }

  return html`
    <form onSubmit=${handleSubmit}>
      <${Css}
        >${`
        :scope {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;

          > input[type="text"] {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--color-input-border);
            border-radius: var(--radius);
            font-size: var(--font-base);

            &:focus { outline: none; border-color: #666; }
          }

          > button {
            padding: 8px 14px;
            border: none;
            border-radius: var(--radius);
            background: var(--color-primary);
            color: #fff;
            font-size: var(--font-base);
            cursor: pointer;

            &:hover { background: #333; }
          }
        }
      `}<//
      >
      <input
        type="text"
        placeholder="Note title..."
        value=${input}
        onInput=${(e: InputEvent) =>
          setInput((e.target as HTMLInputElement).value)}
      />
      <button type="submit">Add</button>
    </form>
  `;
}
