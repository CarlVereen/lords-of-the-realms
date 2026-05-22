// Top-level economy turn resolution. Pure: returns new state, mutates nothing.
//
// The caller derives the rng per turn — createRng(deriveSeed(baseSeed, turn)) —
// so a turn is reproducible from (state, orders, cfg, baseSeed) alone.

import type { EconomyConfig } from '../content/economy';
import type { CountyId } from '../map/types';
import type { Rng } from '../rng';
import { foodConsumption, updateGranary } from './consumption';
import { updateFertility } from './fertility';
import { resolveLandAllocation } from './landuse';
import { breedLivestock, commitHarvest, harvestGrain, livestockFood } from './production';
import { seasonForTurn } from './season';
import type {
  CountyOrders,
  CountyState,
  CountyTurnReport,
  GameState,
  Season,
  TurnResult,
} from './types';

/**
 * Resolves one economy turn for a whole realm. Counties are walked in array
 * order — that order fixes both the RNG draw sequence and the state hash.
 */
export function resolveTurn(
  state: GameState,
  orders: CountyOrders[],
  cfg: EconomyConfig,
  rng: Rng,
): TurnResult {
  const season = seasonForTurn(state.turn);

  const orderIndex = new Map<CountyId, CountyOrders>();
  for (const order of orders) {
    orderIndex.set(order.countyId, order);
  }

  const resolved = state.counties.map((county) =>
    resolveCounty(county, orderIndex.get(county.countyId), season, cfg, rng),
  );

  return {
    state: { turn: state.turn + 1, counties: resolved.map((entry) => entry.county) },
    reports: resolved.map((entry) => entry.report),
  };
}

function resolveCounty(
  prev: CountyState,
  order: CountyOrders | undefined,
  season: Season,
  cfg: EconomyConfig,
  rng: Rng,
): { county: CountyState; report: CountyTurnReport } {
  // 1. Land — orders apply in spring only; otherwise the allocation is locked.
  const land =
    season === 'spring' && order
      ? resolveLandAllocation(prev.landTiles, order)
      : prev.land;

  // 2–5. Season-gated production.
  let standingCrop = prev.standingCrop;
  let grainHarvested = 0;
  let livestockBorn = 0;
  let livestock = prev.livestock;

  if (season === 'spring') {
    // Sow: the harvest size is committed now, against spring fertility.
    standingCrop = commitHarvest(land.crops, prev.fertility, cfg.crop);
  } else if (season === 'summer') {
    livestockBorn = breedLivestock(prev.livestock, land.pasture, cfg.livestock, rng);
    livestock = prev.livestock + livestockBorn;
  } else if (season === 'autumn') {
    // Reap: deliver the committed yield, with this year's weather applied.
    grainHarvested = harvestGrain(prev.standingCrop, cfg.crop, rng);
    standingCrop = 0;
  }

  // 6. Food flow — livestock yield every season, consumption, then the granary.
  const livestockFed = livestockFood(livestock, cfg.livestock);
  const production = grainHarvested + livestockFed;
  const foodConsumed = foodConsumption(prev.population, season, cfg.food);
  const { granary, foodShortfall } = updateGranary(
    prev.granary,
    production,
    foodConsumed,
    cfg.granary,
  );

  // 7. Starvation — reported in M1.2, applied to population in M1.3.
  const starvationLosses =
    foodShortfall > 0 ? Math.ceil(foodShortfall / cfg.food.foodPerPeasant) : 0;

  // 8. Fertility.
  const fertility = updateFertility(prev.fertility, land, cfg.fertility);

  const county: CountyState = {
    countyId: prev.countyId,
    landTiles: prev.landTiles,
    land,
    fertility,
    granary,
    standingCrop,
    livestock,
    population: prev.population, // M1.2: population is an input, passed through
  };

  const report: CountyTurnReport = {
    countyId: prev.countyId,
    season,
    grainHarvested,
    livestockFood: livestockFed,
    livestockBorn,
    foodConsumed,
    foodBalance: production - foodConsumed,
    foodShortfall,
    starvationLosses,
    fertilityChange: Math.round((fertility - prev.fertility) * 1e4) / 1e4,
  };

  return { county, report };
}
