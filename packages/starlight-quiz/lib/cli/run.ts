import { gradeBlanks, gradeChoice } from '../grading.ts';
import type { QuizManifest, QuizManifestEntry } from '../manifest.ts';
import { BLANK_PATTERN } from '../parse.ts';
import { computeProgress, tierForScore } from '../score.ts';
import { STRINGS } from '../strings.ts';

/** Injectable terminal IO, so the runner can be driven in tests. */
export interface RunnerIo {
  /** Print a line (no argument prints a blank line). */
  print(line?: string): void;
  /** Ask the user a question and resolve with their typed answer. */
  ask(prompt: string): Promise<string>;
}

export interface RunResult {
  total: number;
  correct: number;
  score: number;
}

function parseSelection(input: string, count: number): number[] {
  return [
    ...new Set(
      input
        .split(/[\s,]+/)
        .map((part) => Number.parseInt(part, 10))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= count)
        .map((n) => n - 1),
    ),
  ];
}

async function runChoice(quiz: QuizManifestEntry, io: RunnerIo): Promise<boolean> {
  const answers = quiz.answers ?? [];
  answers.forEach((answer, i) => io.print(`  ${i + 1}. ${answer.text}`));
  const multiple = quiz.type === 'multiple';
  io.print();
  const input = await io.ask(multiple ? 'Your answers (e.g. 1,3): ' : 'Your answer: ');

  const selected = parseSelection(input, answers.length);
  const correctIndices = answers.flatMap((answer, i) => (answer.correct ? [i] : []));
  const correct = gradeChoice(selected, correctIndices);

  if (!correct) {
    const right = correctIndices.map((i) => answers[i]?.text).join(', ');
    io.print(`  Correct answer${correctIndices.length > 1 ? 's' : ''}: ${right}`);
  }
  return correct;
}

async function runBlank(quiz: QuizManifestEntry, io: RunnerIo): Promise<boolean> {
  const expected = quiz.blanks ?? [];
  const inputs: string[] = [];
  for (let i = 0; i < expected.length; i++) {
    inputs.push(await io.ask(expected.length > 1 ? `Blank ${i + 1}: ` : 'Your answer: '));
  }
  const correct = gradeBlanks(inputs, expected);
  if (!correct) io.print(`  Correct answer${expected.length > 1 ? 's' : ''}: ${expected.join(', ')}`);
  return correct;
}

/** Run a single quiz interactively; returns whether it was answered correctly. */
export async function runQuiz(quiz: QuizManifestEntry, io: RunnerIo, index: number): Promise<boolean> {
  io.print();
  const heading = quiz.title ? `${index}. ${quiz.title}` : `Question ${index}`;
  io.print(heading);
  io.print('─'.repeat(heading.length));
  io.print(quiz.question.replace(BLANK_PATTERN, '____'));
  io.print();

  const correct = quiz.type === 'blank' ? await runBlank(quiz, io) : await runChoice(quiz, io);

  io.print(correct ? '  ✓ Correct!' : '  ✗ Incorrect.');
  if (quiz.explanation) io.print(`  ${quiz.explanation}`);
  return correct;
}

/** Run every quiz in a manifest, print a final score, and return the result. */
export async function runQuizzes(manifest: QuizManifest, io: RunnerIo): Promise<RunResult> {
  const quizzes = manifest.quizzes;
  if (quizzes.length === 0) {
    io.print('No quizzes found.');
    return { total: 0, correct: 0, score: 0 };
  }

  let correct = 0;
  for (let i = 0; i < quizzes.length; i++) {
    if (await runQuiz(quizzes[i]!, io, i + 1)) correct++;
  }

  const progress = computeProgress(quizzes.length, quizzes.length, correct);
  const tier = tierForScore(progress.score);
  io.print();
  io.print(`Score: ${correct}/${quizzes.length} (${progress.score}%)`);
  io.print(STRINGS[tier.messageKey as keyof typeof STRINGS]);
  return { total: quizzes.length, correct, score: progress.score };
}
