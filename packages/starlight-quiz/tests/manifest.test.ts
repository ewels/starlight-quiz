import { describe, expect, it } from 'vitest';

import { buildManifest, extractQuizzesFromHtml } from '../lib/manifest';

const CHOICE = `
<sl-quiz id="q-choice"><p class="sl-quiz-title">Colours</p><div class="sl-quiz-source">
<p>Which are primary?</p>
<ul class="contains-task-list">
<li class="task-list-item"><input type="checkbox" checked disabled> Red</li>
<li class="task-list-item"><input type="checkbox" disabled> Green<blockquote><p>Secondary.</p></blockquote></li>
<li class="task-list-item"><input type="checkbox" checked disabled> Blue</li>
</ul>
<hr><p>Primary colours can't be mixed.</p>
</div></sl-quiz>`;

const SINGLE = `
<sl-quiz id="q-single"><div class="sl-quiz-source"><p>Capital of France?</p>
<ul class="contains-task-list">
<li class="task-list-item"><input type="checkbox" disabled> London</li>
<li class="task-list-item"><input type="checkbox" checked disabled> Paris</li>
</ul></div></sl-quiz>`;

const BLANK = `
<sl-quiz id="q-blank"><div class="sl-quiz-source"><p>Water is [[H2O]] and salt is [[NaCl]].</p></div></sl-quiz>`;

describe('extractQuizzesFromHtml', () => {
  it('extracts a multiple-choice quiz with feedback and explanation', () => {
    const [quiz] = extractQuizzesFromHtml(CHOICE, '/p/');
    expect(quiz).toMatchObject({ id: 'q-choice', title: 'Colours', type: 'multiple', page: '/p/' });
    expect(quiz?.question).toBe('Which are primary?');
    expect(quiz?.answers).toEqual([
      { text: 'Red', correct: true },
      { text: 'Green', correct: false, feedback: 'Secondary.' },
      { text: 'Blue', correct: true },
    ]);
    expect(quiz?.explanation).toBe("Primary colours can't be mixed.");
  });

  it('classifies a single-correct quiz as single', () => {
    const [quiz] = extractQuizzesFromHtml(SINGLE, '/p/');
    expect(quiz?.type).toBe('single');
    expect(quiz?.explanation).toBeUndefined();
  });

  it('extracts fill-in-the-blank answers in order with no false explanation', () => {
    const [quiz] = extractQuizzesFromHtml(BLANK, '/p/');
    expect(quiz?.type).toBe('blank');
    expect(quiz?.blanks).toEqual(['H2O', 'NaCl']);
    expect(quiz?.explanation).toBeUndefined();
  });

  it('returns every quiz on the page', () => {
    const quizzes = extractQuizzesFromHtml(CHOICE + SINGLE + BLANK, '/p/');
    expect(quizzes.map((q) => q.id)).toEqual(['q-choice', 'q-single', 'q-blank']);
  });
});

describe('buildManifest', () => {
  it('wraps entries with a version', () => {
    expect(buildManifest([])).toEqual({ version: 1, quizzes: [] });
  });
});
