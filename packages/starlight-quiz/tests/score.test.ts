import { describe, expect, it } from 'vitest';

import { computeProgress, isComplete, SCORE_TIERS, tierForScore } from '../lib/score';

describe('tierForScore', () => {
  it('maps scores to the right tier', () => {
    expect(tierForScore(100).key).toBe('excellent');
    expect(tierForScore(90).key).toBe('excellent');
    expect(tierForScore(89).key).toBe('good');
    expect(tierForScore(75).key).toBe('good');
    expect(tierForScore(60).key).toBe('average');
    expect(tierForScore(40).key).toBe('poor');
    expect(tierForScore(39).key).toBe('fail');
    expect(tierForScore(0).key).toBe('fail');
  });

  it('always resolves a tier', () => {
    for (let score = 0; score <= 100; score++) {
      expect(SCORE_TIERS).toContainEqual(tierForScore(score));
    }
  });
});

describe('computeProgress', () => {
  it('computes percentage and score against the total', () => {
    const progress = computeProgress(4, 2, 1);
    expect(progress).toMatchObject({ total: 4, answered: 2, correct: 1, percentage: 50, score: 25 });
  });

  it('handles an empty page without dividing by zero', () => {
    expect(computeProgress(0, 0, 0)).toMatchObject({ percentage: 0, score: 0 });
  });
});

describe('isComplete', () => {
  it('is true only when every quiz is answered', () => {
    expect(isComplete(computeProgress(2, 2, 1))).toBe(true);
    expect(isComplete(computeProgress(2, 1, 1))).toBe(false);
    expect(isComplete(computeProgress(0, 0, 0))).toBe(false);
  });
});
