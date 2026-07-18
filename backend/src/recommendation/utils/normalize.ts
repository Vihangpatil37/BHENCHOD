// utils/normalize.ts
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  const result = ((value - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, result));
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}
