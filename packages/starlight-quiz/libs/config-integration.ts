import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';

import type { QuizDefaults } from '../lib/config';

const VIRTUAL_ID = 'virtual:starlight-quiz-config';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/** A Vite plugin exposing the resolved defaults as a virtual module. */
function configVitePlugin(defaults: QuizDefaults): Plugin {
  return {
    name: 'starlight-quiz:config',
    resolveId(source) {
      return source === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      return id === RESOLVED_ID ? `export const quizDefaults = ${JSON.stringify(defaults)};` : undefined;
    },
  };
}

/**
 * Integration that publishes the site-wide quiz defaults to `Astro.locals` via
 * a small middleware, so the components can read them at render time. The
 * defaults are baked into a virtual module the middleware imports.
 */
export function quizConfigIntegration(defaults: QuizDefaults): AstroIntegration {
  return {
    name: 'starlight-quiz/config',
    hooks: {
      'astro:config:setup'({ addMiddleware, updateConfig }) {
        updateConfig({ vite: { plugins: [configVitePlugin(defaults)] } });
        addMiddleware({ entrypoint: 'starlight-quiz/libs/middleware', order: 'pre' });
      },
    },
  };
}
