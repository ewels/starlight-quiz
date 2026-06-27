import type { StarlightUserConfig } from '@astrojs/starlight/types';
import type { AstroIntegrationLogger } from 'astro';

type Components = NonNullable<StarlightUserConfig['components']>;

/**
 * Build a component-override entry for Starlight, warning (and backing off)
 * if the user already overrides that component themselves, so we never clobber
 * their customisation.
 */
export function overrideStarlightComponent(
  components: StarlightUserConfig['components'],
  logger: AstroIntegrationLogger,
  component: keyof Components,
  entrypoint: string,
): Partial<Components> {
  if (components?.[component]) {
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
