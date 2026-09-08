# Changelog

All notable changes to `starlight-quiz` are recorded here. New work is added under **Unreleased** and rolled into a dated version section when a release is cut.

## Unreleased

Translation overhaul ([#3](https://github.com/ewels/starlight-quiz/pull/3)):

- All 13 locales now translate every string. Nine of them fell back to English for the intro panel, the
  table-of-contents badge, and the reset-all button with its confirm prompt.
- Every translated string now lives in the gettext `.po` files, so translators work in one place with their usual
  tooling instead of editing TypeScript. `locales/mkdocs_quiz.pot` is renamed `locales/starlight-quiz.pot`.
- The progress widget's labels are taken from mkdocs-quiz's own msgids and match its sidebar exactly. A few locales
  shift wording as a result — French reads "Répondu" rather than "répondues", and English "Answered" rather than
  "answered".
- Added `starlightQuiz.progressCorrect`; removed `starlightQuiz.results.progress`, which nothing resolved.

## **Version 1.0.1** (2026-08-14)

Metadata-only release — no code, behaviour or API changes.

- Expanded the package keywords so the package is shelved under a category on
  [astro.build/integrations](https://astro.build/integrations) instead of showing as "Uncategorized".

## **Version 1.0.0** (2026-06-30)

First public release.

### Features

- Markdown-authored quizzes through a `<Quiz>` component: single-choice (radio), multiple-choice (checkbox) and fill-in-the-blank questions, written as GitHub task lists with `[[answer]]` blanks.
- Per-answer feedback blockquotes — each badged with the answer it responds to and tinted by whether that answer was correct, so multiple feedbacks stay distinguishable — plus a post-submit content section that accepts full markdown, including code blocks (rendered by Expressive Code), tables and images.
- `<QuizResults>` aggregate score panel: a live text summary while quizzes are in progress ("_N / M_ questions answered", "_N_ correct"), and on completion a prominent tier-coloured score tile with score tiers and confetti (skipped for readers who set `prefers-reduced-motion`). Submitting the last quiz on a page scrolls the panel into view.
- `<QuizIntro>` panel with a markdown default slot and a one-click reset for every quiz on the page.
- Progress tracking persisted to `localStorage`, a table-of-contents progress widget (`progressPosition: 'top' | 'bottom'`) with a split correct/incorrect bar, and `window` events for building your own progress UI.
- Site-wide behaviour defaults via the `quizDefaults` plugin option, with per-quiz props always taking precedence.
- Optional auto-numbering ("Question N" headings) and per-load answer shuffling.
- Build-time validation of quiz markers, and a JSON quiz manifest emitted by default and served by the dev server too (opt out with `manifest: false`).
- A CLI to take quizzes in the terminal — point `run` at the full URL of a page (scraped directly) or at a whole-site manifest, with `--shuffle` / `--shuffle-answers` and a `history` command — plus QTI 1.2 / 2.1 export for LMS import.
- Translations for 13 languages, shared verbatim with the sibling [mkdocs-quiz](https://github.com/ewels/mkdocs-quiz) plugin.
- Usable as a Starlight plugin or as standalone components in any Astro project.
