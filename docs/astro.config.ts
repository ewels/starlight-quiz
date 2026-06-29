import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
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
      plugins: [starlightQuiz()],
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
            { label: 'Changelog', slug: 'guides/changelog' },
          ],
        },
      ],
    }),
  ],
});
