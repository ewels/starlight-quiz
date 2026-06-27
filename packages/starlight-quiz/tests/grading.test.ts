import { describe, expect, it } from 'vitest';

import { gradeBlank, gradeBlanks, gradeChoice, normaliseBlank } from '../lib/grading';

describe('gradeChoice', () => {
  it('is correct when the selection exactly matches the correct set', () => {
    expect(gradeChoice([1], [1])).toBe(true);
    expect(gradeChoice([0, 2], [2, 0])).toBe(true);
  });

  it('is incorrect when a correct answer is missing', () => {
    expect(gradeChoice([0], [0, 2])).toBe(false);
  });

  it('is incorrect when an extra answer is chosen', () => {
    expect(gradeChoice([0, 1], [0])).toBe(false);
  });

  it('is incorrect when nothing is selected', () => {
    expect(gradeChoice([], [1])).toBe(false);
  });
});

describe('normaliseBlank', () => {
  it('trims and lower-cases', () => {
    expect(normaliseBlank('  Mitochondria  ')).toBe('mitochondria');
  });
});

describe('gradeBlank', () => {
  it('is case- and whitespace-insensitive', () => {
    expect(gradeBlank(' H2O ', 'h2o')).toBe(true);
    expect(gradeBlank('water', 'h2o')).toBe(false);
  });
});

describe('gradeBlanks', () => {
  it('requires every blank to match', () => {
    expect(gradeBlanks(['h2o', 'oxygen'], ['H2O', 'Oxygen'])).toBe(true);
    expect(gradeBlanks(['h2o', 'nitrogen'], ['H2O', 'Oxygen'])).toBe(false);
  });

  it('is incorrect when there are no blanks', () => {
    expect(gradeBlanks([], [])).toBe(false);
  });
});
