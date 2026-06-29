import { beforeEach, describe, expect, it } from 'vitest';

import { defineQuizElement } from '../lib/quiz-element';

defineQuizElement();

function mount(id: string, autoNumber: boolean, label = 'Question {n}'): HTMLElement {
  const quiz = document.createElement('sl-quiz');
  quiz.id = id;
  quiz.setAttribute('data-auto-submit', 'false');
  quiz.setAttribute('data-submit-label', 'Submit');
  quiz.setAttribute('data-auto-number', String(autoNumber));
  quiz.setAttribute('data-number-label', label);
  quiz.innerHTML =
    '<div class="sl-quiz-source"><p>Q</p><ul class="contains-task-list">' +
    '<li class="task-list-item"><input type="checkbox" checked disabled> A</li></ul></div>';
  document.body.append(quiz);
  return quiz;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('auto-numbering', () => {
  it('numbers auto-numbered quizzes down the page', () => {
    const first = mount('a', true);
    const second = mount('b', true);
    expect(first.querySelector('.sl-quiz-number')?.textContent).toBe('Question 1');
    expect(second.querySelector('.sl-quiz-number')?.textContent).toBe('Question 2');
  });

  it('uses the translated label template', () => {
    const quiz = mount('a', true, 'Frage {n}');
    expect(quiz.querySelector('.sl-quiz-number')?.textContent).toBe('Frage 1');
  });

  it('adds no heading when auto-numbering is off', () => {
    const quiz = mount('a', false);
    expect(quiz.querySelector('.sl-quiz-number')).toBeNull();
  });
});
