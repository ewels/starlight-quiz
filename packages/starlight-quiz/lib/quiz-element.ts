import { QUIZ_ELEMENT, RESET_ALL_EVENT } from './constants';
import { gradeBlank, gradeBlanks, gradeChoice } from './grading';
import { BLANK_PATTERN, detectType, findAnswerList, splitAtRule } from './parse';
import { shuffle } from './shuffle';
import { getTracker } from './tracker';
import type { QuizLabels, QuizType } from './types';

interface ChoiceAnswer {
  wrapper: HTMLDivElement;
  input: HTMLInputElement;
  correct: boolean;
  index: number;
  feedback: HTMLElement | null;
}

const DEFAULT_LABELS: QuizLabels = {
  submit: 'Submit',
  reset: 'Reset',
  correct: 'Correct!',
  incorrect: 'Incorrect.',
  tryAgain: 'Incorrect — try again.',
};

/**
 * The `<sl-quiz>` custom element.
 *
 * It reads the markdown that MDX rendered into its `.sl-quiz-source` container —
 * a GFM task list for choice quizzes, or `[[blank]]` tokens for fill-in-the-blank
 * — and rewrites it into an accessible, interactive form. All logic queries
 * `this`, never `document`, so the element re-initialises itself correctly after
 * Astro view transitions (a fresh element is created per navigation).
 */
class StarlightQuizElement extends HTMLElement {
  #initialised = false;
  #type: QuizType = 'single';
  #quizId = '';
  #labels: QuizLabels = DEFAULT_LABELS;

  #feedback!: HTMLDivElement;
  #submitButton!: HTMLButtonElement;
  #resetButton!: HTMLButtonElement;
  #content: HTMLElement | null = null;

  #answers: ChoiceAnswer[] = [];
  #blanks: HTMLInputElement[] = [];

  #onResetAll = (): void => this.#resetUi();

  connectedCallback(): void {
    if (this.#initialised) return;
    this.#initialised = true;

    const source = this.querySelector<HTMLElement>('.sl-quiz-source');
    if (!source) return;

    this.#quizId = this.id || `sl-quiz-${Math.random().toString(36).slice(2, 9)}`;
    this.#labels = this.#readLabels();
    this.#type = detectType(source);

    this.#build(source);
    this.#restore();

    window.addEventListener(RESET_ALL_EVENT, this.#onResetAll);
  }

  disconnectedCallback(): void {
    window.removeEventListener(RESET_ALL_EVENT, this.#onResetAll);
  }

  #readLabels(): QuizLabels {
    const data = this.dataset;
    return {
      submit: data['submitLabel'] || DEFAULT_LABELS.submit,
      reset: data['resetLabel'] || DEFAULT_LABELS.reset,
      correct: data['correctLabel'] || DEFAULT_LABELS.correct,
      incorrect: data['incorrectLabel'] || DEFAULT_LABELS.incorrect,
      tryAgain: data['tryAgainLabel'] || DEFAULT_LABELS.tryAgain,
    };
  }

  get #disableAfterSubmit(): boolean {
    return this.dataset['disableAfterSubmit'] !== 'false';
  }

  get #showCorrect(): boolean {
    return this.dataset['showCorrect'] !== 'false';
  }

