import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { exportQti } from '../lib/cli/export';
import { runQuizzes, type RunnerIo } from '../lib/cli/run';
import type { QuizManifest } from '../lib/manifest';

const manifest: QuizManifest = {
  version: 1,
  quizzes: [
    { id: 's', type: 'single', page: '/', question: 'Q1', answers: [
      { text: 'A', correct: false },
      { text: 'B', correct: true },
    ] },
    { id: 'm', type: 'multiple', page: '/', question: 'Q2', answers: [
      { text: 'A', correct: true },
      { text: 'B', correct: false },
      { text: 'C', correct: true },
    ] },
    { id: 'b', type: 'blank', page: '/', question: 'Water is [[H2O]].', blanks: ['H2O'] },
  ],
};

function scriptedIo(answers: string[]): { io: RunnerIo; lines: string[] } {
  const lines: string[] = [];
  let i = 0;
  return {
    lines,
    io: {
      print: (line = '') => void lines.push(line),
      ask: () => Promise.resolve(answers[i++] ?? ''),
    },
  };
}

describe('runQuizzes', () => {
  it('scores a fully correct run', async () => {
    const { io, lines } = scriptedIo(['2', '1,3', ' h2o ']);
    const result = await runQuizzes(manifest, io);
    expect(result).toEqual({ total: 3, correct: 3, score: 100 });
    expect(lines.join('\n')).toContain('Score: 3/3 (100%)');
  });

  it('scores an all-wrong run and reveals the answers', async () => {
    const { io, lines } = scriptedIo(['1', '1', 'nope']);
    const result = await runQuizzes(manifest, io);
    expect(result.correct).toBe(0);
    const output = lines.join('\n');
    expect(output).toContain('Correct answer: B');
    expect(output).toContain('Correct answers: A, C');
  });

  it('handles an empty manifest', async () => {
    const { io } = scriptedIo([]);
    expect(await runQuizzes({ version: 1, quizzes: [] }, io)).toEqual({ total: 0, correct: 0, score: 0 });
  });
});

describe('exportQti', () => {
  it('writes an item per quiz plus an IMS manifest', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'sq-qti-'));
    const written = await exportQti(manifest, { version: '2.1', outDir: dir });
    expect(written).toEqual(['s.xml', 'm.xml', 'b.xml', 'imsmanifest.xml']);

    const item = await readFile(path.join(dir, 's.xml'), 'utf8');
    expect(item).toContain('<assessmentItem');
    const ims = await readFile(path.join(dir, 'imsmanifest.xml'), 'utf8');
    expect(ims).toContain('imsqti_item_xmlv2p1');
  });
});
