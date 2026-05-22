import { describe, expect, it } from 'vitest';
import { createInitialCountyState } from '../content/counties';
import { DEFAULT_ECONOMY_CONFIG } from '../content/economy';
import { createRng, deriveSeed } from '../rng';
import { hashGameState } from './hash';
import { resolveTurn } from './resolveTurn';
import type { CountyOrders, CountyTurnReport, GameState } from './types';

const GOLDEN_SEED = 1337;

function fixture(): GameState {
  return {
    turn: 0,
    counties: [
      createInitialCountyState('greenvale'),
      createInitialCountyState('stonemarch'),
    ],
  };
}

// Distinct from the determinism fixture so balance tuning does not ripple
// between the two tests.
const orders: CountyOrders[] = [
  { countyId: 'greenvale', crops: 18, pasture: 4 }, // crop-heavy
  { countyId: 'stonemarch', crops: 8, pasture: 10 }, // pasture-heavy
];

describe('economy golden run', () => {
  it('an 8-turn (2-year) run matches the recorded snapshot', () => {
    let state = fixture();
    const reportsByTurn: CountyTurnReport[][] = [];
    for (let i = 0; i < 8; i++) {
      const rng = createRng(deriveSeed(GOLDEN_SEED, state.turn));
      const result = resolveTurn(state, orders, DEFAULT_ECONOMY_CONFIG, rng);
      reportsByTurn.push(result.reports);
      state = result.state;
    }
    expect(reportsByTurn).toMatchSnapshot('reports');
    expect(hashGameState(state)).toMatchSnapshot('final-hash');
  });
});
