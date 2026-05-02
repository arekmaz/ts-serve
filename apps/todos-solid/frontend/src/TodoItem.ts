import { createSignal, html } from "./solid.ts";
import type { Todo } from "./types.ts";
import { Css } from "./Css.ts";

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, text: string) => void;
};

export function TodoItem(props: TodoItemProps) {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal("");

  function startEdit() {
    setDraft(props.todo.text);
    setEditing(true);
  }

  function confirmEdit() {
    const trimmed = draft().trim();
    if (!trimmed) {
      return;
    }
    props.onEdit(props.todo.id, trimmed);
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      confirmEdit();
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  }

  function handleEditInput(e: InputEvent) {
    const target: HTMLInputElement = e.target as HTMLInputElement;
    setDraft(target.value);
  }

  return html`
    <li>
      <${Css}
        >${() => `
        :scope {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--color-border);

          &:last-child {
            border-bottom: none;
          }

          > span {
            flex: 1;
            font-size: var(--font-base);
            text-decoration: ${props.todo.done ? "line-through" : "none"};
            color: ${props.todo.done ? "var(--color-muted)" : "inherit"};
            cursor: default;
          }

          > input.edit-input {
            flex: 1;
            padding: 2px 6px;
            font-size: var(--font-base);
            border: 1px solid var(--color-input-border);
            border-radius: var(--radius);

            &:focus {
              outline: none;
              border-color: #666;
            }
          }

          > button {
            background: transparent;
            border: none;
            padding: 4px 8px;
            border-radius: var(--radius);
            color: var(--color-muted);
            font-size: var(--font-sm);

            &:hover {
              color: var(--color-danger);
              background: var(--color-danger-bg);
            }
          }
        }
      `}<//
      >
      <input
        type="checkbox"
        checked=${() => props.todo.done}
        onChange=${() => props.onToggle(props.todo.id)}
      />
      ${() =>
        editing()
          ? html`<input
              class="edit-input"
              type="text"
              value=${draft}
              onInput=${handleEditInput}
              onKeyDown=${handleEditKeyDown}
              onBlur=${confirmEdit}
              ref=${function focusInput(el: HTMLInputElement) {
                setTimeout(() => el.focus(), 0);
              }}
            />`
          : html`<span onDblClick=${startEdit}>${() => props.todo.text}</span>`}
      <button onClick=${() => props.onRemove(props.todo.id)}>remove</button>
    </li>
  `;
}
