import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AstroIntegration } from 'astro';

import { buildManifest, extractQuizzesFromHtml, type QuizManifestEntry } from './lib/manifest.ts';

export interface QuizManifestIntegrationOptions {
  /** Output filename, relative to the build output directory. */
  filename?: string;
}

/** Turn a built HTML file path (relative to the output dir) into a site path. */
function pagePath(relativeFile: string): string {
  const normalised = relativeFile.replaceAll(path.sep, '/').replace(/index\.html$/, '');
  return '/' + normalised.replace(/^\/+/, '');
}

/**
 * An Astro integration that, after a build, parses the generated HTML for
 * `<sl-quiz>` elements and writes a structured JSON manifest of every quiz to
 * the output directory. The manifest is the source consumed by the QTI exporter
 * and the terminal runner — neither touches MDX.
 */
export function quizManifestIntegration(options: QuizManifestIntegrationOptions = {}): AstroIntegration {
  const filename = options.filename ?? 'quiz-manifest.json';

  return {
    name: 'starlight-quiz/manifest',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const entries = await readdir(outDir, { recursive: true });
        const htmlFiles = entries.filter((file) => file.endsWith('.html')).sort();

        const quizzes: QuizManifestEntry[] = [];
        for (const file of htmlFiles) {
          const html = await readFile(path.join(outDir, file), 'utf8');
          quizzes.push(...extractQuizzesFromHtml(html, pagePath(file)));
        }

        await writeFile(path.join(outDir, filename), JSON.stringify(buildManifest(quizzes), null, 2) + '\n');
        logger.info(`Wrote ${quizzes.length} quiz${quizzes.length === 1 ? '' : 'zes'} to ${filename}`);
      },
    },
  };
}
