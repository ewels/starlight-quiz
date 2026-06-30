import { QUIZ_ELEMENT, QUIZ_PROGRESS_BADGE_ELEMENT, QUIZ_PROGRESS_ELEMENT, QUIZ_RESULTS_ELEMENT } from './constants';
import { getTracker } from './tracker';
import { setTextAll, wireResetButton } from './widget-dom';
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
    wireResetButton(this, '.sl-quiz-progress-reset');
    this.#unsubscribe = getTracker().subscribe((progress) => this.#update(progress));
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  #update(progress: QuizProgress): void {
    this.hidden = progress.total === 0;

    setTextAll(this, '.sl-quiz-progress-answered', String(progress.answered));
    setTextAll(this, '.sl-quiz-progress-total', String(progress.total));
    setTextAll(this, '.sl-quiz-progress-correct', String(progress.correct));
    setTextAll(this, '.sl-quiz-progress-percentage', `${progress.percentage}%`);
    setTextAll(this, '.sl-quiz-progress-score', `${progress.score}%`);

    // The bar splits into a correct (green) and an incorrect (red) segment,
    // each sized as a fraction of the total — matching mkdocs-quiz.
    const fraction = (count: number): string => (progress.total > 0 ? `${(count / progress.total) * 100}%` : '0%');
    this.#setBarWidth('.sl-quiz-progress-bar-correct', fraction(progress.correct));
    this.#setBarWidth('.sl-quiz-progress-bar-incorrect', fraction(progress.answered - progress.correct));

    const bar = this.querySelector('.sl-quiz-progress-bar');
    if (bar) {
      bar.setAttribute('aria-valuenow', String(progress.percentage));
      bar.setAttribute('aria-valuetext', `${progress.answered} / ${progress.total}`);
    }
  }

  #setBarWidth(selector: string, width: string): void {
    const bar = this.querySelector<HTMLElement>(selector);
    if (bar) bar.style.inlineSize = width;
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
  #wired = false;

  connectedCallback(): void {
    this.#wire();

    // Relocate into the fixed mobile ToC bar so the badge scrolls with it.
    // Moving the node re-fires connectedCallback with the new parent in place,
    // so we return early and let that second pass do the subscription.
    const summary = document.querySelector('mobile-starlight-toc summary');
    if (summary && this.parentElement !== summary) {
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

  /** Make the badge a button that jumps to the next thing to do (once). */
  #wire(): void {
    if (this.#wired) return;
    this.#wired = true;
    this.setAttribute('role', 'button');
    this.tabIndex = 0;
    // Inside the ToC `<summary>`, a tap would otherwise toggle the dropdown.
    this.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.#scrollToNext();
    });
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        this.#scrollToNext();
      }
    });
  }

  /**
   * Scroll to the first unanswered quiz on the page, or — once every quiz is
   * answered — to the results panel if there is one (else the last quiz).
   */
  #scrollToNext(): void {
    const quizzes = Array.from(document.querySelectorAll(QUIZ_ELEMENT));
    const target =
      quizzes.find((quiz) => !quiz.hasAttribute('data-answered')) ??
      document.querySelector(QUIZ_RESULTS_ELEMENT) ??
      quizzes[quizzes.length - 1] ??
      null;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  #update(progress: QuizProgress): void {
    this.hidden = progress.total === 0;

    setTextAll(this, '.sl-quiz-progress-answered', String(progress.answered));
    setTextAll(this, '.sl-quiz-progress-total', String(progress.total));

    const prefix = this.dataset['badgeLabel'];
    const answered = this.dataset['answeredLabel'];
    this.setAttribute(
      'aria-label',
      `${prefix ? `${prefix}: ` : ''}${progress.answered} / ${progress.total}${answered ? ` ${answered}` : ''}`,
    );
  }
}

/** Register the `<sl-quiz-progress-badge>` custom element (idempotent). */
export function defineQuizProgressBadgeElement(): void {
  if (typeof customElements !== 'undefined' && !customElements.get(QUIZ_PROGRESS_BADGE_ELEMENT)) {
    customElements.define(QUIZ_PROGRESS_BADGE_ELEMENT, StarlightQuizProgressBadgeElement);
  }
}
