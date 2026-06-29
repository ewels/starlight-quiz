---
'starlight-quiz': minor
---

`<QuizIntro>` now accepts its message in the default slot, so you can write markdown — `<QuizIntro>Your answers are **saved locally**.</QuizIntro>`. The `textLabel` prop stays as a plain-string fallback for vanilla Astro and i18n overrides; a slot, when given, takes precedence over it.

`<QuizResults>` now fires confetti **by default**. Pass `confetti={false}` to disable it (previously it was off unless you passed `confetti`).
