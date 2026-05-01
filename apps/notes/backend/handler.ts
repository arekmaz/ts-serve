import { DatabaseSync } from "node:sqlite";

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

const listStmt = db.prepare("SELECT id, title, body, createdAt FROM notes ORDER BY createdAt");
const getStmt = db.prepare("SELECT id, title, body, createdAt FROM notes WHERE id = ?");
const insertStmt = db.prepare("INSERT INTO notes (id, title, body, createdAt) VALUES (?, ?, ?, ?)");
const updateTitleStmt = db.prepare("UPDATE notes SET title = ? WHERE id = ?");
const updateBodyStmt = db.prepare("UPDATE notes SET body = ? WHERE id = ?");
const deleteStmt = db.prepare("DELETE FROM notes WHERE id = ?");

function seedIfEmpty() {
  const rows = listStmt.all();
  if (rows.length > 0) {
    return;
  }
  insertStmt.run(crypto.randomUUID(), "Welcome", "This is your first note.", new Date().toISOString());
}

seedIfEmpty();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function matchRoute(
  method: string,
  pathname: string,
): { route: string; id?: string } | undefined {
  if (method === "OPTIONS") {
    return { route: "options" };
  }
  if (pathname === "/notes" && method === "GET") {
    return { route: "list" };
  }
  if (pathname === "/notes" && method === "POST") {
    return { route: "create" };
  }
  const match = pathname.match(/^\/notes\/([^/]+)$/);
  if (!match) {
    return undefined;
  }
  const id = match[1];
  if (method === "GET") {
    return { route: "get", id };
  }
  if (method === "PATCH") {
    return { route: "update", id };
  }
  if (method === "DELETE") {
    return { route: "delete", id };
  }
  return undefined;
}

async function handleRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const matched = matchRoute(request.method, url.pathname);
  if (!matched) {
    return null;
  }

  if (matched.route === "options") {
    return emptyResponse(204);
  }

  if (matched.route === "list") {
    return jsonResponse(listStmt.all());
  }

  if (matched.route === "create") {
    const { title, body: noteBody } = (await request.json()) as {
      title: string;
      body: string;
    };
    const note: Note = {
      id: crypto.randomUUID(),
      title,
      body: noteBody ?? "",
      createdAt: new Date().toISOString(),
    };
    insertStmt.run(note.id, note.title, note.body, note.createdAt);
    return jsonResponse(note, 201);
  }

  if (matched.route === "get") {
    const note = getStmt.get(matched.id) as Note | undefined;
    if (!note) {
      return emptyResponse(404);
    }
    return jsonResponse(note);
  }

  if (matched.route === "update") {
    const existing = getStmt.get(matched.id) as Note | undefined;
    if (!existing) {
      return emptyResponse(404);
    }
    const patch = (await request.json()) as {
      title?: string;
      body?: string;
    };
    if (patch.title !== undefined) {
      updateTitleStmt.run(patch.title, matched.id);
    }
    if (patch.body !== undefined) {
      updateBodyStmt.run(patch.body, matched.id);
    }
    const updated = getStmt.get(matched.id) as Note;
    return jsonResponse(updated);
  }

  if (matched.route === "delete") {
    const existing = getStmt.get(matched.id) as Note | undefined;
    if (!existing) {
      return emptyResponse(404);
    }
    deleteStmt.run(matched.id);
    return emptyResponse(204);
  }

  return null;
}

export function handler(request: Request): Promise<Response | null> {
  return handleRequest(request);
}
