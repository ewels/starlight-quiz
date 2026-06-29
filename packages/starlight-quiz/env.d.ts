/// <reference types="astro/client" />

// Teach Starlight about the translation keys this plugin injects, so that
// `Astro.locals.t('starlightQuiz.…')` is type-checked end to end. This only
// applies when the consumer uses Starlight; it has no effect in vanilla Astro.
declare namespace StarlightApp {
  type QuizTranslations = typeof import('./lib/strings').STRINGS;
  interface I18n extends QuizTranslations {}
}

// The virtual module the plugin's middleware reads the site-wide defaults from.
declare module 'virtual:starlight-quiz-config' {
  export const quizDefaults: import('./lib/config').QuizDefaults;
}
