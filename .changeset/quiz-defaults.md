---
'starlight-quiz': minor
---

Add a `quizDefaults` plugin option for site-wide quiz behaviour defaults (`autoSubmit`, `disableAfterSubmit`, `showCorrect`, `shuffle`, `confetti`). Set them once in the plugin config instead of on every `<Quiz>`/`<QuizResults>`; an explicit prop on a component still wins. The defaults are delivered to the components via `Astro.locals`, so behaviour outside Starlight is unchanged (built-in defaults, overridable per prop).
