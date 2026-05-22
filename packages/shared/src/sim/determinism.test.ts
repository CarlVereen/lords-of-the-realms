import { describe, expect, it } from 'vitest';
import { createInitialCountyState } from '../content/counties';
import { DEFAULT_ECONOMY_CONFIG } from '../content/economy';
import { createRng, deriveSeed } from '../rng';
import { hashGameState } from './hash';
import { resolveTurn } from './resolveTurn';
import type { CountyOrders, GameState } from './types';

function fixture(): GameState {
  return {
    turn: 0,
    counties: [createInitialCountyState('alpha'), createInitialCountyState('beta')],
  };
}

const orders: CountyOrders[] = [
  { countyId: 'alpha', crops: 14, pasture: 6 },
  { countyId: 'beta', crops: 10, pasture: 8 },
];

/** Plays `turns` turns, deriving a fresh rng from the base seed each turn. */
function play(turns: number, baseSeed: number): GameState {
  let state = fixture();
  for (let i = 0; i < turns; i++) {
    const rng = createRng(deriveSeed(baseSeed, state.turn));
    state = resolveTurn(state, orders, DEFAULT_ECONOMY_CONFIG, rng).state;
  }
  return state;
}

describe('economy determinism', () => {
  it('same base seed + same orders → identical hash across two runs', () => {
    expect(hashGameState(play(12, 4242))).toBe(hashGameState(play(12, 4242)));
  });

  it('a different base seed → a different hash (the weather rng is consumed)', () => {
    expect(hashGameState(play(12, 4242))).not.toBe(hashGameState(play(12, 9001)));
  });
});
