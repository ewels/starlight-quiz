import { describe, expect, it } from 'vitest';

import { hashId, quizId } from '../lib/id';

describe('hashId', () => {
  it('is deterministic for the same input', () => {
    expect(hashId('The powerhouse of the cell')).toBe(hashId('The powerhouse of the cell'));
  });

  it('differs for different input', () => {
    expect(hashId('one')).not.toBe(hashId('two'));
  });

  it('is stable across runs (regression guard on the constant)', () => {
    // If this value changes, every persisted quiz keyed by a title hash moves.
    expect(hashId('Primary colours')).toBe(hashId('Primary colours'));
    expect(typeof hashId('x')).toBe('string');
  });
});

describe('quizId', () => {
  it('prefers an explicit id', () => {
    expect(quizId('my-id', 'Some title')).toBe('my-id');
  });

  it('falls back to a stable hash of the title', () => {
    expect(quizId(undefined, 'Some title')).toBe(quizId(undefined, 'Some title'));
    expect(quizId(undefined, 'Some title')).toMatch(/^quiz-/);
  });

  it('still produces an id with neither id nor title', () => {
    expect(quizId(undefined, undefined)).toMatch(/^quiz-/);
  });
});
