import { CONFETTI_MIN_SCORE, QUIZ_RESULTS_ELEMENT } from './constants';
import { isComplete, tierForScore, type ScoreTier } from './score';
import { getTracker } from './tracker';
import type { QuizProgress } from './types';

const TIER_CLASSES = ['excellent', 'good', 'average', 'poor', 'fail'] as const;

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
    const resetButton = this.querySelector<HTMLButtonElement>('.sl-quiz-results-reset');
    resetButton?.addEventListener('click', () => {
      const confirmMessage = this.dataset['confirmLabel'];
      if (confirmMessage && !window.confirm(confirmMessage)) return;
      getTracker().resetAll();
    });

    this.#unsubscribe = getTracker().subscribe((progress) => this.#update(progress));
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  #update(progress: QuizProgress): void {
    this.#setText('.sl-quiz-results-answered', String(progress.answered));
    this.#setText('.sl-quiz-results-total', String(progress.total));
    this.#setText('.sl-quiz-results-correct', String(progress.correct));
    this.#setText('.sl-quiz-results-percentage', `${progress.percentage}%`);

    const fill = this.querySelector<HTMLElement>('.sl-quiz-results-bar-fill');
    if (fill) fill.style.inlineSize = `${progress.percentage}%`;

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

  #renderComplete(progress: QuizProgress, allowConfetti: boolean): void {
    this.#setText('.sl-quiz-results-score-value', String(progress.score));

    const tier = tierForScore(progress.score);
    const panel = this.querySelector<HTMLElement>('.sl-quiz-results-complete');
    if (panel) {
      for (const name of TIER_CLASSES) panel.classList.remove(`sl-quiz-results-complete--${name}`);
      panel.classList.add(`sl-quiz-results-complete--${tier.key}`);
    }
    this.#setText('.sl-quiz-results-message', this.#messageForTier(tier));

    if (
      allowConfetti &&
      !this.#wasComplete &&
      this.dataset['confetti'] === 'true' &&
      progress.score >= CONFETTI_MIN_SCORE
    ) {
      void this.#fireConfetti();
      this.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  #messageForTier(tier: ScoreTier): string {
    return this.dataset[`msg${tier.key.charAt(0).toUpperCase()}${tier.key.slice(1)}`] ?? '';
  }

  async #fireConfetti(): Promise<void> {
    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 } });
    } catch {
      /* confetti is purely decorative — ignore load failures */
    }
  }

  #setText(selector: string, value: string): void {
    for (const element of this.querySelectorAll(selector)) {
      element.textContent = value;
    }
  }
}

/** Register the `<sl-quiz-results>` custom element (idempotent). */
export function defineQuizResultsElement(): void {
  if (typeof customElements !== 'undefined' && !customElements.get(QUIZ_RESULTS_ELEMENT)) {
    customElements.define(QUIZ_RESULTS_ELEMENT, StarlightQuizResultsElement);
  }
}
