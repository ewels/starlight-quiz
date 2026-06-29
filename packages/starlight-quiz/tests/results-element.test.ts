import confetti from 'canvas-confetti';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defineQuizResultsElement } from '../lib/results-element';
import { getTracker } from '../lib/tracker';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// jsdom does not implement scrollIntoView; the results panel calls it on completion.
const scrollIntoViewMock = vi.fn();
Element.prototype.scrollIntoView = scrollIntoViewMock;

defineQuizResultsElement();

const TRACKER_KEY = Symbol.for('starlight-quiz.tracker');
const confettiMock = vi.mocked(confetti);

function resetState(): void {
  localStorage.clear();
  delete (globalThis as Record<PropertyKey, unknown>)[TRACKER_KEY];
  confettiMock.mockClear();
  scrollIntoViewMock.mockClear();
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

beforeEach(async () => {
  // The panel defers its scroll to a rAF; let any frame scheduled by a prior
  // test flush (harmlessly, on a now-detached element) before we clear the mock
  // so each test sees only its own scroll calls.
  await new Promise((resolve) => setTimeout(resolve, 20));
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

  it('scrolls to the panel on completion even when confetti is disabled', async () => {
    const el = mount(false);
    const tracker = getTracker();
    tracker.register('a'); // subscribed while incomplete -> baseline established
    tracker.record('a', true, ['1']);
    // The scroll is deferred to the next frame so the just-submitted quiz's
    // revealed content is laid out first.
    await vi.waitFor(() => expect(scrollIntoViewMock).toHaveBeenCalledTimes(1));
    expect(scrollIntoViewMock.mock.contexts[0]).toBe(el);
  });

  it('does not scroll when restored already-complete on load', async () => {
    const seed = getTracker();
    seed.register('a');
    seed.record('a', true, ['1']);
    delete (globalThis as Record<PropertyKey, unknown>)[TRACKER_KEY];
    scrollIntoViewMock.mockClear();

    const tracker = getTracker();
    tracker.register('a'); // restored from storage: complete on first emit
    mount(false);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
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

  it('does not fire confetti when the user prefers reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      mount(true);
      const tracker = getTracker();
      tracker.register('a');
      tracker.record('a', true, ['1']);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(confettiMock).not.toHaveBeenCalled();
    } finally {
      window.matchMedia = original;
    }
  });
});
