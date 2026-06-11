/**
 * Tuning harness — there are no GUI sliders in this project, so debug states
 * are toggled via `?robi=` URL params (comma-separated):
 *
 *   ?robi=hud      live HUD (mode, speed, gait phase, lenis velocity min/max)
 *   ?robi=anchors  magenta markers at every section anchor
 *   ?robi=walk     robot endlessly laps between two near targets (gait tuning)
 *   ?robi=gate     skip the intro gate wait entirely
 */
export interface DebugFlags {
  hud: boolean;
  anchors: boolean;
  walk: boolean;
  gate: boolean;
}

let cached: DebugFlags | null = null;

export function debugFlags(): DebugFlags {
  if (cached) return cached;
  let raw = "";
  if (typeof window !== "undefined") {
    raw = new URLSearchParams(window.location.search).get("robi") ?? "";
  }
  const parts = new Set(raw.split(",").map((s) => s.trim()));
  cached = {
    hud: parts.has("hud"),
    anchors: parts.has("anchors"),
    walk: parts.has("walk"),
    gate: parts.has("gate"),
  };
  return cached;
}
