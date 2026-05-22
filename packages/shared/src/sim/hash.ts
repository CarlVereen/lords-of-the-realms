// Deterministic state hash. Used by the determinism test: same seed + same
// orders must yield an identical hash across independent runs.

import type { CountyState, GameState } from './types';

/** FNV-1a 32-bit over a string. Dependency-free, integer-only. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Serializes one county with an explicit, fixed field order. Every quantity is
 * an integer except `fertility`, which is quantized to 6 decimals — that is the
 * one deliberate float in the state, and it must be quantized for the hash to be
 * reproducible across platforms.
 */
function serializeCounty(county: CountyState): string {
  return [
    county.countyId,
    county.landTiles,
    county.land.crops,
    county.land.pasture,
    county.land.fallow,
    Math.round(county.fertility * 1e6),
    county.granary,
    county.standingCrop,
    county.livestock,
    county.population,
  ].join(',');
}

/** A stable hex digest of the whole game state (turn + every county, in order). */
export function hashGameState(state: GameState): string {
  const payload = [String(state.turn), ...state.counties.map(serializeCounty)].join('|');
  return fnv1a(payload).toString(16).padStart(8, '0');
}
