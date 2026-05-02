import { DatabaseSync } from "node:sqlite";
import { renderApp, renderNoteItem, renderEditForm } from "./render.ts";

type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

const dbPath = new URL("notes.db", import.meta.url).pathname;
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  )
`);

const listStmt = db.prepare(
  "SELECT id, title, body, createdAt FROM notes ORDER BY createdAt",
);
const getStmt = db.prepare(
  "SELECT id, title, body, createdAt FROM notes WHERE id = ?",
);
const insertStmt = db.prepare(
  "INSERT INTO notes (id, title, body, createdAt) VALUES (?, ?, ?, ?)",
);
const updateStmt = db.prepare(
  "UPDATE notes SET title = ?, body = ? WHERE id = ?",
);
const deleteStmt = db.prepare("DELETE FROM notes WHERE id = ?");

function seedIfEmpty(): void {
  const rows = listStmt.all();
  if (rows.length > 0) {
    return;
  }
  insertStmt.run(
    crypto.randomUUID(),
    "Welcome",
    "This is your first note.",
    new Date().toISOString(),
  );
}

seedIfEmpty();

function listNotes(): Note[] {
  return listStmt.all() as Note[];
}

function getNote(id: string): Note | undefined {
  return getStmt.get(id) as Note | undefined;
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function readForm(request: Request): Promise<URLSearchParams> {
  const text = await request.text();
  return new URLSearchParams(text);
}

type Route =
  | { name: "index" }
  | { name: "create" }
  | { name: "edit"; id: string }
  | { name: "save"; id: string }
  | { name: "cancel"; id: string }
  | { name: "delete"; id: string };

function matchRoute(method: string, pathname: string): Route | undefined {
  if (method === "GET" && pathname === "/") {
    return { name: "index" };
  }
  if (method === "POST" && pathname === "/notes") {
    return { name: "create" };
  }
  const editMatch = pathname.match(/^\/notes\/([^/]+)\/edit$/);
  if (method === "POST" && editMatch) {
    return { name: "edit", id: editMatch[1]! };
  }
  const cancelMatch = pathname.match(/^\/notes\/([^/]+)\/cancel$/);
  if (method === "POST" && cancelMatch) {
    return { name: "cancel", id: cancelMatch[1]! };
  }
  const deleteMatch = pathname.match(/^\/notes\/([^/]+)\/delete$/);
  if (method === "POST" && deleteMatch) {
    return { name: "delete", id: deleteMatch[1]! };
  }
  const saveMatch = pathname.match(/^\/notes\/([^/]+)$/);
  if (method === "POST" && saveMatch) {
    return { name: "save", id: saveMatch[1]! };
  }
  return undefined;
}

async function handleCreate(request: Request): Promise<Response> {
  const form = await readForm(request);
  const title = (form.get("title") ?? "").trim();
  const body = (form.get("body") ?? "").trim();
  if (title === "") {
    return htmlResponse(renderApp(listNotes()));
  }
  insertStmt.run(
    crypto.randomUUID(),
    title,
    body,
    new Date().toISOString(),
  );
  return htmlResponse(renderApp(listNotes()));
}

function handleEdit(id: string): Response {
  const note = getNote(id);
  if (!note) {
    return htmlResponse("", 404);
  }
  return htmlResponse(renderEditForm(note));
}

async function handleSave(id: string, request: Request): Promise<Response> {
  const existing = getNote(id);
  if (!existing) {
    return htmlResponse("", 404);
  }
  const form = await readForm(request);
  const title = (form.get("title") ?? existing.title).trim();
  const body = (form.get("body") ?? existing.body).trim();
  updateStmt.run(title || existing.title, body, id);
  const updated = getNote(id)!;
  return htmlResponse(renderNoteItem(updated));
}

function handleCancel(id: string): Response {
  const note = getNote(id);
  if (!note) {
    return htmlResponse("", 404);
  }
  return htmlResponse(renderNoteItem(note));
}

function handleDelete(id: string): Response {
  deleteStmt.run(id);
  return htmlResponse("");
}

export async function handler(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const route = matchRoute(request.method, url.pathname);
  if (!route) {
    return null;
  }
  if (route.name === "index") {
    return htmlResponse(renderApp(listNotes(), { fullPage: true }));
  }
  if (route.name === "create") {
    return handleCreate(request);
  }
  if (route.name === "edit") {
    return handleEdit(route.id);
  }
  if (route.name === "save") {
    return handleSave(route.id, request);
  }
  if (route.name === "cancel") {
    return handleCancel(route.id);
  }
  if (route.name === "delete") {
    return handleDelete(route.id);
  }
  return null;
}
