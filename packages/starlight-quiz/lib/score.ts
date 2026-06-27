import type { QuizProgress } from './types';

/** A score tier: a CSS modifier key and the translation key for its message. */
export interface ScoreTier {
  /** Modifier appended to the results panel class, e.g. `excellent`. */
  key: 'excellent' | 'good' | 'average' | 'poor' | 'fail';
  /** Inclusive lower bound (percent) for this tier. */
  min: number;
  /** Translation key for the tier's message. */
  messageKey: string;
}

/**
 * Score tiers, evaluated from the top down with `>=`. Mirrors the original
 * mkdocs-quiz bands: 90–100 / 75–89 / 60–74 / 40–59 / 0–39.
 */
export const SCORE_TIERS: readonly ScoreTier[] = [
  { key: 'excellent', min: 90, messageKey: 'starlightQuiz.results.excellent' },
  { key: 'good', min: 75, messageKey: 'starlightQuiz.results.good' },
  { key: 'average', min: 60, messageKey: 'starlightQuiz.results.average' },
  { key: 'poor', min: 40, messageKey: 'starlightQuiz.results.poor' },
  { key: 'fail', min: 0, messageKey: 'starlightQuiz.results.fail' },
];

/** Resolve the score tier for a given score percentage (0–100). */
export function tierForScore(score: number): ScoreTier {
  // SCORE_TIERS always ends with a `min: 0` entry, so this never returns undefined.
  return SCORE_TIERS.find((tier) => score >= tier.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1]!;
}

/** Compute aggregate progress from the per-quiz tallies. */
export function computeProgress(total: number, answered: number, correct: number): QuizProgress {
  const safeTotal = Math.max(total, 0);
  return {
    total: safeTotal,
    answered,
    correct,
    percentage: safeTotal === 0 ? 0 : Math.round((answered / safeTotal) * 100),
    score: safeTotal === 0 ? 0 : Math.round((correct / safeTotal) * 100),
  };
}

/** Whether every registered quiz has been answered. */
export function isComplete(progress: QuizProgress): boolean {
  return progress.total > 0 && progress.answered >= progress.total;
}
