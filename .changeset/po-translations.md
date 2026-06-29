---
'starlight-quiz': minor
---

Translations now ship for 13 languages (added Esperanto, Hindi, Indonesian, Japanese, Korean, Norwegian, Brazilian Portuguese, Swedish and Simplified Chinese alongside English, French, German and Spanish). The strings are sourced from gettext `.po` files copied verbatim from the sibling [mkdocs-quiz](https://github.com/ewels/mkdocs-quiz) plugin and compiled into `translations.ts` by `scripts/build-i18n.ts`, so the two plugins stay in sync. No change to the English strings or the public API.
