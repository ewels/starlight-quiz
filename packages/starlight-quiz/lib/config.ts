/**
 * Site-wide quiz behaviour defaults.
 *
 * The Starlight plugin lets authors set these once (the `quizDefaults` option)
 * instead of on every `<Quiz>`/`<QuizResults>`. The plugin pushes the resolved
 * values onto `Astro.locals` via middleware; components read them here and an
 * explicit prop still wins. Outside Starlight there is no middleware, so the
 * built-in defaults below apply (and props still override them).
 *
 * This module is framework-agnostic — it must not import `astro`.
 */
export interface QuizDefaults {
  /** Single-choice quizzes grade on click (no Submit button). */
  autoSubmit: boolean;
  /** Lock a quiz after submitting (vs. showing a reset button). */
  disableAfterSubmit: boolean;
  /** Highlight the correct answer(s) after a wrong submission. */
  showCorrect: boolean;
  /** Shuffle answer order on load (choice quizzes only). */
  shuffle: boolean;
  /** Fire confetti from `<QuizResults>` on a first-time completion. */
  confetti: boolean;
  /** Prefix each quiz with a "Question N" heading, numbered down the page. */
  autoNumber: boolean;
}

/** The built-in defaults, used when nothing overrides them. */
export const DEFAULT_QUIZ_DEFAULTS: QuizDefaults = {
  autoSubmit: true,
  disableAfterSubmit: true,
  showCorrect: true,
  shuffle: false,
  confetti: true,
  autoNumber: false,
};

/**
 * Read the site-wide defaults off `Astro.locals` (set by the plugin), merged
 * over the built-ins. Defensive so it is safe in vanilla Astro, where
 * `locals.starlightQuiz` is absent.
 */
export function getQuizDefaults(locals: unknown): QuizDefaults {
  if (typeof locals === 'object' && locals !== null) {
    const holder = (locals as Record<string, unknown>)['starlightQuiz'];
    if (typeof holder === 'object' && holder !== null) {
      const defaults = (holder as Record<string, unknown>)['defaults'];
      if (typeof defaults === 'object' && defaults !== null) {
        return { ...DEFAULT_QUIZ_DEFAULTS, ...(defaults as Partial<QuizDefaults>) };
      }
    }
  }
  return DEFAULT_QUIZ_DEFAULTS;
}
