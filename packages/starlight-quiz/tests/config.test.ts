import { describe, expect, it } from 'vitest';

import { DEFAULT_QUIZ_DEFAULTS, getQuizDefaults } from '../lib/config';

describe('getQuizDefaults', () => {
  it('returns the built-in defaults when locals carry nothing', () => {
    expect(getQuizDefaults(undefined)).toEqual(DEFAULT_QUIZ_DEFAULTS);
    expect(getQuizDefaults(null)).toEqual(DEFAULT_QUIZ_DEFAULTS);
    expect(getQuizDefaults({})).toEqual(DEFAULT_QUIZ_DEFAULTS);
    expect(getQuizDefaults({ starlightQuiz: {} })).toEqual(DEFAULT_QUIZ_DEFAULTS);
  });

  it('merges overrides from locals over the built-ins', () => {
    const merged = getQuizDefaults({ starlightQuiz: { defaults: { confetti: false, shuffle: true } } });
    expect(merged.confetti).toBe(false);
    expect(merged.shuffle).toBe(true);
    // Untouched keys keep their built-in value.
    expect(merged.autoSubmit).toBe(true);
    expect(merged.showCorrect).toBe(true);
  });

  it('ignores a malformed holder', () => {
    expect(getQuizDefaults({ starlightQuiz: 'nope' })).toEqual(DEFAULT_QUIZ_DEFAULTS);
    expect(getQuizDefaults({ starlightQuiz: { defaults: 42 } })).toEqual(DEFAULT_QUIZ_DEFAULTS);
  });
});
