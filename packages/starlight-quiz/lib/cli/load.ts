import { readFile } from 'node:fs/promises';

import { buildManifest, extractQuizzesFromHtml, type QuizManifest } from '../manifest.ts';

const DEFAULT_FILENAME = 'quiz-manifest.json';

function isUrl(source: string): boolean {
  return /^https?:\/\//.test(source);
}

async function loadFromUrl(source: string, filename: string): Promise<QuizManifest> {
  const manifestUrl = source.endsWith('.json') ? source : `${source.replace(/\/$/, '')}/${filename}`;
  const manifestResponse = await fetch(manifestUrl);
  if (manifestResponse.ok) {
    return (await manifestResponse.json()) as QuizManifest;
  }

  // Fall back to scraping the page's HTML when no manifest is published.
  const pageResponse = await fetch(source);
  if (!pageResponse.ok) {
    throw new Error(`Could not load a manifest or page from ${source} (HTTP ${pageResponse.status}).`);
  }
  const html = await pageResponse.text();
  return buildManifest(extractQuizzesFromHtml(html, new URL(source).pathname));
}

/**
 * Load a quiz manifest from a source: a local manifest JSON file, a directory
 * containing one, or the URL of a deployed site (which is fetched, falling back
 * to scraping the page HTML if no manifest is published there).
 */
export async function loadManifest(source: string, filename = DEFAULT_FILENAME): Promise<QuizManifest> {
  if (isUrl(source)) return loadFromUrl(source, filename);

  const filePath = source.endsWith('.json') ? source : `${source.replace(/\/$/, '')}/${filename}`;
  return JSON.parse(await readFile(filePath, 'utf8')) as QuizManifest;
}
