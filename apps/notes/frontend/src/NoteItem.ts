import { createSignal, html } from "./solid.ts";
import type { Note } from "./types.ts";
import { Css } from "./Css.ts";

type NoteItemProps = {
  note: Note;
  onRemove: (id: string) => void;
  onEdit: (id: string, patch: { title?: string; body?: string }) => void;
};

export function NoteItem(props: NoteItemProps) {
  const [editing, setEditing] = createSignal(false);
  const [draftTitle, setDraftTitle] = createSignal("");
  const [draftBody, setDraftBody] = createSignal("");

  function startEdit() {
    setDraftTitle(props.note.title);
    setDraftBody(props.note.body);
    setEditing(true);
  }

  function confirmEdit() {
    const title = draftTitle().trim();
    if (!title) {
      return;
    }
    props.onEdit(props.note.id, { title, body: draftBody() });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      cancelEdit();
    }
  }

  return html`
    <li>
      <${Css}
        >${`
        :scope {
          padding: 10px 0;
          border-bottom: 1px solid var(--color-border);

          &:last-child { border-bottom: none; }

          > .view {
            display: flex;
            align-items: flex-start;
            gap: 10px;

            > .content {
              flex: 1;
              cursor: default;

              > .title {
                font-size: var(--font-base);
                font-weight: 600;
              }

              > .body {
                font-size: var(--font-sm);
                color: var(--color-muted);
                margin-top: 2px;
                white-space: pre-wrap;
              }

              > .date {
                font-size: 0.7rem;
                color: var(--color-muted);
                margin-top: 4px;
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

          > .edit-form {
            display: flex;
            flex-direction: column;
            gap: 6px;

            > input, > textarea {
              padding: 4px 8px;
              font-size: var(--font-base);
              border: 1px solid var(--color-input-border);
              border-radius: var(--radius);
              font-family: inherit;

              &:focus { outline: none; border-color: #666; }
            }

            > textarea { min-height: 60px; resize: vertical; }

            > .actions {
              display: flex;
              gap: 6px;

              > button {
                padding: 4px 10px;
                border: 1px solid var(--color-input-border);
                border-radius: var(--radius);
                background: transparent;
                font-size: var(--font-sm);
                cursor: pointer;

                &:first-child {
                  background: var(--color-primary);
                  color: #fff;
                  border-color: var(--color-primary);
                }
              }
            }
          }
        }
      `}<//
      >
      ${() =>
        editing()
          ? html`<div class="edit-form" onKeyDown=${handleKeyDown}>
              <input
                type="text"
                value=${draftTitle}
                onInput=${(e: InputEvent) =>
                  setDraftTitle((e.target as HTMLInputElement).value)}
                ref=${function focusInput(el: HTMLInputElement) {
                  setTimeout(() => el.focus(), 0);
                }}
              />
              <textarea
                onInput=${(e: InputEvent) =>
                  setDraftBody((e.target as HTMLTextAreaElement).value)}
              >
                ${draftBody}
              </textarea>
              <div class="actions">
                <button onClick=${confirmEdit}>Save</button>
                <button onClick=${cancelEdit}>Cancel</button>
              </div>
            </div>`
          : html`<div class="view">
              <div class="content" onDblClick=${startEdit}>
                <div class="title">${() => props.note.title}</div>
                ${() =>
                  props.note.body
                    ? html`<div class="body">${() => props.note.body}</div>`
                    : ""}
                <div class="date">
                  ${() =>
                    new Date(props.note.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick=${() => props.onRemove(props.note.id)}>
                remove
              </button>
            </div>`}
    </li>
  `;
}
