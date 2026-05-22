// Land-use order validation. This is the server-authoritative check (M2): the
// client may clamp for UX, but the legal allocation is decided here.

import type { CountyOrders, LandAllocation } from './types';

/**
 * Clamps a player's raw order into a legal `LandAllocation`. Negatives become 0;
 * on over-allocation crops are honored first and pasture is shed; fallow is
 * always the remainder, so the three buckets sum exactly to `landTiles`.
 */
export function resolveLandAllocation(
  landTiles: number,
  orders: CountyOrders,
): LandAllocation {
  const tiles = Math.max(0, Math.trunc(landTiles));
  const crops = Math.min(tiles, Math.max(0, Math.trunc(orders.crops)));
  const pasture = Math.min(tiles - crops, Math.max(0, Math.trunc(orders.pasture)));
  const fallow = tiles - crops - pasture;
  return { crops, pasture, fallow };
}
