import { describe, expect, it } from 'vitest';
import { seasonForTurn, yearForTurn } from './season';
import type { Season } from './types';

describe('seasonForTurn', () => {
  it('cycles spring → summer → autumn → winter from turn 0', () => {
    const seasons: Season[] = [];
    for (let turn = 0; turn <= 8; turn++) {
      seasons.push(seasonForTurn(turn));
    }
    expect(seasons).toEqual([
      'spring',
      'summer',
      'autumn',
      'winter',
      'spring',
      'summer',
      'autumn',
      'winter',
      'spring',
    ]);
  });

  it('handles negative and large turn numbers', () => {
    expect(seasonForTurn(-1)).toBe('winter');
    expect(seasonForTurn(-4)).toBe('spring');
    expect(seasonForTurn(4000)).toBe('spring');
    expect(seasonForTurn(4002)).toBe('autumn');
  });
});

describe('yearForTurn', () => {
  it('is 1-based with four turns per year', () => {
    expect(yearForTurn(0)).toBe(1);
    expect(yearForTurn(3)).toBe(1);
    expect(yearForTurn(4)).toBe(2);
    expect(yearForTurn(11)).toBe(3);
  });
});
