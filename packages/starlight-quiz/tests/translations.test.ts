import { describe, expect, it } from 'vitest';

import { STRINGS } from '../lib/strings';
import { Translations } from '../translations';

const englishKeys = new Set(Object.keys(STRINGS));
const locales = Object.keys(Translations);

describe('translations', () => {
  it('ships English as the source of truth', () => {
    expect(Translations.en).toEqual({ ...STRINGS });
  });

  it.each(locales)('locale "%s" only overlays known English keys', (locale) => {
    // Locales are partial: each overlays only the keys it translates and
    // Starlight falls back to the English base for the rest.
    for (const key of Object.keys(Translations[locale]!)) {
      expect(englishKeys, `${locale}.${key}`).toContain(key);
    }
  });

  it.each(locales)('locale "%s" has no empty strings', (locale) => {
    for (const [key, value] of Object.entries(Translations[locale]!)) {
      expect(value, `${locale}.${key}`).toBeTruthy();
    }
  });

  it('ships the mkdocs-quiz locales', () => {
    // The .po files are copied verbatim from mkdocs-quiz, so all of its locales ship.
    expect(locales).toEqual(
      expect.arrayContaining(['en', 'de', 'eo', 'es', 'fr', 'hi', 'id', 'ja', 'ko', 'no', 'pt-br', 'sv', 'zh']),
    );
  });

  it('ports shared translations from the .po files', () => {
    expect(Translations.fr?.['starlightQuiz.submit']).toBe('Soumettre');
    expect(Translations.ja?.['starlightQuiz.results.excellent']).toBe('素晴らしい！完璧です！');
    // A starlight-only string keeps its curated translation.
    expect(Translations.de?.['starlightQuiz.results.resetAll']).toBe('Alle Antworten zurücksetzen');
  });
});
