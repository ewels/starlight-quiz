<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ewels/starlight-quiz/main/.github/assets/wordmark-dark.svg" />
  <img alt="starlight-quiz" src="https://raw.githubusercontent.com/ewels/starlight-quiz/main/.github/assets/wordmark.svg" width="420" />
</picture>

[![npm version](https://img.shields.io/npm/v/starlight-quiz.svg)](https://www.npmjs.com/package/starlight-quiz)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/ewels/starlight-quiz/blob/main/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-ewels.github.io-7c3aed.svg)](https://ewels.github.io/starlight-quiz)

A spiritual port of [**mkdocs-quiz**](https://github.com/ewels/mkdocs-quiz) for [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

</div>

A plugin to create interactive quizzes directly in your Astro and Starlight markdown documentation. Perfect for
educational content, tutorials, and documentation that requires reader engagement.

## Features

- ✨ **Simple markdown syntax** – write quizzes with GitHub-flavoured task lists, no new syntax to learn
- 🎯 **Multiple quiz types** – single choice (radio), multiple choice (checkboxes), and fill-in-the-blank
- ⚡ **Instant feedback** – per-answer feedback and visual correct/incorrect indicators
- 📊 **Progress &amp; results** – an aggregate results panel with score tiers and confetti :tada:
- 💾 **Results saved** – answers persist to the browser's local storage, surviving reloads and rebuilds
- 🌐 **Internationalisation** – English, French, German and Spanish out of the box, with label props otherwise
- 🧩 **Works anywhere** – a zero-config Starlight plugin or standalone in any Astro project, safe under view transitions
- ♿ **Accessible** – real fieldsets, `aria-live` feedback, focus management and keyboard-safe auto-submit

```mdx
import { Quiz } from 'starlight-quiz/components';

<Quiz title="Static site generators">
Which of these are static site generators?

- [x] Astro
- [ ] Django
- [x] Eleventy

Astro and Eleventy build static sites, while Django is a web framework.

</Quiz>
```

## Installation

```sh
npm install starlight-quiz
```

## Usage

### As a Starlight plugin (zero config)

Add the plugin to your Starlight configuration — it wires up the styles and translations for you:

```js
// astro.config.mjs
import starlight from '@astrojs/starlight';
import starlightQuiz from 'starlight-quiz';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My docs',
      plugins: [starlightQuiz()],
    }),
  ],
});
```

Then import the components in any `.mdx` page and author your quiz with markdown:

```mdx
import { Quiz, QuizResults } from 'starlight-quiz/components';

<Quiz title="Primary colours">
Which of these are primary colours?

- [x] Red
- [ ] Green
  > Green is a secondary colour.
- [x] Blue

Primary colours cannot be made by mixing other colours.

</Quiz>

<Quiz title="Cell biology">
The powerhouse of the cell is the [[mitochondria]].
</Quiz>

<QuizResults confetti />
```

### Standalone in any Astro project

The components have no hard dependency on Starlight. Import them the same way and the stylesheet yourself, passing label
props for any text you want to translate:

```astro
---
import { Quiz } from 'starlight-quiz/components';
import 'starlight-quiz/styles';
---

<Quiz title="Quick check" submitLabel="Check answer">
Is the sky blue?

- [x] Yes
- [ ] No
</Quiz>
```

## Documentation

Full guides, the authoring reference and a live demo are on the **[documentation site](https://ewels.github.io/starlight-quiz)**.

## License

This project is licensed under the [Apache License 2.0](https://github.com/ewels/starlight-quiz/blob/main/LICENSE).

## Credits

- Created by [Phil Ewels](https://github.com/ewels)
- Ported from [mkdocs-quiz](https://github.com/ewels/mkdocs-quiz), originally by [Sebastian Jörz](https://github.com/skyface753)
