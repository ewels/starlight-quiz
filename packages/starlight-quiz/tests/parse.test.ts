import { describe, expect, it } from 'vitest';

import {
  detectType,
  findAnswerList,
  hasBlank,
  isEmptyCheckboxText,
  splitAtRule,
  stripEmptyCheckbox,
} from '../lib/parse';

function fromHtml(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

const TASK_LIST = `
<p>Question?</p>
<ul class="contains-task-list">
  <li class="task-list-item"><input type="checkbox" disabled> A</li>
  <li class="task-list-item"><input type="checkbox" checked disabled> B</li>
</ul>`;

describe('hasBlank', () => {
  it('detects [[blank]] tokens', () => {
    expect(hasBlank('The cell is the [[mitochondria]].')).toBe(true);
    expect(hasBlank('No blanks here.')).toBe(false);
  });
});

describe('findAnswerList', () => {
  it('finds the task list containing checkboxes', () => {
    const root = fromHtml(TASK_LIST);
    expect(findAnswerList(root)?.tagName).toBe('UL');
  });

  it('returns null when there is no task list', () => {
    expect(findAnswerList(fromHtml('<p>Just text</p>'))).toBeNull();
  });
});

describe('detectType', () => {
  it('is blank when a token is present, even alongside a list', () => {
    expect(detectType(fromHtml('<p>[[x]] and a list</p>' + TASK_LIST))).toBe('blank');
  });

  it('is single when exactly one answer is correct', () => {
    expect(detectType(fromHtml(TASK_LIST))).toBe('single');
  });

  it('is multiple when more than one answer is correct', () => {
    const html = `<ul class="contains-task-list">
      <li class="task-list-item"><input type="checkbox" checked disabled> A</li>
      <li class="task-list-item"><input type="checkbox" checked disabled> B</li>
    </ul>`;
    expect(detectType(fromHtml(html))).toBe('multiple');
  });
});

describe('empty checkbox `[]`', () => {
  it('recognises a leading `[]` marker', () => {
    expect(isEmptyCheckboxText('[] an answer')).toBe(true);
    expect(isEmptyCheckboxText('[]no space')).toBe(true);
    expect(isEmptyCheckboxText('  [] leading space')).toBe(true);
  });

  it('does not match other markers or mid-text brackets', () => {
    expect(isEmptyCheckboxText('[x] checked')).toBe(false);
    expect(isEmptyCheckboxText('[ ] spaced')).toBe(false);
    expect(isEmptyCheckboxText('[y] typo')).toBe(false);
    expect(isEmptyCheckboxText('an [] in the middle')).toBe(false);
  });

  it('strips the leading `[]` marker from a label', () => {
    expect(stripEmptyCheckbox('[] an answer')).toBe('an answer');
    expect(stripEmptyCheckbox('[]no space')).toBe('no space');
    expect(stripEmptyCheckbox('[x] untouched')).toBe('[x] untouched');
  });
});

describe('splitAtRule', () => {
  it('splits sibling nodes at the first <hr>', () => {
    const root = fromHtml('<p>a</p><hr><p>b</p>');
    const { body, content } = splitAtRule(Array.from(root.childNodes));
    expect(body).toHaveLength(1);
    expect(content).toHaveLength(1);
    expect((content[0] as HTMLElement).textContent).toBe('b');
  });

  it('puts everything in the body when there is no rule', () => {
    const root = fromHtml('<p>a</p><p>b</p>');
    const { body, content } = splitAtRule(Array.from(root.childNodes));
    expect(body).toHaveLength(2);
    expect(content).toHaveLength(0);
  });
});
