import { laneGeometry, railXForSide, type LaneSide } from "../lib/lane";
import type { RobotSection } from "./robot-store";

/**
 * Where the robot stands per section. Anchors are resolved against live DOM
 * rects at SETTLE time (never per frame) — except `live` anchors (sticky
 * cards, flip cards) which the director refreshes each tick while their
 * section is active.
 *
 * Feet coordinates are DOC-space px (they ride with the page as it scrolls),
 * or viewport-space when docked.
 */
export const BASE_SCALE_PX = 122;
/** Robot screen footprint: width ≈ height × this (squat, wide silhouette). */
export const ROBOT_W_RATIO = 0.66;
/** Below this viewport width every anchor falls back to the dock perch. */
const DOCK_BELOW_VW = 1080;

type RefCorner = "right-bottom" | "left-bottom" | "top-right" | "top-left";

export interface AnchorSpec {
  section: RobotSection;
  selector: string;
  /** Which gutter Robi rests in for this section — he leaps across between them. */
  side: LaneSide;
  ref: RefCorner;
  offset: { x: number; y: number };
  facing: -1 | 1;
  /** Re-resolve every director tick while active (sticky / animated targets). */
  live?: boolean;
  /** Selector the robot points at after greeting. */
  point?: string;
  /** Check free room on this side; shrink → dock when tight. */
  gutter?: "left" | "right";
}

/**
 * Side choreography — Robi zig-zags down the page (right → left → right …),
 * leaping across the centre between sections. He only ever RESTS in a gutter,
 * so the content is never covered; the cross-page leaps are the spectacle.
 */
export const ANCHORS: Record<RobotSection, AnchorSpec> = {
  hero: {
    section: "hero",
    selector: "#hero .hero-meta, #hero .hero-cta",
    side: "right",
    ref: "right-bottom",
    offset: { x: 0, y: 40 },
    facing: -1,
    point: "#hero .hero-cta",
  },
  stats: {
    section: "stats",
    selector: "#stats .stats-grid, .stats .stats-grid",
    side: "left",
    ref: "left-bottom",
    offset: { x: 0, y: 0 },
    facing: 1,
    point: ".stats-grid .num",
  },
  about: {
    section: "about",
    selector: "#about .about-card",
    side: "right",
    ref: "right-bottom",
    offset: { x: 0, y: 0 },
    facing: -1,
    live: true,
    point: "#about .about-card",
  },
  experience: {
    // The director sub-anchors to whichever .tl-card spans the viewport
    // center; this selector is the initial / fallback target.
    section: "experience",
    selector: "#experience .tl-item.current .tl-card, #experience .tl-card",
    side: "left",
    ref: "left-bottom",
    offset: { x: 0, y: 0 },
    facing: 1,
    live: true,
  },
  skills: {
    section: "skills",
    selector: "#skills .section-head h2",
    side: "right",
    ref: "right-bottom",
    offset: { x: 0, y: 60 },
    facing: -1,
    point: "#skills .skill-card",
  },
  projects: {
    section: "projects",
    selector: "#projects .section-head h2",
    side: "left",
    ref: "left-bottom",
    offset: { x: 0, y: 60 },
    facing: 1,
    point: "#projects .proj",
  },
  education: {
    section: "education",
    selector: "#education .section-head h2",
    side: "right",
    ref: "right-bottom",
    offset: { x: 0, y: 60 },
    facing: -1,
    point: "#education .scholarship",
  },
  contact: {
    section: "contact",
    selector: "#contact .contact-card",
    side: "left",
    ref: "left-bottom",
    offset: { x: 0, y: 0 },
    facing: 1,
    point: "#contact [data-copy]",
  },
  footer: {
    section: "footer",
    selector: "footer .foot-right",
    side: "right",
    ref: "right-bottom",
    offset: { x: 0, y: 0 },
    facing: -1,
  },
};

export interface ResolvedAnchor {
  x: number;
  y: number;
  space: "doc" | "viewport";
  facing: -1 | 1;
  scalePx: number;
  docked: boolean;
}

/** Bottom-right perch used whenever a real placement doesn't fit. */
export function dockAnchor(vw: number, vh: number): ResolvedAnchor {
  return {
    x: vw - 96,
    y: vh - 36,
    space: "viewport",
    facing: -1,
    scalePx: BASE_SCALE_PX * 0.8,
    docked: true,
  };
}

/**
 * Resolve a RAIL placement from a specific element: X is the gutter rail (so
 * the robot can never cross the content), Y tracks the element's vertical
 * middle (page-riding keeps it synced as you scroll). Used for the live
 * experience sub-anchor too. Falls back to the dock when the gutter is too thin.
 */
export function resolveElementAnchor(
  el: Element,
  offsetY: number,
  side: LaneSide,
  vw: number,
  vh: number,
): ResolvedAnchor {
  const lane = laneGeometry(vw);
  if (lane.collapsed) return dockAnchor(vw, vh);
  const r = el.getBoundingClientRect();
  const sy = window.scrollY;
  const refY = r.top + r.height / 2 + sy + offsetY;
  return {
    x: railXForSide(lane, side),
    y: refY,
    space: "doc",
    facing: side === "left" ? 1 : -1,
    scalePx: lane.scalePx,
    docked: false,
  };
}

export function resolveAnchor(spec: AnchorSpec, vw: number, vh: number): ResolvedAnchor {
  if (vw < DOCK_BELOW_VW) return dockAnchor(vw, vh);
  const el = document.querySelector(spec.selector);
  if (!el) return dockAnchor(vw, vh);
  return resolveElementAnchor(el, spec.offset.y, spec.side, vw, vh);
}

/** Ordered doc-space section tops (hysteresis boundaries live in the director). */
export interface SectionRange {
  id: RobotSection;
  top: number;
}

const SECTION_IDS: RobotSection[] = [
  "hero",
  "stats",
  "about",
  "experience",
  "skills",
  "projects",
  "education",
  "contact",
];

export function measureSections(): SectionRange[] {
  const sy = window.scrollY;
  const out: SectionRange[] = [];
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id);
    if (el) out.push({ id, top: el.getBoundingClientRect().top + sy });
  }
  const footer = document.querySelector("footer");
  if (footer) {
    out.push({ id: "footer", top: footer.getBoundingClientRect().top + sy - 120 });
  }
  out.sort((a, b) => a.top - b.top);
  return out;
}
