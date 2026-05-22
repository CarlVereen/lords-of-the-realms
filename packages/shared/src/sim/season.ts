// Season derivation. A year is four turns; turn 0 is spring of year 1.

import type { Season } from './types';

/** The season a turn falls in. Cycles spring → summer → autumn → winter. */
export function seasonForTurn(turn: number): Season {
  // ((n % 4) + 4) % 4 keeps the index in 0..3 even for negative turns.
  switch (((Math.trunc(turn) % 4) + 4) % 4) {
    case 0:
      return 'spring';
    case 1:
      return 'summer';
    case 2:
      return 'autumn';
    default:
      return 'winter';
  }
}

/** The 1-based year a turn falls in (turns 0–3 are year 1). */
export function yearForTurn(turn: number): number {
  return Math.floor(Math.trunc(turn) / 4) + 1;
}
