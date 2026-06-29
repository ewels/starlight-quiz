import { CONFETTI_MIN_SCORE, QUIZ_RESULTS_ELEMENT } from './constants';
import { isComplete, tierForScore, type ScoreTier } from './score';
import { getTracker } from './tracker';
import { setTextAll, wireResetButton } from './widget-dom';
import type { QuizProgress } from './types';

const TIER_CLASSES = ['excellent', 'good', 'average', 'poor', 'fail'] as const;

/** Whether the user has asked for reduced motion (no confetti, instant scroll). */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * The `<sl-quiz-results>` custom element: an aggregate score panel.
 *
 * It subscribes to the shared tracker, shows live progress, and reveals a score
 * with a tier message once every quiz on the page is answered. Confetti is
 * loaded with a dynamic import so it adds nothing to the bundle unless enabled
 * and actually triggered.
 */
class StarlightQuizResultsElement extends HTMLElement {
  #unsubscribe: (() => void) | null = null;
  #wasComplete = false;
  // The first update is a baseline (e.g. restored-on-load state); confetti only
  // fires on a genuine in-session transition into completion, never on reload.
  #firstUpdate = true;

  connectedCallback(): void {
    wireResetButton(this, '.sl-quiz-results-reset');
    this.#unsubscribe = getTracker().subscribe((progress) => this.#update(progress));
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  #update(progress: QuizProgress): void {
    setTextAll(this, '.sl-quiz-results-answered', String(progress.answered));
    setTextAll(this, '.sl-quiz-results-total', String(progress.total));
    setTextAll(this, '.sl-quiz-results-correct', String(progress.correct));
    setTextAll(this, '.sl-quiz-results-percentage', `${progress.percentage}%`);

    const complete = isComplete(progress);
    const progressPanel = this.querySelector<HTMLElement>('.sl-quiz-results-progress');
    const completePanel = this.querySelector<HTMLElement>('.sl-quiz-results-complete');
    if (progressPanel) progressPanel.hidden = complete;
    if (completePanel) completePanel.hidden = !complete;

    if (complete) {
      this.#renderComplete(progress, !this.#firstUpdate);
    }
    this.#wasComplete = complete;
    this.#firstUpdate = false;
  }

  #renderComplete(progress: QuizProgress, liveUpdate: boolean): void {
    setTextAll(this, '.sl-quiz-results-score-value', String(progress.score));

    const tier = tierForScore(progress.score);
    const panel = this.querySelector<HTMLElement>('.sl-quiz-results-complete');
    if (panel) {
      for (const name of TIER_CLASSES) panel.classList.remove(`sl-quiz-results-complete--${name}`);
      panel.classList.add(`sl-quiz-results-complete--${tier.key}`);
    }
    setTextAll(this, '.sl-quiz-results-message', this.#messageForTier(tier));

    // Only react to a genuine in-session transition into completion (the last
    // quiz was just submitted) — never on the initial baseline (e.g. a
    // restored-on-load state) or repeat emits while already complete.
    if (!liveUpdate || this.#wasComplete) return;

    const reduced = prefersReducedMotion();

    // Bring the results panel into view now that every quiz is answered. Defer
    // to the next frame: the quiz that was just submitted records its result
    // (which lands us here) *before* it reveals its per-answer feedback and
    // post-answer explanation. Scrolling synchronously would aim at the panel's
    // pre-reveal position and land short once that content grows the page.
    const scrollToPanel = (): void => this.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(scrollToPanel);
    else scrollToPanel();

    // Confetti is motion — skip it entirely when the user prefers reduced motion.
    if (!reduced && this.dataset['confetti'] === 'true' && progress.score >= CONFETTI_MIN_SCORE) {
      void this.#fireConfetti();
    }
  }

  #messageForTier(tier: ScoreTier): string {
    return this.dataset[`msg${tier.key.charAt(0).toUpperCase()}${tier.key.slice(1)}`] ?? '';
  }

  async #fireConfetti(): Promise<void> {
    try {
      const { default: confetti } = await import('canvas-confetti');
      // 4x the particle count, a 2x-larger burst (wider spread, faster launch),
      // and 1.5x-bigger pieces.
      confetti({ particleCount: 560, spread: 150, startVelocity: 90, scalar: 1.5, origin: { y: 0.6 } });
    } catch {
      /* confetti is purely decorative — ignore load failures */
    }
  }
}

/** Register the `<sl-quiz-results>` custom element (idempotent). */
export function defineQuizResultsElement(): void {
  if (typeof customElements !== 'undefined' && !customElements.get(QUIZ_RESULTS_ELEMENT)) {
    customElements.define(QUIZ_RESULTS_ELEMENT, StarlightQuizResultsElement);
  }
}
