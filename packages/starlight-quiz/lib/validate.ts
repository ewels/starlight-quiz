import { HTMLElement as ParsedElement, parse } from 'node-html-parser';

import { isEmptyCheckboxText } from './parse.ts';

/** A problem found in an authored quiz. */
export interface QuizValidationIssue {
  /** Site-relative page the quiz is on. */
  page: string;
  /** The quiz id. */
  id: string;
  /** Human-readable description of the problem. */
  message: string;
}

function directChildren(parent: ParsedElement, tag: string): ParsedElement[] {
  return parent.childNodes.filter(
    (node): node is ParsedElement => node instanceof ParsedElement && node.tagName?.toLowerCase() === tag,
  );
}

/**
 * Validate the `<sl-quiz>` markup on a built page and return any problems.
 *
 * Because quizzes are authored as markdown task lists, an unrecognised checkbox
 * marker (e.g. `[y]`, `[o]`, `[✓]`) is not rendered as a checkbox by GFM — it
 * becomes a plain list item that would silently never be an answer. We treat
 * that as an authoring error so it fails the build rather than vanishing. The
 * sole exception is `[]` (no inner space), which we accept as an unchecked
 * answer to match the original mkdocs-quiz.
 */
export function validateQuizHtml(html: string, page: string): QuizValidationIssue[] {
  const root = parse(html);
  const issues: QuizValidationIssue[] = [];

  for (const el of root.querySelectorAll('sl-quiz')) {
    const source = el.querySelector('.sl-quiz-source');
    if (!source) continue;
    const id = el.getAttribute('id') ?? '(unknown)';

    const taskLists = source.querySelectorAll('ul.contains-task-list');
    for (const list of taskLists) {
      for (const li of directChildren(list, 'li')) {
        if (!li.querySelector('input[type="checkbox"]') && !isEmptyCheckboxText(li.text)) {
          const text = li.text.replace(/\s+/g, ' ').trim().slice(0, 60);
          issues.push({
            page,
            id,
            message: `answer "${text}" has no checkbox — only \`- [x]\`, \`- [ ]\` and \`- [X]\` mark answers`,
          });
        }
      }
    }
  }

  return issues;
}

/** Format a list of issues into a single build-error message. */
export function formatValidationError(issues: QuizValidationIssue[]): string {
  const lines = issues.map((issue) => `  • ${issue.page} (quiz "${issue.id}"): ${issue.message}`);
  return `starlight-quiz found ${issues.length} malformed quiz answer${issues.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}
