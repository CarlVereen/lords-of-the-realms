import type { County, CountyId } from './types';

/** The map's world coordinate space. The island is authored to sit within this. */
export const MAP_WIDTH = 1600;
export const MAP_HEIGHT = 1000;

/**
 * The eight counties of the realm.
 *
 * Polygons are hand-authored on a shared vertex grid so that neighbouring
 * counties share exact border coordinates (no gaps or overlaps), and the outer
 * edges form a coastline against the sea. This is a stylized realm, not literal
 * cartography. Adjacency in `neighbors` matches the shared polygon edges.
 */
export const COUNTIES: readonly County[] = [
  {
    id: 'northumbria',
    name: 'Northumbria',
    polygon: [
      { x: 430, y: 170 },
      { x: 700, y: 120 },
      { x: 980, y: 150 },
      { x: 1120, y: 240 },
      { x: 1180, y: 430 },
      { x: 920, y: 360 },
      { x: 640, y: 380 },
      { x: 400, y: 360 },
    ],
    centroid: { x: 770, y: 260 },
    neighbors: ['lancaster', 'york'],
  },
  {
    id: 'lancaster',
    name: 'Lancaster',
    polygon: [
      { x: 400, y: 360 },
      { x: 640, y: 380 },
      { x: 660, y: 600 },
      { x: 430, y: 600 },
    ],
    centroid: { x: 520, y: 470 },
    neighbors: ['northumbria', 'york', 'mercia'],
  },
  {
    id: 'york',
    name: 'York',
    polygon: [
      { x: 640, y: 380 },
      { x: 920, y: 360 },
      { x: 1180, y: 430 },
      { x: 1210, y: 560 },
      { x: 980, y: 580 },
      { x: 660, y: 600 },
    ],
    centroid: { x: 900, y: 480 },
    neighbors: ['northumbria', 'lancaster', 'mercia', 'anglia'],
  },
  {
    id: 'mercia',
    name: 'Mercia',
    polygon: [
      { x: 430, y: 600 },
      { x: 660, y: 600 },
      { x: 980, y: 580 },
      { x: 1000, y: 720 },
      { x: 470, y: 720 },
    ],
    centroid: { x: 700, y: 650 },
    neighbors: ['lancaster', 'york', 'anglia', 'wessex'],
  },
  {
    id: 'anglia',
    name: 'East Anglia',
    polygon: [
      { x: 980, y: 580 },
      { x: 1210, y: 560 },
      { x: 1240, y: 660 },
      { x: 1000, y: 720 },
    ],
    centroid: { x: 1100, y: 625 },
    neighbors: ['york', 'mercia', 'kent'],
  },
  {
    id: 'wessex',
    name: 'Wessex',
    polygon: [
      { x: 470, y: 720 },
      { x: 1000, y: 720 },
      { x: 900, y: 860 },
      { x: 640, y: 870 },
    ],
    centroid: { x: 740, y: 780 },
    neighbors: ['mercia', 'kent', 'cornwall'],
  },
  {
    id: 'cornwall',
    name: 'Cornwall',
    polygon: [
      { x: 470, y: 720 },
      { x: 360, y: 800 },
      { x: 300, y: 880 },
      { x: 640, y: 870 },
    ],
    centroid: { x: 445, y: 815 },
    neighbors: ['wessex'],
  },
  {
    id: 'kent',
    name: 'Kent',
    polygon: [
      { x: 1000, y: 720 },
      { x: 1240, y: 660 },
      { x: 1120, y: 810 },
      { x: 900, y: 860 },
    ],
    centroid: { x: 1065, y: 765 },
    neighbors: ['anglia', 'wessex'],
  },
];

/** Lookup of every county by its id. */
export const countyById: Record<CountyId, County> = Object.fromEntries(
  COUNTIES.map((county) => [county.id, county]),
) as Record<CountyId, County>;
