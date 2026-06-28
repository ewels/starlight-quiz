import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadManifest } from '../lib/cli/load';

const sample = { version: 1, quizzes: [{ id: 'q', type: 'single', page: '/', question: 'Q?' }] };

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 404, json: () => Promise.resolve(body), text: () => Promise.resolve('') } as Response;
}
function htmlResponse(html: string, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.reject(new Error()),
    text: () => Promise.resolve(html),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadManifest — local', () => {
  it('loads a manifest file directly', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'sq-load-'));
    const file = path.join(dir, 'quiz-manifest.json');
    await writeFile(file, JSON.stringify(sample));
    expect(await loadManifest(file)).toEqual(sample);
  });

  it('loads a manifest from a directory', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'sq-load-'));
    await writeFile(path.join(dir, 'quiz-manifest.json'), JSON.stringify(sample));
    expect(await loadManifest(dir)).toEqual(sample);
  });

  it('rejects when the manifest is missing', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'sq-load-'));
    await expect(loadManifest(dir)).rejects.toThrow();
  });
});

describe('loadManifest — URL', () => {
  it('fetches the manifest from a deployed site', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(sample)));
    expect(await loadManifest('https://example.com')).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith('https://example.com/quiz-manifest.json');
  });

  it('falls back to scraping the page HTML when no manifest is published', async () => {
    const html = '<sl-quiz id="x"><div class="sl-quiz-source"><p>The cap is [[Paris]].</p></div></sl-quiz>';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, false)) // manifest 404
      .mockResolvedValueOnce(htmlResponse(html)); // page HTML
    vi.stubGlobal('fetch', fetchMock);

    const manifest = await loadManifest('https://example.com/page/');
    expect(manifest.quizzes).toHaveLength(1);
    expect(manifest.quizzes[0]).toMatchObject({ id: 'x', type: 'blank', blanks: ['Paris'] });
  });

  it('throws when neither a manifest nor a page can be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, false)));
    await expect(loadManifest('https://example.com/missing/')).rejects.toThrow(/Could not load/);
  });
});
