# Changelog

All notable changes to `starlight-quiz` are recorded here. New work is added under **Unreleased** and rolled into a dated version section when a release is cut.

## Unreleased

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
- Build-time validation of quiz markers, and a JSON quiz manifest emitted by default (opt out with `manifest: false`).
- A CLI to take quizzes in the terminal (`run`, with `--shuffle`, `--shuffle-answers` and `--page`, plus a `history` command) and to export quizzes to QTI 1.2 / 2.1 for LMS import.
- Translations for 13 languages, shared verbatim with the sibling [mkdocs-quiz](https://github.com/ewels/mkdocs-quiz) plugin.
- Usable as a Starlight plugin or as standalone components in any Astro project.
