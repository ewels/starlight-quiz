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
      plugins: [starlightQuiz({ manifest: true })],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Quick start', slug: 'guides/quick-start' },
            { label: 'Live demo', slug: 'demo' },
          ],
        },
        {
          label: 'Question types',
          items: [
            { label: 'Multiple choice', slug: 'guides/multiple-choice' },
            { label: 'Fill-in-the-blank', slug: 'guides/fill-in-the-blank' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Shuffle answers', slug: 'guides/shuffle-answers' },
            { label: 'Progress tracking', slug: 'guides/progress-tracking' },
            { label: 'Results screen', slug: 'guides/results-screen' },
            { label: 'Intro panel', slug: 'guides/intro-panel' },
            { label: 'Advanced formatting', slug: 'guides/advanced-formatting' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Configuration', slug: 'guides/configuration' },
            { label: 'Translations', slug: 'guides/translations' },
            { label: 'Command-line tools', slug: 'guides/cli' },
            { label: 'Vanilla Astro', slug: 'guides/vanilla-astro' },
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
