import type { Note } from "./types.ts";
import { fetchNotes, createNote, updateNote, deleteNote } from "./api.ts";

type State = {
  readonly notes: ReadonlyArray<Note>;
  readonly loading: boolean;
  readonly error: boolean;
  readonly editingId: string | null;
  readonly editTitle: string;
  readonly editBody: string;
};

let state: State = {
  notes: [],
  loading: true,
  error: false,
  editingId: null,
  editTitle: "",
  editBody: "",
};

const app = document.getElementById("app") as HTMLDivElement;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

function setState(partial: Partial<State>) {
  state = { ...state, ...partial };
  render();
}

async function loadNotes() {
  setState({ loading: true, error: false });
  try {
    const notes = await fetchNotes();
    setState({ notes, loading: false });
  } catch {
    setState({ loading: false, error: true });
  }
}

function handleSubmit(e: SubmitEvent) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const input = form.querySelector("input") as HTMLInputElement;
  const title = input.value.trim();
  if (!title) {
    return;
  }
  input.value = "";
  createNote(title).then(function onCreated() {
    loadNotes();
  });
}

function handleRemove(id: string) {
  deleteNote(id).then(function onDeleted() {
    loadNotes();
  });
}

function startEdit(note: Note) {
  setState({ editingId: note.id, editTitle: note.title, editBody: note.body });
}

function cancelEdit() {
  setState({ editingId: null, editTitle: "", editBody: "" });
}

function confirmEdit() {
  const title = state.editTitle.trim();
  if (!title || !state.editingId) {
    return;
  }
  const id = state.editingId;
  const body = state.editBody;
  setState({ editingId: null });
  updateNote(id, { title, body }).then(function onUpdated() {
    loadNotes();
  });
}

function renderAddForm(): HTMLFormElement {
  const input = el("input", { type: "text", placeholder: "Note title..." });
  const button = el("button", { type: "submit" }, ["Add"]);
  const form = el("form", { class: "add-form" }, [input, button]);
  form.addEventListener("submit", handleSubmit);
  return form;
}

function renderNoteView(note: Note): HTMLLIElement {
  const titleEl = el("div", { class: "title" }, [note.title]);
  const contentChildren: Array<Node> = [titleEl];
  if (note.body) {
    contentChildren.push(el("div", { class: "body" }, [note.body]));
  }
  contentChildren.push(
    el("div", { class: "date" }, [new Date(note.createdAt).toLocaleDateString()]),
  );

  const content = el("div", { class: "content" }, contentChildren);
  content.addEventListener("dblclick", function onDblClick() {
    startEdit(note);
  });

  const removeBtn = el("button", {}, ["remove"]);
  removeBtn.addEventListener("click", function onClick() {
    handleRemove(note.id);
  });

  return el("li", { class: "note" }, [content, removeBtn]);
}

function renderNoteEdit(note: Note): HTMLLIElement {
  const titleInput = el("input", { type: "text", value: state.editTitle });
  titleInput.addEventListener("input", function onInput() {
    state = { ...state, editTitle: titleInput.value };
  });

  const bodyTextarea = el("textarea", {}, [state.editBody]);
  bodyTextarea.addEventListener("input", function onInput() {
    state = { ...state, editBody: bodyTextarea.value };
  });

  const saveBtn = el("button", {}, ["Save"]);
  saveBtn.addEventListener("click", confirmEdit);

  const cancelBtn = el("button", {}, ["Cancel"]);
  cancelBtn.addEventListener("click", cancelEdit);

  const actions = el("div", { class: "actions" }, [saveBtn, cancelBtn]);
  const editForm = el("div", { class: "edit-form" }, [titleInput, bodyTextarea, actions]);
  editForm.addEventListener("keydown", function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      cancelEdit();
    }
  });

  setTimeout(function focusTitle() {
    titleInput.focus();
  }, 0);

  return el("li", {}, [editForm]);
}

function renderNote(note: Note): HTMLLIElement {
  if (state.editingId === note.id) {
    return renderNoteEdit(note);
  }
  return renderNoteView(note);
}

function render() {
  app.textContent = "";

  const h1 = el("h1", {}, ["Notes"]);
  app.appendChild(h1);
  app.appendChild(renderAddForm());

  if (state.loading) {
    app.appendChild(el("p", {}, ["Loading..."]));
    return;
  }

  if (state.error) {
    app.appendChild(el("p", {}, ["Error loading notes"]));
    return;
  }

  const ul = el("ul", {});
  for (const note of state.notes) {
    ul.appendChild(renderNote(note));
  }
  app.appendChild(ul);
  app.appendChild(
    el("div", { class: "footer" }, [
      `${state.notes.length} note${state.notes.length === 1 ? "" : "s"}`,
    ]),
  );
}

render();
loadNotes();
