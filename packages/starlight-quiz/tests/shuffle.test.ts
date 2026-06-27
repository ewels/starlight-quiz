import { describe, expect, it } from 'vitest';

import { shuffle } from '../lib/shuffle';

describe('shuffle', () => {
  it('keeps the same members', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle([...items]);
    expect([...result].sort((a, b) => a - b)).toEqual(items);
  });

  it('is deterministic with a seeded random source', () => {
    // A constant 0 source rotates each element to the front in turn.
    const result = shuffle(['a', 'b', 'c'], () => 0);
    expect(result).toEqual(['b', 'c', 'a']);
  });

  it('returns the same array reference', () => {
    const items = [1, 2, 3];
    expect(shuffle(items)).toBe(items);
  });
});
