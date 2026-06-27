import type { StarlightPlugin } from '@astrojs/starlight/types';

import { quizManifestIntegration } from './integration';
import { overrideStarlightComponent } from './libs/starlight';
import { Translations } from './translations';

/** Options for the `starlight-quiz` plugin. */
export interface StarlightQuizOptions {
  /**
   * Append the bundled theme CSS to Starlight's `customCss`. Disable this if you
   * want to provide all quiz styling yourself.
   *
   * @default true
   */
  injectStyles?: boolean;
  /**
   * Show an aggregate progress tracker (answered + correct across the page) in
   * the table of contents, by overriding Starlight's `TableOfContents` and
   * `MobileTableOfContents` components. The widget hides itself on pages with
   * no quizzes.
   *
   * @default true
   */
  progressTracker?: boolean;
  /**
   * Emit a structured JSON manifest of every quiz to the build output, for the
   * QTI exporter and terminal runner to consume. Pass `true` for the default
   * filename (`quiz-manifest.json`) or a string to set the filename.
   *
   * @default false
   */
  manifest?: boolean | string;
}

/**
 * The `starlight-quiz` Starlight plugin.
 *
 * Wires up the bundled translations and theme CSS so authors can use the
 * `<Quiz>` and `<QuizResults>` components in MDX with zero configuration. The
 * components themselves are imported from `starlight-quiz/components`.
 */
export default function starlightQuiz(options: StarlightQuizOptions = {}): StarlightPlugin {
  const { injectStyles = true, progressTracker = true, manifest = false } = options;

  return {
    name: 'starlight-quiz',
    hooks: {
      'i18n:setup'({ injectTranslations }) {
        injectTranslations(Translations);
      },
      'config:setup'({ addIntegration, config, logger, updateConfig }) {
        if (manifest) {
          addIntegration(quizManifestIntegration(typeof manifest === 'string' ? { filename: manifest } : {}));
        }

        const customCss = injectStyles ? [...(config.customCss ?? []), 'starlight-quiz/styles'] : config.customCss;

        const components = progressTracker
          ? {
              ...config.components,
              ...overrideStarlightComponent(
                config.components,
                logger,
                'TableOfContents',
                'starlight-quiz/overrides/TableOfContents.astro',
              ),
              ...overrideStarlightComponent(
                config.components,
                logger,
                'MobileTableOfContents',
                'starlight-quiz/overrides/MobileTableOfContents.astro',
              ),
            }
          : config.components;

        updateConfig({ customCss, components });
      },
    },
  };
}
