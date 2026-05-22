/**
 * Seeded pseudo-random number generator.
 *
 * The simulation must be deterministic (see CLAUDE.md §11): the same seed and
 * the same inputs must always produce the same result. Sim code is forbidden
 * from calling `Math.random()` directly — it receives an `Rng` instead.
 */

export type Rng = () => number;

/**
 * Creates a deterministic RNG from a 32-bit integer seed. Implementation is
 * `mulberry32` — small, fast, and well-distributed. Returns a function that
 * yields a float in the half-open range [0, 1) on each call.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derives a 32-bit turn seed from a per-game base seed and a turn number.
 *
 * Turn resolution creates its rng fresh each turn via `createRng(deriveSeed(...))`
 * rather than threading one stateful generator across turns. Each turn is then
 * reproducible from `(baseSeed, turn)` alone — nothing to persist for snapshots
 * or reconnection, and hypothetical turns can be resolved without side effects.
 * Pure integer mixing — fully deterministic.
 */
export function deriveSeed(baseSeed: number, turn: number): number {
  let h = (baseSeed ^ Math.imul(turn + 1, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