  get #autoSubmit(): boolean {
    return this.dataset['autoSubmit'] === 'true' && this.#type === 'single';
  }

  get #shuffle(): boolean {
    return this.dataset['shuffle'] === 'true';
  }

  // --- Building -----------------------------------------------------------

  #build(source: HTMLElement): void {
    const form = document.createElement('form');
    form.className = 'sl-quiz-form';
    form.noValidate = true;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.#handleSubmit();
    });

    if (this.#type === 'blank') {
      this.#buildBlanks(source, form);
    } else {
      this.#buildChoices(source, form);
    }

    this.#feedback = document.createElement('div');
    this.#feedback.className = 'sl-quiz-feedback';
    this.#feedback.setAttribute('role', 'status');
    this.#feedback.setAttribute('aria-live', 'polite');
    this.#feedback.hidden = true;
    form.append(this.#feedback);

    const actions = document.createElement('div');
    actions.className = 'sl-quiz-actions';

    this.#submitButton = document.createElement('button');
    this.#submitButton.type = 'submit';
    this.#submitButton.className = 'sl-quiz-submit';
    this.#submitButton.textContent = this.#labels.submit;

    this.#resetButton = document.createElement('button');
    this.#resetButton.type = 'button';
    this.#resetButton.className = 'sl-quiz-reset';
    this.#resetButton.textContent = this.#labels.reset;
    this.#resetButton.hidden = true;
    this.#resetButton.addEventListener('click', () => {
      getTracker().reset(this.#quizId);
      this.#resetUi();
    });

    // In auto-submit mode there is no Submit button — picking an answer grades it.
    if (this.#autoSubmit) this.#submitButton.hidden = true;

    actions.append(this.#submitButton, this.#resetButton);
    form.append(actions);

    source.remove();
    this.append(form);
    if (this.#content) this.append(this.#content);
  }

  #buildChoices(source: HTMLElement, form: HTMLFormElement): void {
    const list = findAnswerList(source);
    const nodes = Array.from(source.childNodes);

    const questionNodes = list ? nodes.slice(0, nodes.indexOf(list)) : nodes;
    const question = document.createElement('div');
    question.className = 'sl-quiz-question';
    question.id = `${this.#quizId}-question`;
    question.append(...questionNodes);

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'sl-quiz-fieldset';

    const legend = document.createElement('legend');
    legend.className = 'sr-only';
    legend.textContent = question.textContent?.trim() || this.#labels.submit;
    fieldset.append(legend);

    if (list) {
      // Only task-list items (those with a rendered checkbox) are answers; a
      // plain list item — e.g. an unsupported `[y]` marker that GFM left as
      // text — is ignored rather than becoming a bogus answer.
      const items = Array.from(list.querySelectorAll<HTMLLIElement>(':scope > li')).filter((li) =>
        li.querySelector<HTMLInputElement>('input[type="checkbox"]'),
      );
      const correctCount = items.filter(
        (li) => li.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked,
      ).length;
      const inputType = correctCount > 1 ? 'checkbox' : 'radio';
      const groupName = `${this.#quizId}-answer`;

      this.#answers = items.map((li, index) => this.#buildAnswer(li, index, inputType, groupName));
      if (this.#shuffle) shuffle(this.#answers);
      fieldset.append(...this.#answers.map((answer) => answer.wrapper));

      if (this.#autoSubmit) {
        for (const answer of this.#answers) {
          // Submit on `click` (mouse, tap, Space-activation) rather than
          // `change`, so keyboard users arrowing through the radios are not
          // locked in on the first arrow press.
          answer.input.addEventListener('click', () => this.#handleSubmit());
        }
      }
    }

    form.append(question, fieldset);
    this.#extractContent(list ? nodes.slice(nodes.indexOf(list) + 1) : []);
  }

  #buildAnswer(li: HTMLLIElement, index: number, type: 'radio' | 'checkbox', groupName: string): ChoiceAnswer {
    const checkbox = li.querySelector<HTMLInputElement>('input[type="checkbox"]');
    const correct = checkbox?.checked ?? false;
    checkbox?.remove();

    const blockquote = li.querySelector<HTMLElement>(':scope > blockquote');
    let feedback: HTMLElement | null = null;
    if (blockquote) {
      feedback = document.createElement('div');
      feedback.className = 'sl-quiz-answer-feedback';
      feedback.hidden = true;
      feedback.append(...Array.from(blockquote.childNodes));
      blockquote.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'sl-quiz-answer';

    const input = document.createElement('input');
    input.type = type;
    input.name = groupName;
    input.value = String(index);
    input.id = `${this.#quizId}-answer-${index}`;
    if (correct) input.dataset['correct'] = 'true';

    const label = document.createElement('label');
    label.setAttribute('for', input.id);
    label.append(...Array.from(li.childNodes));

    wrapper.append(input, label);
    if (feedback) wrapper.append(feedback);

    return { wrapper, input, correct, index, feedback };
  }

  #buildBlanks(source: HTMLElement, form: HTMLFormElement): void {
    const { body, content } = splitAtRule(Array.from(source.childNodes));

    const question = document.createElement('div');
    question.className = 'sl-quiz-question';
    question.id = `${this.#quizId}-question`;
    question.append(...body);

    this.#replaceBlanks(question);
    form.append(question);
    this.#extractContent(content);
  }

  /** Walk text nodes and replace `[[answer]]` tokens with text inputs. */
  #replaceBlanks(root: HTMLElement): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      const value = walker.currentNode.nodeValue;
      // Reset before each test: BLANK_PATTERN is a shared global regex and
      // earlier callers (e.g. detectType) leave its lastIndex advanced.
      BLANK_PATTERN.lastIndex = 0;
      if (value && BLANK_PATTERN.test(value)) {
        textNodes.push(walker.currentNode as Text);
      }
    }

    for (const node of textNodes) {
      const fragment = document.createDocumentFragment();
      const text = node.nodeValue ?? '';
      let lastIndex = 0;
      BLANK_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = BLANK_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const answer = match[1]?.trim() ?? '';
        const index = this.#blanks.length;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sl-quiz-blank';
        input.autocomplete = 'off';
        input.dataset['answer'] = answer;
        input.id = `${this.#quizId}-blank-${index}`;
        input.setAttribute('aria-label', `${this.#labels.submit} ${index + 1}`);
        // Width matches the original mkdocs-quiz: at least 5, else answer + 2.
        input.size = Math.max(answer.length + 2, 5);
        this.#blanks.push(input);
        fragment.append(input);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        fragment.append(document.createTextNode(text.slice(lastIndex)));
      }
      node.replaceWith(fragment);
    }
  }

  #extractContent(nodes: Node[]): void {
    const meaningful = nodes.filter((node) => !(node instanceof HTMLElement && node.tagName === 'HR'));
    const hasContent = meaningful.some((node) => !(node.nodeType === Node.TEXT_NODE && !node.nodeValue?.trim()));
    if (!hasContent) return;
    const section = document.createElement('section');
    section.className = 'sl-quiz-content';
    section.hidden = true;
    section.append(...meaningful);
    this.#content = section;
  }

  // --- Submitting & grading ----------------------------------------------

  #handleSubmit(): void {
    const correct = this.#type === 'blank' ? this.#gradeBlanks() : this.#gradeChoices();
    const selected =
      this.#type === 'blank' ? this.#blanks.map((input) => input.value) : this.#selectedIndices().map(String);
    getTracker().record(this.#quizId, correct, selected);
    this.#showResult(correct, true);
  }

  #selectedIndices(): number[] {
    return this.#answers.filter((answer) => answer.input.checked).map((answer) => answer.index);
  }

  #gradeChoices(): boolean {
    const selected = this.#selectedIndices();
    const correct = this.#answers.filter((answer) => answer.correct).map((answer) => answer.index);
    return gradeChoice(selected, correct);
  }

  #gradeBlanks(): boolean {
    return gradeBlanks(
      this.#blanks.map((input) => input.value),
      this.#blanks.map((input) => input.dataset['answer'] ?? ''),
    );
  }

  #showResult(correct: boolean, focus: boolean): void {
    if (this.#content) this.#content.hidden = false;
    if (this.#type === 'blank') {
      this.#markBlanks();
    } else {
      this.#markChoices(correct);
    }
    this.#renderFeedback(correct);

    if (this.#disableAfterSubmit) {
      this.#setDisabled(true);
      this.#submitButton.hidden = true;
      this.#resetButton.hidden = true;
    } else {
      this.#submitButton.hidden = true;
      this.#resetButton.hidden = false;
    }

    if (focus) {
      this.#feedback.tabIndex = -1;
      this.#feedback.focus();
    }
  }

  #markChoices(correct: boolean): void {
    for (const answer of this.#answers) {
      answer.wrapper.classList.remove('sl-quiz-answer--correct', 'sl-quiz-answer--wrong');
      if (answer.feedback) answer.feedback.hidden = true;
      const selected = answer.input.checked;
      if (selected && answer.correct) {
        answer.wrapper.classList.add('sl-quiz-answer--correct');
      } else if (selected && !answer.correct) {
        answer.wrapper.classList.add('sl-quiz-answer--wrong');
      } else if (!selected && answer.correct && (this.#showCorrect || correct)) {
        answer.wrapper.classList.add('sl-quiz-answer--correct');
      }
    }
  }

  #markBlanks(): void {
    for (const input of this.#blanks) {
      const ok = gradeBlank(input.value, input.dataset['answer'] ?? '');
      input.classList.remove('sl-quiz-blank--correct', 'sl-quiz-blank--wrong');
      input.classList.add(ok ? 'sl-quiz-blank--correct' : 'sl-quiz-blank--wrong');
      if (!ok && this.#showCorrect) {
        input.placeholder = input.dataset['answer'] ?? '';
      }
    }
  }

  #renderFeedback(correct: boolean): void {
    this.#feedback.replaceChildren();
    this.#feedback.classList.toggle('sl-quiz-feedback--correct', correct);
    this.#feedback.classList.toggle('sl-quiz-feedback--wrong', !correct);

    const items: HTMLElement[] = [];
    if (this.#type !== 'blank') {
      for (const answer of this.#answers) {
        if (answer.input.checked && answer.feedback) {
          const item = document.createElement('div');
          item.className = 'sl-quiz-feedback-item';
          item.append(...Array.from(answer.feedback.cloneNode(true).childNodes));
          items.push(item);
        }
      }
    }

    if (items.length === 0) {
      const message = document.createElement('p');
      message.className = 'sl-quiz-feedback-message';
      message.textContent = correct
        ? this.#labels.correct
        : this.#disableAfterSubmit
          ? this.#labels.incorrect
          : this.#labels.tryAgain;
      items.push(message);
    }

    if (this.#type === 'blank' && !correct && this.#showCorrect) {
      items.push(this.#buildBlankCorrections());
    }

    this.#feedback.append(...items);
    this.#feedback.hidden = false;
  }

  #buildBlankCorrections(): HTMLElement {
    const list = document.createElement('ul');
    list.className = 'sl-quiz-corrections';
    for (const input of this.#blanks) {
      const expected = input.dataset['answer'] ?? '';
      if (gradeBlank(input.value, expected)) continue;
      const item = document.createElement('li');
      const wrong = document.createElement('del');
      wrong.textContent = input.value || '…';
      const right = document.createElement('ins');
      right.textContent = expected;
      item.append(wrong, document.createTextNode(' → '), right);
      list.append(item);
    }
    return list;
  }

  // --- Restore & reset ----------------------------------------------------

  #restore(): void {
    const state = getTracker().register(this.#quizId);
    if (!state?.answered) return;

    if (this.#type === 'blank') {
      this.#blanks.forEach((input, index) => {
        input.value = state.selected[index] ?? '';
      });
    } else {
      const selected = new Set(state.selected);
      for (const answer of this.#answers) {
        answer.input.checked = selected.has(String(answer.index));
      }
    }
    this.#showResult(state.correct, false);
  }

  #setDisabled(disabled: boolean): void {
    for (const answer of this.#answers) answer.input.disabled = disabled;
    for (const input of this.#blanks) input.disabled = disabled;
  }

  #resetUi(): void {
    for (const answer of this.#answers) {
      answer.input.checked = false;
      answer.wrapper.classList.remove('sl-quiz-answer--correct', 'sl-quiz-answer--wrong');
      if (answer.feedback) answer.feedback.hidden = true;
    }
    for (const input of this.#blanks) {
      input.value = '';
      input.placeholder = '';
      input.classList.remove('sl-quiz-blank--correct', 'sl-quiz-blank--wrong');
    }
    this.#setDisabled(false);
    this.#feedback.hidden = true;
    this.#feedback.replaceChildren();
    if (this.#content) this.#content.hidden = true;
    this.#submitButton.hidden = this.#autoSubmit;
    this.#resetButton.hidden = true;
  }
}

/** Register the `<sl-quiz>` custom element (idempotent). */
export function defineQuizElement(): void {
  if (typeof customElements !== 'undefined' && !customElements.get(QUIZ_ELEMENT)) {
    customElements.define(QUIZ_ELEMENT, StarlightQuizElement);
  }
}
