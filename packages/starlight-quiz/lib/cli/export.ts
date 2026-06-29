import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { QuizManifest } from '../manifest.ts';
import { buildImsManifest, toQtiItem, type QtiVersion } from '../qti.ts';

export interface ExportQtiOptions {
  version: QtiVersion;
  outDir: string;
}

function safeName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Write a manifest's quizzes as QTI assessment items plus an `imsmanifest.xml`
 * into `outDir` (an unzipped IMS Content Package). Returns the filenames
 * written, relative to `outDir`.
 */
export async function exportQti(manifest: QuizManifest, options: ExportQtiOptions): Promise<string[]> {
  await mkdir(options.outDir, { recursive: true });

  const items = manifest.quizzes.map((quiz) => ({ identifier: quiz.id, href: `${safeName(quiz.id)}.xml`, quiz }));

  await Promise.all(
    items.map(({ href, quiz }) => writeFile(path.join(options.outDir, href), toQtiItem(quiz, options.version))),
  );
  await writeFile(path.join(options.outDir, 'imsmanifest.xml'), buildImsManifest(items, options.version));

  return [...items.map((item) => item.href), 'imsmanifest.xml'];
}
