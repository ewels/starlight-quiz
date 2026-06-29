// Middleware registered by the plugin (via addMiddleware) to expose the
// site-wide quiz defaults on `Astro.locals`, where the components read them.
// Only loaded under the Starlight plugin, so the virtual module always exists.
import { defineMiddleware } from 'astro:middleware';
import { progressPosition, quizDefaults } from 'virtual:starlight-quiz-config';

export const onRequest = defineMiddleware((context, next) => {
  (context.locals as Record<string, unknown>)['starlightQuiz'] = { defaults: quizDefaults, progressPosition };
  return next();
});
