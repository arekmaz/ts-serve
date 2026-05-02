function createStore<T extends Record<string, unknown>>(
  initial: T,
): {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  subscribe(listener: (state: T) => void): () => void;
} {
  let state: T = { ...initial };
  const listeners: Array<(state: T) => void> = [];

  function get<K extends keyof T>(key: K): T[K] {
    return state[key];
  }

  function set<K extends keyof T>(key: K, value: T[K]): void {
    state = { ...state, [key]: value };
    for (const listener of listeners) {
      listener(state);
    }
  }

  function subscribe(listener: (state: T) => void): () => void {
    listeners.push(listener);
    return function unsubscribe(): void {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  }

  return { get, set, subscribe };
}

function parseQuery(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  const pairs: ReadonlyArray<string> = search.replace(/^\?/, "").split("&");
  for (const pair of pairs) {
    const [key, value]: [string, string | undefined] = pair.split("=") as [string, string | undefined];
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
    }
  }
  return params;
}

function mapValues<T extends Record<string, unknown>, U>(
  obj: T,
  fn: <K extends keyof T>(value: T[K], key: K) => U,
): { [K in keyof T]: U } {
  const result: Partial<{ [K in keyof T]: U }> = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    result[key] = fn(obj[key], key);
  }
  return result as { [K in keyof T]: U };
}

function retry<T>(
  fn: () => Promise<T>,
  options: { attempts: number; delayMs: number; backoff?: number },
): Promise<T> {
  const { attempts, delayMs, backoff = 1 } = options;

  async function attempt(remaining: number, delay: number): Promise<T> {
    try {
      return await fn();
    } catch (err: unknown) {
      if (remaining <= 1) {
        throw err;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
      return attempt(remaining - 1, delay * backoff);
    }
  }

  return attempt(attempts, delayMs);
}

function createPool<T>(
  factory: () => Promise<T>,
  options: { maxSize: number; onRelease?: (item: T) => void },
): {
  acquire(): Promise<T>;
  release(item: T): void;
  size(): number;
} {
  const available: Array<T> = [];
  let total: number = 0;

  async function acquire(): Promise<T> {
    if (available.length > 0) {
      return available.pop() as T;
    }
    if (total < options.maxSize) {
      total++;
      return factory();
    }
    return new Promise<T>(function waitForRelease(resolve) {
      const interval: ReturnType<typeof setInterval> = setInterval(function check() {
        if (available.length > 0) {
          clearInterval(interval);
          resolve(available.pop() as T);
        }
      }, 10);
    });
  }

  function release(item: T): void {
    if (options.onRelease) {
      options.onRelease(item);
    }
    available.push(item);
  }

  function size(): number {
    return total;
  }

  return { acquire, release, size };
}

function zip<A, B>(a: ReadonlyArray<A>, b: ReadonlyArray<B>): Array<[A, B]> {
  const length: number = Math.min(a.length, b.length);
  const result: Array<[A, B]> = [];
  for (let i: number = 0; i < length; i++) {
    result.push([a[i], b[i]]);
  }
  return result;
}

function chunk<T>(items: ReadonlyArray<T>, size: number): Array<ReadonlyArray<T>> {
  const result: Array<ReadonlyArray<T>> = [];
  for (let i: number = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: ReadonlyArray<K>,
): Pick<T, K> {
  const result: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result as Pick<T, K>;
}

function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: ReadonlyArray<K>,
): Omit<T, K> {
  const result: Partial<T> = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

export { createStore, parseQuery, mapValues, retry, createPool, zip, chunk, pick, omit };
