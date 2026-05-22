// Fertility update. The central land tradeoff: crop use degrades the soil,
// fallow restores it, pasture is neutral. Deterministic — no Rng.

import type { FertilityConfig } from '../content/economy';
import type { LandAllocation } from './types';
import { clamp } from './math';

/**
 * Next-turn fertility for a county. The delta scales with crop share (down) and
 * fallow share (up); the result is clamped to [cfg.min, cfg.max].
 */
export function updateFertility(
  fertility: number,
  land: LandAllocation,
  cfg: FertilityConfig,
): number {
  const total = land.crops + land.pasture + land.fallow;
  if (total <= 0) {
    return clamp(fertility, cfg.min, cfg.max);
  }
  const cropShare = land.crops / total;
  const fallowShare = land.fallow / total;
  const delta = fallowShare * cfg.recoveryPerTurn - cropShare * cfg.depletionPerTurn;
  return clamp(fertility + delta, cfg.min, cfg.max);
}
