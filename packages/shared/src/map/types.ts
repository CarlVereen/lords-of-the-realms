/** A point in a map's world coordinate space (see `GameMap.width` / `height`). */
export interface Point {
  x: number;
  y: number;
}

/**
 * A county identifier — a slug of the county name, unique within its map.
 * Plain `string` rather than a union: counties are procedurally generated, and
 * adjacency correctness is guaranteed by the generator and the map tests.
 */
export type CountyId = string;

/** Static content describing one county on a strategic map. */
export interface County {
  id: CountyId;
  name: string;
  /** Closed polygon outline in world coordinates — drawn and hit-tested by the renderer. */
  polygon: Point[];
  /** Label / army anchor: the visual centre of the county. */
  centroid: Point;
  /** Counties sharing a land border — used for army movement from M1.4. */
  neighbors: CountyId[];
}

/** The selectable map sizes (a match setting). */
export type MapId = 'small' | 'realm';

/** A complete strategic map: a set of counties in a fixed world coordinate space. */
export interface GameMap {
  id: MapId;
  name: string;
  width: number;
  height: number;
  counties: County[];
}
