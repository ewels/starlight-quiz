import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RESET_ALL_EVENT } from '../lib/constants';
import type { StorageLike } from '../lib/storage';
import { QuizTracker } from '../lib/tracker';

function createStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

describe('QuizTracker', () => {
  let storage: StorageLike;
  let path: string;
  let tracker: QuizTracker;

  beforeEach(() => {
    storage = createStorage();
    path = '/page/';
    tracker = new QuizTracker({ storage, getPath: () => path });
  });

  it('counts registered quizzes in the total', () => {
    tracker.register('a');
    tracker.register('b');
    expect(tracker.progress).toMatchObject({ total: 2, answered: 0, correct: 0 });
  });

  it('does not double-count a quiz registered twice', () => {
    tracker.register('a');
    tracker.register('a');
    expect(tracker.progress.total).toBe(1);
  });

  it('records answers and computes progress', () => {
    tracker.register('a');
    tracker.register('b');
    tracker.record('a', true, ['1']);
    tracker.record('b', false, ['0']);
    expect(tracker.progress).toMatchObject({ total: 2, answered: 2, correct: 1, score: 50 });
  });

  it('persists across instances on the same page', () => {
    tracker.register('a');
    tracker.record('a', true, ['2']);

    const restored = new QuizTracker({ storage, getPath: () => path });
    expect(restored.register('a')).toEqual({ answered: true, correct: true, selected: ['2'] });
  });

  it('reset clears a single quiz', () => {
    tracker.register('a');
    tracker.record('a', true, ['1']);
    tracker.reset('a');
    expect(tracker.progress.answered).toBe(0);
    expect(tracker.register('a')).toBeUndefined();
  });

  it('resetAll clears the page and dispatches an event', () => {
    const handler = vi.fn();
    window.addEventListener(RESET_ALL_EVENT, handler);
    tracker.register('a');
    tracker.record('a', true, ['1']);
    tracker.resetAll();
    expect(tracker.progress.answered).toBe(0);
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener(RESET_ALL_EVENT, handler);
  });

  it('notifies subscribers and supports unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = tracker.subscribe(listener);
    expect(listener).toHaveBeenCalledOnce(); // initial call
    tracker.register('a');
    tracker.record('a', true, ['0']);
    const callsBefore = listener.mock.calls.length;
    unsubscribe();
    tracker.record('a', false, ['1']);
    expect(listener.mock.calls.length).toBe(callsBefore);
  });

  it('reloads state when the page changes', () => {
    tracker.register('a');
    tracker.record('a', true, ['1']);
    expect(tracker.progress.total).toBe(1);

    path = '/other/';
    expect(tracker.progress.total).toBe(0); // fresh page, nothing registered yet
  });
});
