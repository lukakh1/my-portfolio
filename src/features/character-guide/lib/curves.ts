export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const clamp01 = (v: number) => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const smoothstep01 = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};

export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

export const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);

/** Shortest signed angle — keeps yaw from spinning the long way round. */
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export interface Pt {
  x: number;
  y: number;
}

/** Cubic Bézier point (2D, allocation-free via `out`). */
export function cubicBezier(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt, out: Pt): Pt {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  const a = uu * u;
  const b = 3 * uu * t;
  const c = 3 * u * tt;
  const d = tt * t;
  out.x = a * p0.x + b * p1.x + c * p2.x + d * p3.x;
  out.y = a * p0.y + b * p1.y + c * p2.y + d * p3.y;
  return out;
}

/** Pick a random element. */
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Random in [a, b). */
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
