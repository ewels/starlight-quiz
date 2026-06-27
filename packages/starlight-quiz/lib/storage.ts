import { STORAGE_KEY_PREFIX, STORAGE_MAX_CHARS } from './constants';
import type { QuizState } from './types';

/** A minimal subset of the Web Storage API, so this module is easy to test. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** The serialised shape: a map of quiz id to its state. */
export type StorageMap = Record<string, QuizState>;

/** Build the per-page storage key from a pathname. */
export function storageKey(pathname: string): string {
  return STORAGE_KEY_PREFIX + pathname;
}

/** Type guard validating a single persisted quiz state. */
function isValidState(value: unknown): value is QuizState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    typeof state['answered'] === 'boolean' &&
    typeof state['correct'] === 'boolean' &&
    Array.isArray(state['selected']) &&
    state['selected'].every((item) => typeof item === 'string')
  );
}

/**
 * Load and validate the persisted state for a page.
 *
 * Returns an empty map and removes the key for anything malformed — corrupted
 * JSON, a non-object payload, an oversized payload, or any individual entry
 * that fails validation. This keeps a single bad write from poisoning a page.
 */
export function loadState(storage: StorageLike, pathname: string): StorageMap {
  const key = storageKey(pathname);
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return {};
  }
  if (raw === null) return {};
  if (raw.length > STORAGE_MAX_CHARS) {
    safeRemove(storage, key);
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safeRemove(storage, key);
    return {};
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    safeRemove(storage, key);
    return {};
  }

  const result: StorageMap = {};
  for (const [id, state] of Object.entries(parsed)) {
    if (!isValidState(state)) {
      // A single malformed entry invalidates the whole page payload.
      safeRemove(storage, key);
      return {};
    }
    result[id] = state;
  }
  return result;
}

/**
 * Persist the state map for a page. Refuses to write oversized payloads and
 * swallows quota/availability errors, returning whether the write succeeded.
 */
export function saveState(storage: StorageLike, pathname: string, map: StorageMap): boolean {
  const key = storageKey(pathname);
  if (Object.keys(map).length === 0) {
    return safeRemove(storage, key);
  }
  const serialised = JSON.stringify(map);
  if (serialised.length > STORAGE_MAX_CHARS) return false;
  try {
    storage.setItem(key, serialised);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage: StorageLike, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
