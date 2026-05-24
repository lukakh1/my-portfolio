import type { Tier } from "./capabilities";

/** Cap device-pixel-ratio so we never render a backdrop at full Retina (3x). */
export function dprFor(tier: Tier): [number, number] {
  return tier === "high" ? [1, 1.75] : [1, 1.25];
}

/**
 * Side length of the square GPGPU position texture. The particle count is the
 * square of this (256² ≈ 65k on desktop, 128² ≈ 16k on low-end).
 */
export function simSizeFor(tier: Tier): number {
  return tier === "high" ? 256 : 128;
}
