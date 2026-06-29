import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appendHistory, clearHistory, formatHistoryTable, readHistory } from '../lib/cli/history';

let dir: string;
let previous: string | undefined;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'slq-history-'));
  previous = process.env['XDG_DATA_HOME'];
  process.env['XDG_DATA_HOME'] = dir;
});

afterEach(async () => {
  if (previous === undefined) delete process.env['XDG_DATA_HOME'];
  else process.env['XDG_DATA_HOME'] = previous;
  await rm(dir, { recursive: true, force: true });
});

const entry = (correct: number) => ({
  date: '2026-06-29T00:00:00.000Z',
  source: 'demo/',
  total: 4,
  correct,
  score: correct * 25,
});

describe('cli history', () => {
  it('starts empty and appends entries in order', async () => {
    expect(await readHistory()).toEqual([]);
    await appendHistory(entry(2));
    await appendHistory(entry(4));
    const history = await readHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.correct).toBe(2);
    expect(history[1]?.score).toBe(100);
  });

  it('clears the history', async () => {
    await appendHistory(entry(1));
    await clearHistory();
    expect(await readHistory()).toEqual([]);
  });

  it('formats a table and a friendly empty message', () => {
    expect(formatHistoryTable([])).toBe('No quiz history yet.');
    const table = formatHistoryTable([entry(3)]);
    expect(table).toContain('Date');
    expect(table).toContain('3/4');
    expect(table).toContain('75%');
  });
});
