/**
 * Generate `translations.ts` from the gettext `.po` files in `locales/`.
 *
 * The `.po` files are copied verbatim from mkdocs-quiz so the two sibling
 * plugins share one set of translations. starlight-quiz keeps its own
 * namespaced string keys (e.g. `starlightQuiz.submit`) for safe injection into
 * Starlight's i18n, so this script maps each key to the corresponding mkdocs
 * msgid (the English source string) and pulls the translated value across.
 *
 * Strings with no mkdocs counterpart (the intro text, the reset-all confirm,
 * etc.) keep the hand-written translations in CURATED below.
 *
 * Run with: `pnpm --filter starlight-quiz gen:i18n`
 * (Node strips the types: `node --experimental-strip-types`.)
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { STRINGS, type StringKey } from '../lib/strings.ts';

const here = dirname(fileURLToPath(import.meta.url));
const localesDir = join(here, '..', 'locales');
const outFile = join(here, '..', 'translations.ts');

/** starlight-quiz key -> mkdocs-quiz msgid (the English source string). */
const KEY_TO_MSGID: Partial<Record<StringKey, string>> = {
  'starlightQuiz.questionNumber': 'Question {n}',
  'starlightQuiz.submit': 'Submit',
  'starlightQuiz.reset': 'Reset',
  'starlightQuiz.correct': 'Correct answer!',
  'starlightQuiz.incorrect': 'Incorrect answer.',
  'starlightQuiz.tryAgain': 'Incorrect answer. Please try again.',
  'starlightQuiz.empty': '(empty)',
  'starlightQuiz.results.title': 'Quiz Complete!',
  'starlightQuiz.progressHeading': 'Quiz Progress',
  'starlightQuiz.results.questionsAnswered': 'questions answered',
  'starlightQuiz.results.correct': 'correct',
  'starlightQuiz.results.excellent': 'Outstanding! You aced it!',
  'starlightQuiz.results.good': 'Great job! You really know your stuff!',
  'starlightQuiz.results.average': 'Good effort! Keep learning!',
  'starlightQuiz.results.poor': "Not bad, but there's room for improvement!",
  'starlightQuiz.results.fail': 'Better luck next time! Keep trying!',
};

/**
 * Hand-written translations for strings that have no mkdocs msgid. Locales not
 * listed here fall back to English for these keys (Starlight overlays the
 * locale table on top of the English base).
 */
const CURATED: Record<string, Partial<Record<StringKey, string>>> = {
  fr: {
    'starlightQuiz.intro.text':
      'Les réponses de cette page sont enregistrées dans le stockage local de votre navigateur et persistent entre les visites.',
    'starlightQuiz.results.progress': 'Progression',
    'starlightQuiz.results.answered': 'répondues',
    'starlightQuiz.results.resetAll': 'Réinitialiser toutes les réponses',
    'starlightQuiz.results.confirmReset':
      'Réinitialiser toutes les réponses de cette page ? Cette action est irréversible.',
  },
  de: {
    'starlightQuiz.intro.text':
      'Die Antworten auf dieser Seite werden im lokalen Speicher deines Browsers gespeichert und bleiben zwischen Besuchen erhalten.',
    'starlightQuiz.results.progress': 'Fortschritt',
    'starlightQuiz.results.answered': 'beantwortet',
    'starlightQuiz.results.resetAll': 'Alle Antworten zurücksetzen',
    'starlightQuiz.results.confirmReset':
      'Alle Antworten auf dieser Seite zurücksetzen? Dies kann nicht rückgängig gemacht werden.',
  },
  es: {
    'starlightQuiz.intro.text':
      'Las respuestas de esta página se guardan en el almacenamiento local de tu navegador y se conservan entre visitas.',
    'starlightQuiz.results.progress': 'Progreso',
    'starlightQuiz.results.answered': 'respondidas',
    'starlightQuiz.results.resetAll': 'Reiniciar todas las respuestas',
    'starlightQuiz.results.confirmReset':
      '¿Reiniciar todas las respuestas de esta página? Esta acción no se puede deshacer.',
  },
};

