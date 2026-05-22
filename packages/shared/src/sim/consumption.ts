// Consumption: peasants eat every turn; the granary buffers surplus and deficit.

import type { EconomyConfig, FoodConfig, GranaryConfig } from '../content/economy';
import type { CountyState, Season } from './types';
import { livestockFood } from './production';

/** Food the population eats this turn. */
export function foodConsumption(
  population: number,
  season: Season,
  cfg: FoodConfig,
): number {
  const seasonal = cfg.seasonalConsumption[season];
  return Math.round(Math.max(0, population) * cfg.foodPerPeasant * seasonal);
}

/**
 * Applies one turn's food flow to the granary. Production is added and
 * consumption drawn down; any unmet demand is returned as `foodShortfall` and
 * the granary is clamped to [0, capacity].
 */
export function updateGranary(
  granary: number,
  production: number,
  consumption: number,
  cfg: GranaryConfig,
): { granary: number; foodShortfall: number } {
  const available = Math.max(0, granary) + Math.max(0, production);
  const remaining = available - Math.max(0, consumption);
  if (remaining < 0) {
    return { granary: 0, foodShortfall: -remaining };
  }
  return { granary: Math.min(remaining, cfg.capacity), foodShortfall: 0 };
}

/**
 * Projected food balance (production − consumption) for the upcoming turn —
 * the panel's "next turn food" readout. Deterministic: weather is not applied,
 * so the projection equals the committed yield's expected value. The expected
 * harvest itself is read straight from `commitHarvest`.
 */
export function projectFoodBalance(
  county: CountyState,
  season: Season,
  cfg: EconomyConfig,
): number {
  let production = livestockFood(county.livestock, cfg.livestock);
  if (season === 'autumn') {
    production += county.standingCrop;
  }
  const consumption = foodConsumption(county.population, season, cfg.food);
  return production - consumption;
}
