import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defineQuizIntroElement } from '../lib/intro-element';
import { getTracker } from '../lib/tracker';

defineQuizIntroElement();

const TRACKER_KEY = Symbol.for('starlight-quiz.tracker');

function resetState(): void {
  localStorage.clear();
  delete (globalThis as Record<PropertyKey, unknown>)[TRACKER_KEY];
}

function mount(confirmLabel?: string): HTMLElement {
  const el = document.createElement('sl-quiz-intro');
  if (confirmLabel) el.dataset['confirmLabel'] = confirmLabel;
  el.innerHTML = `
    <p class="sl-quiz-intro-text">Answers are saved locally.</p>
    <button type="button" class="sl-quiz-intro-reset">Reset all answers</button>`;
  document.body.append(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
  resetState();
  vi.restoreAllMocks();
});

describe('sl-quiz-intro', () => {
  it('clears all progress when the reset button is pressed', () => {
    const el = mount();
    const tracker = getTracker();
    tracker.register('a');
    tracker.record('a', true, ['1']);
    expect(tracker.progress.answered).toBe(1);

    el.querySelector<HTMLButtonElement>('.sl-quiz-intro-reset')?.click();

    expect(tracker.progress.answered).toBe(0);
  });

  it('asks for confirmation first when a confirm label is set', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const el = mount('Reset everything?');
    const tracker = getTracker();
    tracker.register('a');
    tracker.record('a', true, ['1']);

    el.querySelector<HTMLButtonElement>('.sl-quiz-intro-reset')?.click();

    expect(confirmSpy).toHaveBeenCalledWith('Reset everything?');
    // Declined — progress is untouched.
    expect(tracker.progress.answered).toBe(1);
  });
});
