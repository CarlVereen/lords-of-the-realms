// Per-county starting state. These are starting *values* — deliberately kept
// distinct from the *rates* in economy.ts. Uniform across counties for M1.2; the
// per-CountyId factory call leaves room for per-county terroir tuning later.

import type { CountyId } from '../map/types';
import type { CountyState, LandAllocation } from '../sim/types';

/** The seed quantities a county starts a game with. */
export interface StartingCountyState {
  landTiles: number;
  land: LandAllocation;
  fertility: number;
  granary: number;
  standingCrop: number;
  livestock: number;
  population: number;
}

/** Default starting county. Placeholder tuning — see economy.ts. */
export const STARTING_COUNTY: StartingCountyState = {
  landTiles: 24,
  land: { crops: 12, pasture: 6, fallow: 6 },
  fertility: 0.85,
  granary: 600,
  standingCrop: 0,
  livestock: 30,
  population: 100,
};

/** Builds a fresh runtime `CountyState` for a county from its starting values. */
export function createInitialCountyState(
  countyId: CountyId,
  start: StartingCountyState = STARTING_COUNTY,
): CountyState {
  return {
    countyId,
    landTiles: start.landTiles,
    land: { ...start.land },
    fertility: start.fertility,
    granary: start.granary,
    standingCrop: start.standingCrop,
    livestock: start.livestock,
    population: start.population,
  };
}
