/**
 * How much WebGL this device can afford.
 *
 * Ported from the pre-redesign `shared/three/lib/capabilities.ts` (commit
 * 30298cb) with three deliberate changes:
 *
 *  1. A fourth "phone" tier. The original returned "off" for every handset,
 *     which contradicts the current budget — phones get the cheap raymarched
 *     backdrop (~3 KB, no three.js) even though they never load the stage.
 *  2. The probe context is released. The original called getContext("webgl2")
 *     and dropped the reference, holding a real context slot for the life of
 *     the page and paying context creation twice on the mount path.
 *  3. A Save-Data / slow-connection veto.
 */

export type Tier = "off" | "phone" | "low" | "high";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

/** True when the user has asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True on metered/slow connections, where a canvas is not worth the bytes. */
export function isDataSaving(): boolean {
  const c = (navigator as NavigatorWithHints).connection;
  if (!c) return false;
  return c.saveData === true || c.effectiveType === "2g" || c.effectiveType === "slow-2g";
}

function hasWebgl2(): boolean {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) return false;
    // Hand the slot straight back — this is a capability question, not a
    // renderer. Without this the page holds a context it never draws with.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectTier(): Tier {
  if (typeof window === "undefined") return "off";
  if (prefersReducedMotion()) return "off";
  if (!hasWebgl2()) return "off";

  const touchOnly = window.matchMedia("(hover: none)").matches;
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  const nav = navigator as NavigatorWithHints;
  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;

  // Slow or metered: the backdrop only, at its cheapest preset.
  if (isDataSaving()) return "phone";

  if (touchOnly && minSide < 700) return "phone";
  if (touchOnly || memory <= 4 || cores <= 4) return "low";
  return "high";
}

let cached: Tier | null = null;

/** Detect once; a stable snapshot suitable for useSyncExternalStore. */
export function getTier(): Tier {
  if (cached === null) cached = detectTier();
  return cached;
}

/** Server snapshot — never render a canvas during SSR. */
export const getServerTier = (): Tier => "off";

/**
 * Re-evaluate when the motion preference changes, so toggling "reduce motion"
 * in the OS actually tears the canvases down instead of merely hiding them.
 */
export function subscribeTier(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    cached = null;
    onChange();
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
