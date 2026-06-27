/**
 * Derive a stable quiz id from its title, used when the author does not supply
 * an explicit `id`. A deterministic hash means the persisted progress key
 * survives reordering and rebuilding, as long as the title is unchanged.
 *
 * This is the FNV-1a 32-bit hash — small, dependency-free and stable across
 * builds and runtimes (unlike `Math.random`).
 */
export function hashId(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** Build a stable quiz id from an explicit id or, failing that, a title. */
export function quizId(id: string | undefined, title: string | undefined): string {
  if (id) return id;
  if (title) return `quiz-${hashId(title)}`;
  return `quiz-${hashId('untitled')}`;
}
