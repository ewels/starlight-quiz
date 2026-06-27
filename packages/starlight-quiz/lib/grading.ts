/**
 * Pure grading helpers, shared by the runtime and the unit tests.
 *
 * No DOM access here — callers pass plain data — so these functions are trivial
 * to test and reason about.
 */

/**
 * Grade a single- or multiple-choice quiz.
 *
 * A submission is correct when the set of selected indices is exactly equal to
 * the set of correct indices: every correct answer chosen, and no incorrect
 * answer chosen. This holds for both radio (one correct) and checkbox (many
 * correct) quizzes.
 */
export function gradeChoice(selected: readonly number[], correct: readonly number[]): boolean {
  if (selected.length !== correct.length) return false;
  const correctSet = new Set(correct);
  return selected.every((index) => correctSet.has(index));
}

/** Normalise a fill-in-the-blank answer for comparison: trimmed, lower-cased. */
export function normaliseBlank(value: string): string {
  return value.trim().toLowerCase();
}

/** Whether a single blank's input matches its expected answer (case-insensitive). */
export function gradeBlank(input: string, expected: string): boolean {
  return normaliseBlank(input) === normaliseBlank(expected);
}

/**
 * Grade a fill-in-the-blank quiz. Correct only when every blank matches.
 * `inputs` and `answers` are positional and must be the same length.
 */
export function gradeBlanks(inputs: readonly string[], answers: readonly string[]): boolean {
  if (inputs.length !== answers.length || inputs.length === 0) return false;
  return inputs.every((input, index) => gradeBlank(input, answers[index] ?? ''));
}
