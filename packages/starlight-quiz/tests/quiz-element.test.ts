import { beforeEach, describe, expect, it } from 'vitest';

import { defineQuizElement } from '../lib/quiz-element';

defineQuizElement();

const TRACKER_KEY = Symbol.for('starlight-quiz.tracker');

function resetState(): void {
  localStorage.clear();
  delete (globalThis as Record<PropertyKey, unknown>)[TRACKER_KEY];
}

interface QuizOptions {
  id?: string;
  type?: 'single' | 'multiple';
  disableAfterSubmit?: boolean;
  showCorrect?: boolean;
  autoSubmit?: boolean;
}

function choiceSource(correct: number[], count = 3, withFeedback = false): string {
  const items = Array.from({ length: count }, (_, i) => {
    const checked = correct.includes(i) ? ' checked' : '';
    const feedback = withFeedback ? `\n<blockquote><p>Feedback ${i}</p></blockquote>` : '';
    return `<li class="task-list-item"><input type="checkbox"${checked} disabled> Option ${i}${feedback}\n</li>`;
  }).join('\n');
  return `<p>Pick the right option.</p><ul class="contains-task-list">${items}</ul>`;
}

function mountQuiz(source: string, options: QuizOptions = {}): HTMLElement {
  const { id = 'q', disableAfterSubmit = true, showCorrect = true, autoSubmit = false } = options;
  const quiz = document.createElement('sl-quiz');
  quiz.id = id;
  quiz.setAttribute('data-disable-after-submit', String(disableAfterSubmit));
  quiz.setAttribute('data-show-correct', String(showCorrect));
  quiz.setAttribute('data-auto-submit', String(autoSubmit));
  quiz.setAttribute('data-submit-label', 'Submit');
  quiz.setAttribute('data-correct-label', 'Correct!');
  quiz.setAttribute('data-incorrect-label', 'Incorrect.');
  quiz.innerHTML = `<div class="sl-quiz-source">${source}</div>`;
  document.body.append(quiz);
  return quiz;
}

