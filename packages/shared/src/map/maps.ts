import { REALM_MAP, SMALL_MAP } from './maps.generated';
import type { County, CountyId, GameMap, MapId } from './types';

/** Every selectable strategic map, keyed by id. */
export const MAPS: Record<MapId, GameMap> = {
  small: SMALL_MAP,
  realm: REALM_MAP,
};

/** The map used until the player chooses otherwise. */
export const DEFAULT_MAP_ID: MapId = 'realm';

export function getMap(id: MapId): GameMap {
  return MAPS[id];
}

/** Builds a county lookup (by id) for a map. */
export function countyIndex(map: GameMap): Map<CountyId, County> {
  return new Map(map.counties.map((county) => [county.id, county]));
}
