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
      logo: { src: './src/assets/logo.svg', alt: 'Starlight Quiz' },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ewels/starlight-quiz' }],
      plugins: [starlightQuiz()],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Getting started', slug: 'guides/getting-started' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Authoring quizzes', slug: 'guides/authoring' },
            { label: 'Results & scoring', slug: 'guides/results' },
            { label: 'Vanilla Astro', slug: 'guides/vanilla-astro' },
          ],
        },
        {
          label: 'Reference',
          items: [{ label: 'Live demo', slug: 'demo' }],
        },
      ],
    }),
  ],
});
