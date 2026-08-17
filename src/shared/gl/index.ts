/**
 * Barrel for the GL layer.
 *
 * IMPORTANT: types and the tier/quality helpers ONLY. Nothing here may import
 * three.js, or the gate components that use these helpers would drag the whole
 * engine into the main bundle and defeat the point of the dynamic import.
 */
export type { Tier } from "./lib/capabilities";
export {
  detectTier,
  getServerTier,
  getTier,
  isDataSaving,
  prefersReducedMotion,
  subscribeTier,
} from "./lib/capabilities";
export { QUALITY, type Quality } from "./lib/quality";
export { attachPointer, glStore, stepPointer } from "./model/gl-store";
