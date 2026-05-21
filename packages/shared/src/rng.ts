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
