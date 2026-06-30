import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IncomingMessage, ServerResponse } from 'node:http';

import type { AstroIntegration } from 'astro';

import { buildManifest, extractQuizzesFromHtml, type QuizManifestEntry } from './lib/manifest.ts';
import { formatValidationError, validateQuizHtml, type QuizValidationIssue } from './lib/validate.ts';

export interface QuizManifestIntegrationOptions {
  /** Output filename, relative to the build output directory. */
  filename?: string;
}

/** Turn a built HTML file path (relative to the output dir) into a site path. */
function pagePath(relativeFile: string): string {
  const normalised = relativeFile.replaceAll(path.sep, '/').replace(/index\.html$/, '');
  return '/' + normalised.replace(/^\/+/, '');
}

/** Join a base path and a site path without doubling the slash between them. */
function joinBase(base: string, page: string): string {
  return (base.replace(/\/$/, '') + page).replace(/\/{2,}/g, '/');
}

/** List the content pages under a Starlight `src/content/docs` dir as site paths. */
async function listContentPages(contentDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(contentDir, { recursive: true });
  } catch {
    return [];
  }
  const pages = new Set<string>();
  for (const rel of entries) {
    if (!/\.(md|mdx|markdown)$/i.test(rel)) continue;
    const slug = rel
      .replaceAll(path.sep, '/')
      .replace(/\.(md|mdx|markdown)$/i, '')
      .replace(/(^|\/)index$/i, '');
    pages.add(slug === '' ? '/' : `/${slug}/`);
  }
  return [...pages].sort();
}

/** The slice of Vite's dev server we use (avoids a hard dependency on Vite's types). */
interface DevMiddlewareServer {
  middlewares: {
    use(handler: (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void): void;
  };
}

interface DevServerPlugin {
  name: string;
  configureServer(server: DevMiddlewareServer): void;
}

/**
 * A Vite dev-server plugin that serves the quiz manifest at the same path the
 * build emits it. `astro dev` never writes the file, which surprises people who
 * point the CLI at their local dev site, so we build it on demand: list the
 * content pages, fetch each from the running dev server, and parse the rendered
 * HTML with the same extractor the build uses.
 */
function devManifestPlugin(filename: string, base: string, srcDir: string): DevServerPlugin {
  const contentDir = path.join(srcDir, 'content', 'docs');
  const routePath = joinBase(base, '/' + filename);

  return {
    name: 'starlight-quiz/dev-manifest',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const reqPath = (req.url ?? '').split('?')[0];
        if (reqPath !== routePath && reqPath !== '/' + filename) return next();

        void (async () => {
          const origin = `http://${req.headers.host ?? 'localhost'}`;
          const pages = await listContentPages(contentDir);
          const rendered = await Promise.all(
            pages.map(async (page) => {
              const resp = await fetch(origin + joinBase(base, page)).catch(() => null);
              return { page, html: resp?.ok ? await resp.text() : '' };
            }),
          );

          const quizzes = collectQuizzes(rendered.filter(({ html }) => html));

          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(buildManifest(quizzes), null, 2) + '\n');
        })().catch(next);
      });
    },
  };
}

/** A page's rendered HTML paired with its site path. */
interface RenderedPage {
  html: string;
  page: string;
}

/** Extract the quiz entries from a set of rendered pages, in page order. */
function collectQuizzes(pages: RenderedPage[]): QuizManifestEntry[] {
  return pages.flatMap(({ html, page }) => extractQuizzesFromHtml(html, page));
}

/** Read every built `.html` file under `dir`, paired with its site path. */
async function readHtmlFiles(dir: URL): Promise<RenderedPage[]> {
  const outDir = fileURLToPath(dir);
  const entries = await readdir(outDir, { recursive: true });
  const htmlFiles = entries.filter((file) => file.endsWith('.html')).sort();
  return Promise.all(
    htmlFiles.map(async (file) => ({
      html: await readFile(path.join(outDir, file), 'utf8'),
      page: pagePath(file),
    })),
  );
}

/**
 * An Astro integration that fails the build if any quiz has malformed answers —
 * for example an unrecognised checkbox marker that GFM left as plain text. This
 * gives authors a hard error instead of a silently dropped answer.
 */
export function quizValidationIntegration(): AstroIntegration {
  return {
    name: 'starlight-quiz/validate',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const issues: QuizValidationIssue[] = [];
        for (const { html, page } of await readHtmlFiles(dir)) {
          issues.push(...validateQuizHtml(html, page));
        }
        if (issues.length > 0) {
          throw new Error(formatValidationError(issues));
        }
      },
    },
  };
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
      'astro:config:setup': ({ command, config, updateConfig }) => {
        // The build writes the manifest file; the dev server serves it dynamically.
        if (command !== 'dev') return;
        updateConfig({
          vite: { plugins: [devManifestPlugin(filename, config.base, fileURLToPath(config.srcDir))] },
        } as Parameters<typeof updateConfig>[0]);
      },
      'astro:build:done': async ({ dir, logger }) => {
        const quizzes = collectQuizzes(await readHtmlFiles(dir));

        const outFile = path.join(fileURLToPath(dir), filename);
        await writeFile(outFile, JSON.stringify(buildManifest(quizzes), null, 2) + '\n');
        logger.info(`Wrote ${quizzes.length} quiz${quizzes.length === 1 ? '' : 'zes'} to ${filename}`);
      },
    },
  };
}
