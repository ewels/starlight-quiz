import { describe, expect, it } from 'vitest';

import { getTranslate, resolveString } from '../lib/i18n';
import { STRINGS } from '../lib/strings';

describe('resolveString', () => {
  it('prefers an explicit override prop', () => {
    expect(resolveString('starlightQuiz.submit', 'Go!', () => 'translated')).toBe('Go!');
  });

  it('uses the translation when one is returned', () => {
    expect(resolveString('starlightQuiz.submit', undefined, () => 'Soumettre')).toBe('Soumettre');
  });

  it('falls back to the English default when there is no translate function', () => {
    expect(resolveString('starlightQuiz.submit', undefined, undefined)).toBe(STRINGS['starlightQuiz.submit']);
  });

  it('falls back when the translate function echoes the key back', () => {
    expect(resolveString('starlightQuiz.submit', undefined, (key) => key)).toBe(STRINGS['starlightQuiz.submit']);
  });

  it('ignores an empty override', () => {
    expect(resolveString('starlightQuiz.reset', '', undefined)).toBe(STRINGS['starlightQuiz.reset']);
  });
});

describe('getTranslate', () => {
  it('returns the t function when present on locals', () => {
    const t = (key: string) => key.toUpperCase();
    expect(getTranslate({ t })).toBe(t);
  });

  it('returns undefined when locals has no t function', () => {
    expect(getTranslate({})).toBeUndefined();
    expect(getTranslate(null)).toBeUndefined();
    expect(getTranslate({ t: 'not a function' })).toBeUndefined();
  });
});
