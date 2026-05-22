// Data-driven economy balance (CLAUDE.md §11). These are tuning *rates* — every
// number here is a placeholder for balancing, not final. Logic lives in sim/;
// this module holds only numbers, so it sits outside the sim/ determinism lint.

import type { Season } from '../sim/types';

/** Soil model: crop use degrades fertility, fallow restores it, pasture is neutral. */
export interface FertilityConfig {
  min: number;
  max: number;
  /** Fertility lost per turn at 100% crop share. */
  depletionPerTurn: number;
  /** Fertility gained per turn at 100% fallow share. */
  recoveryPerTurn: number;
}

/** Crop yield model. */
export interface CropConfig {
  /** Grain per crop tile at full fertility. */
  grainPerTile: number;
  /** Autumn weather multiplier band — applied to the committed yield. */
  weatherMin: number;
  weatherMax: number;
}

/** Livestock model. */
export interface LivestockConfig {
  /** Herd capacity per pasture tile. */
  headPerPastureTile: number;
  /** Summer breeding-rate band. */
  breedMin: number;
  breedMax: number;
  /** Food yielded per head, every turn. */
  foodPerHeadPerTurn: number;
}

/** Food consumption model. */
export interface FoodConfig {
  /** Food a peasant eats per turn, before the seasonal multiplier. */
  foodPerPeasant: number;
  /** Per-season consumption multiplier. */
  seasonalConsumption: Record<Season, number>;
}

/** Granary (food store) model. */
export interface GranaryConfig {
  /** Maximum food the granary holds; surplus beyond this is lost. */
  capacity: number;
  /** Fraction of stored food lost per turn (0 for M1.2). */
  spoilageRate: number;
}

/** The full economy balance bundle, passed explicitly into every turn. */
export interface EconomyConfig {
  fertility: FertilityConfig;
  crop: CropConfig;
  livestock: LivestockConfig;
  food: FoodConfig;
  granary: GranaryConfig;
}

/**
 * Starting balance values. Tuned only so a default county is roughly sustainable
 * and a year visibly cycles (autumn spike, winter drain). All placeholders.
 *
 * Note: `depletionPerTurn ≥ recoveryPerTurn` is deliberate — recovery must not
 * outpace depletion, or fallow becomes a no-brainer and the tradeoff stops biting.
 */
export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  fertility: { min: 0.2, max: 1, depletionPerTurn: 0.05, recoveryPerTurn: 0.03 },
  crop: { grainPerTile: 70, weatherMin: 0.85, weatherMax: 1.15 },
  livestock: { headPerPastureTile: 6, breedMin: 0.05, breedMax: 0.2, foodPerHeadPerTurn: 2 },
  food: {
    foodPerPeasant: 2,
    seasonalConsumption: { spring: 1, summer: 1, autumn: 1, winter: 1 },
  },
  granary: { capacity: 2000, spoilageRate: 0 },
};
