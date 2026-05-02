import { LitElement, html, css } from "lit";
import type { Note } from "./types.ts";

export class NoteItem extends LitElement {
  static properties = {
    note: { type: Object },
    editing: { type: Boolean },
    editTitle: { type: String },
    editBody: { type: String },
  };

  static styles = css`
    :host { display: block; }
    .note {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .content { flex: 1; cursor: default; }
    .title { font-size: 0.9rem; font-weight: 600; }
    .body { font-size: 0.8rem; color: #888; margin-top: 2px; white-space: pre-wrap; }
    .date { font-size: 0.7rem; color: #888; margin-top: 4px; }
    button.remove {
      background: transparent;
      border: none;
      padding: 4px 8px;
      border-radius: 6px;
      color: #888;
      font-size: 0.8rem;
      cursor: pointer;
    }
    button.remove:hover { color: #c00; background: #fee; }
    .edit-form { display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-bottom: 1px solid #eee; }
    .edit-form input, .edit-form textarea {
      padding: 4px 8px;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-family: inherit;
    }
    .edit-form input:focus, .edit-form textarea:focus { outline: none; border-color: #666; }
    .edit-form textarea { min-height: 60px; resize: vertical; }
    .actions { display: flex; gap: 6px; }
    .actions button {
      padding: 4px 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
      background: transparent;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .actions button.save {
      background: #1a1a1a;
      color: #fff;
      border-color: #1a1a1a;
    }
  `;

  declare note: Note;
  declare editing: boolean;
  declare editTitle: string;
  declare editBody: string;

  constructor() {
    super();
    this.editing = false;
    this.editTitle = "";
    this.editBody = "";
  }

  render() {
    if (this.editing) {
      return this.renderEdit();
    }
    return this.renderView();
  }

  private renderView() {
    const note = this.note;
    return html`
      <div class="note">
        <div class="content" @dblclick=${this.startEdit}>
          <div class="title">${note.title}</div>
          ${note.body ? html`<div class="body">${note.body}</div>` : ""}
          <div class="date">${new Date(note.createdAt).toLocaleDateString()}</div>
        </div>
        <button class="remove" @click=${this.handleRemove}>remove</button>
      </div>
    `;
  }

  private renderEdit() {
    return html`
      <div class="edit-form" @keydown=${this.handleKeyDown}>
        <input
          type="text"
          .value=${this.editTitle}
          @input=${this.handleTitleInput}
        />
        <textarea
          .value=${this.editBody}
          @input=${this.handleBodyInput}
        ></textarea>
        <div class="actions">
          <button class="save" @click=${this.confirmEdit}>Save</button>
          <button @click=${this.cancelEdit}>Cancel</button>
        </div>
      </div>
    `;
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has("editing") && this.editing) {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>("input");
      input?.focus();
    }
  }

  private startEdit() {
    this.editing = true;
    this.editTitle = this.note.title;
    this.editBody = this.note.body;
  }

  private cancelEdit() {
    this.editing = false;
  }

  private confirmEdit() {
    const title = this.editTitle.trim();
    if (!title) {
      return;
    }
    this.editing = false;
    this.dispatchEvent(
      new CustomEvent("note-update", {
        detail: { id: this.note.id, title, body: this.editBody },
        bubbles: true,
      }),
    );
  }

  private handleRemove() {
    this.dispatchEvent(
      new CustomEvent("note-remove", {
        detail: { id: this.note.id },
        bubbles: true,
      }),
    );
  }

  private handleTitleInput(e: InputEvent) {
    this.editTitle = (e.target as HTMLInputElement).value;
  }

  private handleBodyInput(e: InputEvent) {
    this.editBody = (e.target as HTMLTextAreaElement).value;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      this.cancelEdit();
    }
  }
}

customElements.define("note-item", NoteItem);
