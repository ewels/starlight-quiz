import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { AstroIntegrationLogger } from 'astro';
import { describe, expect, it, vi } from 'vitest';

import { overrideStarlightComponent } from '../libs/starlight';

const ENTRYPOINT = 'starlight-quiz/overrides/Footer.astro';

async function projectWithFooter(source: string): Promise<URL> {
  const dir = await mkdtemp(path.join(tmpdir(), 'sl-quiz-override-'));
  await mkdir(path.join(dir, 'src'));
  await writeFile(path.join(dir, 'src', 'Footer.astro'), source);
  return pathToFileURL(`${dir}/`);
}

function mockLogger() {
  return { warn: vi.fn() } as unknown as AstroIntegrationLogger & { warn: ReturnType<typeof vi.fn> };
}

describe('overrideStarlightComponent', () => {
  it('overrides the component when the user has none', () => {
    const logger = mockLogger();
    const result = overrideStarlightComponent({}, logger, 'Footer', ENTRYPOINT, new URL('file:///nowhere/'));
    expect(result).toEqual({ Footer: ENTRYPOINT });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('stays quiet when the user override already renders the entrypoint', async () => {
    const root = await projectWithFooter(
      `---\nimport Default from '${ENTRYPOINT}';\n---\n<Default><slot /></Default>\n`,
    );
    const logger = mockLogger();
    const result = overrideStarlightComponent({ Footer: './src/Footer.astro' }, logger, 'Footer', ENTRYPOINT, root);
    expect(result).toEqual({});
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns when the user override does not render the entrypoint', async () => {
    const root = await projectWithFooter('<footer>Mine</footer>\n');
    const logger = mockLogger();
    const result = overrideStarlightComponent({ Footer: './src/Footer.astro' }, logger, 'Footer', ENTRYPOINT, root);
    expect(result).toEqual({});
    expect(logger.warn).toHaveBeenCalled();
  });

  it('warns when the override path cannot be read, such as a package specifier', () => {
    const logger = mockLogger();
    const result = overrideStarlightComponent(
      { Footer: 'some-theme/Footer.astro' },
      logger,
      'Footer',
      ENTRYPOINT,
      new URL('file:///nowhere/'),
    );
    expect(result).toEqual({});
    expect(logger.warn).toHaveBeenCalled();
  });
});
