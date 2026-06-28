# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`starlight-quiz` is a published npm package (in `packages/starlight-quiz`) that adds interactive markdown-authored quizzes to Astro and Starlight. It is a spiritual port of [mkdocs-quiz](https://github.com/ewels/mkdocs-quiz) and intentionally mirrors its quiz syntax and accumulated edge-case behaviour.

## Branding

Logo assets live in `docs/src/assets/logo/` (horizontal, stacked, and icon arrangements, each in light/dark; the icon SVG is mode-agnostic). The SVGs are **outlined** (text converted to vector paths) so they have **no font dependency** — they render identically without the font installed. Wired up in three places: the Starlight header logo (`logo.src` in `docs/astro.config.ts`), the favicon (`docs/public/favicon.svg`), and the README's horizontal lockup. `starlight-quiz` is part of a shared quiz-plugin logo family with `mkdocs-quiz` (same icon: a multiple-choice list in a rounded tile, distinguished by colour and a per-framework badge).

- **Font:** [Sora](https://fonts.google.com/specimen/Sora) (Open Font License). Wordmark = weight 500 (Medium), letter-spacing -0.02em, lowercase; the badge mark is a star (★, Astro's cue).
- **Brand colour:** `#490086` (the tile, the filled radio bullet, and the `starlight` wordmark prefix in light mode). Dark-mode wordmark prefix: `#C49BEC`. Note this differs from the Starlight site's own accent (`#7c3aed`).
- **Wordmark `quiz` text:** `#13161F` (near-black ink) in light mode, `#EDEFF4` (off-white) in dark mode.

If editing logos, prefer regenerating from source rather than hand-editing the outlined paths.

The homepage cross-link to mkdocs-quiz (in `docs/src/content/docs/index.mdx`) uses Starlight's `<Aside type="tip">` component wrapped in a `.mkdocs-tip` div. `docs/src/styles/custom.css` then swaps that aside's default tip icon for the Material for MkDocs logo (a CSS mask scoped to the wrapper).

## Repository layout

A pnpm workspace with two packages:

- `packages/starlight-quiz` — the published package (the only thing shipped to npm).
- `docs` — a Starlight site (`starlight-quiz-docs`) that dogfoods the plugin **and** doubles as the fixture for the end-to-end tests. The `/demo` page exercises every feature; its quizzes have stable ids the e2e specs rely on.

## Commands

Run from the repo root unless noted. Node ≥22.12, pnpm 10.33.

| Task | Command |
| --- | --- |
| Unit tests (Vitest, jsdom) | `pnpm test` |
| A single test file | `pnpm --filter starlight-quiz exec vitest run tests/parse.test.ts` |
| Tests by name | `pnpm --filter starlight-quiz exec vitest run -t "empty checkbox"` |
| Watch / coverage | `pnpm --filter starlight-quiz test:watch` · `… test:coverage` |
| End-to-end (Playwright) | `pnpm test:e2e` (builds + previews docs, runs `docs/tests/e2e`) |
| Type-check everything | `pnpm typecheck` |
| Lint / format | `pnpm lint` · `pnpm format` |
| All checks (as CI runs them) | `prek run --all-files` |
| Dev server / build docs | `pnpm dev` · `pnpm build` · `pnpm preview` |

`prek.toml` defines the prettier → eslint → typecheck hooks; `prek install` wires the git pre-commit hook and CI runs the exact same `prek run --all-files`. There is no separate build step for the package — it ships its `.ts`/`.astro` source and is consumed/transpiled by the host Astro project.

Playwright uses the pre-installed Chromium at `/opt/pw-browsers/chromium` when present (this environment), else a managed download.

### The CLI

`bin/starlight-quiz.ts` runs directly under Node via type-stripping (`node --experimental-strip-types`). Two commands, both taking a `<source>` that is a manifest JSON file, a directory containing one, or a deployed site URL:

- `starlight-quiz run <source>` — take the quizzes in the terminal.
- `starlight-quiz export-qti <source> --out <dir> [--version 1.2|2.1]` — export to QTI for LMS import.

## Architecture

### The core idea: reinterpret rendered markdown, don't parse it

Quizzes are authored as **plain markdown inside `<Quiz>`** (`components/Quiz.astro`). MDX renders that markdown to DOM — GFM task lists become checkboxes, `[[answer]]` tokens mark fill-in-the-blanks, indented `> ` blockquotes are per-answer feedback, and `---`/`<hr>` separates a post-answer explanation. The package contains **no markdown parser**. Instead, the `<sl-quiz>` custom element reads the already-rendered `.sl-quiz-source` DOM at runtime and rewrites it into an accessible interactive form. `lib/parse.ts` therefore operates on DOM nodes, and authoring quirks (e.g. `[]` with no inner space being accepted as an unchecked answer, like mkdocs-quiz) are handled at the DOM layer in `quiz-element.ts`, `manifest.ts` and `validate.ts` together — change one, check the other two.

### Two consumption modes

- **Starlight plugin** — the default export in `index.ts`. Injects styles + translations, optionally overrides the table-of-contents components, and registers the build-time integrations.
- **Vanilla components** — `starlight-quiz/components`. These have **no hard dependency on Starlight** (it's an optional peer dep). Consumers import the components and `starlight-quiz/styles`, passing label props for i18n.

This split drives a hard rule: **`lib/` must never import `astro` or `@astrojs/starlight`.** Starlight-specific glue is isolated in `index.ts`, `integration.ts`, `libs/starlight.ts`, and `overrides/`.

### Custom elements + the tracker

UI is built from custom elements defined in each component's `<script>` (`sl-quiz`, `sl-quiz-results`, `sl-quiz-progress`, `sl-quiz-progress-badge`). They self-initialise in `connectedCallback` and **query `this`, never `document`**, so they re-initialise correctly after Astro view transitions (a fresh element is created per navigation).

`lib/tracker.ts` is the single source of truth: a per-tab singleton (`getTracker()`) holding per-page state keyed by pathname, persisted to `localStorage` (with an in-memory fallback), broadcasting aggregate progress to subscribers and via window events. Quizzes `register`/`record`; the progress and results widgets `subscribe`. Features are decoupled this way — a widget never reaches into a quiz.

### Build-time integrations (`integration.ts`)

On `astro:build:done` the generated HTML is parsed with `node-html-parser`:

- **Validation** (`lib/validate.ts`) — **hard-fails the build** if a task-list item has an unrecognised checkbox marker (`[y]`, `[o]`, a smart bracket) that GFM silently rendered as plain text. Disable with the plugin's `validate: false`.
- **Manifest** (`lib/manifest.ts`) — writes `quiz-manifest.json`. This manifest is the single source consumed by the QTI exporter (`lib/qti.ts`) and the CLI runner — **neither touches MDX or the DOM**, only the manifest.

### i18n

`lib/strings.ts` holds the English strings (the single source of truth and the vanilla-Astro fallback). `translations.ts` mirrors those keys per locale (en/fr/de/es) and is injected via Starlight's `i18n:setup`. Components resolve each label through `resolveString` — translation table when under Starlight, explicit prop override otherwise.

### Two runtime contexts for `lib/` code

Code in `lib/` runs in **two** environments, which dictates import style:

- **Browser** — custom elements, bundled by Vite. Relative imports omit the extension (`./parse`).
- **Node** — the CLI and the build integration run the `.ts` directly via type-stripping, so their relative imports need explicit **`.ts` extensions** (`./parse.ts`). This is why `manifest.ts`, `validate.ts`, `qti.ts`, `bin/` and `lib/cli/` use `.ts` on imports.

### TypeScript

Strictest config (`astro/tsconfigs/strictest`) with `verbatimModuleSyntax` and `allowImportingTsExtensions`. The package's `tsc --noEmit` only type-checks the framework-agnostic runtime + CLI (`lib/`, `bin/`, `integration.ts`, `translations.ts`); the plugin, integration and `.astro` components are type-checked by `astro check` in the docs site, which imports them. `pnpm typecheck` runs both.

## Gotchas

- `BLANK_PATTERN` (and other global regexes) are shared — reset `.lastIndex = 0` before each `.test()`/`.exec()`.
- Only `[x]`/`[X]`/`[ ]`/`[]` mark answers; don't mix `-` and `*` bullets within one quiz (it splits the answer list into separate `<ul>`s).
- The docs deploy to GitHub Pages under base `/starlight-quiz` — keep links and Playwright `baseURL` base-path-aware.
- Versioning/release is via Changesets (`pnpm changeset`); publishing is manual, not on push.
- MDX is **excluded from Prettier** (`.prettierignore`) and `*.md` uses `embeddedLanguageFormatting: 'off'` — Prettier reflows task lists / fenced quiz examples in ways that break the authoring syntax. Format MDX by hand.

## Starlight integration gotchas (learned the hard way)

These are non-obvious and cost real time to discover — check here before fighting them again:

- **Remark plugins don't run in this Astro 7 / Starlight-MDX pipeline.** Late-appended `markdown.remarkPlugins` (added from an integration's `astro:config:setup`) never execute for `.mdx`. This is *why* markdown quirks like the `[]` empty-checkbox are normalised at the DOM/HTML layer (runtime element + build-time `manifest.ts`/`validate.ts`) instead of in a remark transform. Don't reach for remark to fix authoring quirks — it won't fire.
- **Starlight color tokens are contrast tokens, not literal colours.** `--sl-color-white` is the high-contrast foreground and *flips to dark in light mode*; `--sl-color-black` flips the other way. A button using `color: var(--sl-color-white)` over an accent background reads black-on-blue in light mode. Mirror Starlight's primary LinkButton instead: `background: var(--sl-color-text-accent)` + `color: var(--sl-color-black)`, with vanilla fallbacks.
- **Don't add your own `scroll-margin-top` for scroll-into-view.** Starlight already sets `scroll-padding-top` (~128px) on `<html>` to clear the fixed header + mobile ToC bar. `scrollIntoView` adds the container's scroll-padding *and* the target's scroll-margin, so a custom `scroll-margin-top` roughly doubles the offset. Rely on Starlight's scroll-padding.
- **The mobile ToC `<nav>` is `position: fixed`.** To keep a widget visible while scrolling (the progress badge), inject it into the bar's `<summary>` row at runtime. Pin it with an **inline** `margin-inline-start: auto` — `styles.css` is wrapped in `@layer starlight-quiz` (deliberately low-priority so consumers can override it), and Starlight's *unlayered* margin reset on that row beats any layered rule. Inline styles win.
- **Custom elements query `this`, not `document`, and self-define idempotently.** Astro view transitions create a fresh element per navigation; anything relying on `document`-wide state or one-time module setup breaks on the second page. Elements moved into Starlight's DOM (e.g. the badge into `<summary>`) re-fire `connectedCallback` on the move, so guard re-entrancy.
