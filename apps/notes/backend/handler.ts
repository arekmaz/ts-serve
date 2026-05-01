type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

let notes: Array<Note> = [
  {
    id: crypto.randomUUID(),
    title: "Welcome",
    body: "This is your first note.",
    createdAt: new Date().toISOString(),
  },
];

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
    return jsonResponse(notes);
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
    notes = [...notes, note];
    return jsonResponse(note, 201);
  }

  if (matched.route === "get") {
    const note = notes.find((n) => n.id === matched.id);
    if (!note) {
      return emptyResponse(404);
    }
    return jsonResponse(note);
  }

  if (matched.route === "update") {
    const index = notes.findIndex((n) => n.id === matched.id);
    if (index === -1) {
      return emptyResponse(404);
    }
    const patch = (await request.json()) as {
      title?: string;
      body?: string;
    };
    const updated: Note = { ...notes[index], ...patch };
    notes = notes.with(index, updated);
    return jsonResponse(updated);
  }

  if (matched.route === "delete") {
    if (!notes.some((n) => n.id === matched.id)) {
      return emptyResponse(404);
    }
    notes = notes.filter((n) => n.id !== matched.id);
    return emptyResponse(204);
  }

  return null;
}

export function handler(request: Request): Promise<Response | null> {
  return handleRequest(request);
}
