import type { Todo } from "./types.ts";

export async function fetchTodos(): Promise<Array<Todo>> {
  const res = await fetch("/todos");
  return res.json();
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function updateTodo(
  id: string,
  patch: { text?: string; done?: boolean },
): Promise<Todo> {
  const res = await fetch(`/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function deleteTodo(id: string): Promise<void> {
  await fetch(`/todos/${id}`, { method: "DELETE" });
}
