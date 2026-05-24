export type Tier = "off" | "low" | "high";

/**
 * Decide how much WebGL we can afford on this device.
 * - "off"  → render no canvas at all (reduced-motion, no WebGL2, or phone) → CSS `.bg-fx` fallback shows.
 * - "low"  → tablets / low-end: fewer particles, no post-processing, tighter DPR.
 * - "high" → desktop: full effect.
 *
 * Runs on the client only (guards `window`); SSR resolves to "off".
 */
export function detectTier(): Tier {
  if (typeof window === "undefined") return "off";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "off";
  }

  // Require a real WebGL2 context — bail to the static backdrop otherwise.
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) return "off";
  } catch {
    return "off";
  }

  const touchOnly = window.matchMedia("(hover: none)").matches;
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;

  // Phones: native momentum + battery beat a particle sim → static backdrop.
  if (touchOnly && minSide < 700) return "off";

  // Tablets and weaker machines: keep it, but calmer.
  if (touchOnly || memory <= 4 || cores <= 4) return "low";

  return "high";
}

let cachedTier: Tier | null = null;

/** Detect once and reuse — a stable snapshot for `useSyncExternalStore`. */
export function getTier(): Tier {
  if (cachedTier === null) cachedTier = detectTier();
  return cachedTier;
}
