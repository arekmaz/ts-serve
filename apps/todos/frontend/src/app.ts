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
import type { Todo } from "./types.ts";
import { TodoItem } from "./TodoItem.ts";
import { AddTodo } from "./AddTodo.ts";
import { ShadowScope } from "./ShadowScope.ts";
import { Css } from "./Css.ts";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "./api.ts";

const queryClient = new QueryClient();

function Todos() {
  const todosQuery = createQuery(() => ({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  }));

  function invalidateTodos() {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  }

  const addMutation = createMutation(() => ({
    mutationFn: (text: string) => createTodo(text),
    onSuccess: invalidateTodos,
  }));

  const toggleMutation = createMutation(() => ({
    mutationFn: (todo: Todo) => updateTodo(todo.id, { done: !todo.done }),
    onSuccess: invalidateTodos,
  }));

  const editMutation = createMutation(() => ({
    mutationFn: (vars: { id: string; text: string }) =>
      updateTodo(vars.id, { text: vars.text }),
    onSuccess: invalidateTodos,
  }));

  const removeMutation = createMutation(() => ({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: invalidateTodos,
  }));

  function addTodo(text: string) {
    addMutation.mutate(text);
  }

  function toggle(id: string) {
    const todo = todosQuery.data?.find((t) => t.id === id);
    if (!todo) {
      return;
    }
    toggleMutation.mutate(todo);
  }

  function remove(id: string) {
    removeMutation.mutate(id);
  }

  function editTodo(id: string, text: string) {
    editMutation.mutate({ id, text });
  }

  function clearCompleted() {
    const completed = todosQuery.data?.filter((t) => t.done) ?? [];
    for (const todo of completed) {
      removeMutation.mutate(todo.id);
    }
  }

  const todos = () => todosQuery.data ?? [];
  const remaining = createMemo(() => todos().filter((t) => !t.done).length);
  const hasCompleted = createMemo(() => todos().some((t) => t.done));

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
                margin-top: 12px;
              }

              > .clear {
                padding: 4px 10px;
                border: 1px solid var(--color-input-border);
                border-radius: var(--radius);
                background: transparent;
                color: var(--color-muted);
                font-size: var(--font-sm);
                cursor: pointer;

                &:hover {
                  color: var(--color-danger);
                  background: var(--color-danger-bg);
                }
              }
            }
          }
      `}<//
      >

      <h1>Todos</h1>
      <${AddTodo} onAdd=${addTodo} />
      <${Switch}>
        <${Match} when=${() => todosQuery.isLoading}>
          <p>Loading...</p>
        <//>
        <${Match} when=${() => todosQuery.isError}>
          <p>Error loading todos</p>
        <//>
        <${Match} when=${() => todosQuery.isSuccess}>
          <ul>
            <${For} each=${todos}>
              ${(todo: Todo) =>
                html`<${TodoItem}
                  todo=${todo}
                  onToggle=${toggle}
                  onRemove=${remove}
                  onEdit=${editTodo}
                />`}
            <//>
          </ul>
          <div class="footer">
            <span class="count"
              >${() =>
                `${remaining()} item${remaining() === 1 ? "" : "s"} left`}</span
            >
            ${() =>
              hasCompleted()
                ? html`<button class="clear" onClick=${clearCompleted}>
                    Clear completed
                  </button>`
                : ""}
          </div>
        <//>
      <//>
    <//>
  `;
}

function App() {
  return html`
    <${QueryClientProvider} client=${queryClient}>
      <${Todos} />
    <//>
  `;
}

render(App as never, document.body);
