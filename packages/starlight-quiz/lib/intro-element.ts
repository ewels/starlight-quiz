import { QUIZ_INTRO_ELEMENT } from './constants';
import { wireResetButton } from './widget-dom';

/**
 * The `<sl-quiz-intro>` custom element: a small panel of intro text with a
 * button that resets every quiz on the page.
 *
 * It is the spiritual equivalent of mkdocs-quiz's `<!-- mkdocs-quiz intro -->`
 * placeholder — somewhere to tell readers their answers are saved locally and
 * to offer a one-click reset. The panel is static text plus the reset button;
 * progress lives in the shared tracker, which the button clears via `resetAll`.
 */
class StarlightQuizIntroElement extends HTMLElement {
  connectedCallback(): void {
    wireResetButton(this, '.sl-quiz-intro-reset');
  }
}

/** Register the `<sl-quiz-intro>` custom element (idempotent). */
export function defineQuizIntroElement(): void {
  if (typeof customElements !== 'undefined' && !customElements.get(QUIZ_INTRO_ELEMENT)) {
    customElements.define(QUIZ_INTRO_ELEMENT, StarlightQuizIntroElement);
  }
}
