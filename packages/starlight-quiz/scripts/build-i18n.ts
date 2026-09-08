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
  'starlightQuiz.results.answered': 'Answered:',
  'starlightQuiz.results.questionsAnswered': 'questions answered',
  'starlightQuiz.results.correct': 'correct',
  'starlightQuiz.results.excellent': 'Outstanding! You aced it!',
  'starlightQuiz.results.good': 'Great job! You really know your stuff!',
  'starlightQuiz.results.average': 'Good effort! Keep learning!',
  'starlightQuiz.results.poor': "Not bad, but there's room for improvement!",
  'starlightQuiz.results.fail': 'Better luck next time! Keep trying!',
};

/**
 * msgids whose mkdocs wording carries punctuation that starlight-quiz renders
 * in the markup instead. `Answered:` labels the count in both plugins, but
 * here the colon lives in `QuizProgress.astro`, so strip it — along with any
 * space before it, since French writes "Répondu :".
 */
const STRIP_TRAILING_COLON = new Set<StringKey>(['starlightQuiz.results.answered']);

/**
 * Hand-written translations for the five strings that have no mkdocs msgid
 * (the intro text, the progress and badge labels, the page-wide reset-all
 * button — mkdocs-quiz's `Reset quiz` is the per-quiz one — and the confirm
 * prompt). Every locale shipped in `locales/` is listed here so a gap is
 * visible in this file rather than only in the coverage report.
 *
 * A value identical to the English source is intentional (e.g. "Quiz" is
 * "Quiz" in German) — `buildLocale` drops it from the generated table and
 * Starlight falls back to the English base.
 */
