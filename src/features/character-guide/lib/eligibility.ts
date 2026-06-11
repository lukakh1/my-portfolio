/**
 * "Does a hoverable desktop mascot make sense here?" — deliberately separate
 * from the GPU `tier` (capabilities.ts answers "how much WebGL can we
 * afford"; this answers interaction modality). Tablets (hover: none) pass
 * tier "low" but fail here, which is exactly the desired split.
 */
const QUERY = "(min-width: 700px) and (hover: hover) and (pointer: fine)";

let mql: MediaQueryList | null = null;

function list(): MediaQueryList | null {
  if (typeof window === "undefined") return null;
  if (!mql) mql = window.matchMedia(QUERY);
  return mql;
}

export function getEligibility(): boolean {
  return list()?.matches ?? false;
}

/** Live gate — resizing across 700px mounts/unmounts the whole feature. */
export function subscribeEligibility(cb: () => void): () => void {
  const l = list();
  if (!l) return () => {};
  l.addEventListener("change", cb);
  return () => l.removeEventListener("change", cb);
}
