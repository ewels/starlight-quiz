import { beforeEach, describe, expect, it } from 'vitest';

import { defineQuizProgressBadgeElement, defineQuizProgressElement } from '../lib/progress-element';
import { getTracker } from '../lib/tracker';

defineQuizProgressElement();
defineQuizProgressBadgeElement();

const TRACKER_KEY = Symbol.for('starlight-quiz.tracker');

function resetState(): void {
  localStorage.clear();
  delete (globalThis as Record<PropertyKey, unknown>)[TRACKER_KEY];
}

function mount(): HTMLElement {
  const el = document.createElement('sl-quiz-progress');
  el.hidden = true;
  el.innerHTML = `
    <span class="sl-quiz-progress-answered">0</span>
    <span class="sl-quiz-progress-total">0</span>
    <span class="sl-quiz-progress-percentage">0%</span>
    <div class="sl-quiz-progress-bar"><span class="sl-quiz-progress-bar-fill"></span></div>
    <span class="sl-quiz-progress-correct">0</span>
    <span class="sl-quiz-progress-total">0</span>
    <span class="sl-quiz-progress-score">0%</span>
    <button type="button" class="sl-quiz-progress-reset">Reset</button>`;
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
    expect(el.querySelector('.sl-quiz-progress-percentage')?.textContent).toBe('100%');
    expect(el.querySelector('.sl-quiz-progress-score')?.textContent).toBe('50%');
    expect((el.querySelector('.sl-quiz-progress-bar-fill') as HTMLElement).style.inlineSize).toBe('100%');
  });

  it('sets both total spans (answered and correct lines) to the same count', () => {
    const el = mount();
    const tracker = getTracker();
    tracker.register('a');
    tracker.register('b');
    tracker.register('c');
    for (const total of el.querySelectorAll('.sl-quiz-progress-total')) {
      expect(total.textContent).toBe('3');
    }
  });

  it('clears all progress when the reset button is pressed', () => {
    const el = mount();
    const tracker = getTracker();
    tracker.register('a');
    tracker.record('a', true, ['1']);
    expect(el.querySelector('.sl-quiz-progress-answered')?.textContent).toBe('1');

    el.querySelector<HTMLButtonElement>('.sl-quiz-progress-reset')?.click();

    expect(el.querySelector('.sl-quiz-progress-answered')?.textContent).toBe('0');
    expect(el.querySelector('.sl-quiz-progress-correct')?.textContent).toBe('0');
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

function mountMobileToc(): HTMLElement {
  const toc = document.createElement('mobile-starlight-toc');
  toc.innerHTML = `<nav><details><summary><span class="toggle">On this page</span></summary></details></nav>`;
  document.body.append(toc);
  return toc;
}

function mountBadge(): HTMLElement {
  const el = document.createElement('sl-quiz-progress-badge');
  el.hidden = true;
  el.dataset['badgeLabel'] = 'Quiz';
  el.dataset['answeredLabel'] = 'answered';
  el.innerHTML = `<span class="sl-quiz-progress-badge-label">Quiz:</span>
    <span class="sl-quiz-progress-answered">0</span>/<span class="sl-quiz-progress-total">0</span>`;
  document.body.append(el);
  return el;
}

describe('sl-quiz-progress-badge', () => {
  it('moves itself into the mobile ToC summary bar, pinned to the end', () => {
    mountMobileToc();
    const badge = mountBadge();
    expect(badge.closest('summary')).not.toBeNull();
    expect(badge.style.marginInlineStart).toBe('auto');
  });

  it('reflects answered / total and an accessible label', () => {
    mountMobileToc();
    const badge = mountBadge();
    const tracker = getTracker();
    tracker.register('a');
    tracker.register('b');
    tracker.register('c');

    expect(badge.hidden).toBe(false);
    expect(badge.querySelector('.sl-quiz-progress-total')?.textContent).toBe('3');

    tracker.record('a', true, ['1']);
    expect(badge.querySelector('.sl-quiz-progress-answered')?.textContent).toBe('1');
    expect(badge.getAttribute('aria-label')).toBe('Quiz: 1 / 3 answered');
  });

  it('stays hidden when the page has no quizzes', () => {
    mountMobileToc();
    const badge = mountBadge();
    expect(badge.hidden).toBe(true);
  });

  it('prevents its tap from toggling the ToC', () => {
    mountMobileToc();
    mountBadge();
    const answered = document.querySelector('.sl-quiz-progress-answered') as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    answered.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('works (without relocating) when there is no mobile ToC', () => {
    const badge = mountBadge();
    const tracker = getTracker();
    tracker.register('a');
    expect(badge.hidden).toBe(false);
    expect(badge.querySelector('.sl-quiz-progress-total')?.textContent).toBe('1');
  });
});

describe('sl-quiz-progress-badge tap target', () => {
  const SCROLLED = 'data-test-scrolled';

  beforeEach(() => {
    Element.prototype.scrollIntoView = function (this: Element) {
      this.setAttribute(SCROLLED, 'true');
    };
  });

  function addQuiz(answered: boolean): HTMLElement {
    const quiz = document.createElement('sl-quiz');
    if (answered) quiz.setAttribute('data-answered', 'true');
    document.body.append(quiz);
    return quiz;
  }

  it('scrolls to the first unanswered quiz on tap', () => {
    mountMobileToc();
    addQuiz(true);
    const second = addQuiz(false);
    addQuiz(false);
    const badge = mountBadge();
    badge.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(second.hasAttribute(SCROLLED)).toBe(true);
  });

  it('scrolls to the results panel once every quiz is answered', () => {
    mountMobileToc();
    addQuiz(true);
    addQuiz(true);
    const results = document.createElement('sl-quiz-results');
    document.body.append(results);
    const badge = mountBadge();
    badge.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(results.hasAttribute(SCROLLED)).toBe(true);
  });

  it('falls back to the last quiz when all are answered and there is no results panel', () => {
    mountMobileToc();
    const first = addQuiz(true);
    const last = addQuiz(true);
    const badge = mountBadge();
    badge.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(last.hasAttribute(SCROLLED)).toBe(true);
    expect(first.hasAttribute(SCROLLED)).toBe(false);
  });

  it('responds to keyboard activation (Enter)', () => {
    mountMobileToc();
    const only = addQuiz(false);
    const badge = mountBadge();
    badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(only.hasAttribute(SCROLLED)).toBe(true);
  });
});