const CURATED: Record<string, Partial<Record<StringKey, string>>> = {
  de: {
    'starlightQuiz.intro.text':
      'Die Antworten auf dieser Seite werden im lokalen Speicher deines Browsers gespeichert und bleiben zwischen Besuchen erhalten.',
    'starlightQuiz.results.progress': 'Fortschritt',
    'starlightQuiz.results.badge': 'Quiz',
    'starlightQuiz.results.resetAll': 'Alle Antworten zurücksetzen',
    'starlightQuiz.results.confirmReset':
      'Alle Antworten auf dieser Seite zurücksetzen? Dies kann nicht rückgängig gemacht werden.',
  },
  eo: {
    'starlightQuiz.intro.text':
      'La respondoj de ĉi tiu paĝo estas konservataj en la loka memoro de via retumilo kaj restas inter vizitoj.',
    'starlightQuiz.results.progress': 'Progreso',
    'starlightQuiz.results.badge': 'Kvizo',
    'starlightQuiz.results.resetAll': 'Restarigi ĉiujn respondojn',
    'starlightQuiz.results.confirmReset': 'Ĉu restarigi ĉiujn respondojn en ĉi tiu paĝo? Tio ne estas malfarebla.',
  },
  es: {
    'starlightQuiz.intro.text':
      'Las respuestas de esta página se guardan en el almacenamiento local de tu navegador y se conservan entre visitas.',
    'starlightQuiz.results.progress': 'Progreso',
    'starlightQuiz.results.badge': 'Cuestionario',
    'starlightQuiz.results.resetAll': 'Reiniciar todas las respuestas',
    'starlightQuiz.results.confirmReset':
      '¿Reiniciar todas las respuestas de esta página? Esta acción no se puede deshacer.',
  },
  fr: {
    'starlightQuiz.intro.text':
      'Les réponses de cette page sont enregistrées dans le stockage local de votre navigateur et persistent entre les visites.',
    'starlightQuiz.results.progress': 'Progression',
    'starlightQuiz.results.badge': 'Quiz',
    'starlightQuiz.results.resetAll': 'Réinitialiser toutes les réponses',
    'starlightQuiz.results.confirmReset':
      'Réinitialiser toutes les réponses de cette page ? Cette action est irréversible.',
  },
  hi: {
    'starlightQuiz.intro.text':
      'इस पृष्ठ के क्विज़ उत्तर आपके ब्राउज़र के लोकल स्टोरेज में सहेजे जाते हैं और अगली विज़िट तक बने रहते हैं।',
    'starlightQuiz.results.progress': 'प्रगति',
    'starlightQuiz.results.badge': 'क्विज़',
    'starlightQuiz.results.resetAll': 'सभी उत्तर रीसेट करें',
    'starlightQuiz.results.confirmReset': 'इस पृष्ठ के सभी उत्तर रीसेट करें? इसे पूर्ववत नहीं किया जा सकता।',
  },
  id: {
    'starlightQuiz.intro.text':
      'Jawaban kuis di halaman ini disimpan di penyimpanan lokal peramban Anda dan tetap tersimpan di antara kunjungan.',
    'starlightQuiz.results.progress': 'Progres',
    'starlightQuiz.results.badge': 'Kuis',
    'starlightQuiz.results.resetAll': 'Atur ulang semua jawaban',
    'starlightQuiz.results.confirmReset':
      'Atur ulang semua jawaban di halaman ini? Tindakan ini tidak dapat dibatalkan.',
  },
  ja: {
    'starlightQuiz.intro.text':
      'このページのクイズの回答はブラウザのローカルストレージに保存され、次回の訪問時にも保持されます。',
    'starlightQuiz.results.progress': '進捗',
    'starlightQuiz.results.badge': 'クイズ',
    'starlightQuiz.results.resetAll': 'すべての回答をリセット',
    'starlightQuiz.results.confirmReset': 'このページのすべての回答をリセットしますか？この操作は元に戻せません。',
  },
  ko: {
    'starlightQuiz.intro.text': '이 페이지의 퀴즈 답변은 브라우저의 로컬 저장소에 저장되어 다시 방문해도 유지됩니다.',
    'starlightQuiz.results.progress': '진행 상황',
    'starlightQuiz.results.badge': '퀴즈',
    'starlightQuiz.results.resetAll': '모든 답변 초기화',
    'starlightQuiz.results.confirmReset': '이 페이지의 모든 답변을 초기화할까요? 이 작업은 되돌릴 수 없습니다.',
  },
  no: {
    'starlightQuiz.intro.text': 'Svarene på denne siden lagres i nettleserens lokale lagring og beholdes mellom besøk.',
    'starlightQuiz.results.progress': 'Fremdrift',
    'starlightQuiz.results.badge': 'Quiz',
    'starlightQuiz.results.resetAll': 'Tilbakestill alle svar',
    'starlightQuiz.results.confirmReset': 'Tilbakestille alle svar på denne siden? Dette kan ikke angres.',
  },
  'pt-br': {
    'starlightQuiz.intro.text':
      'As respostas desta página são salvas no armazenamento local do seu navegador e são mantidas entre as visitas.',
    'starlightQuiz.results.progress': 'Progresso',
    'starlightQuiz.results.badge': 'Quiz',
    'starlightQuiz.results.resetAll': 'Reiniciar todas as respostas',
    'starlightQuiz.results.confirmReset': 'Reiniciar todas as respostas desta página? Esta ação não pode ser desfeita.',
  },
  ru: {
    'starlightQuiz.intro.text':
      'Ответы на этой странице сохраняются в локальном хранилище вашего браузера и остаются доступными между посещениями.',
    'starlightQuiz.results.progress': 'Прогресс',
    'starlightQuiz.results.badge': 'Викторина',
    'starlightQuiz.results.resetAll': 'Сбросить все ответы',
    'starlightQuiz.results.confirmReset': 'Сбросить все ответы на этой странице? Это действие нельзя отменить.',
  },
  sv: {
    'starlightQuiz.intro.text':
      'Svaren på den här sidan sparas i webbläsarens lokala lagring och finns kvar mellan besöken.',
    'starlightQuiz.results.progress': 'Framsteg',
    'starlightQuiz.results.badge': 'Quiz',
    'starlightQuiz.results.resetAll': 'Återställ alla svar',
    'starlightQuiz.results.confirmReset': 'Återställa alla svar på den här sidan? Detta kan inte ångras.',
  },
  zh: {
    'starlightQuiz.intro.text': '本页的测验答案会保存在浏览器的本地存储中，并在下次访问时保留。',
    'starlightQuiz.results.progress': '进度',
    'starlightQuiz.results.badge': '测验',
    'starlightQuiz.results.resetAll': '重置所有答案',
    'starlightQuiz.results.confirmReset': '确定重置本页所有答案吗？此操作无法撤销。',
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

/**
 * Build one locale's table: only keys that genuinely differ from English.
 *
 * `missing` lists the keys the locale has no value for at all — those are real
 * gaps. A key whose translation happens to equal the English source ("Quiz" in
 * German) is covered, not missing: it is left out of the table so Starlight
 * falls back to the English base.
 */
function buildLocale(
  po: Record<string, string>,
  curated: Partial<Record<StringKey, string>>,
): { table: Partial<Record<StringKey, string>>; missing: StringKey[] } {
  const table: Partial<Record<StringKey, string>> = {};
  const missing: StringKey[] = [];
  for (const key of Object.keys(STRINGS) as StringKey[]) {
    const msgid = KEY_TO_MSGID[key];
    const fromPo = msgid ? po[msgid] : undefined;
    const raw = fromPo?.trim() ? fromPo : curated[key];
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
  const { table, missing } = buildLocale(po, CURATED[code] ?? CURATED[code.split('-')[0]!] ?? {});
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
  // Either the .po file is missing msgids or CURATED has no entry for the locale.
  console.warn(`\nWarning: incomplete locales: ${incomplete.join(', ')}`);
}
