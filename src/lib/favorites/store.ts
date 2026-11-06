"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Favourites (RP-53): product IDs in localStorage under `rp-favs`, newest first. No
 * account needed; survives reloads and syncs between tabs. Storage can be unavailable
 * (private mode, blocked cookies), so every access is wrapped in try/catch.
 */
export const FAVORITES_KEY = "rp-favs";
const EVENT = "rp-favs";
const EMPTY: string[] = [];

let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

export function parseFavorites(raw: string | null): string[] {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    // Also accepts the prototype's objects ({ id, … }) and drops anything odd.
    const ids = value
      .map((v) => (typeof v === "string" ? v : (v as { id?: unknown })?.id))
      .filter((v): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v));
    return [...new Set(ids)];
  } catch {
    return EMPTY;
  }
}

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(FAVORITES_KEY);
  } catch {
    return cache.ids;
  }
  if (raw !== cache.raw) cache = { raw, ids: parseFavorites(raw) };
  return cache.ids;
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Not stored; keep it for this page view at least.
    cache = { raw: JSON.stringify(ids), ids };
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === FAVORITES_KEY) onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The saved IDs; empty on the server and during hydration. */
export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const current = read();
    write(current.includes(id) ? current.filter((x) => x !== id) : [id, ...current]);
  }, []);
  const remove = useCallback((id: string) => write(read().filter((x) => x !== id)), []);
  const clear = useCallback(() => write([]), []);
  return { ids, has: (id: string) => ids.includes(id), toggle, remove, clear };
}
