import { clamp } from "./curves";

/**
 * The robot's habitat: the two empty page gutters either side of the centered
 * content column (`.container`, max-width `--container`). Robi RESTS in a
 * gutter (left or right, choreographed per section) and LEAPS across the page
 * between them — so he roams freely yet never sits on top of the content.
 * Pure viewport-px geometry — the single source of truth for "where is safe."
 */

/** Robot footprint: half-width ≈ height × this (generous, keeps arms clear). */
const HALF_W_RATIO = 0.42;
/** Below this gutter width the rail can't hold the robot → caller docks instead. */
export const RAIL_GUTTER_MIN = 92;
/** Below this, the robot rides the gutter but shrinks to fit. */
export const RAIL_GUTTER_COMFORT = 124;
const BASE_SCALE_PX = 122;

export type LaneSide = "left" | "right";

export interface Lane {
  vw: number;
  /** px edges of the centered content column. */
  columnLeft: number;
  columnRight: number;
  /** Outer gutter width (each side). */
  gutter: number;
  /** Feet-center px for resting in each gutter. */
  leftRailX: number;
  rightRailX: number;
  halfW: number;
  /** Suggested robot height (shrinks when the gutters are tight). */
  scalePx: number;
  /** Gutters too thin → dock in the corner instead. */
  collapsed: boolean;
}

let containerCache = 0;
function containerWidthPx(): number {
  if (containerCache) return containerCache;
  if (typeof document === "undefined") return 1180;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--container");
  const n = parseFloat(raw);
  containerCache = Number.isFinite(n) && n > 0 ? n : 1180;
  return containerCache;
}

/** Resolve both gutter rails for the current viewport width. */
export function laneGeometry(vw: number): Lane {
  const colW = Math.min(containerWidthPx(), vw);
  const columnLeft = (vw - colW) / 2;
  const columnRight = columnLeft + colW;
  const gutter = (vw - colW) / 2;

  const scalePx = gutter < RAIL_GUTTER_COMFORT ? BASE_SCALE_PX * 0.78 : BASE_SCALE_PX;
  const halfW = scalePx * HALF_W_RATIO;
  const collapsed = gutter < RAIL_GUTTER_MIN;

  const rightRailX = clamp(columnRight + gutter / 2, columnRight + halfW + 6, vw - halfW - 6);
  const leftRailX = clamp(columnLeft - gutter / 2, halfW + 6, columnLeft - halfW - 6);

  return { vw, columnLeft, columnRight, gutter, leftRailX, rightRailX, halfW, scalePx, collapsed };
}

export function railXForSide(lane: Lane, side: LaneSide): number {
  return side === "left" ? lane.leftRailX : lane.rightRailX;
}

/**
 * Snap a feet-center px OUT of the content column to the NEARER gutter (and
 * inside the viewport). Used for the resting/landing states so the robot can
 * settle on either side but never on the content. Travel (jet-dash) is exempt —
 * leaping over the content is the spectacle.
 */
export function clampOutOfContent(xPx: number, lane: Lane): number {
  let x = clamp(xPx, lane.halfW + 6, lane.vw - lane.halfW - 6);
  const loBound = lane.columnLeft - lane.halfW - 6; // furthest-right a LEFT rest may sit
  const hiBound = lane.columnRight + lane.halfW + 6; // furthest-left a RIGHT rest may sit
  if (x > loBound && x < hiBound) {
    const mid = (loBound + hiBound) / 2;
    x = x < mid ? loBound : hiBound;
  }
  return x;
}
