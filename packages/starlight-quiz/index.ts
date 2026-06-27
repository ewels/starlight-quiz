import type { StarlightPlugin } from '@astrojs/starlight/types';

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
}

/**
 * The `starlight-quiz` Starlight plugin.
 *
 * Wires up the bundled translations and theme CSS so authors can use the
 * `<Quiz>` and `<QuizResults>` components in MDX with zero configuration. The
 * components themselves are imported from `starlight-quiz/components`.
 */
export default function starlightQuiz(options: StarlightQuizOptions = {}): StarlightPlugin {
  const { injectStyles = true } = options;

  return {
    name: 'starlight-quiz',
    hooks: {
      'i18n:setup'({ injectTranslations }) {
        injectTranslations(Translations);
      },
      'config:setup'({ config, updateConfig }) {
        if (injectStyles) {
          updateConfig({
            customCss: [...(config.customCss ?? []), 'starlight-quiz/styles'],
          });
        }
      },
    },
  };
}
