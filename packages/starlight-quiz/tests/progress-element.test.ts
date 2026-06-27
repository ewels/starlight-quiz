import { beforeEach, describe, expect, it } from 'vitest';

import { defineQuizProgressElement } from '../lib/progress-element';
import { getTracker } from '../lib/tracker';

defineQuizProgressElement();

const TRACKER_KEY = Symbol.for('starlight-quiz.tracker');

function resetState(): void {
  localStorage.clear();
  delete (globalThis as Record<PropertyKey, unknown>)[TRACKER_KEY];
}

function mount(): HTMLElement {
  const el = document.createElement('sl-quiz-progress');
  el.hidden = true;
  el.innerHTML = `
    <div class="sl-quiz-progress-bar"><span class="sl-quiz-progress-bar-fill"></span></div>
    <span class="sl-quiz-progress-answered">0</span>
    <span class="sl-quiz-progress-total">0</span>
    <span class="sl-quiz-progress-correct">0</span>`;
  document.body.append(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
  resetState();
});

describe('sl-quiz-progress', () => {
  it('stays hidden when the page has no quizzes', () => {
    const el = mount();
    expect(el.hidden).toBe(true);
  });

  it('reveals and reflects progress as quizzes register and are answered', () => {
    const el = mount();
    const tracker = getTracker();
    tracker.register('a');
    tracker.register('b');

    expect(el.hidden).toBe(false);
    expect(el.querySelector('.sl-quiz-progress-total')?.textContent).toBe('2');
    expect(el.querySelector('.sl-quiz-progress-answered')?.textContent).toBe('0');

    tracker.record('a', true, ['1']);
    tracker.record('b', false, ['0']);

    expect(el.querySelector('.sl-quiz-progress-answered')?.textContent).toBe('2');
    expect(el.querySelector('.sl-quiz-progress-correct')?.textContent).toBe('1');
    expect((el.querySelector('.sl-quiz-progress-bar-fill') as HTMLElement).style.inlineSize).toBe('100%');
  });

  it('unsubscribes on disconnect', () => {
    const el = mount();
    const tracker = getTracker();
    tracker.register('a');
    el.remove();
    // Recording after disconnect must not throw or touch the detached element.
    expect(() => tracker.record('a', true, ['0'])).not.toThrow();
  });
});
