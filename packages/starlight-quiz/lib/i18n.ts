import { STRINGS, type StringKey } from './strings';

/** A translation function, as provided by Starlight via `Astro.locals.t`. */
export type Translate = (key: string) => string;

/**
 * Resolve a user-facing string for a component.
 *
 * Precedence: an explicit prop wins; then Starlight's `t()` if it returns a
 * real translation; then the bundled English default. This is what lets the
 * same component work in a Starlight site (translated) and a plain Astro
 * project (label props or English).
 */
export function resolveString(key: StringKey, override: string | undefined, translate: Translate | undefined): string {
  if (override !== undefined && override !== '') return override;
  if (translate) {
    const value = translate(key);
    if (value && value !== key) return value;
  }
  return STRINGS[key];
}

/**
 * Safely read Starlight's translation function off `Astro.locals` without
 * importing `@astrojs/starlight`, so this stays usable in vanilla Astro.
 */
export function getTranslate(locals: unknown): Translate | undefined {
  if (typeof locals !== 'object' || locals === null) return undefined;
  const translate = (locals as Record<string, unknown>)['t'];
  return typeof translate === 'function' ? (translate as Translate) : undefined;
}

/** Resolve a string for a key, applying an optional prop override. */
export type StringResolver = (key: StringKey, override?: string) => string;

/**
 * Bind a resolver to `Astro.locals` so components don't repeat the
 * `getTranslate` + `resolveString(..., t)` dance for every label.
 */
export function createStringResolver(locals: unknown): StringResolver {
  const translate = getTranslate(locals);
  return (key, override) => resolveString(key, override, translate);
}
