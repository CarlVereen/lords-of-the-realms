/**
 * Map generator — run once, output committed.
 *
 *   pnpm --filter @lor/shared generate-maps
 *
 * Places hand-tuned county seed points plus a procedural ring of "sea" seed
 * points, computes a Voronoi diagram, and keeps the county cells. The boundary
 * between a county cell and a sea cell is an irregular Voronoi edge, which gives
 * the island a natural coastline without any polygon-clipping. County adjacency
 * is read straight off the Voronoi graph. Fully deterministic — no RNG.
 *
 * Output: src/map/maps.generated.ts (do not edit that file by hand).
 */
import { Delaunay } from 'd3-delaunay';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { County, GameMap, Point } from '../src/map/types';

interface CountySeed {
  name: string;
  x: number;
  y: number;
}

interface MapConfig {
  id: GameMap['id'];
  name: string;
  width: number;
  height: number;
  seaSeedCount: number;
  seaSeedOffset: number;
  seeds: CountySeed[];
}

const REALM: MapConfig = {
  id: 'realm',
  name: 'Realm of England',
  width: 1600,
  height: 1000,
  seaSeedCount: 26,
  seaSeedOffset: 165,
  seeds: [
    { name: 'Northumberland', x: 820, y: 150 },
    { name: 'Cumberland', x: 640, y: 200 },
    { name: 'Durham', x: 850, y: 270 },
    { name: 'Yorkshire', x: 910, y: 360 },
    { name: 'Lancashire', x: 660, y: 350 },
    { name: 'Cheshire', x: 640, y: 450 },
    { name: 'Derbyshire', x: 820, y: 450 },
    { name: 'Nottinghamshire', x: 940, y: 440 },
    { name: 'Lincolnshire', x: 1070, y: 420 },
    { name: 'Shropshire', x: 600, y: 540 },
    { name: 'Staffordshire', x: 760, y: 530 },
    { name: 'Leicestershire', x: 910, y: 540 },
    { name: 'Norfolk', x: 1210, y: 520 },
    { name: 'Herefordshire', x: 560, y: 640 },
    { name: 'Warwickshire', x: 790, y: 620 },
    { name: 'Northamptonshire', x: 940, y: 620 },
    { name: 'Cambridgeshire', x: 1080, y: 610 },
    { name: 'Suffolk', x: 1200, y: 640 },
    { name: 'Gloucestershire', x: 620, y: 720 },
    { name: 'Oxfordshire', x: 830, y: 710 },
    { name: 'Hertfordshire', x: 1000, y: 710 },
    { name: 'Essex', x: 1140, y: 720 },
    { name: 'Somerset', x: 530, y: 800 },
    { name: 'Wiltshire', x: 720, y: 790 },
    { name: 'Surrey', x: 950, y: 800 },
    { name: 'Kent', x: 1160, y: 810 },
    { name: 'Hampshire', x: 850, y: 860 },
    { name: 'Sussex', x: 1030, y: 870 },
    { name: 'Devon', x: 400, y: 870 },
    { name: 'Cornwall', x: 260, y: 910 },
  ],
};