function submit(quiz: HTMLElement): void {
  const form = quiz.querySelector('form');
  form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

beforeEach(() => {
  document.body.innerHTML = '';
  resetState();
});

describe('building', () => {
  it('builds radios for a single-choice quiz', () => {
    const quiz = mountQuiz(choiceSource([1]));
    const inputs = quiz.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(inputs).toHaveLength(3);
    expect(quiz.querySelector('input[data-correct]')?.getAttribute('value')).toBe('1');
    expect(quiz.querySelector('fieldset')).not.toBeNull();
  });

  it('builds checkboxes when more than one answer is correct', () => {
    const quiz = mountQuiz(choiceSource([0, 2]));
    expect(quiz.querySelectorAll('input[type="checkbox"]')).toHaveLength(3);
  });

  it('builds text inputs for a fill-in-the-blank quiz', () => {
    const quiz = mountQuiz('<p>Water is [[H2O]] and salt is [[NaCl]].</p>');
    const blanks = quiz.querySelectorAll<HTMLInputElement>('input.sl-quiz-blank');
    expect(blanks).toHaveLength(2);
    expect(blanks[0]?.dataset['answer']).toBe('H2O');
  });
});

describe('submitting', () => {
  it('marks a correct single-choice answer and reveals nothing missing', () => {
    const quiz = mountQuiz(choiceSource([1]));
    quiz.querySelector<HTMLInputElement>('input[value="1"]')!.checked = true;
    submit(quiz);

    expect(quiz.querySelector('.sl-quiz-answer--correct')).not.toBeNull();
    expect(quiz.querySelector('.sl-quiz-feedback')?.hasAttribute('hidden')).toBe(false);
    expect(quiz.querySelector<HTMLInputElement>('input[value="1"]')!.disabled).toBe(true);
  });

  it('marks a wrong answer and shows the correct one when showCorrect is on', () => {
    const quiz = mountQuiz(choiceSource([1]));
    quiz.querySelector<HTMLInputElement>('input[value="0"]')!.checked = true;
    submit(quiz);

    expect(quiz.querySelector('input[value="0"]')!.closest('.sl-quiz-answer')!.className).toContain('--wrong');
    expect(quiz.querySelector('input[value="1"]')!.closest('.sl-quiz-answer')!.className).toContain('--correct');
  });

  it('does not reveal the correct answer when showCorrect is off', () => {
    const quiz = mountQuiz(choiceSource([1]), { showCorrect: false });
    quiz.querySelector<HTMLInputElement>('input[value="0"]')!.checked = true;
    submit(quiz);
    expect(quiz.querySelector('input[value="1"]')!.closest('.sl-quiz-answer')!.className).not.toContain('--correct');
  });

  it('shows per-answer feedback when present', () => {
    const quiz = mountQuiz(choiceSource([1], 3, true));
    quiz.querySelector<HTMLInputElement>('input[value="1"]')!.checked = true;
    submit(quiz);
    expect(quiz.querySelector('.sl-quiz-feedback')?.textContent).toContain('Feedback 1');
  });

  it('grades fill-in-the-blank case-insensitively', () => {
    const quiz = mountQuiz('<p>Water is [[H2O]].</p>');
    quiz.querySelector<HTMLInputElement>('input.sl-quiz-blank')!.value = ' h2o ';
    submit(quiz);
    expect(quiz.querySelector('.sl-quiz-blank--correct')).not.toBeNull();
  });

  it('auto-submits a single-choice quiz when an answer is clicked', () => {
    const quiz = mountQuiz(choiceSource([1]), { autoSubmit: true });
    expect(quiz.querySelector<HTMLButtonElement>('.sl-quiz-submit')!.hidden).toBe(true);
    quiz.querySelector<HTMLInputElement>('input[value="1"]')!.click();
    expect(quiz.querySelector('.sl-quiz-feedback')?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-submit on keyboard arrow navigation (change without click)', () => {
    const quiz = mountQuiz(choiceSource([1]), { autoSubmit: true });
    const input = quiz.querySelector<HTMLInputElement>('input[value="0"]')!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(quiz.querySelector('.sl-quiz-feedback')?.hasAttribute('hidden')).toBe(true);
  });
});

describe('persistence and restore', () => {
  it('restores a previously answered quiz on mount', () => {
    const first = mountQuiz(choiceSource([1]), { id: 'persist' });
    first.querySelector<HTMLInputElement>('input[value="1"]')!.checked = true;
    submit(first);

    // Re-mount a fresh element with the same id and source.
    document.body.innerHTML = '';
    const second = mountQuiz(choiceSource([1]), { id: 'persist' });
    expect(second.querySelector<HTMLInputElement>('input[value="1"]')!.checked).toBe(true);
    expect(second.querySelector('.sl-quiz-answer--correct')).not.toBeNull();
    expect(second.querySelector<HTMLInputElement>('input[value="1"]')!.disabled).toBe(true);
  });
});

describe('reset', () => {
  it('clears answers and re-enables inputs when disableAfterSubmit is false', () => {
    const quiz = mountQuiz(choiceSource([1]), { disableAfterSubmit: false });
    quiz.querySelector<HTMLInputElement>('input[value="1"]')!.checked = true;
    submit(quiz);

    const reset = quiz.querySelector<HTMLButtonElement>('.sl-quiz-reset')!;
    expect(reset.hidden).toBe(false);
    reset.click();

    expect(quiz.querySelector('.sl-quiz-answer--correct')).toBeNull();
    expect(quiz.querySelector<HTMLInputElement>('input[value="1"]')!.checked).toBe(false);
    expect(quiz.querySelector<HTMLInputElement>('input[value="1"]')!.disabled).toBe(false);
  });
});
