import { describe, expect, it } from 'vitest';

import { STRINGS } from '../lib/strings';
import { Translations } from '../translations';

const englishKeys = Object.keys(STRINGS).sort();

describe('translations', () => {
  it('ships English as the source of truth', () => {
    expect(Translations.en).toEqual({ ...STRINGS });
  });

  it.each(Object.keys(Translations))('locale "%s" defines exactly the English keys', (locale) => {
    const keys = Object.keys(Translations[locale]!).sort();
    expect(keys).toEqual(englishKeys);
  });

  it.each(Object.keys(Translations))('locale "%s" has no empty strings', (locale) => {
    for (const [key, value] of Object.entries(Translations[locale]!)) {
      expect(value, `${locale}.${key}`).toBeTruthy();
    }
  });

  it('ships at least English plus three more locales', () => {
    expect(Object.keys(Translations).length).toBeGreaterThanOrEqual(4);
  });
});
