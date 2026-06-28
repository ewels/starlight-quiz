import { HTMLElement as ParsedElement, parse } from 'node-html-parser';

// Explicit .ts extensions on runtime relative imports so this module runs both
// under Vite (the build integration) and directly under Node (the CLI).
import { BLANK_PATTERN, isEmptyCheckboxText, stripEmptyCheckbox } from './parse.ts';
import type { QuizType } from './types.ts';

/** A single answer in a choice quiz. */
export interface ManifestAnswer {
  text: string;
  correct: boolean;
  feedback?: string;
}

/** A structured record of one quiz, suitable for export or a terminal runner. */
export interface QuizManifestEntry {
  /** Stable quiz id. */
  id: string;
  /** Title, if the author gave one. */
  title?: string;
  /** Question type. */
  type: QuizType;
  /** Site-relative path of the page the quiz appears on. */
  page: string;
  /** The question text (plain text). */
  question: string;
  /** Answers, for single- and multiple-choice quizzes. */
  answers?: ManifestAnswer[];
  /** Expected answers, for fill-in-the-blank quizzes, in order. */
  blanks?: string[];
  /** Optional post-answer explanation (plain text). */
  explanation?: string;
}

/** The build-time manifest of every quiz across a site. */
export interface QuizManifest {
  /** Manifest schema version. */
  version: 1;
  /** ISO timestamp of when the manifest was generated, if provided. */
  generatedAt?: string;
  /** Every quiz found, in document order per page. */
  quizzes: QuizManifestEntry[];
}

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Text content of the sibling nodes before `stop` (exclusive). */
function textBefore(parent: ParsedElement, stop: ParsedElement | null): string {
  const parts: string[] = [];
  for (const node of parent.childNodes) {
    if (stop && node === stop) break;
    parts.push(node.text);
  }
  return collapse(parts.join(' '));
}

/** Text content of the sibling nodes after `start`, skipping `<hr>` rules. */
function textAfter(parent: ParsedElement, start: ParsedElement | null): string {
  const parts: string[] = [];
  let seen = start === null;
  for (const node of parent.childNodes) {
    if (!seen) {
      if (node === start) seen = true;
      continue;
    }
    if (node instanceof ParsedElement && node.tagName?.toLowerCase() === 'hr') continue;
    parts.push(node.text);
  }
  return collapse(parts.join(' '));
}

function firstRule(source: ParsedElement): ParsedElement | null {
  for (const node of source.childNodes) {
    if (node instanceof ParsedElement && node.tagName?.toLowerCase() === 'hr') return node;
  }
  return null;
}

function extractBlanks(text: string): string[] {
  const answers: string[] = [];
  BLANK_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BLANK_PATTERN.exec(text)) !== null) {
    answers.push((match[1] ?? '').trim());
  }
  return answers;
}

function parseChoice(
  source: ParsedElement,
  list: ParsedElement,
): Pick<QuizManifestEntry, 'answers' | 'question' | 'explanation' | 'type'> {
  const items = list
    .querySelectorAll('li')
    .filter((li) => li.querySelector('input[type="checkbox"]') || isEmptyCheckboxText(li.text));
  const answers: ManifestAnswer[] = items.map((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const correct = checkbox?.hasAttribute('checked') ?? false;
    const blockquote = li.querySelector('blockquote');
    const feedback = blockquote ? collapse(blockquote.text) : undefined;
    blockquote?.remove();
    checkbox?.remove();
    // `[]` empty-checkbox answers have no input; strip the plain-text marker.
    const answer: ManifestAnswer = { text: stripEmptyCheckbox(collapse(li.text)), correct };
    if (feedback) answer.feedback = feedback;
    return answer;
  });
  const correctCount = answers.filter((a) => a.correct).length;
  const explanation = textAfter(source, list);
  return {
    type: correctCount > 1 ? 'multiple' : 'single',
    question: textBefore(source, list),
    answers,
    ...(explanation ? { explanation } : {}),
  };
}

/**
 * Extract structured quiz records from a page's built HTML.
 *
 * Reads the server-rendered `<sl-quiz>` markup — which preserves the authoring
 * data (checked task-list items mark correct answers, `[[…]]` tokens mark
 * blanks) — so no MDX or runtime DOM is needed.
 */
export function extractQuizzesFromHtml(html: string, page: string): QuizManifestEntry[] {
  const root = parse(html);
  const entries: QuizManifestEntry[] = [];

  for (const el of root.querySelectorAll('sl-quiz')) {
    const source = el.querySelector('.sl-quiz-source');
    if (!source) continue;

    const id = el.getAttribute('id') ?? '';
    const title = el.querySelector('.sl-quiz-title')?.text.trim();
    const base: Pick<QuizManifestEntry, 'id' | 'page'> & { title?: string } = { id, page };
    if (title) base.title = title;

    if (BLANK_PATTERN.test(source.text)) {
      const rule = firstRule(source);
      const question = textBefore(source, rule);
      const blanks = extractBlanks(question);
      const explanation = rule ? textAfter(source, rule) : '';
      entries.push({ ...base, type: 'blank', question, blanks, ...(explanation ? { explanation } : {}) });
      continue;
    }

    const list = source.querySelector('ul.contains-task-list') ?? source.querySelector('ul');
    if (!list) continue;
    entries.push({ ...base, ...parseChoice(source, list) });
  }

  return entries;
}

/** Assemble a manifest from extracted entries. */
export function buildManifest(quizzes: QuizManifestEntry[], generatedAt?: string): QuizManifest {
  return { version: 1, ...(generatedAt ? { generatedAt } : {}), quizzes };
}
