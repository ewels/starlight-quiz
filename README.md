<div align="center">

# starlight-quiz

Interactive quizzes for [Astro](https://astro.build/) with first-class [Starlight](https://starlight.astro.build/)
support.

[Documentation](https://ewels.github.io/starlight-quiz) · [npm](https://www.npmjs.com/package/starlight-quiz)

</div>

`starlight-quiz` lets you drop interactive, self-marking quizzes straight into your MDX. Author them with familiar
markdown — task lists for answers, blockquotes for feedback, `[[double brackets]]` for fill-in-the-blank — and the
package turns them into accessible, themeable, progress-tracking quizzes that work with or without Starlight.

```mdx
import { Quiz } from 'starlight-quiz/components';

<Quiz title="Primary colours">
Which of these are primary colours?

- [x] Red
- [ ] Green
  > Green is a secondary colour.
- [x] Blue

---

Primary colours cannot be made by mixing other colours.

</Quiz>
```

## Two ways to use it

1. **Starlight plugin** (zero config) — add `starlightQuiz()` to your Starlight `plugins` array and the components,
   styles and translations are wired up for you.
2. **Vanilla Astro** — import the components from `starlight-quiz/components` and use them in any Astro project,
   passing label props for any text you want to translate.

See the [documentation site](https://ewels.github.io/starlight-quiz) for the full guide.

## Repository layout

This is a pnpm workspace monorepo:

| Path                      | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `packages/starlight-quiz` | The published package (the Starlight plugin and the components). |
| `docs`                    | The Starlight documentation site, which dogfoods the plugin.     |

## Contributing

```sh
pnpm install
pnpm dev          # run the docs site
pnpm typecheck    # type-check every workspace
pnpm lint         # lint
pnpm test         # unit tests
pnpm test:e2e     # Playwright end-to-end tests
```

## Licence

[Apache-2.0](./LICENSE) © Phil Ewels
