import type { CountyId } from '@lor/shared';
import { create } from 'zustand';

interface SelectionState {
  selectedCountyId: CountyId | null;
  selectCounty: (id: CountyId | null) => void;
}

/**
 * Which county the player has selected. This is client-side UI/view state, not
 * game state — both the Pixi renderer and the React panel react to it.
 */
export const useSelectionStore = create<SelectionState>((set) => ({
  selectedCountyId: null,
  selectCounty: (id) => set({ selectedCountyId: id }),
}));
