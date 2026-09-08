/**
 * Generate `translations.ts` from the gettext `.po` files in `locales/`.
 *
 * starlight-quiz keeps its own namespaced string keys (e.g.
 * `starlightQuiz.submit`) for safe injection into Starlight's i18n, so this
 * script maps each key to its msgid (the English source string) and pulls the
 * translated value across.
 *
 * Most of those msgids are shared with mkdocs-quiz, and that part of each
 * `.po` file is kept byte-identical to the sibling plugin's so the two read
 * the same way. The strings belonging to UI mkdocs-quiz does not have (the
 * intro panel, the ToC badge, the page-wide reset and its confirm prompt) are
 * appended in a marked block at the end of the same file — inert there, since
 * mkdocs-quiz loads a `.po` into a dict and looks up only the msgids it knows,
 * and it keeps translators working in one file.
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

/** starlight-quiz key -> msgid (the English source string) in the `.po` files. */
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
  'starlightQuiz.results.answered': 'Answered:',
  'starlightQuiz.progressCorrect': 'Correct:',
  'starlightQuiz.results.questionsAnswered': 'questions answered',
  'starlightQuiz.results.correct': 'correct',
  'starlightQuiz.results.excellent': 'Outstanding! You aced it!',
  'starlightQuiz.results.good': 'Great job! You really know your stuff!',
  'starlightQuiz.results.average': 'Good effort! Keep learning!',
  'starlightQuiz.results.poor': "Not bad, but there's room for improvement!",
  'starlightQuiz.results.fail': 'Better luck next time! Keep trying!',
  // starlight-quiz-only strings; the msgid is the English source verbatim.
  'starlightQuiz.intro.text':
    "Quiz answers on this page are saved to your browser's local storage and persist between visits.",
  'starlightQuiz.results.badge': 'Quiz',
  'starlightQuiz.results.resetAll': 'Reset all answers',
  'starlightQuiz.results.confirmReset': 'Reset every answer on this page? This cannot be undone.',
};

/**
 * msgids whose mkdocs wording carries punctuation that starlight-quiz renders
 * in the markup instead. `Answered:` and `Correct:` label the counts in both
 * plugins, but here the colon lives in `QuizProgress.astro`, so strip it —
 * along with any space before it, since French writes "Correctes :".
 */
const STRIP_TRAILING_COLON = new Set<StringKey>(['starlightQuiz.results.answered', 'starlightQuiz.progressCorrect']);

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

/**
 * Build one locale's table: only keys that genuinely differ from English.
 *
 * `missing` lists the keys the locale has no value for at all — those are real
 * gaps. A key whose translation happens to equal the English source ("Quiz" in
 * German) is covered, not missing: it is left out of the table so Starlight
 * falls back to the English base.
 */
function buildLocale(po: Record<string, string>): {
  table: Partial<Record<StringKey, string>>;
  missing: StringKey[];
} {
  const table: Partial<Record<StringKey, string>> = {};
  const missing: StringKey[] = [];
  for (const key of Object.keys(STRINGS) as StringKey[]) {
    const msgid = KEY_TO_MSGID[key];
    const raw = msgid && po[msgid]?.trim() ? po[msgid] : undefined;
    const value = raw !== undefined && STRIP_TRAILING_COLON.has(key) ? raw.replace(/\s*:\s*$/, '') : raw;
    if (value === undefined) missing.push(key);
    else if (value !== STRINGS[key]) table[key] = value;
  }
  return { table, missing };
}

const files = readdirSync(localesDir)
  .filter((f) => f.endsWith('.po'))
  .sort();

const tables: Record<string, Partial<Record<StringKey, string>>> = {};
const gaps: Record<string, StringKey[]> = {};
for (const file of files) {
  const code = file.replace(/\.po$/, '').toLowerCase(); // mkdocs `pt-BR` -> Starlight `pt-br`
  const po = parsePo(readFileSync(join(localesDir, file), 'utf8'));
  const { table, missing } = buildLocale(po);
  if (Object.keys(table).length > 0) tables[code] = table;
  gaps[code] = missing;
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

// Coverage report — how many of the source strings each locale has a value for.
const totalKeys = Object.keys(STRINGS).length;
const codes = Object.keys(gaps).sort();
console.log(`Wrote ${outFile} — en + ${Object.keys(tables).length} locales.\n`);
console.log(`Coverage (translated / ${totalKeys} strings):`);
for (const code of codes) {
  const missing = gaps[code]!;
  const covered = totalKeys - missing.length;
  const pct = Math.round((covered / totalKeys) * 100);
  const note = missing.length > 0 ? `  missing: ${missing.join(', ')}` : '';
  console.log(`  ${code.padEnd(6)} ${String(covered).padStart(2)}/${totalKeys}  ${String(pct).padStart(3)}%${note}`);
}
const incomplete = codes.filter((code) => gaps[code]!.length > 0);
if (incomplete.length > 0) {
  // The locale's .po file is missing msgids, or leaves their msgstr empty.
  console.warn(`\nWarning: incomplete locales: ${incomplete.join(', ')}`);
}
