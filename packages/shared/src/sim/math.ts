// Tiny pure numeric helpers shared across the sim. Deterministic by construction.

/** Constrains `value` to the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation: t = 0 → min, t = 1 → max. */
export function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}
