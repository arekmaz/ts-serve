type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escape(value: string): string {
  return value.replace(/[&<>"']/g, function replaceChar(char) {
    return escapeMap[char]!;
  });
}

class SafeHtml {
  readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
  toString(): string {
    return this.value;
  }
}

function renderValue(value: unknown): string {
  if (value instanceof SafeHtml) {
    return value.value;
  }
  if (Array.isArray(value)) {
    return value.map(renderValue).join("");
  }
  if (value === null || value === undefined || value === false) {
    return "";
  }
  return escape(String(value));
}

function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): SafeHtml {
  let result = strings[0]!;
  for (let i = 0; i < values.length; i++) {
    result += renderValue(values[i]) + strings[i + 1]!;
  }
  return new SafeHtml(result);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function noteItem(note: Note): SafeHtml {
  return html`
    <li class="note" id="note-${note.id}">
      <div class="content">
        <div class="title">${note.title}</div>
        ${note.body ? html`<div class="body">${note.body}</div>` : ""}
        <div class="date">${formatDate(note.createdAt)}</div>
      </div>
      <div class="actions">
        <form action="/notes/${note.id}/edit#note-${note.id}" method="post">
          <button type="submit">edit</button>
        </form>
        <form action="/notes/${note.id}/delete#note-${note.id}" method="post">
          <button type="submit" class="danger" aria-label="Delete">✕</button>
        </form>
      </div>
    </li>
  `;
}

function editForm(note: Note): SafeHtml {
  return html`
    <li class="note" id="note-${note.id}">
      <form
        class="edit-form"
        action="/notes/${note.id}#note-${note.id}"
        method="post"
      >
        <input name="title" type="text" value="${note.title}" required />
        <textarea name="body" placeholder="Body">${note.body}</textarea>
        <div class="actions">
          <button type="submit">save</button>
          <button
            type="submit"
            formaction="/notes/${note.id}/cancel#note-${note.id}"
          >
            cancel
          </button>
        </div>
      </form>
    </li>
  `;
}

function notesList(notes: Note[]): SafeHtml {
  if (notes.length === 0) {
    return html`<li class="note"><div class="content"><div class="body">No notes yet.</div></div></li>`;
  }
  return html`${notes.map(noteItem)}`;
}

function appShell(notes: Note[]): SafeHtml {
  return html`
    <div id="app">
      <form class="add-form" action="/notes#app" method="post">
        <input name="title" type="text" placeholder="Title" required />
        <textarea name="body" placeholder="Body (optional)"></textarea>
        <button type="submit">Add note</button>
      </form>
      <ul>
        ${notesList(notes)}
      </ul>
    </div>
  `;
}

export function renderNoteItem(note: Note): string {
  return noteItem(note).value;
}

export function renderEditForm(note: Note): string {
  return editForm(note).value;
}

export function renderApp(
  notes: Note[],
  options: { fullPage?: boolean } = {},
): string {
  if (!options.fullPage) {
    return appShell(notes).value;
  }
  return html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Notes (htmz)</title>
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>"
    />
    <link rel="stylesheet" href="/style.css" />
    <base target="htmz" />
  </head>
  <body>
    <h1>Notes</h1>
    ${appShell(notes)}
    <p class="footer">
      Powered by <a href="https://leanrada.com/htmz/" target="_top">htmz</a>
    </p>
    <iframe
      hidden
      name="htmz"
      onload="setTimeout(()=>document.querySelector(contentWindow.location.hash||null)?.replaceWith(...contentDocument.body.childNodes))"
    ></iframe>
  </body>
</html>`.value;
}
