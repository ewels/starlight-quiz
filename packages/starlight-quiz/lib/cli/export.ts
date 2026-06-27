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

  const written: string[] = [];
  const items: { identifier: string; href: string }[] = [];

  for (const quiz of manifest.quizzes) {
    const href = `${safeName(quiz.id)}.xml`;
    await writeFile(path.join(options.outDir, href), toQtiItem(quiz, options.version));
    written.push(href);
    items.push({ identifier: quiz.id, href });
  }

  await writeFile(path.join(options.outDir, 'imsmanifest.xml'), buildImsManifest(items, options.version));
  written.push('imsmanifest.xml');
  return written;
}
