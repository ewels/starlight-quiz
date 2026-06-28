import { describe, expect, it } from 'vitest';

import { formatValidationError, validateQuizHtml } from '../lib/validate';

const valid = `<sl-quiz id="ok"><div class="sl-quiz-source"><p>Q</p>
<ul class="contains-task-list">
<li class="task-list-item"><input type="checkbox" checked disabled> Right</li>
<li class="task-list-item"><input type="checkbox" disabled> Wrong</li>
</ul></div></sl-quiz>`;

const malformed = `<sl-quiz id="bad"><div class="sl-quiz-source"><p>Q</p>
<ul class="contains-task-list">
<li class="task-list-item"><input type="checkbox" checked disabled> Right</li>
<li>[o] typo marker</li>
<li>[] empty</li>
</ul></div></sl-quiz>`;

describe('validateQuizHtml', () => {
  it('passes a well-formed quiz', () => {
    expect(validateQuizHtml(valid, '/p/')).toEqual([]);
  });

  it('reports each list item without a checkbox', () => {
    const issues = validateQuizHtml(malformed, '/p/');
    expect(issues).toHaveLength(2);
    expect(issues[0]).toMatchObject({ page: '/p/', id: 'bad' });
    expect(issues[0]?.message).toContain('[o] typo marker');
    expect(issues[1]?.message).toContain('[] empty');
  });

  it('ignores pages without quizzes', () => {
    expect(validateQuizHtml('<p>nothing here</p>', '/p/')).toEqual([]);
  });

  it('does not flag a plain (non-task) list elsewhere in the quiz content', () => {
    const html = `<sl-quiz id="c"><div class="sl-quiz-source"><p>Q</p>
<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked disabled> A</li></ul>
<ul><li>a content bullet</li></ul></div></sl-quiz>`;
    expect(validateQuizHtml(html, '/p/')).toEqual([]);
  });
});

describe('formatValidationError', () => {
  it('summarises issues into one message', () => {
    const msg = formatValidationError([{ page: '/p/', id: 'q', message: 'broken' }]);
    expect(msg).toContain('1 malformed quiz answer');
    expect(msg).toContain('/p/ (quiz "q"): broken');
  });
});
