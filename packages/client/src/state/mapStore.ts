import { DEFAULT_MAP_ID, type MapId } from '@lor/shared';
import { create } from 'zustand';

interface MapState {
  currentMapId: MapId;
  setMap: (id: MapId) => void;
}

/**
 * Which strategic map is in play. A match setting — for now driven by the
 * header selector; the full match-setup/lobby flow arrives in M3.
 */
export const useMapStore = create<MapState>((set) => ({
  currentMapId: DEFAULT_MAP_ID,
  setMap: (id) => set({ currentMapId: id }),
}));
