import { describe, expect, it } from 'vitest';
import { DEFAULT_ECONOMY_CONFIG } from '../content/economy';
import { updateFertility } from './fertility';
import type { LandAllocation } from './types';

const cfg = DEFAULT_ECONOMY_CONFIG.fertility;

describe('updateFertility', () => {
  it('drops fertility under all-crop use', () => {
    const land: LandAllocation = { crops: 24, pasture: 0, fallow: 0 };
    expect(updateFertility(0.8, land, cfg)).toBeLessThan(0.8);
  });

  it('raises fertility under all-fallow use', () => {
    const land: LandAllocation = { crops: 0, pasture: 0, fallow: 24 };
    expect(updateFertility(0.8, land, cfg)).toBeGreaterThan(0.8);
  });

  it('leaves fertility roughly unchanged under all-pasture use', () => {
    const land: LandAllocation = { crops: 0, pasture: 24, fallow: 0 };
    expect(updateFertility(0.8, land, cfg)).toBeCloseTo(0.8);
  });

  it('clamps to [min, max] under sustained extreme use', () => {
    const allCrops: LandAllocation = { crops: 24, pasture: 0, fallow: 0 };
    let depleted = 0.25;
    for (let i = 0; i < 100; i++) {
      depleted = updateFertility(depleted, allCrops, cfg);
    }
    expect(depleted).toBe(cfg.min);

    const allFallow: LandAllocation = { crops: 0, pasture: 0, fallow: 24 };
    let restored = 0.95;
    for (let i = 0; i < 100; i++) {
      restored = updateFertility(restored, allFallow, cfg);
    }
    expect(restored).toBe(cfg.max);
  });

  it('handles an empty allocation without dividing by zero', () => {
    const land: LandAllocation = { crops: 0, pasture: 0, fallow: 0 };
    expect(updateFertility(0.7, land, cfg)).toBe(0.7);
  });
});
