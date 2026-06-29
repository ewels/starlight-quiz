import { parse } from 'node-html-parser';

import type { HTMLElement as ParsedElement } from 'node-html-parser';

// Explicit .ts extension: this module is shared by manifest.ts and validate.ts,
// which run directly under Node (the CLI and build integration) via type-stripping.
import { isEmptyCheckboxText } from './parse.ts';

/** A `<sl-quiz>` element paired with its server-rendered `.sl-quiz-source` markup. */
export interface QuizSource {
  /** The quiz id, or `fallback` when the element has none. */
  id: string;
  /** The `<sl-quiz>` element itself. */
  el: ParsedElement;
  /** The `.sl-quiz-source` container holding the authored markdown. */
  source: ParsedElement;
}

/** Collapse runs of whitespace to single spaces and trim. */
export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Parse a page's built HTML and yield each `<sl-quiz>` paired with its source
 * container, skipping any element missing one. Both the manifest builder and
 * the validator read quizzes this way, so the `<sl-quiz>` → `.sl-quiz-source`
 * lookup lives here.
 */
export function eachQuizSource(html: string, fallbackId = ''): QuizSource[] {
  const root = parse(html);
  const quizzes: QuizSource[] = [];
  for (const el of root.querySelectorAll('sl-quiz')) {
    const source = el.querySelector('.sl-quiz-source');
    if (!source) continue;
    quizzes.push({ id: el.getAttribute('id') ?? fallbackId, el, source });
  }
  return quizzes;
}

/**
 * True if a task-list item is an answer: it either has a rendered checkbox
 * (`- [x]`/`- [ ]`) or starts with the `[]` empty-checkbox marker that GFM
 * leaves as plain text. An item that is neither carries an unrecognised marker.
 *
 * The runtime element applies the same rule (quiz-element.ts `#buildChoices`),
 * but can't share this: that path runs in the browser over live `HTMLLIElement`
 * nodes, whereas this module is Node-only (it imports `node-html-parser`). The
 * shared seam they do reuse is `isEmptyCheckboxText` from parse.ts.
 */
export function isAnswerItem(li: ParsedElement): boolean {
  return Boolean(li.querySelector('input[type="checkbox"]')) || isEmptyCheckboxText(li.text);
}
