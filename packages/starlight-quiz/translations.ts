import { STRINGS } from './lib/strings';

/**
 * Translation tables injected into Starlight via the `i18n:setup` hook. English
 * is the single source of truth in `lib/strings.ts`; the other locales mirror
 * its keys. Add a locale by adding a table here.
 */
export const Translations: Record<string, Record<string, string>> = {
  en: { ...STRINGS },
  fr: {
    'starlightQuiz.submit': 'Valider',
    'starlightQuiz.reset': 'Réinitialiser',
    'starlightQuiz.correct': 'Correct !',
    'starlightQuiz.incorrect': 'Incorrect.',
    'starlightQuiz.tryAgain': 'Incorrect — réessayez.',
    'starlightQuiz.intro.text':
      'Les réponses de cette page sont enregistrées dans le stockage local de votre navigateur et persistent entre les visites.',
    'starlightQuiz.results.title': 'Votre score',
    'starlightQuiz.results.progress': 'Progression',
    'starlightQuiz.progressHeading': 'Progression du quiz',
    'starlightQuiz.results.badge': 'Quiz',
    'starlightQuiz.results.answered': 'répondues',
    'starlightQuiz.results.correct': 'correctes',
    'starlightQuiz.results.resetAll': 'Réinitialiser toutes les réponses',
    'starlightQuiz.results.confirmReset':
      'Réinitialiser toutes les réponses de cette page ? Cette action est irréversible.',
    'starlightQuiz.results.excellent': 'Excellent ! Sans faute !',
    'starlightQuiz.results.good': 'Bravo ! Vous maîtrisez le sujet !',
    'starlightQuiz.results.average': 'Bon effort ! Continuez à apprendre !',
    'starlightQuiz.results.poor': 'Pas mal, mais il y a encore à faire !',
    'starlightQuiz.results.fail': 'Ce sera pour la prochaine fois ! Persévérez !',
  },
  de: {
    'starlightQuiz.submit': 'Absenden',
    'starlightQuiz.reset': 'Zurücksetzen',
    'starlightQuiz.correct': 'Richtig!',
    'starlightQuiz.incorrect': 'Falsch.',
    'starlightQuiz.tryAgain': 'Falsch — versuche es erneut.',
    'starlightQuiz.intro.text':
      'Die Antworten auf dieser Seite werden im lokalen Speicher deines Browsers gespeichert und bleiben zwischen Besuchen erhalten.',
    'starlightQuiz.results.title': 'Dein Ergebnis',
    'starlightQuiz.results.progress': 'Fortschritt',
    'starlightQuiz.progressHeading': 'Quiz-Fortschritt',
    'starlightQuiz.results.badge': 'Quiz',
    'starlightQuiz.results.answered': 'beantwortet',
    'starlightQuiz.results.correct': 'richtig',
    'starlightQuiz.results.resetAll': 'Alle Antworten zurücksetzen',
    'starlightQuiz.results.confirmReset':
      'Alle Antworten auf dieser Seite zurücksetzen? Dies kann nicht rückgängig gemacht werden.',
    'starlightQuiz.results.excellent': 'Hervorragend! Alles richtig!',
    'starlightQuiz.results.good': 'Super gemacht! Du kennst dich wirklich aus!',
    'starlightQuiz.results.average': 'Guter Versuch! Bleib dran!',
    'starlightQuiz.results.poor': 'Nicht schlecht, aber da geht noch mehr!',
    'starlightQuiz.results.fail': 'Beim nächsten Mal klappt es! Weiter so!',
  },
  es: {
    'starlightQuiz.submit': 'Enviar',
    'starlightQuiz.reset': 'Reiniciar',
    'starlightQuiz.correct': '¡Correcto!',
    'starlightQuiz.incorrect': 'Incorrecto.',
    'starlightQuiz.tryAgain': 'Incorrecto: inténtalo de nuevo.',
    'starlightQuiz.intro.text':
      'Las respuestas de esta página se guardan en el almacenamiento local de tu navegador y se conservan entre visitas.',
    'starlightQuiz.results.title': 'Tu puntuación',
    'starlightQuiz.results.progress': 'Progreso',
    'starlightQuiz.progressHeading': 'Progreso del cuestionario',
    'starlightQuiz.results.badge': 'Quiz',
    'starlightQuiz.results.answered': 'respondidas',
    'starlightQuiz.results.correct': 'correctas',
    'starlightQuiz.results.resetAll': 'Reiniciar todas las respuestas',
    'starlightQuiz.results.confirmReset':
      '¿Reiniciar todas las respuestas de esta página? Esta acción no se puede deshacer.',
    'starlightQuiz.results.excellent': '¡Excelente! ¡Lo has clavado!',
    'starlightQuiz.results.good': '¡Buen trabajo! ¡Dominas el tema!',
    'starlightQuiz.results.average': '¡Buen esfuerzo! ¡Sigue aprendiendo!',
    'starlightQuiz.results.poor': '¡No está mal, pero se puede mejorar!',
    'starlightQuiz.results.fail': '¡Más suerte la próxima vez! ¡Sigue intentándolo!',
  },
};
