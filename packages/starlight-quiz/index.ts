import type { StarlightPlugin } from '@astrojs/starlight/types';

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
}

/**
 * The `starlight-quiz` Starlight plugin.
 *
 * Wires up the bundled translations and theme CSS so authors can use the
 * `<Quiz>` and `<QuizResults>` components in MDX with zero configuration. The
 * components themselves are imported from `starlight-quiz/components`.
 */
export default function starlightQuiz(options: StarlightQuizOptions = {}): StarlightPlugin {
  const { injectStyles = true, progressTracker = true } = options;

  return {
    name: 'starlight-quiz',
    hooks: {
      'i18n:setup'({ injectTranslations }) {
        injectTranslations(Translations);
      },
      'config:setup'({ config, logger, updateConfig }) {
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
