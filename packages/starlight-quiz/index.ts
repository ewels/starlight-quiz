import type { StarlightPlugin } from '@astrojs/starlight/types';

import { quizManifestIntegration, quizValidationIntegration } from './integration';
import { DEFAULT_QUIZ_DEFAULTS, type ProgressPosition, type QuizDefaults } from './lib/config';
import { quizConfigIntegration } from './libs/config-integration';
import { overrideStarlightComponent, type StarlightComponentName } from './libs/starlight';
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
   * Where the progress widget sits relative to the table of contents:
   * `'top'` (above the on-this-page links) or `'bottom'`.
   *
   * @default 'top'
   */
  progressPosition?: ProgressPosition;
  /**
   * Emit a structured JSON manifest of every quiz, for the QTI exporter and
   * terminal runner to consume. Written to the build output, and served by the
   * dev server at the same path. Enabled by default; set to `false` to opt out,
   * or pass a string to choose the filename (defaults to `quiz-manifest.json`).
   *
   * @default true
   */
  manifest?: boolean | string;
  /**
   * Fail the build if a quiz has malformed answers — for example an
   * unrecognised checkbox marker (`[y]`, `[o]`, a smart bracket) that GFM would
   * render as plain text and silently drop. Set to `false` to allow such items
   * to be ignored instead. (`[]` with no inner space is accepted as an
   * unchecked answer, matching mkdocs-quiz.)
   *
   * @default true
   */
  validate?: boolean;
  /**
   * Site-wide defaults for quiz behaviour, applied to every `<Quiz>` and
   * `<QuizResults>` that doesn't set the matching prop itself. Lets you, for
   * example, turn confetti off or switch to manual submit everywhere without
   * touching each quiz.
   *
   * @default { autoSubmit: true, disableAfterSubmit: true, showCorrect: true, shuffle: false, confetti: true }
   */
  quizDefaults?: Partial<QuizDefaults>;
}

/**
 * The `starlight-quiz` Starlight plugin.
 *
 * Wires up the bundled translations and theme CSS so authors can use the
 * `<Quiz>` and `<QuizResults>` components in MDX with zero configuration. The
 * components themselves are imported from `starlight-quiz/components`.
 */
export default function starlightQuiz(options: StarlightQuizOptions = {}): StarlightPlugin {
  const {
    injectStyles = true,
    progressTracker = true,
    progressPosition = 'top',
    manifest = true,
    validate = true,
  } = options;
  const quizDefaults: QuizDefaults = { ...DEFAULT_QUIZ_DEFAULTS, ...options.quizDefaults };

  return {
    name: 'starlight-quiz',
    hooks: {
      'i18n:setup'({ injectTranslations }) {
        injectTranslations(Translations);
      },
      'config:setup'({ addIntegration, config, logger, updateConfig }) {
        addIntegration(quizConfigIntegration({ defaults: quizDefaults, progressPosition }));

        if (validate) {
          addIntegration(quizValidationIntegration());
        }
        if (manifest) {
          addIntegration(quizManifestIntegration(typeof manifest === 'string' ? { filename: manifest } : {}));
        }

        const customCss = injectStyles ? [...(config.customCss ?? []), 'starlight-quiz/styles'] : config.customCss;

        function override(component: StarlightComponentName, entrypoint: string) {
          return overrideStarlightComponent(config.components, logger, component, entrypoint);
        }

        const components = progressTracker
          ? {
              ...config.components,
              ...override('TableOfContents', 'starlight-quiz/overrides/TableOfContents.astro'),
              ...override('MobileTableOfContents', 'starlight-quiz/overrides/MobileTableOfContents.astro'),
              ...override('Footer', 'starlight-quiz/overrides/Footer.astro'),
            }
          : config.components;

        updateConfig({ customCss, components });
      },
    },
  };
}
