# Contributing

Contributions are welcome. This page is the quick start; the
[Contributing guide](https://ewels.github.io/starlight-quiz/guides/contributing/) on the
documentation site covers translations and releases in full.

## Get it running

A pnpm workspace, Node ≥ 22.12. The published package lives in `packages/starlight-quiz`; the
`docs` site dogfoods it and doubles as the end-to-end test fixture.

pnpm comes from npm — `npm install -g pnpm`. Corepack was removed from Node in v25, so
`corepack enable` is not an option on a current Node.

```sh
git clone https://github.com/ewels/starlight-quiz
cd starlight-quiz
pnpm install
prek install    # git pre-commit hook: prettier → eslint → typecheck
pnpm dev
```

The docs site is served under its base path: open
**<http://localhost:4321/starlight-quiz>**, not bare `localhost:4321`.

The package ships its `.ts` and `.astro` source with no build step. Edits inside
`packages/starlight-quiz` are picked up by the dev server directly.

`/demo` exercises every feature, and its quizzes have the stable ids the e2e specs rely on — it is
the fastest way to see a change and the first place to add a new one.

## Checks

| Task                          | Command                     |
| ----------------------------- | --------------------------- |
| Unit tests (Vitest)           | `pnpm test`                 |
| End-to-end tests (Playwright) | `pnpm test:e2e`             |
| Type-check                    | `pnpm typecheck`            |
| Lint · format                 | `pnpm lint` · `pnpm format` |
| Everything, as CI runs it     | `prek run --all-files`      |

## Before you open a pull request

- Add a line under **Unreleased** in `CHANGELOG.md`, in the same pull request as the change. The
  changelog page on the site is generated from it.
- Edited a `.po` file in `packages/starlight-quiz/locales/`? Run
  `pnpm --filter starlight-quiz gen:i18n` and commit the regenerated `translations.ts` with it.
  The `.po` files are shared verbatim with [mkdocs-quiz](https://github.com/ewels/mkdocs-quiz), so
  fix a translation there and both plugins get it.
- `.mdx` is formatted by hand. Prettier reflows task lists and fenced quiz examples in ways that
  break the authoring syntax, so it is set to skip those files.

`CLAUDE.md` records the architecture and the Starlight-specific traps worth knowing before changing
the package. Two rules to know up front: `lib/` never imports `astro` or `@astrojs/starlight`, and
the package registers no remark plugin — they do not run in this pipeline, so markdown quirks are
normalised at the DOM and HTML layer instead.
