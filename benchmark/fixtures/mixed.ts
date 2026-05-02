import type { ReadableStream } from "node:stream/web";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface HandlerResult {
  status: number;
  headers: Record<string, string>;
  body: string | null;
}

type Handler = (request: Request) => Promise<HandlerResult | null>;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200): HandlerResult {
  return {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

function emptyResponse(status: number): HandlerResult {
  return { status, headers: corsHeaders, body: null };
}

interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface User extends Entity {
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
}

interface Post extends Entity {
  title: string;
  body: string;
  authorId: string;
  tags: ReadonlyArray<string>;
  published: boolean;
}

type CreateUser = Omit<User, keyof Entity>;
type UpdateUser = Partial<CreateUser>;
type CreatePost = Omit<Post, keyof Entity>;
type UpdatePost = Partial<CreatePost>;

class Store<T extends Entity> {
  private items: Array<T> = [];

  findAll(predicate?: (item: T) => boolean): ReadonlyArray<T> {
    if (!predicate) {
      return [...this.items];
    }
    return this.items.filter(predicate);
  }

  findById(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  create(data: Omit<T, keyof Entity>): T {
    const now = new Date().toISOString();
    const entity = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T;
    this.items.push(entity);
    return entity;
  }

  update(id: string, patch: Partial<Omit<T, keyof Entity>>): T | undefined {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      return undefined;
    }
    this.items[index] = {
      ...this.items[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.items[index];
  }

  delete(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }
    this.items.splice(index, 1);
    return true;
  }
}

const userStore = new Store<User>();
const postStore = new Store<Post>();

function matchRoute(
  method: string,
  pathname: string,
): { resource: string; id?: string; action?: string } | undefined {
  if (method === "OPTIONS") {
    return { resource: "options" };
  }

  const usersMatch = pathname.match(/^\/users(?:\/([^/]+))?$/);
  if (usersMatch) {
    return { resource: "users", id: usersMatch[1] };
  }

  const postsMatch = pathname.match(/^\/posts(?:\/([^/]+))?$/);
  if (postsMatch) {
    return { resource: "posts", id: postsMatch[1] };
  }

  const userPostsMatch = pathname.match(/^\/users\/([^/]+)\/posts$/);
  if (userPostsMatch) {
    return { resource: "user-posts", id: userPostsMatch[1] };
  }

  return undefined;
}

async function parseBody<T>(request: Request): Promise<T> {
  const text = await request.text();
  return JSON.parse(text) as T;
}

async function handleUsers(
  method: string,
  id: string | undefined,
  request: Request,
): Promise<HandlerResult | null> {
  if (!id && method === "GET") {
    return jsonResponse(userStore.findAll());
  }

  if (!id && method === "POST") {
    const data = await parseBody<CreateUser>(request);
    return jsonResponse(userStore.create(data), 201);
  }

  if (!id) {
    return null;
  }

  if (method === "GET") {
    const user = userStore.findById(id);
    if (!user) {
      return emptyResponse(404);
    }
    return jsonResponse(user);
  }

  if (method === "PUT") {
    const data = await parseBody<UpdateUser>(request);
    const updated = userStore.update(id, data);
    if (!updated) {
      return emptyResponse(404);
    }
    return jsonResponse(updated);
  }

  if (method === "DELETE") {
    const deleted = userStore.delete(id);
    if (!deleted) {
      return emptyResponse(404);
    }
    return emptyResponse(204);
  }

  return null;
}

async function handlePosts(
  method: string,
  id: string | undefined,
  request: Request,
): Promise<HandlerResult | null> {
  if (!id && method === "GET") {
    return jsonResponse(postStore.findAll());
  }

  if (!id && method === "POST") {
    const data = await parseBody<CreatePost>(request);
    return jsonResponse(postStore.create(data), 201);
  }

  if (!id) {
    return null;
  }

  if (method === "GET") {
    const post = postStore.findById(id);
    if (!post) {
      return emptyResponse(404);
    }
    return jsonResponse(post);
  }

  if (method === "PUT") {
    const data = await parseBody<UpdatePost>(request);
    const updated = postStore.update(id, data);
    if (!updated) {
      return emptyResponse(404);
    }
    return jsonResponse(updated);
  }

  if (method === "DELETE") {
    const deleted = postStore.delete(id);
    if (!deleted) {
      return emptyResponse(404);
    }
    return emptyResponse(204);
  }

  return null;
}

function handleUserPosts(userId: string): HandlerResult {
  const posts = postStore.findAll((post) => post.authorId === userId);
  return jsonResponse(posts);
}

const handler: Handler = async function handler(request) {
  const url = new URL(request.url);
  const matched = matchRoute(request.method, url.pathname);
  if (!matched) {
    return null;
  }

  if (matched.resource === "options") {
    return emptyResponse(204);
  }

  if (matched.resource === "users") {
    return handleUsers(request.method, matched.id, request);
  }

  if (matched.resource === "posts") {
    return handlePosts(request.method, matched.id, request);
  }

  if (matched.resource === "user-posts" && matched.id) {
    return handleUserPosts(matched.id);
  }

  return null;
};

export { handler, userStore, postStore };
export type { User, Post, Handler, HandlerResult };
