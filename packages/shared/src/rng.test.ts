import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

describe('createRng', () => {
  it('yields values in the half-open range [0, 1)', () => {
    const rng = createRng(12345);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('is deterministic: the same seed produces the same sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    const sequenceA = Array.from({ length: 32 }, () => a());
    const sequenceB = Array.from({ length: 32 }, () => b());
    expect(sequenceA).toEqual(sequenceB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const sequenceA = Array.from({ length: 32 }, () => a());
    const sequenceB = Array.from({ length: 32 }, () => b());
    expect(sequenceA).not.toEqual(sequenceB);
  });
});
