import { QUIZ_PROGRESS_ELEMENT } from './constants';
import { getTracker } from './tracker';
import type { QuizProgress } from './types';

/**
 * The `<sl-quiz-progress>` custom element: a compact progress widget.
 *
 * It subscribes to the shared tracker and shows how many quizzes on the page
 * have been answered and how many were correct. It hides itself entirely when
 * the page has no quizzes, so it is safe to render on every page (e.g. from a
 * Starlight table-of-contents override).
 */
class StarlightQuizProgressElement extends HTMLElement {
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#unsubscribe = getTracker().subscribe((progress) => this.#update(progress));
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  #update(progress: QuizProgress): void {
    this.hidden = progress.total === 0;

    this.#setText('.sl-quiz-progress-answered', String(progress.answered));
    this.#setText('.sl-quiz-progress-total', String(progress.total));
    this.#setText('.sl-quiz-progress-correct', String(progress.correct));

    const fill = this.querySelector<HTMLElement>('.sl-quiz-progress-bar-fill');
    if (fill) fill.style.inlineSize = `${progress.percentage}%`;

    const bar = this.querySelector('.sl-quiz-progress-bar');
    if (bar) {
      bar.setAttribute('aria-valuenow', String(progress.percentage));
      bar.setAttribute('aria-valuetext', `${progress.answered} / ${progress.total}`);
    }
  }

  #setText(selector: string, value: string): void {
    for (const element of this.querySelectorAll(selector)) {
      element.textContent = value;
    }
  }
}

/** Register the `<sl-quiz-progress>` custom element (idempotent). */
export function defineQuizProgressElement(): void {
  if (typeof customElements !== 'undefined' && !customElements.get(QUIZ_PROGRESS_ELEMENT)) {
    customElements.define(QUIZ_PROGRESS_ELEMENT, StarlightQuizProgressElement);
  }
}
