import { beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_MAX_CHARS } from '../lib/constants';
import { loadState, saveState, storageKey, type StorageLike } from '../lib/storage';

function createStorage(initial: Record<string, string> = {}): StorageLike & { dump: () => Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    dump: () => Object.fromEntries(map),
  };
}

const PATH = '/guide/';
const KEY = storageKey(PATH);

describe('saveState / loadState round-trip', () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(() => {
    storage = createStorage();
  });

  it('persists and reloads valid state', () => {
    const map = { quiz1: { answered: true, correct: true, selected: ['1'] } };
    expect(saveState(storage, PATH, map)).toBe(true);
    expect(loadState(storage, PATH)).toEqual(map);
  });

  it('removes the key when saving an empty map', () => {
    saveState(storage, PATH, { quiz1: { answered: true, correct: false, selected: [] } });
    saveState(storage, PATH, {});
    expect(storage.dump()[KEY]).toBeUndefined();
  });

  it('returns an empty map for a missing key', () => {
    expect(loadState(storage, PATH)).toEqual({});
  });
});

describe('corruption recovery', () => {
  it('recovers from invalid JSON and clears the key', () => {
    const storage = createStorage({ [KEY]: '{not json' });
    expect(loadState(storage, PATH)).toEqual({});
    expect(storage.dump()[KEY]).toBeUndefined();
  });

  it('rejects a non-object payload', () => {
    const storage = createStorage({ [KEY]: '[1,2,3]' });
    expect(loadState(storage, PATH)).toEqual({});
    expect(storage.dump()[KEY]).toBeUndefined();
  });

  it('rejects a payload with a malformed entry', () => {
    const storage = createStorage({
      [KEY]: JSON.stringify({ ok: { answered: true, correct: true, selected: ['0'] }, bad: { answered: 'yes' } }),
    });
    expect(loadState(storage, PATH)).toEqual({});
    expect(storage.dump()[KEY]).toBeUndefined();
  });

  it('drops oversized payloads on load', () => {
    const storage = createStorage({ [KEY]: 'x'.repeat(STORAGE_MAX_CHARS + 1) });
    expect(loadState(storage, PATH)).toEqual({});
    expect(storage.dump()[KEY]).toBeUndefined();
  });

  it('refuses to save oversized payloads', () => {
    const storage = createStorage();
    const huge = { quiz1: { answered: true, correct: true, selected: ['x'.repeat(STORAGE_MAX_CHARS)] } };
    expect(saveState(storage, PATH, huge)).toBe(false);
  });
});

describe('hostile storage', () => {
  it('survives a throwing storage backend', () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadState(throwing, PATH)).toEqual({});
    expect(saveState(throwing, PATH, { q: { answered: true, correct: true, selected: [] } })).toBe(false);
  });
});
