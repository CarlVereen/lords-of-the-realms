/** A point in the map's world coordinate space (see `MAP_WIDTH` / `MAP_HEIGHT`). */
export interface Point {
  x: number;
  y: number;
}

/**
 * The eight counties of the realm. Hand-declared as a string-literal union (not
 * derived from the `COUNTIES` array) so that `County.neighbors` references are
 * compiler-checked without a circular type reference.
 */
export type CountyId =
  | 'northumbria'
  | 'lancaster'
  | 'york'
  | 'mercia'
  | 'anglia'
  | 'wessex'
  | 'cornwall'
  | 'kent';

/** Static content describing one county on the strategic map. */
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
