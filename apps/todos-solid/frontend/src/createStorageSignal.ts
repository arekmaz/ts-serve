import { createSignal, createEffect, onCleanup } from "./solid.ts";

type Accessor<T> = () => T;
type Setter<T> = (v: T | ((prev: T) => T)) => void;

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function createStorageSignal<T>(
  key: string,
  fallback: T,
): [Accessor<T>, Setter<T>] {
  const stored = localStorage.getItem(key);
  const initial: T = stored ? safeParse(stored, fallback) : fallback;
  const [value, setValue] = createSignal<T>(initial);

  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(value()));
  });

  function handleStorage(e: StorageEvent) {
    if (e.key !== key || e.newValue === null) {
      return;
    }
    setValue(() => safeParse<T>(e.newValue ?? "", fallback));
  }

  window.addEventListener("storage", handleStorage);

  onCleanup(function detachStorage() {
    window.removeEventListener("storage", handleStorage);
  });

  return [value, setValue];
}
