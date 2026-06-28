/**
 * The English strings, used both as the vanilla-Astro fallback labels and as
 * the `en` table injected into Starlight's i18n. Keeping one source avoids the
 * defaults drifting from the translations.
 */
export const STRINGS = {
  'starlightQuiz.submit': 'Submit',
  'starlightQuiz.reset': 'Reset',
  'starlightQuiz.correct': 'Correct!',
  'starlightQuiz.incorrect': 'Incorrect.',
  'starlightQuiz.tryAgain': 'Incorrect — try again.',
  'starlightQuiz.results.title': 'Your score',
  'starlightQuiz.results.progress': 'Progress',
  'starlightQuiz.results.badge': 'Quiz',
  'starlightQuiz.results.answered': 'answered',
  'starlightQuiz.results.correct': 'correct',
  'starlightQuiz.results.resetAll': 'Reset all answers',
  'starlightQuiz.results.confirmReset': 'Reset every answer on this page? This cannot be undone.',
  'starlightQuiz.results.excellent': 'Outstanding! You aced it!',
  'starlightQuiz.results.good': 'Great job! You really know your stuff!',
  'starlightQuiz.results.average': 'Good effort! Keep learning!',
  'starlightQuiz.results.poor': "Not bad, but there's room for improvement!",
  'starlightQuiz.results.fail': 'Better luck next time! Keep trying!',
} as const;

export type StringKey = keyof typeof STRINGS;
