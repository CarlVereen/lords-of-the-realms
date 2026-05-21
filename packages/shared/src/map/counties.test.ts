import { describe, expect, it } from 'vitest';
import { COUNTIES, countyById } from './counties';

describe('county data', () => {
  it('has eight counties with unique ids', () => {
    const ids = COUNTIES.map((county) => county.id);
    expect(ids).toHaveLength(8);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every neighbor id refers to a real county', () => {
    for (const county of COUNTIES) {
      for (const neighborId of county.neighbors) {
        expect(countyById[neighborId]).toBeDefined();
      }
    }
  });

  it('adjacency is symmetric', () => {
    for (const county of COUNTIES) {
      for (const neighborId of county.neighbors) {
        expect(countyById[neighborId].neighbors).toContain(county.id);
      }
    }
  });

  it('no county lists itself as a neighbor', () => {
    for (const county of COUNTIES) {
      expect(county.neighbors).not.toContain(county.id);
    }
  });

  it('every polygon is a closed shape with at least 3 vertices', () => {
    for (const county of COUNTIES) {
      expect(county.polygon.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('countyById covers every county', () => {
    expect(Object.keys(countyById)).toHaveLength(COUNTIES.length);
    for (const county of COUNTIES) {
      expect(countyById[county.id]).toBe(county);
    }
  });
});
