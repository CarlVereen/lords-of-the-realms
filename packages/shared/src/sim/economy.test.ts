import { describe, expect, it } from 'vitest';
import { DEFAULT_ECONOMY_CONFIG } from '../content/economy';
import type { Rng } from '../rng';
import { foodConsumption, updateGranary } from './consumption';
import { resolveLandAllocation } from './landuse';
import { breedLivestock, commitHarvest, harvestGrain, livestockFood } from './production';

const cfg = DEFAULT_ECONOMY_CONFIG;

describe('resolveLandAllocation', () => {
  it('derives fallow as the remainder', () => {
    expect(resolveLandAllocation(24, { countyId: 'x', crops: 10, pasture: 6 })).toEqual({
      crops: 10,
      pasture: 6,
      fallow: 8,
    });
  });

  it('clamps negative orders to zero', () => {
    expect(resolveLandAllocation(24, { countyId: 'x', crops: -5, pasture: -2 })).toEqual({
      crops: 0,
      pasture: 0,
      fallow: 24,
    });
  });

  it('sheds pasture first when over-allocated', () => {
    expect(resolveLandAllocation(24, { countyId: 'x', crops: 20, pasture: 20 })).toEqual({
      crops: 20,
      pasture: 4,
      fallow: 0,
    });
  });

  it('clamps crops to the tile count', () => {
    expect(resolveLandAllocation(24, { countyId: 'x', crops: 99, pasture: 5 })).toEqual({
      crops: 24,
      pasture: 0,
      fallow: 0,
    });
  });
});

describe('commitHarvest', () => {
  it('scales with fertility', () => {
    expect(commitHarvest(12, 0.9, cfg.crop)).toBeGreaterThan(commitHarvest(12, 0.4, cfg.crop));
  });

  it('is zero with no crop tiles', () => {
    expect(commitHarvest(0, 1, cfg.crop)).toBe(0);
  });
});

describe('harvestGrain', () => {
  it('hits the band edges at rng 0 and rng → 1', () => {
    expect(harvestGrain(1000, cfg.crop, () => 0)).toBe(Math.round(1000 * cfg.crop.weatherMin));
    const lush = harvestGrain(1000, cfg.crop, () => 0.999999);
    expect(lush).toBeGreaterThan(Math.round(1000 * cfg.crop.weatherMin));
    expect(lush).toBeLessThanOrEqual(Math.round(1000 * cfg.crop.weatherMax));
  });

  it('stays within the weather band for any draw', () => {
    for (const draw of [0, 0.25, 0.5, 0.75, 0.999]) {
      const rng: Rng = () => draw;
      const grain = harvestGrain(1000, cfg.crop, rng);
      expect(grain).toBeGreaterThanOrEqual(Math.round(1000 * cfg.crop.weatherMin));
      expect(grain).toBeLessThanOrEqual(Math.round(1000 * cfg.crop.weatherMax));
    }
  });
});

describe('breedLivestock', () => {
  const mid: Rng = () => 0.5;

  it('produces offspring when below pasture capacity', () => {
    // pasture 10 → capacity 60; herd 30 has room to grow.
    expect(breedLivestock(30, 10, cfg.livestock, mid)).toBeGreaterThan(0);
  });

  it('is capped by pasture capacity', () => {
    // pasture 5 → capacity 30; herd already at 30 → no room.
    expect(breedLivestock(30, 5, cfg.livestock, mid)).toBe(0);
  });

  it('is zero with no pasture', () => {
    expect(breedLivestock(30, 0, cfg.livestock, mid)).toBe(0);
  });
});

describe('livestockFood', () => {
  it('scales linearly with the herd', () => {
    expect(livestockFood(0, cfg.livestock)).toBe(0);
    expect(livestockFood(20, cfg.livestock)).toBe(20 * cfg.livestock.foodPerHeadPerTurn);
  });
});

describe('foodConsumption', () => {
  it('is linear in population', () => {
    expect(foodConsumption(0, 'spring', cfg.food)).toBe(0);
    expect(foodConsumption(100, 'winter', cfg.food)).toBe(
      Math.round(100 * cfg.food.foodPerPeasant * cfg.food.seasonalConsumption.winter),
    );
  });
});

describe('updateGranary', () => {
  it('accumulates surplus', () => {
    const result = updateGranary(100, 500, 200, cfg.granary);
    expect(result).toEqual({ granary: 400, foodShortfall: 0 });
  });

  it('clamps stored food to capacity', () => {
    const result = updateGranary(cfg.granary.capacity, 1000, 0, cfg.granary);
    expect(result.granary).toBe(cfg.granary.capacity);
  });

  it('reports a shortfall when demand outstrips supply', () => {
    const result = updateGranary(50, 20, 200, cfg.granary);
    expect(result).toEqual({ granary: 0, foodShortfall: 130 });
  });
});
