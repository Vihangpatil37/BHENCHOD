import { normalize, clamp } from './normalize';

describe('normalize', () => {
  it('correctly normalizes a value between min and max', () => {
    expect(normalize(50, 0, 100)).toBe(50);
    expect(normalize(75, 50, 100)).toBe(50);
    expect(normalize(20, 0, 10)).toBe(100);
    expect(normalize(-5, 0, 10)).toBe(0);
  });

  it('handles division by zero (min === max)', () => {
    expect(normalize(50, 50, 50)).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps values below the minimum', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it('clamps values above the maximum', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('returns value if within bounds', () => {
    expect(clamp(45, 0, 100)).toBe(45);
  });
});
