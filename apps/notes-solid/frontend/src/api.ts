import type { Note } from "./types.ts";

export async function fetchNotes(): Promise<Array<Note>> {
  const res = await fetch("/notes");
  return res.json();
}

export async function createNote(title: string): Promise<Note> {
  const res = await fetch("/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body: "" }),
  });
  return res.json();
}

export async function updateNote(
  id: string,
  patch: { title?: string; body?: string },
): Promise<Note> {
  const res = await fetch(`/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  await fetch(`/notes/${id}`, { method: "DELETE" });
}
