// Runtime game-state types for the economy simulation (M1.2).
//
// `County` (see ../map/types.ts) is *static* content. These types are the first
// *runtime* state: what a county becomes as turns resolve. They are plain TS —
// the Colyseus room will project a Schema view over them at M2, never the reverse.

import type { CountyId } from '../map/types';

/** A year is four turns. Turn 0 is spring of year 1. */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** A county's land tiles split three ways. Integers; fallow is the remainder. */
export interface LandAllocation {
  crops: number;
  pasture: number;
  fallow: number;
}

/** Runtime economy state of one county. */
export interface CountyState {
  countyId: CountyId;
  /** Fixed tile count for this county (from content). */
  landTiles: number;
  /** Current allocation — also the committed order, locked for the year. */
  land: LandAllocation;
  /** Aggregate soil quality, 0..1 — drives grain yield. */
  fertility: number;
  /** Food carried across turns. */
  granary: number;
  /** Committed grain yield: set at spring sowing, delivered at autumn. */
  standingCrop: number;
  /** Head of livestock — yield food every turn, breed in summer. */
  livestock: number;
  /** Peasants. M1.2 INPUT ONLY — population dynamics are M1.3. */
  population: number;
}

/** Whole-realm runtime state — only what the sim itself reads. */
export interface GameState {
  /** 0-based turn counter; turn 0 = spring, year 1. */
  turn: number;
  /** Array order is a determinism invariant (RNG draw order + state hash). */
  counties: CountyState[];
}

/** A player's land-use order for one county. Validated by the resolver. */
export interface CountyOrders {
  countyId: CountyId;
  crops: number;
  pasture: number;
}

/** Per-county breakdown of one resolved turn — surfaced verbatim in the UI. */
export interface CountyTurnReport {
  countyId: CountyId;
  season: Season;
  grainHarvested: number;
  livestockFood: number;
  livestockBorn: number;
  foodConsumed: number;
  /** production − consumption for this turn. */
  foodBalance: number;
  /** Unmet demand after the granary was drained. */
  foodShortfall: number;
  /** Peasants a shortfall would cost — reported in M1.2, applied in M1.3. */
  starvationLosses: number;
  /** Signed fertility delta this turn. */
  fertilityChange: number;
}

/** The result of resolving one economy turn. Inputs are never mutated. */
export interface TurnResult {
  state: GameState;
  reports: CountyTurnReport[];
}
