import {
  init,
  h,
  classModule,
  propsModule,
  eventListenersModule,
  styleModule,
} from "snabbdom";
import type { VNode } from "snabbdom";
import type { Note } from "./types.ts";
import { fetchNotes, createNote, updateNote, deleteNote } from "./api.ts";

const patch = init([classModule, propsModule, eventListenersModule, styleModule]);

type State = {
  notes: ReadonlyArray<Note>;
  loading: boolean;
  error: boolean;
  inputValue: string;
  editingId: string | null;
  editTitle: string;
  editBody: string;
};

let state: State = {
  notes: [],
  loading: true,
  error: false,
  inputValue: "",
  editingId: null,
  editTitle: "",
  editBody: "",
};

let vnode: VNode = h("div#app");

function setState(partial: Partial<State>) {
  state = { ...state, ...partial };
  render();
}

function render() {
  const next = view(state);
  patch(vnode, next);
  vnode = next;
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

function handleSubmit(e: Event) {
  e.preventDefault();
  const title = state.inputValue.trim();
  if (!title) {
    return;
  }
  setState({ inputValue: "" });
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
  setState({ editingId: null });
  updateNote(id, { title, body: state.editBody }).then(function onUpdated() {
    loadNotes();
  });
}

function renderAddForm(s: State): VNode {
  return h("form.add-form", { on: { submit: handleSubmit } }, [
    h("input", {
      props: { type: "text", placeholder: "Note title...", value: s.inputValue },
      on: {
        input: function onInput(e: Event) {
          setState({ inputValue: (e.target as HTMLInputElement).value });
        },
      },
    }),
    h("button", { props: { type: "submit" } }, "Add"),
  ]);
}

function renderNoteView(note: Note): VNode {
  const children: Array<VNode> = [
    h("div.title", note.title),
  ];
  if (note.body) {
    children.push(h("div.body", note.body));
  }
  children.push(
    h("div.date", new Date(note.createdAt).toLocaleDateString()),
  );

  return h("li.note", { key: note.id }, [
    h("div.content", { on: { dblclick: function onDblClick() { startEdit(note); } } }, children),
    h("button", { on: { click: function onClick() { handleRemove(note.id); } } }, "remove"),
  ]);
}

function renderNoteEdit(note: Note, s: State): VNode {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      cancelEdit();
    }
  }

  return h("li", { key: note.id }, [
    h("div.edit-form", { on: { keydown: handleKeyDown } }, [
      h("input", {
        props: { type: "text", value: s.editTitle },
        on: {
          input: function onInput(e: Event) {
            setState({ editTitle: (e.target as HTMLInputElement).value });
          },
        },
        hook: {
          insert: function focusInput(vnode: VNode) {
            (vnode.elm as HTMLInputElement).focus();
          },
        },
      }),
      h("textarea", {
        props: { value: s.editBody },
        on: {
          input: function onInput(e: Event) {
            setState({ editBody: (e.target as HTMLTextAreaElement).value });
          },
        },
      }),
      h("div.actions", [
        h("button", { on: { click: confirmEdit } }, "Save"),
        h("button", { on: { click: cancelEdit } }, "Cancel"),
      ]),
    ]),
  ]);
}

function renderNote(note: Note, s: State): VNode {
  if (s.editingId === note.id) {
    return renderNoteEdit(note, s);
  }
  return renderNoteView(note);
}

function view(s: State): VNode {
  let content: VNode;
  if (s.loading) {
    content = h("p", "Loading...");
  } else if (s.error) {
    content = h("p", "Error loading notes");
  } else {
    content = h("div", [
      h("ul", s.notes.map((note) => renderNote(note, s))),
      h("div.footer", `${s.notes.length} note${s.notes.length === 1 ? "" : "s"}`),
    ]);
  }

  return h("div#app", [
    h("h1", "Notes"),
    renderAddForm(s),
    content,
  ]);
}

const container = document.getElementById("app");
if (container) {
  vnode = patch(container, view(state));
  loadNotes();
}
