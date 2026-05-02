export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type DeepReadonly<T> = T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type PathKeys<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? PathKeys<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<ReadonlyArray<T>>;
  create(data: Omit<T, "id">): Promise<T>;
  update(id: string, patch: Partial<Omit<T, "id">>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface EventMap {
  connect: { host: string; port: number };
  disconnect: { reason: string };
  message: { topic: string; payload: unknown };
  error: { code: number; message: string };
}

export type EventHandler<K extends keyof EventMap> = (event: EventMap[K]) => void;

export interface TypedEmitter {
  on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void;
  off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void;
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
}

export type Middleware<TContext> = (
  ctx: TContext,
  next: () => Promise<void>,
) => Promise<void>;

export type MiddlewareStack<TContext> = ReadonlyArray<Middleware<TContext>>;

declare function compose<TContext>(
  middlewares: MiddlewareStack<TContext>,
): (ctx: TContext) => Promise<void>;

export type Validator<T> = {
  parse(input: unknown): Result<T, ReadonlyArray<string>>;
  optional(): Validator<T | undefined>;
  array(): Validator<ReadonlyArray<T>>;
};

export type InferValidator<V> = V extends Validator<infer T> ? T : never;

export type Schema = {
  string: Validator<string>;
  number: Validator<number>;
  boolean: Validator<boolean>;
  object<T extends Record<string, Validator<unknown>>>(
    shape: T,
  ): Validator<{ [K in keyof T]: InferValidator<T[K]> }>;
};

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  maxSize: number;
  ttlMs: number;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export type RouteHandler<TParams extends Record<string, string> = Record<string, string>> = (
  request: Request,
  params: TParams,
) => Promise<Response>;

export interface Route<TParams extends Record<string, string> = Record<string, string>> {
  method: HttpMethod;
  pattern: string;
  handler: RouteHandler<TParams>;
}

export type Router = {
  add<TParams extends Record<string, string>>(
    method: HttpMethod,
    pattern: string,
    handler: RouteHandler<TParams>,
  ): void;
  match(method: string, pathname: string): { handler: RouteHandler; params: Record<string, string> } | null;
};

declare module "node:http" {
  interface IncomingMessage {
    parsedBody?: unknown;
  }
}

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type UserId = Brand<string, "UserId">;
export type Email = Brand<string, "Email">;
export type Timestamp = Brand<number, "Timestamp">;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type MergeDeep<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? K extends keyof A
      ? A[K] extends object
        ? B[K] extends object
          ? MergeDeep<A[K], B[K]>
          : B[K]
        : B[K]
      : B[K]
    : K extends keyof A
      ? A[K]
      : never;
};

function identity<T>(value: T): T {
  return value;
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

export { identity, assertNever };
