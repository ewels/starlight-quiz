import type { QuizType } from './types';

/** Matches a fill-in-the-blank token, e.g. `[[mitochondria]]`. */
export const BLANK_PATTERN = /\[\[([^\]]+)\]\]/g;

/** True if the given text contains at least one `[[blank]]` token. */
export function hasBlank(text: string): boolean {
  BLANK_PATTERN.lastIndex = 0;
  return BLANK_PATTERN.test(text);
}

/**
 * Find the GFM task list that holds the answers, i.e. the first `<ul>`
 * containing checkbox inputs. Astro renders `- [x]` / `- [ ]` items as
 * `<li><input type="checkbox" disabled ...></li>`.
 */
export function findAnswerList(root: ParentNode): HTMLUListElement | null {
  const lists = root.querySelectorAll('ul');
  for (const list of lists) {
    if (list.querySelector(':scope > li input[type="checkbox"]')) {
      return list as HTMLUListElement;
    }
  }
  return null;
}

/**
 * Determine the quiz type from its authored source.
 *
 * Fill-in-the-blank wins if any `[[blank]]` token is present (mirroring the
 * original mkdocs-quiz precedence). Otherwise the answer count decides between
 * a single-choice (radio) and multiple-choice (checkbox) quiz: more than one
 * correct answer means multiple choice.
 */
export function detectType(root: HTMLElement): QuizType {
  if (hasBlank(root.textContent ?? '')) return 'blank';
  const list = findAnswerList(root);
  if (!list) return 'single';
  const checkboxes = list.querySelectorAll<HTMLInputElement>(':scope > li input[type="checkbox"]');
  let correct = 0;
  for (const box of checkboxes) {
    if (box.checked) correct++;
  }
  return correct > 1 ? 'multiple' : 'single';
}

/**
 * Split a list of sibling nodes at the first `<hr>` (rendered from `---`).
 * Everything before the rule is the question/answers region; everything after
 * is the post-answer explanation. When there is no rule, `content` is empty.
 */
export function splitAtRule(nodes: Node[]): { body: Node[]; content: Node[] } {
  const ruleIndex = nodes.findIndex((node) => node instanceof HTMLElement && node.tagName === 'HR');
  if (ruleIndex === -1) return { body: nodes, content: [] };
  return {
    body: nodes.slice(0, ruleIndex),
    content: nodes.slice(ruleIndex + 1),
  };
}
