import { beforeEach, describe, expect, it } from 'vitest';

import { defineQuizElement } from '../lib/quiz-element';

defineQuizElement();

function mountBlank(emptyLabel?: string): HTMLElement {
  const quiz = document.createElement('sl-quiz');
  quiz.id = 'b';
  quiz.setAttribute('data-show-correct', 'true');
  quiz.setAttribute('data-submit-label', 'Submit');
  if (emptyLabel !== undefined) quiz.setAttribute('data-empty-label', emptyLabel);
  quiz.innerHTML = '<div class="sl-quiz-source"><p>The capital of France is [[Paris]].</p></div>';
  document.body.append(quiz);
  return quiz;
}

function submit(quiz: HTMLElement): void {
  quiz.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('blank corrections', () => {
  it('shows the empty label for a blank left empty', () => {
    const quiz = mountBlank();
    submit(quiz); // input left empty
    const del = quiz.querySelector('.sl-quiz-corrections del');
    const ins = quiz.querySelector('.sl-quiz-corrections ins');
    expect(del?.textContent).toBe('(empty)');
    expect(ins?.textContent).toBe('Paris');
  });

  it('uses the provided (translated) empty label', () => {
    const quiz = mountBlank('(vide)');
    submit(quiz);
    expect(quiz.querySelector('.sl-quiz-corrections del')?.textContent).toBe('(vide)');
  });

  it('shows what the reader typed when not empty', () => {
    const quiz = mountBlank();
    const input = quiz.querySelector<HTMLInputElement>('input.sl-quiz-blank')!;
    input.value = 'Berlin';
    submit(quiz);
    expect(quiz.querySelector('.sl-quiz-corrections del')?.textContent).toBe('Berlin');
  });
});
