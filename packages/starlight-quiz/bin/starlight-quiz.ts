#!/usr/bin/env -S node --experimental-strip-types
import { argv, exit, stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';

import { exportQti } from '../lib/cli/export.ts';
import { loadManifest } from '../lib/cli/load.ts';
import { runQuizzes, type RunnerIo } from '../lib/cli/run.ts';
import type { QtiVersion } from '../lib/qti.ts';

/**
 * A line reader that buffers every line as it arrives, so it works equally for
 * an interactive TTY and for piped/redirected input (where all lines arrive up
 * front and a per-prompt `readline.question` would drop them).
 */
function createLineReader(): { ask: (prompt: string) => Promise<string>; close: () => void } {
  const rl = createInterface({ input: stdin });
  const buffer: string[] = [];
  let pending: ((line: string) => void) | null = null;
  let closed = false;

  rl.on('line', (line) => {
    if (pending) {
      const resolve = pending;
      pending = null;
      resolve(line);
    } else {
      buffer.push(line);
    }
  });
  rl.on('close', () => {
    closed = true;
    if (pending) {
      const resolve = pending;
      pending = null;
      resolve('');
    }
  });

  return {
    ask: (prompt) => {
      stdout.write(prompt);
      const next = buffer.shift();
      if (next !== undefined) return Promise.resolve(next);
      if (closed) return Promise.resolve('');
      return new Promise<string>((resolve) => {
        pending = resolve;
      });
    },
    close: () => rl.close(),
  };
}

const USAGE = `starlight-quiz — take or export quizzes from a manifest or a deployed site

Usage:
  starlight-quiz run <source> [--filename quiz-manifest.json]
  starlight-quiz export-qti <source> --out <dir> [--version 2.1] [--filename ...]

<source> is a local manifest JSON file, a directory containing one, or the URL
of a deployed site (its manifest is fetched, falling back to scraping the page).`;

async function main(): Promise<number> {
  const [command, ...rest] = argv.slice(2);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    stdout.write(USAGE + '\n');
    return command ? 0 : 1;
  }

  if (command === 'run') {
    const { positionals, values } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { filename: { type: 'string' } },
    });
    const source = positionals[0];
    if (!source) {
      stdout.write('Missing <source>.\n\n' + USAGE + '\n');
      return 1;
    }
    const manifest = await loadManifest(source, values.filename);
    const reader = createLineReader();
    const io: RunnerIo = { print: (line = '') => void stdout.write(line + '\n'), ask: (prompt) => reader.ask(prompt) };
    try {
      await runQuizzes(manifest, io);
      return 0;
    } finally {
      reader.close();
    }
  }

  if (command === 'export-qti') {
    const { positionals, values } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { version: { type: 'string' }, out: { type: 'string' }, filename: { type: 'string' } },
    });
    const source = positionals[0];
    if (!source) {
      stdout.write('Missing <source>.\n\n' + USAGE + '\n');
      return 1;
    }
    const version = values.version ?? '2.1';
    if (version !== '1.2' && version !== '2.1') {
      stdout.write('--version must be 1.2 or 2.1\n');
      return 1;
    }
    const manifest = await loadManifest(source, values.filename);
    const written = await exportQti(manifest, { version: version as QtiVersion, outDir: values.out ?? 'qti' });
    stdout.write(`Wrote ${written.length} file(s) to ${values.out ?? 'qti'}/\n`);
    return 0;
  }

  stdout.write(`Unknown command: ${command}\n\n` + USAGE + '\n');
  return 1;
}

main().then(
  (code) => exit(code),
  (error: unknown) => {
    stdout.write(`${error instanceof Error ? error.message : String(error)}\n`);
    exit(1);
  },
);
