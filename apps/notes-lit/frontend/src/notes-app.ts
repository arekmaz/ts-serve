import { LitElement, html, css } from "lit";
import type { Note } from "./types.ts";
import { fetchNotes, createNote, updateNote, deleteNote } from "./api.ts";
import "./note-item.ts";

export class NotesApp extends LitElement {
  static properties = {
    notes: { type: Array },
    loading: { type: Boolean },
    error: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
      max-width: 480px;
      margin: 40px auto;
      padding: 0 16px;
      color: #1a1a1a;
    }
    h1 { font-size: 1.5rem; margin-bottom: 16px; }
    .add-form {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .add-form input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .add-form input:focus { outline: none; border-color: #666; }
    .add-form button {
      padding: 8px 14px;
      border: none;
      border-radius: 6px;
      background: #1a1a1a;
      color: #fff;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .add-form button:hover { background: #333; }
    .footer { margin-top: 12px; font-size: 0.8rem; color: #888; }
  `;

  declare notes: ReadonlyArray<Note>;
  declare loading: boolean;
  declare error: boolean;

  constructor() {
    super();
    this.notes = [];
    this.loading = true;
    this.error = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadNotes();
    this.addEventListener("note-update", this.handleNoteUpdate as EventListener);
    this.addEventListener("note-remove", this.handleNoteRemove as EventListener);
  }

  render() {
    return html`
      <h1>Notes</h1>
      <form class="add-form" @submit=${this.handleSubmit}>
        <input type="text" placeholder="Note title..." />
        <button type="submit">Add</button>
      </form>
      ${this.renderContent()}
    `;
  }

  private renderContent() {
    if (this.loading) {
      return html`<p>Loading...</p>`;
    }
    if (this.error) {
      return html`<p>Error loading notes</p>`;
    }
    return html`
      ${this.notes.map(
        (note) => html`<note-item .note=${note}></note-item>`,
      )}
      <div class="footer">
        ${this.notes.length} note${this.notes.length === 1 ? "" : "s"}
      </div>
    `;
  }

  private async loadNotes() {
    this.loading = true;
    this.error = false;
    try {
      this.notes = await fetchNotes();
      this.loading = false;
    } catch {
      this.loading = false;
      this.error = true;
    }
  }

  private handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector("input") as HTMLInputElement;
    const title = input.value.trim();
    if (!title) {
      return;
    }
    input.value = "";
    createNote(title).then(() => this.loadNotes());
  }

  private handleNoteUpdate(e: CustomEvent<{ id: string; title: string; body: string }>) {
    const { id, title, body } = e.detail;
    updateNote(id, { title, body }).then(() => this.loadNotes());
  }

  private handleNoteRemove(e: CustomEvent<{ id: string }>) {
    deleteNote(e.detail.id).then(() => this.loadNotes());
  }
}

customElements.define("notes-app", NotesApp);
