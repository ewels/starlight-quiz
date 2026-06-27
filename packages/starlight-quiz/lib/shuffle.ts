/**
 * In-place Fisher–Yates shuffle.
 *
 * Accepts an optional `random` source (defaulting to `Math.random`) so tests
 * can supply a deterministic generator. Returns the same array for chaining.
 */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = items[i]!;
    const b = items[j]!;
    items[i] = b;
    items[j] = a;
  }
  return items;
}
