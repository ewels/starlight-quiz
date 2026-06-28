import { QUIZ_PROGRESS_BADGE_ELEMENT, QUIZ_PROGRESS_ELEMENT } from './constants';
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

/**
 * The `<sl-quiz-progress-badge>` custom element: a compact `answered / total`
 * counter for the mobile table-of-contents bar.
 *
 * Starlight renders that bar as a `position: fixed` element so it stays put
 * while the page scrolls. To ride along with it, the badge moves itself into
 * the bar's `<summary>` row on connect (it is authored as a sibling just after
 * the mobile ToC). Like the sidebar widget it subscribes to the shared tracker
 * and hides itself when the page has no quizzes.
 */
class StarlightQuizProgressBadgeElement extends HTMLElement {
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    // Relocate into the fixed mobile ToC bar so the badge scrolls with it.
    // Moving the node re-fires connectedCallback with the new parent in place,
    // so we return early and let that second pass do the subscription.
    const summary = document.querySelector('mobile-starlight-toc summary');
    if (summary && this.parentElement !== summary) {
      // A tap on the badge should not toggle the table of contents open.
      this.addEventListener('click', (event) => event.preventDefault());
      // Pin the badge to the end of the flex row. Set inline (not via the
      // stylesheet) so it beats Starlight's unlayered margin reset on the bar.
      this.style.marginInlineStart = 'auto';
      summary.append(this);
      return;
    }

    this.#unsubscribe = getTracker().subscribe((progress) => this.#update(progress));
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  #update(progress: QuizProgress): void {
    this.hidden = progress.total === 0;

    for (const element of this.querySelectorAll('.sl-quiz-progress-answered')) {
      element.textContent = String(progress.answered);
    }
    for (const element of this.querySelectorAll('.sl-quiz-progress-total')) {
      element.textContent = String(progress.total);
    }

    const label = this.dataset['answeredLabel'];
    this.setAttribute('aria-label', `${progress.answered} / ${progress.total}${label ? ` ${label}` : ''}`);
  }
}

/** Register the `<sl-quiz-progress-badge>` custom element (idempotent). */
export function defineQuizProgressBadgeElement(): void {
  if (typeof customElements !== 'undefined' && !customElements.get(QUIZ_PROGRESS_BADGE_ELEMENT)) {
    customElements.define(QUIZ_PROGRESS_BADGE_ELEMENT, StarlightQuizProgressBadgeElement);
  }
}
