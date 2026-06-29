/** The kind of quiz, derived from its authored content. */
export type QuizType = 'single' | 'multiple' | 'blank';

/** Persisted state for a single quiz. */
export interface QuizState {
  /** Whether the quiz has been submitted. */
  answered: boolean;
  /** Whether the submitted answer was fully correct. */
  correct: boolean;
  /**
   * The values the user selected/entered, so the quiz can be restored.
   * For choice quizzes these are the answer indices as strings; for
   * fill-in-the-blank quizzes they are the raw input strings, in order.
   */
  selected: string[];
}

/** Aggregate progress across every quiz on the current page. */
export interface QuizProgress {
  /** Total number of quizzes registered on the page. */
  total: number;
  /** Number of quizzes that have been answered. */
  answered: number;
  /** Number of quizzes answered correctly. */
  correct: number;
  /** Percentage of quizzes answered (`answered / total`), 0–100. */
  percentage: number;
  /** Percentage scored across all quizzes (`correct / total`), 0–100. */
  score: number;
}

/** A resolved set of user-facing strings, passed from the component to the runtime. */
export interface QuizLabels {
  submit: string;
  reset: string;
  correct: string;
  incorrect: string;
  tryAgain: string;
  /** Shown in the corrections list when a fill-in-the-blank was left empty. */
  empty: string;
}

declare global {
  interface WindowEventMap {
    'starlight-quiz:progress': CustomEvent<QuizProgress>;
    'starlight-quiz:reset-all': CustomEvent<void>;
  }
}
