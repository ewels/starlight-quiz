import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightPageActions from 'starlight-page-actions';
import starlightQuiz from 'starlight-quiz';

// https://astro.build/config
export default defineConfig({
  site: 'https://ewels.github.io',
  base: '/starlight-quiz',
  integrations: [
    starlight({
      title: 'Starlight Quiz',
      description: 'Interactive quizzes for Astro and Starlight, authored in markdown.',
      logo: { src: './src/assets/logo/starlight-quiz-icon.svg', alt: 'Starlight Quiz' },
      customCss: ['./src/styles/custom.css'],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ewels/starlight-quiz' }],
      // Adds og:image (Starlight omits it) and the rel="alternate" Markdown pointer.
      components: { Head: './src/components/Head.astro' },
      plugins: [
        starlightQuiz(),
        starlightLlmsTxt({
          projectName: 'Starlight Quiz',
          description:
            'A plugin that adds interactive, self-marking quizzes to Astro and Starlight documentation sites. Quizzes are authored as plain markdown — GitHub task lists become single-choice, multiple-choice or fill-in-the-blank questions — and are rendered as accessible interactive forms with per-answer feedback, progress tracking, an aggregate results panel, QTI export for LMS import and a terminal runner.',
          // Orientation first, changelog last.
          demote: ['guides/changelog', 'guides/contributing*'],
          // The demo page is one long interactive fixture; it teaches a small-context
          // model nothing the syntax guides do not say more directly.
          exclude: ['demo'],
        }),
        // Owns the raw `.md` routes and the copy/open buttons. `baseUrl` is left
        // unset deliberately: setting it makes this plugin write a competing
        // llms.txt, and starlight-llms-txt owns that file.
        starlightPageActions({
          prompt:
            'Read {url}. It documents starlight-quiz, a markdown-authored quiz plugin for Astro and Starlight. I want to ask questions about it.',
          actions: { chatgpt: true, claude: true, markdown: true, cursor: false, perplexity: false },
        }),
        starlightLinksValidator(),
      ],
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Demo quiz', slug: 'demo' },
            { label: 'Starlight Installation', slug: 'guides/quick-start' },
            { label: 'Astro Installation', slug: 'guides/vanilla-astro' },
          ],
        },
        {
          label: 'Writing Quizzes',
          items: [
            { label: 'Multiple choice', slug: 'guides/multiple-choice' },
            { label: 'Fill-in-the-blank', slug: 'guides/fill-in-the-blank' },
            { label: 'Advanced formatting', slug: 'guides/advanced-formatting' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Progress tracking', slug: 'guides/progress-tracking' },
            { label: 'Results screen', slug: 'guides/results-screen' },
            { label: 'Intro panel', slug: 'guides/intro-panel' },
            { label: 'Auto-numbering', slug: 'guides/auto-numbering' },
            { label: 'Shuffle answers', slug: 'guides/shuffle-answers' },
            { label: 'Translations', slug: 'guides/translations' },
          ],
        },
        {
          label: 'Advanced',
          items: [
            { label: 'Configuration', slug: 'guides/configuration' },
            { label: 'Custom CSS', slug: 'guides/custom-css' },
            { label: 'Terminal runner', slug: 'guides/cli' },
            { label: 'QTI export', slug: 'guides/qti-export' },
          ],
        },
        {
          label: 'Project',
          items: [
            { label: 'Contributing', slug: 'guides/contributing' },
            { label: 'Contributing translations', slug: 'guides/contributing-translations' },
            { label: 'Changelog', slug: 'guides/changelog' },
          ],
        },
      ],
    }),
  ],
});
