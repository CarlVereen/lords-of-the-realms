export { createRng, deriveSeed } from './rng';
export type { Rng } from './rng';

export { MAPS, DEFAULT_MAP_ID, getMap, countyIndex } from './map/maps';
export type { County, CountyId, GameMap, MapId, Point } from './map/types';

export {
  seasonForTurn,
  yearForTurn,
  updateFertility,
  resolveLandAllocation,
  commitHarvest,
  harvestGrain,
  breedLivestock,
  livestockFood,
  foodConsumption,
  updateGranary,
  projectFoodBalance,
  resolveTurn,
  hashGameState,
} from './sim';
export type {
  Season,
  LandAllocation,
  CountyState,
  GameState,
  CountyOrders,
  CountyTurnReport,
  TurnResult,
} from './sim';

export { DEFAULT_ECONOMY_CONFIG } from './content/economy';
export type {
  EconomyConfig,
  FertilityConfig,
  CropConfig,
  LivestockConfig,
  FoodConfig,
  GranaryConfig,
} from './content/economy';

export { STARTING_COUNTY, createInitialCountyState } from './content/counties';
export type { StartingCountyState } from './content/counties';
