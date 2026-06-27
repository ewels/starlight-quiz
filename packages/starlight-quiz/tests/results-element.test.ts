import confetti from 'canvas-confetti';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defineQuizResultsElement } from '../lib/results-element';
import { getTracker } from '../lib/tracker';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// jsdom does not implement scrollIntoView; the results panel calls it on completion.
Element.prototype.scrollIntoView = () => {};

defineQuizResultsElement();

const TRACKER_KEY = Symbol.for('starlight-quiz.tracker');
const confettiMock = vi.mocked(confetti);

function resetState(): void {
  localStorage.clear();
  delete (globalThis as Record<PropertyKey, unknown>)[TRACKER_KEY];
  confettiMock.mockClear();
}

function mount(confettiEnabled: boolean): HTMLElement {
  const el = document.createElement('sl-quiz-results');
  el.dataset['confetti'] = String(confettiEnabled);
  el.dataset['msgExcellent'] = 'Outstanding!';
  el.dataset['msgFail'] = 'Keep trying!';
  el.innerHTML = `
    <div class="sl-quiz-results-progress">
      <span class="sl-quiz-results-answered">0</span><span class="sl-quiz-results-total">0</span>
    </div>
    <div class="sl-quiz-results-complete" hidden>
      <span class="sl-quiz-results-score-value">0</span>
      <p class="sl-quiz-results-message"></p>
      <span class="sl-quiz-results-correct">0</span>
    </div>`;
  document.body.append(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
  resetState();
});

describe('sl-quiz-results', () => {
  it('reveals the score and tier message on completion', async () => {
    const el = mount(false);
    const tracker = getTracker();
    tracker.register('a');
    tracker.record('a', true, ['1']);

    expect(el.querySelector('.sl-quiz-results-complete')?.hasAttribute('hidden')).toBe(false);
    expect(el.querySelector('.sl-quiz-results-score-value')?.textContent).toBe('100');
    expect(el.querySelector('.sl-quiz-results-message')?.textContent).toBe('Outstanding!');
    expect(el.querySelector('.sl-quiz-results-complete')?.className).toContain('--excellent');
  });

  it('fires confetti on a genuine in-session completion', async () => {
    mount(true);
    const tracker = getTracker();
    tracker.register('a'); // subscribed while incomplete -> baseline established
    tracker.record('a', true, ['1']);
    await vi.waitFor(() => expect(confettiMock).toHaveBeenCalledTimes(1));
  });

  it('does not fire confetti when restored already-complete on load', async () => {
    // Pre-seed an answered quiz, then mount as if the page just loaded.
    const seed = getTracker();
    seed.register('a');
    seed.record('a', true, ['1']);
    delete (globalThis as Record<PropertyKey, unknown>)[TRACKER_KEY];
    confettiMock.mockClear();

    const tracker = getTracker();
    tracker.register('a'); // restored from storage: complete on first emit
    mount(true);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it('never fires confetti when disabled', async () => {
    mount(false);
    const tracker = getTracker();
    tracker.register('a');
    tracker.record('a', true, ['1']);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(confettiMock).not.toHaveBeenCalled();
  });
});
