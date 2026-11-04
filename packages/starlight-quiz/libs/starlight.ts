import { readFileSync } from 'node:fs';

import type { StarlightUserConfig } from '@astrojs/starlight/types';
import type { AstroIntegrationLogger } from 'astro';

type Components = NonNullable<StarlightUserConfig['components']>;

/** The name of a Starlight component that can be overridden. */
export type StarlightComponentName = keyof Components;

/**
 * Build a component-override entry for Starlight, backing off if the user
 * already overrides that component themselves, so we never clobber their
 * customisation. Warns unless their override already renders `entrypoint`.
 */
export function overrideStarlightComponent(
  components: StarlightUserConfig['components'],
  logger: AstroIntegrationLogger,
  component: StarlightComponentName,
  entrypoint: string,
  root: URL,
): Partial<Components> {
  const existing = components?.[component];
  if (existing) {
    if (rendersEntrypoint(existing, entrypoint, root)) return {};
    logger.warn(
      `It looks like you already have a \`${component}\` component override in your Starlight configuration.`,
    );
    logger.warn(
      `To use the starlight-quiz progress tracker, either remove that override or render \`${entrypoint}\` from it yourself.`,
    );
    return {};
  }
  return { [component]: entrypoint };
}

/** Whether the user's override file already renders the starlight-quiz entrypoint. */
function rendersEntrypoint(path: string, entrypoint: string, root: URL): boolean {
  try {
    return readFileSync(new URL(path, root), 'utf8').includes(entrypoint);
  } catch {
    // Package specifiers and aliases aren't readable as files.
    return false;
  }
}
