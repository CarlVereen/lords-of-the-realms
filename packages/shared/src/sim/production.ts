// Production: grain (committed at sowing, delivered at harvest) and livestock.

import type { CropConfig, LivestockConfig } from '../content/economy';
import type { Rng } from '../rng';
import { lerp } from './math';

/**
 * The base grain yield, locked in at spring sowing against spring fertility.
 * No Rng — the size of the harvest is decided here; only the weather is not.
 */
export function commitHarvest(
  cropTiles: number,
  fertility: number,
  cfg: CropConfig,
): number {
  return Math.round(Math.max(0, cropTiles) * cfg.grainPerTile * Math.max(0, fertility));
}

/**
 * The autumn harvest delivery: the committed yield times one seeded weather
 * draw from the [weatherMin, weatherMax] band. One `rng()` call.
 */
export function harvestGrain(standingCrop: number, cfg: CropConfig, rng: Rng): number {
  const weather = lerp(cfg.weatherMin, cfg.weatherMax, rng());
  return Math.round(Math.max(0, standingCrop) * weather);
}

/**
 * Head of livestock born this turn (summer only — the caller season-gates this).
 * Growth scales with a seeded breeding rate and is capped by pasture capacity.
 * One `rng()` call.
 */
export function breedLivestock(
  livestock: number,
  pasture: number,
  cfg: LivestockConfig,
  rng: Rng,
): number {
  const herd = Math.max(0, livestock);
  const capacity = Math.max(0, pasture) * cfg.headPerPastureTile;
  const room = Math.max(0, capacity - herd);
  const rate = lerp(cfg.breedMin, cfg.breedMax, rng());
  return Math.min(Math.floor(herd * rate), room);
}

/** Food the herd yields this turn — a steady trickle, every season. */
export function livestockFood(livestock: number, cfg: LivestockConfig): number {
  return Math.round(Math.max(0, livestock) * cfg.foodPerHeadPerTurn);
}
