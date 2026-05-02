import {
  createMemo,
  For,
  Switch,
  Match,
  render,
  html,
  QueryClient,
  QueryClientProvider,
  createQuery,
  createMutation,
} from "./solid.ts";
import type { Note } from "./types.ts";
import { NoteItem } from "./NoteItem.ts";
import { AddNote } from "./AddNote.ts";
import { ShadowScope } from "./ShadowScope.ts";
import { Css } from "./Css.ts";
import { fetchNotes, createNote, updateNote, deleteNote } from "./api.ts";

const queryClient = new QueryClient();

function Notes() {
  const notesQuery = createQuery(() => ({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  }));

  function invalidateNotes() {
    queryClient.invalidateQueries({ queryKey: ["notes"] });
  }

  const addMutation = createMutation(() => ({
    mutationFn: (title: string) => createNote(title),
    onSuccess: invalidateNotes,
  }));

  const editMutation = createMutation(() => ({
    mutationFn: (vars: { id: string; patch: { title?: string; body?: string } }) =>
      updateNote(vars.id, vars.patch),
    onSuccess: invalidateNotes,
  }));

  const removeMutation = createMutation(() => ({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: invalidateNotes,
  }));

  function addNote(title: string) {
    addMutation.mutate(title);
  }

  function remove(id: string) {
    removeMutation.mutate(id);
  }

  function editNote(id: string, patch: { title?: string; body?: string }) {
    editMutation.mutate({ id, patch });
  }

  const notes = () => notesQuery.data ?? [];
  const count = createMemo(() => notes().length);

  return html`
    <${ShadowScope}>
      <${Css} unscoped
        >${`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :host {
          --color-primary: #1a1a1a;
          --color-muted: #888;
          --color-border: #eee;
          --color-input-border: #ccc;
          --color-danger: #c00;
          --color-danger-bg: #fee;
          --radius: 6px;
          --font-sm: 0.8rem;
          --font-base: 0.9rem;
          font-family: system-ui, sans-serif;
          max-width: 480px;
          margin: 40px auto;
          padding: 0 16px;
          color: var(--color-primary);
        }
        h1 { font-size: 1.5rem; margin-bottom: 16px; }
        ul { list-style: none; }
      `}<//
      >

      <${Css}
        >${`
          :scope {
            .footer {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-top: 12px;

              > .count {
                font-size: var(--font-sm);
                color: var(--color-muted);
              }
            }
          }
      `}<//
      >

      <h1>Notes</h1>
      <${AddNote} onAdd=${addNote} />
      <${Switch}>
        <${Match} when=${() => notesQuery.isLoading}>
          <p>Loading...</p>
        <//>
        <${Match} when=${() => notesQuery.isError}>
          <p>Error loading notes</p>
        <//>
        <${Match} when=${() => notesQuery.isSuccess}>
          <ul>
            <${For} each=${notes}>
              ${(note: Note) =>
                html`<${NoteItem}
                  note=${note}
                  onRemove=${remove}
                  onEdit=${editNote}
                />`}
            <//>
          </ul>
          <div class="footer">
            <span class="count"
              >${() =>
                `${count()} note${count() === 1 ? "" : "s"}`}</span
            >
          </div>
        <//>
      <//>
    <//>
  `;
}

function App() {
  return html`
    <${QueryClientProvider} client=${queryClient}>
      <${Notes} />
    <//>
  `;
}

render(App as never, document.body);
