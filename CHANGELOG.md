# Changelog

All notable changes to `starlight-quiz` are recorded here. New work is added under **Unreleased** and rolled into a dated version section when a release is cut.

## Unreleased

### Added

- Per-answer feedback boxes now carry a badge naming the answer they respond to, and each box is tinted by whether that answer was right — keeping multiple feedbacks distinguishable (matching mkdocs-quiz). The Multiple choice guide gains single- and multiple-choice examples for it.

### Changed

- The table-of-contents progress bar now splits into a green (correct) and red (incorrect) segment, matching mkdocs-quiz, instead of a single accent-coloured fill.
- The in-progress `<QuizResults>` panel now shows a text summary ("_N / M_ questions answered", "_N_ correct") instead of repeating the progress bar, matching mkdocs-quiz.
- The completed `<QuizResults>` score is larger and sits in a tier-coloured background tile (green / orange / red) for more prominence.
- Submitting the last quiz on a page now scrolls a `<QuizResults>` panel into view (previously this only happened when confetti fired, and could land off-target). The confetti burst is also larger.

## **Version 0.1.0** (2026-06-29)

First public release.

### Features

- Markdown-authored quizzes through a `<Quiz>` component: single-choice (radio), multiple-choice (checkbox) and fill-in-the-blank questions, written as GitHub task lists with `[[answer]]` blanks.
- Per-answer feedback blockquotes and a post-submit content section that accepts full markdown, including code blocks (rendered by Expressive Code), tables and images.
- `<QuizResults>` aggregate score panel with score tiers and confetti, on by default and skipped for readers who set `prefers-reduced-motion`.
- `<QuizIntro>` panel with a markdown default slot and a one-click reset for every quiz on the page.
- Progress tracking persisted to `localStorage`, a table-of-contents progress widget (`progressPosition: 'top' | 'bottom'`), and `window` events for building your own progress UI.
- Site-wide behaviour defaults via the `quizDefaults` plugin option, with per-quiz props always taking precedence.
- Optional auto-numbering ("Question N" headings) and per-load answer shuffling.
- Build-time validation of quiz markers, and a JSON quiz manifest emitted by default and served by the dev server too (opt out with `manifest: false`).
- A CLI to take quizzes in the terminal (`run`, with `--shuffle` and `--shuffle-answers`, plus a `history` command) and to export quizzes to QTI 1.2 / 2.1 for LMS import.
- Translations for 13 languages, shared verbatim with the sibling [mkdocs-quiz](https://github.com/ewels/mkdocs-quiz) plugin.
- Usable as a Starlight plugin or as standalone components in any Astro project.
