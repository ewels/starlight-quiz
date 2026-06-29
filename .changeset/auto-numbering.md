---
'starlight-quiz': minor
---

Add auto-numbering: prefix quizzes with a numbered "Question N" heading. Enable it everywhere with the `quizDefaults.autoNumber` plugin option, or per quiz with the `<Quiz autoNumber>` prop. The number reflects the quiz's position among the auto-numbered quizzes on the page (computed in the browser, so it survives shuffling and view transitions) and renders as a restylable `.sl-quiz-number` element. The "Question {n}" label is translated in all bundled locales.
