/**
 * The English strings, used both as the vanilla-Astro fallback labels and as
 * the `en` table injected into Starlight's i18n. Keeping one source avoids the
 * defaults drifting from the translations.
 */
export const STRINGS = {
  'starlightQuiz.questionNumber': 'Question {n}',
  'starlightQuiz.submit': 'Submit',
  'starlightQuiz.reset': 'Reset',
  'starlightQuiz.correct': 'Correct!',
  'starlightQuiz.incorrect': 'Incorrect.',
  'starlightQuiz.tryAgain': 'Incorrect — try again.',
  'starlightQuiz.empty': '(empty)',
  'starlightQuiz.intro.text':
    "Quiz answers on this page are saved to your browser's local storage and persist between visits.",
  'starlightQuiz.results.title': 'Your score',
  // The progress widget's three labels. `answered` and `progressCorrect` lead
  // their counts ("Answered: 3 / 10"), with the colon rendered by the
  // component — mirroring mkdocs-quiz's `Answered:` / `Correct:` sidebar. The
  // `results.` prefix on `answered` is historical; its twin is progressCorrect.
  'starlightQuiz.progressHeading': 'Quiz Progress',
  'starlightQuiz.results.answered': 'Answered',
  'starlightQuiz.progressCorrect': 'Correct',
  'starlightQuiz.results.badge': 'Quiz',
  'starlightQuiz.results.questionsAnswered': 'questions answered',
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
