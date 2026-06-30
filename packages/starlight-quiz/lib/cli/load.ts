import { readFile } from 'node:fs/promises';

import { buildManifest, extractQuizzesFromHtml, type QuizManifest } from '../manifest.ts';

const DEFAULT_FILENAME = 'quiz-manifest.json';

function isUrl(source: string): boolean {
  return /^https?:\/\//.test(source);
}

async function loadFromUrl(source: string): Promise<QuizManifest> {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Could not load ${source} (HTTP ${response.status}).`);
  }
  // A `.json` URL is a published manifest; any other URL is a page to scrape.
  if (source.endsWith('.json')) {
    return (await response.json()) as QuizManifest;
  }
  const html = await response.text();
  return buildManifest(extractQuizzesFromHtml(html, new URL(source).pathname));
}

/**
 * Load quizzes from a source:
 *  - the full URL of a deployed page (scraped directly) or of a published
 *    `quiz-manifest.json` (fetched as-is);
 *  - a local manifest JSON file;
 *  - a local directory containing a manifest.
 */
export async function loadManifest(source: string, filename = DEFAULT_FILENAME): Promise<QuizManifest> {
  if (isUrl(source)) return loadFromUrl(source);
  const file = source.endsWith('.json') ? source : `${source.replace(/\/$/, '')}/${filename}`;
  return JSON.parse(await readFile(file, 'utf8')) as QuizManifest;
}
