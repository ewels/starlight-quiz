import { PROGRESS_EVENT, RESET_ALL_EVENT } from './constants';
import { computeProgress, progressEquals } from './score';
import { loadState, saveState, type StorageLike, type StorageMap } from './storage';
import type { QuizProgress, QuizState } from './types';

/** A listener notified whenever aggregate progress changes. */
export type ProgressListener = (progress: QuizProgress) => void;

export interface QuizTrackerOptions {
  /** Storage backend. Defaults to `localStorage`, falling back to an in-memory store. */
  storage?: StorageLike;
  /** Resolves the current page key. Defaults to `location.pathname`. */
  getPath?: () => string;
}

/** A storage backend that keeps data in memory — used when `localStorage` is unavailable. */
function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

function defaultStorage(): StorageLike {
  try {
    if (typeof localStorage !== 'undefined') {
      // Touch the API to surface SecurityError in locked-down contexts.
      const probe = '__starlight_quiz_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return localStorage;
    }
  } catch {
    /* fall through to memory storage */
  }
  return createMemoryStorage();
}

/**
 * The central per-page progress store.
 *
 * Every quiz registers itself here; the store owns persistence and broadcasts
 * aggregate progress to subscribers and to the window. It is deliberately the
 * single source of truth so that future features — an aggregate sidebar, a
 * build-time manifest — can subscribe without the quizzes knowing about them.
 */
export class QuizTracker {
  readonly #storage: StorageLike;
  readonly #getPath: () => string;
  readonly #listeners = new Set<ProgressListener>();
  #path: string | null = null;
  #states: StorageMap = {};
  #registered = new Set<string>();
  /** Last progress broadcast, so `#emit` can skip no-op notifications. */
  #lastEmitted: QuizProgress | null = null;

  constructor(options: QuizTrackerOptions = {}) {
    this.#storage = options.storage ?? defaultStorage();
    this.#getPath = options.getPath ?? (() => (typeof location === 'undefined' ? '/' : location.pathname));
  }

  /** Reload state when the page changes (e.g. after a view transition). */
  #ensurePage(): void {
    const path = this.#getPath();
    if (path !== this.#path) {
      this.#path = path;
      this.#states = loadState(this.#storage, path);
      this.#registered = new Set();
      this.#lastEmitted = null;
    }
  }

  /**
   * Register a quiz on the current page. Returns any persisted state for it so
   * the quiz can restore itself, or `undefined` if it has not been answered.
   */
  register(id: string): QuizState | undefined {
    this.#ensurePage();
    this.#registered.add(id);
    this.#emit();
    return this.#states[id];
  }

  /** Record a submitted answer. */
  record(id: string, correct: boolean, selected: string[]): void {
    this.#ensurePage();
    this.#registered.add(id);
    this.#states[id] = { answered: true, correct, selected };
    this.#persist();
    this.#emit();
  }

  /** Clear a single quiz's progress. */
  reset(id: string): void {
    this.#ensurePage();
    delete this.#states[id];
    this.#persist();
    this.#emit();
  }

  /** Clear progress for every quiz on the page and notify quizzes to reset their UI. */
  resetAll(): void {
    this.#ensurePage();
    this.#states = {};
    this.#persist();
    this.#emit();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(RESET_ALL_EVENT));
    }
  }

  /** Current aggregate progress, counting only quizzes registered on this page. */
  get progress(): QuizProgress {
    this.#ensurePage();
    let answered = 0;
    let correct = 0;
    for (const id of this.#registered) {
      const state = this.#states[id];
      if (state?.answered) {
        answered++;
        if (state.correct) correct++;
      }
    }
    return computeProgress(this.#registered.size, answered, correct);
  }

  /** Subscribe to progress updates. Returns an unsubscribe function. */
  subscribe(listener: ProgressListener): () => void {
    this.#listeners.add(listener);
    listener(this.progress);
    return () => this.#listeners.delete(listener);
  }

  #persist(): void {
    saveState(this.#storage, this.#path ?? this.#getPath(), this.#states);
  }

  #emit(): void {
    const progress = this.progress;
    // Quizzes register one-by-one on load; skip the redundant broadcasts when
    // the aggregate has not actually changed.
    if (this.#lastEmitted && progressEquals(this.#lastEmitted, progress)) return;
    this.#lastEmitted = progress;
    for (const listener of this.#listeners) listener(progress);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: progress }));
    }
  }
}

const GLOBAL_KEY = Symbol.for('starlight-quiz.tracker');

/** Get the shared per-tab tracker instance, creating it on first use. */
export function getTracker(): QuizTracker {
  const globals = globalThis as typeof globalThis & { [GLOBAL_KEY]?: QuizTracker };
  globals[GLOBAL_KEY] ??= new QuizTracker();
  return globals[GLOBAL_KEY];
}