/** Parse a gettext `.po` file into a `{ msgid: msgstr }` map. */
function parsePo(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  let id: string | null = null;
  let str: string | null = null;
  let mode: 'id' | 'str' | null = null;

  const unquote = (s: string): string =>
    s.trim().replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');

  const flush = (): void => {
    if (id) out[id] = str ?? '';
    id = null;
    str = null;
    mode = null;
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('#') || line === '') continue;
    if (line.startsWith('msgid ')) {
      flush();
      id = unquote(line.slice('msgid '.length));
      mode = 'id';
    } else if (line.startsWith('msgstr ')) {
      str = unquote(line.slice('msgstr '.length));
      mode = 'str';
    } else if (line.startsWith('"')) {
      if (mode === 'id') id = (id ?? '') + unquote(line);
      else if (mode === 'str') str = (str ?? '') + unquote(line);
    }
  }
  flush();
  return out;
}

/** Build one locale's table: only keys that genuinely differ from English. */
function buildLocale(po: Record<string, string>, curated: Partial<Record<StringKey, string>>) {
  const table: Partial<Record<StringKey, string>> = {};
  for (const key of Object.keys(STRINGS) as StringKey[]) {
    const msgid = KEY_TO_MSGID[key];
    const fromPo = msgid ? po[msgid] : undefined;
    const value = fromPo && fromPo.trim() !== '' ? fromPo : curated[key];
    if (value !== undefined && value !== STRINGS[key]) table[key] = value;
  }
  return table;
}

const files = readdirSync(localesDir)
  .filter((f) => f.endsWith('.po'))
  .sort();

const tables: Record<string, Partial<Record<StringKey, string>>> = {};
for (const file of files) {
  const code = file.replace(/\.po$/, '').toLowerCase(); // mkdocs `pt-BR` -> Starlight `pt-br`
  const po = parsePo(readFileSync(join(localesDir, file), 'utf8'));
  const table = buildLocale(po, CURATED[code] ?? CURATED[code.split('-')[0]!] ?? {});
  if (Object.keys(table).length > 0) tables[code] = table;
}

const body = Object.entries(tables)
  .map(([code, table]) => {
    const entries = Object.entries(table)
      .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
      .join('\n');
    return `  ${JSON.stringify(code)}: {\n${entries}\n  },`;
  })
  .join('\n');

const output = `// GENERATED by scripts/build-i18n.ts from the .po files in locales/ — do not edit by hand.
// Run \`pnpm --filter starlight-quiz gen:i18n\` after editing a .po file.
import { STRINGS } from './lib/strings';

/**
 * Translation tables injected into Starlight via the \`i18n:setup\` hook. English
 * is the single source of truth in \`lib/strings.ts\`; each locale overlays only
 * the keys it translates (Starlight falls back to English for the rest).
 */
export const Translations: Record<string, Record<string, string>> = {
  en: { ...STRINGS },
${body}
};
`;

writeFileSync(outFile, output);

// Coverage report — how many of the source strings each locale translates.
const totalKeys = Object.keys(STRINGS).length;
const codes = Object.keys(tables).sort();
console.log(`Wrote ${outFile} — en + ${codes.length} locales.\n`);
console.log(`Coverage (translated / ${totalKeys} strings):`);
const empty: string[] = [];
for (const code of codes) {
  const translated = Object.keys(tables[code]!).length;
  const pct = Math.round((translated / totalKeys) * 100);
  console.log(`  ${code.padEnd(6)} ${String(translated).padStart(2)}/${totalKeys}  ${String(pct).padStart(3)}%`);
  if (translated === 0) empty.push(code);
}
if (empty.length > 0) {
  // A locale that translates nothing usually means a broken or empty .po file.
  console.warn(`\nWarning: no translations found for: ${empty.join(', ')}`);
}
