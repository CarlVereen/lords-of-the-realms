import {
  createInitialCountyState,
  createRng,
  DEFAULT_ECONOMY_CONFIG,
  DEFAULT_MAP_ID,
  deriveSeed,
  getMap,
  resolveLandAllocation,
  resolveTurn,
  seasonForTurn,
  type CountyId,
  type CountyOrders,
  type CountyTurnReport,
  type GameState,
  type MapId,
} from '@lor/shared';
import { create } from 'zustand';

/** Fixed per game — the per-turn rng is derived from it (deterministic by design). */
const BASE_SEED = 0x1abe11ed;

function newGame(mapId: MapId): { game: GameState; homeCountyId: CountyId } {
  const map = getMap(mapId);
  const counties = map.counties.map((county) => createInitialCountyState(county.id));
  // The first county is the player's home for the M1.2 single-player slice.
  const homeCountyId = map.counties[0]?.id ?? '';
  return { game: { turn: 0, counties }, homeCountyId };
}

interface GameStore {
  game: GameState;
  /** View state — which county the player manages. Not part of the sim state. */
  homeCountyId: CountyId;
  baseSeed: number;
  lastReports: CountyTurnReport[];
  /** Re-allocates the home county's land. No-op outside spring (year-lock). */
  setLandAllocation: (crops: number, pasture: number) => void;
  /** Resolves one economy turn for the whole realm via the shared sim. */
  advanceTurn: () => void;
  /** Starts a fresh game on the given map. */
  resetGame: (mapId: MapId) => void;
}

/**
 * The local single-player game host (M1.x). It only *holds* `GameState` and
 * swaps it for the pure `resolveTurn` result — all economy logic lives in
 * `@lor/shared`. At M2 the Colyseus room takes over this hosting role.
 */
export const useGameStore = create<GameStore>((set, get) => ({
  ...newGame(DEFAULT_MAP_ID),
  baseSeed: BASE_SEED,
  lastReports: [],

  setLandAllocation: (crops, pasture) => {
    const { game, homeCountyId } = get();
    if (seasonForTurn(game.turn) !== 'spring') return;
    const counties = game.counties.map((county) => {
      if (county.countyId !== homeCountyId) return county;
      return {
        ...county,
        land: resolveLandAllocation(county.landTiles, {
          countyId: county.countyId,
          crops,
          pasture,
        }),
      };
    });
    set({ game: { ...game, counties } });
  },

  advanceTurn: () => {
    const { game, baseSeed } = get();
    const orders: CountyOrders[] = game.counties.map((county) => ({
      countyId: county.countyId,
      crops: county.land.crops,
      pasture: county.land.pasture,
    }));
    const rng = createRng(deriveSeed(baseSeed, game.turn));
    const result = resolveTurn(game, orders, DEFAULT_ECONOMY_CONFIG, rng);
    set({ game: result.state, lastReports: result.reports });
  },

  resetGame: (mapId) => {
    set({ ...newGame(mapId), lastReports: [] });
  },
}));
