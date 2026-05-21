// The deterministic game simulation lives in this directory (starting at M1.2).
//
// ESLint forbids `Math.random`, `Date.now`, and `new Date()` anywhere under
// `src/sim/**` — all randomness must come from the seeded PRNG (see ../rng.ts)
// and time is the turn counter, never the wall clock.
export {};
