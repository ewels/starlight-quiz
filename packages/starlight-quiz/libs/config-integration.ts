import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';

import type { ProgressPosition, QuizDefaults } from '../lib/config';

export interface QuizPluginConfig {
  defaults: QuizDefaults;
  progressPosition: ProgressPosition;
}

const VIRTUAL_ID = 'virtual:starlight-quiz-config';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/** A Vite plugin exposing the resolved plugin config as a virtual module. */
function configVitePlugin(config: QuizPluginConfig): Plugin {
  return {
    name: 'starlight-quiz:config',
    resolveId(source) {
      return source === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      return [
        `export const quizDefaults = ${JSON.stringify(config.defaults)};`,
        `export const progressPosition = ${JSON.stringify(config.progressPosition)};`,
      ].join('\n');
    },
  };
}

/**
 * Integration that publishes the resolved plugin config to `Astro.locals` via a
 * small middleware, so the components and overrides can read it at render time.
 * The config is baked into a virtual module the middleware imports.
 */
export function quizConfigIntegration(config: QuizPluginConfig): AstroIntegration {
  return {
    name: 'starlight-quiz/config',
    hooks: {
      'astro:config:setup'({ addMiddleware, updateConfig }) {
        updateConfig({ vite: { plugins: [configVitePlugin(config)] } });
        addMiddleware({ entrypoint: 'starlight-quiz/libs/middleware', order: 'pre' });
      },
    },
  };
}
