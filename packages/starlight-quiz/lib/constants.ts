/**
 * Shared constants for the starlight-quiz runtime.
 *
 * These are intentionally framework-agnostic — nothing in `lib/` may import
 * `@astrojs/starlight` or `astro`, so the `./components` entry stays usable in
 * a plain Astro project.
 */

/** Custom element tag for an individual quiz. */
export const QUIZ_ELEMENT = 'sl-quiz';

/** Custom element tag for the aggregate results panel. */
export const QUIZ_RESULTS_ELEMENT = 'sl-quiz-results';

/** Custom element tag for the compact progress widget (e.g. in the sidebar). */
export const QUIZ_PROGRESS_ELEMENT = 'sl-quiz-progress';

/** Prefix for the per-page localStorage key. The page pathname is appended. */
export const STORAGE_KEY_PREFIX = 'starlight-quiz:';

/**
 * Maximum serialised size (characters) we are willing to read from or write to
 * localStorage for a single page. Guards against runaway growth and quota
 * errors. Mirrors the behaviour of the original mkdocs-quiz runtime.
 */
export const STORAGE_MAX_CHARS = 50_000;

/** Window event dispatched whenever aggregate progress changes. */
export const PROGRESS_EVENT = 'starlight-quiz:progress';

/** Window event dispatched when the user resets every quiz on the page. */
export const RESET_ALL_EVENT = 'starlight-quiz:reset-all';

/** Minimum score (percent) required for confetti to fire on completion. */
export const CONFETTI_MIN_SCORE = 10;
