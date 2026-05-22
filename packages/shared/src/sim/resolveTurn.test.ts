import { describe, expect, it } from 'vitest';
import { createInitialCountyState } from '../content/counties';
import { DEFAULT_ECONOMY_CONFIG } from '../content/economy';
import { createRng } from '../rng';
import { resolveTurn } from './resolveTurn';
import type { CountyOrders, GameState } from './types';

const cfg = DEFAULT_ECONOMY_CONFIG;

function fixtureAt(turn: number): GameState {
  return { turn, counties: [createInitialCountyState('shire')] };
}

describe('resolveTurn', () => {
  it('commits the standing crop at spring sowing, with no harvest', () => {
    const result = resolveTurn(
      fixtureAt(0),
      [{ countyId: 'shire', crops: 16, pasture: 4 }],
      cfg,
      createRng(1),
    );
    expect(result.reports[0]!.season).toBe('spring');
    expect(result.state.counties[0]!.standingCrop).toBeGreaterThan(0);
    expect(result.reports[0]!.grainHarvested).toBe(0);
  });

  it('delivers grain at autumn and clears the standing crop', () => {
    const orders: CountyOrders[] = [{ countyId: 'shire', crops: 16, pasture: 4 }];
    const rng = createRng(7);
    const spring = resolveTurn(fixtureAt(0), orders, cfg, rng);
    const summer = resolveTurn(spring.state, orders, cfg, rng);
    const autumn = resolveTurn(summer.state, orders, cfg, rng);
    expect(autumn.reports[0]!.season).toBe('autumn');
    expect(autumn.reports[0]!.grainHarvested).toBeGreaterThan(0);
    expect(autumn.state.counties[0]!.standingCrop).toBe(0);
  });

  it('applies a land order only in spring (the year-lock)', () => {
    // Turn 1 is summer — a land order must be ignored.
    const before = createInitialCountyState('shire');
    const summer: GameState = { turn: 1, counties: [before] };
    const result = resolveTurn(
      summer,
      [{ countyId: 'shire', crops: 24, pasture: 0 }],
      cfg,
      createRng(1),
    );
    expect(result.state.counties[0]!.land).toEqual(before.land);
  });

  it('does not mutate its inputs', () => {
    const state = fixtureAt(0);
    const snapshot = JSON.stringify(state);
    resolveTurn(state, [{ countyId: 'shire', crops: 20, pasture: 2 }], cfg, createRng(3));
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('advances the turn counter', () => {
    const result = resolveTurn(fixtureAt(5), [], cfg, createRng(1));
    expect(result.state.turn).toBe(6);
  });
});