const SMALL: MapConfig = {
  id: 'small',
  name: 'Small Realm',
  width: 1200,
  height: 900,
  seaSeedCount: 20,
  seaSeedOffset: 150,
  seeds: [
    { name: 'Northumberland', x: 620, y: 160 },
    { name: 'Cumberland', x: 430, y: 250 },
    { name: 'Yorkshire', x: 680, y: 330 },
    { name: 'Lancashire', x: 450, y: 390 },
    { name: 'Lincolnshire', x: 820, y: 370 },
    { name: 'Norfolk', x: 950, y: 470 },
    { name: 'Warwickshire', x: 600, y: 520 },
    { name: 'Gloucestershire', x: 470, y: 620 },
    { name: 'Essex', x: 840, y: 610 },
    { name: 'Kent', x: 880, y: 730 },
    { name: 'Devon', x: 380, y: 750 },
    { name: 'Cornwall', x: 250, y: 830 },
  ],
};

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** A ring of sea seed points encircling the county seeds, hugging their extent. */
function seaRing(seeds: CountySeed[], count: number, offset: number): [number, number][] {
  const cx = mean(seeds.map((s) => s.x));
  const cy = mean(seeds.map((s) => s.y));
  const ring: [number, number][] = [];
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let maxProjection = 0;
    for (const seed of seeds) {
      const projection = (seed.x - cx) * dx + (seed.y - cy) * dy;
      if (projection > maxProjection) {
        maxProjection = projection;
      }
    }
    ring.push([cx + dx * (maxProjection + offset), cy + dy * (maxProjection + offset)]);
  }
  return ring;
}

function polygonCentroid(points: Point[]): Point {
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const cross = a.x * b.y - b.x * a.y;
    twiceArea += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  if (twiceArea === 0) {
    return {
      x: Math.round(mean(points.map((p) => p.x))),
      y: Math.round(mean(points.map((p) => p.y))),
    };
  }
  const factor = 1 / (3 * twiceArea);
  return { x: Math.round(cx * factor), y: Math.round(cy * factor) };
}

function buildMap(config: MapConfig): GameMap {
  const countyCount = config.seeds.length;
  const countyPoints: [number, number][] = config.seeds.map((s) => [s.x, s.y]);
  const seaPoints = seaRing(config.seeds, config.seaSeedCount, config.seaSeedOffset);
  const delaunay = Delaunay.from([...countyPoints, ...seaPoints]);
  const voronoi = delaunay.voronoi([0, 0, config.width, config.height]);

  // Symmetric adjacency, county-to-county only (sea cells excluded).
  const adjacency = new Map<number, Set<number>>();
  for (let i = 0; i < countyCount; i++) {
    adjacency.set(i, new Set());
  }
  for (let i = 0; i < countyCount; i++) {
    for (const j of voronoi.neighbors(i)) {
      if (j < countyCount && j !== i) {
        adjacency.get(i)?.add(j);
        adjacency.get(j)?.add(i);
      }
    }
  }

  const counties: County[] = config.seeds.map((seed, i) => {
    const cell = voronoi.cellPolygon(i);
    if (!cell || cell.length < 4) {
      throw new Error(`Degenerate Voronoi cell for ${seed.name} — adjust its seed position.`);
    }
    // cellPolygon is closed (last point repeats the first); drop the repeat.
    const polygon: Point[] = cell
      .slice(0, -1)
      .map(([x, y]) => ({ x: Math.round(x), y: Math.round(y) }));
    const neighbors = [...(adjacency.get(i) ?? [])]
      .sort((a, b) => a - b)
      .map((j) => slug(config.seeds[j].name));
    return {
      id: slug(seed.name),
      name: seed.name,
      polygon,
      centroid: polygonCentroid(polygon),
      neighbors,
    };
  });

  return { id: config.id, name: config.name, width: config.width, height: config.height, counties };
}

function main(): void {
  const small = buildMap(SMALL);
  const realm = buildMap(REALM);

  const file = `// AUTO-GENERATED by scripts/generate-maps.ts — do not edit by hand.
// Regenerate with: pnpm --filter @lor/shared generate-maps
import type { GameMap } from './types';

export const SMALL_MAP: GameMap = ${JSON.stringify(small, null, 2)};

export const REALM_MAP: GameMap = ${JSON.stringify(realm, null, 2)};
`;

  const outPath = join(dirname(fileURLToPath(import.meta.url)), '../src/map/maps.generated.ts');
  writeFileSync(outPath, file, 'utf8');
  console.log(
    `[generate-maps] wrote ${outPath}\n` +
      `  small: ${small.counties.length} counties\n` +
      `  realm: ${realm.counties.length} counties`,
  );
}

main();
