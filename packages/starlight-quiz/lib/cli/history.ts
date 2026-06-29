/**
 * Persistent record of quizzes taken with the CLI runner, stored as JSON under
 * the XDG data directory (e.g. `~/.local/share/starlight-quiz/history.json`).
 * Node-only — used by `bin/starlight-quiz.ts`.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { env } from 'node:process';

export interface HistoryEntry {
  /** ISO timestamp of when the run finished. */
  date: string;
  /** The source taken (manifest path, directory or URL). */
  source: string;
  total: number;
  correct: number;
  /** Percentage score, 0–100. */
  score: number;
}

/** Path to the history file, honouring `XDG_DATA_HOME`. */
export function historyFile(): string {
  const base = env['XDG_DATA_HOME']?.trim() || join(homedir(), '.local', 'share');
  return join(base, 'starlight-quiz', 'history.json');
}

/** Read the saved history (empty if none / unreadable / malformed). */
export async function readHistory(): Promise<HistoryEntry[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(historyFile(), 'utf8'));
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Append one entry to the history file, creating it if needed. */
export async function appendHistory(entry: HistoryEntry): Promise<void> {
  const history = await readHistory();
  history.push(entry);
  const file = historyFile();
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(history, null, 2) + '\n');
}

/** Delete the history file. */
export async function clearHistory(): Promise<void> {
  await rm(historyFile(), { force: true });
}

/** Render history as an aligned plain-text table. */
export function formatHistoryTable(entries: HistoryEntry[]): string {
  if (entries.length === 0) return 'No quiz history yet.';
  const rows = entries.map((e) => [e.date, e.source, `${e.correct}/${e.total}`, `${e.score}%`]);
  const headers = ['Date', 'Source', 'Result', 'Score'];
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]): string =>
    cells
      .map((c, i) => c.padEnd(widths[i]!))
      .join('  ')
      .trimEnd();
  return [line(headers), widths.map((w) => '─'.repeat(w)).join('  '), ...rows.map(line)].join('\n');
}
