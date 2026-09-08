# Changelog

All notable changes to `starlight-quiz` are recorded here. New work is added under **Unreleased** and rolled into a dated version section when a release is cut.

## Unreleased

## **Version 1.0.2** (2026-09-08)

Translation release — no API changes.

- Added a Russian translation, contributed by [@dragomano](https://github.com/dragomano)
  ([#2](https://github.com/ewels/starlight-quiz/pull/2)). That brings the built-in locales to 14 including English.
- Filled in every missing string across all 13 translated locales, and moved each one into the gettext `.po` files so
  they are the single source ([#3](https://github.com/ewels/starlight-quiz/pull/3)).
- Relabelled the table-of-contents progress widget to match mkdocs-quiz. Both counts now read with the label first —
  "Answered: 3 / 10" and "Correct: 2", rather than the word trailing the count. In French this also corrects "Répondu"
  from "répondues" ([#3](https://github.com/ewels/starlight-quiz/pull/3)).
- The progress widget's correct-count label now resolves `starlightQuiz.progressCorrect` rather than sharing
  `starlightQuiz.results.correct` with the results panel, so the two read independently. If you overrode that string in
  your own Starlight translations, move the override to the new key. The `correctLabel` prop is unchanged.

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
