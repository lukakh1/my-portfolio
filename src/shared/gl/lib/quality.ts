import type { Tier } from "./capabilities";

/**
 * The single table behind every quality decision, so "what does a phone get?"
 * has exactly one answer.
 *
 * Note `liquidDpr` is 1 at every tier. The backdrop is a soft, out-of-focus
 * field — rendering it at Retina density buys nothing visible and is the
 * single most expensive thing the page could do. At 1440x900 the difference
 * is 1.43 Mpx of raymarcher versus 0.47 Mpx.
 */
export type Quality = {
  liquidDpr: number;
  /** Backing-store scale for the backdrop; upscaled by the compositor. */
  liquidScale: number;
  /** Raymarch step budget. */
  steps: number;
  /** Metaball count. */
  balls: number;
  /** smooth-min blend radius; larger reads gooier and hides low step counts. */
  k: number;
};

export const QUALITY: Record<Tier, Quality> = {
  off: {
    liquidDpr: 1,
    liquidScale: 0,
    steps: 0,
    balls: 0,
    k: 0,
  },
  phone: {
    liquidDpr: 1,
    liquidScale: 0.4,
    steps: 12,
    balls: 4,
    k: 0.7,
  },
  low: {
    liquidDpr: 1,
    liquidScale: 0.5,
    steps: 16,
    balls: 5,
    k: 0.78,
  },
  // A larger blend radius reads gooier — blobs stretch into each other
  // instead of overlapping like circles — and it conveniently hides the low
  // step count, since a smoother field needs fewer marches to resolve.
  high: {
    liquidDpr: 1,
    liquidScale: 0.6,
    steps: 24,
    balls: 7,
    k: 0.72,
  },
};
