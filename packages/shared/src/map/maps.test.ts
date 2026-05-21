import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import type { GameMap } from './types';

const maps: GameMap[] = Object.values(MAPS);

describe.each(maps)('map: $name', (map) => {
  const ids = new Set(map.counties.map((county) => county.id));
  const byId = new Map(map.counties.map((county) => [county.id, county]));

  it('has counties', () => {
    expect(map.counties.length).toBeGreaterThan(0);
  });

  it('has unique county ids', () => {
    expect(ids.size).toBe(map.counties.length);
  });

  it('every neighbor id refers to a county in the same map', () => {
    for (const county of map.counties) {
      for (const neighborId of county.neighbors) {
        expect(ids.has(neighborId)).toBe(true);
      }
    }
  });

  it('adjacency is symmetric', () => {
    for (const county of map.counties) {
      for (const neighborId of county.neighbors) {
        expect(byId.get(neighborId)?.neighbors).toContain(county.id);
      }
    }
  });

  it('no county is its own neighbor', () => {
    for (const county of map.counties) {
      expect(county.neighbors).not.toContain(county.id);
    }
  });

  it('no county is isolated', () => {
    for (const county of map.counties) {
      expect(county.neighbors.length).toBeGreaterThan(0);
    }
  });

  it('every polygon is a closed shape with at least 3 vertices', () => {
    for (const county of map.counties) {
      expect(county.polygon.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every county lies within the map bounds', () => {
    for (const county of map.counties) {
      for (const point of county.polygon) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(map.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(map.height);
      }
    }
  });
});
