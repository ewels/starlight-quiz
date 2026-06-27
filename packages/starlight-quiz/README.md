# starlight-quiz

Interactive, self-marking quizzes for [Astro](https://astro.build/) with first-class
[Starlight](https://starlight.astro.build/) support. Author quizzes with familiar markdown — task lists for answers,
blockquotes for feedback and `[[double brackets]]` for fill-in-the-blank.

📖 **[Read the documentation →](https://ewels.github.io/starlight-quiz)**

## Features

- **Single-choice, multiple-choice and fill-in-the-blank** questions (multiple choice is detected automatically when
  more than one answer is correct).
- **Markdown authoring** inside a `<Quiz>` component — no new syntax to learn.
- **Per-answer feedback**, an optional post-answer explanation, show-correct, auto-submit, shuffle and reset.
- **Aggregate results panel** with score tiers and optional, tree-shakeable confetti.
- **Progress persistence** to `localStorage`, keyed by page path and a stable quiz id, with corruption recovery.
- **Accessible**: real fieldsets, grouped radios/checkboxes, `aria-live` feedback and focus management.
- **Themeable** via Starlight's colour tokens, with light/dark handled automatically.
- Works **with or without Starlight**, and is safe under Astro's `<ClientRouter>` view transitions.

## Installation

```sh
npm install starlight-quiz
```

## Usage with Starlight

Add the plugin to your Starlight config:

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

Then use the components in any `.mdx` page:

```mdx
import { Quiz, QuizResults } from 'starlight-quiz/components';

<Quiz title="Primary colours">
Which of these are primary colours?

- [x] Red
- [ ] Green
  > Green is a secondary colour.
- [x] Blue

---

Primary colours cannot be made by mixing other colours.

</Quiz>

<Quiz title="Cell biology">The powerhouse of the cell is the [[mitochondria]].</Quiz>

<QuizResults confetti />
```

## Usage without Starlight (vanilla Astro)

The components have no hard dependency on Starlight. Import them the same way and pass label props for any text you want
to localise:

```astro
---
import { Quiz } from 'starlight-quiz/components';
import 'starlight-quiz/styles';
---

<Quiz title="Quick check" submitLabel="Check answer"> Is the sky blue? - [x] Yes - [ ] No </Quiz>
```

## Authoring reference

| Syntax         | Meaning                                                          |
| -------------- | ---------------------------------------------------------------- |
| `- [x] Answer` | A correct answer.                                                |
| `- [ ] Answer` | An incorrect answer.                                             |
| `  > Feedback` | Per-answer feedback (indent it under its answer).                |
| `[[answer]]`   | A fill-in-the-blank (case-insensitive, whitespace-trimmed).      |
| `---`          | Separates the question from an optional post-answer explanation. |

More than one correct answer turns a quiz into multiple-choice (checkboxes); a single correct answer is single-choice
(radios).

### `<Quiz>` props

| Prop                 | Type      | Default | Description                                                  |
| -------------------- | --------- | ------- | ------------------------------------------------------------ |
| `id`                 | `string`  | —       | Stable id for persistence (falls back to a hash of `title`). |
| `title`              | `string`  | —       | Heading shown above the quiz.                                |
| `shuffle`            | `boolean` | `false` | Shuffle answer order on load.                                |
| `autoSubmit`         | `boolean` | `false` | Submit a single-choice quiz when an answer is chosen.        |
| `disableAfterSubmit` | `boolean` | `true`  | Lock after submitting; when `false`, shows a reset button.   |
| `showCorrect`        | `boolean` | `true`  | Reveal the correct answer(s) after a wrong submission.       |
| `*Label`             | `string`  | —       | Override any UI string (`submitLabel`, `resetLabel`, …).     |

See the [documentation](https://ewels.github.io/starlight-quiz) for the full prop and `<QuizResults>` reference.

## Licence

[Apache-2.0](https://github.com/ewels/starlight-quiz/blob/main/LICENSE) © Phil Ewels
