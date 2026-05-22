// The deterministic economy simulation (M1.2). Pure functions only.
//
// ESLint forbids `Math.random`, `Date.now`, and `new Date()` anywhere under
// `src/sim/**` — all randomness must come from the seeded PRNG (see ../rng.ts)
// and time is the turn counter, never the wall clock.

export type {
  Season,
  LandAllocation,
  CountyState,
  GameState,
  CountyOrders,
  CountyTurnReport,
  TurnResult,
} from './types';

export { seasonForTurn, yearForTurn } from './season';
export { updateFertility } from './fertility';
export { resolveLandAllocation } from './landuse';
export { commitHarvest, harvestGrain, breedLivestock, livestockFood } from './production';
export { foodConsumption, updateGranary, projectFoodBalance } from './consumption';
export { resolveTurn } from './resolveTurn';
export { hashGameState } from './hash';
