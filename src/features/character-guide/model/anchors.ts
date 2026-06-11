import { clamp } from "../lib/curves";
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

export const ANCHORS: Record<RobotSection, AnchorSpec> = {
  hero: {
    // Stands on the LEFT, in the empty band BELOW the hero copy (a 122px
    // robot needs ~130px of clearance under the meta line or he covers the
    // CTA). Faces the content. This is also where the intro fly-in lands.
    section: "hero",
    selector: "#hero .hero-meta, #hero .hero-cta",
    ref: "left-bottom",
    offset: { x: 36, y: 138 },
    facing: 1,
    point: "#hero .hero-cta",
  },
  stats: {
    // BESIDE the numbers, not on them — right gutter of the grid.
    section: "stats",
    selector: "#stats .stats-grid, .stats .stats-grid",
    ref: "right-bottom",
    offset: { x: 64, y: -6 },
    facing: -1,
    gutter: "right",
    point: ".stats-grid .num",
  },
  about: {
    section: "about",
    selector: "#about .about-card",
    ref: "left-bottom",
    offset: { x: -56, y: -36 },
    facing: 1,
    live: true,
    gutter: "left",
    point: "#about .about-card",
  },
  experience: {
    // The director sub-anchors to whichever .tl-card spans the viewport
    // center; this selector is the initial / fallback target.
    section: "experience",
    selector: "#experience .tl-item.current .tl-card, #experience .tl-card",
    ref: "right-bottom",
    offset: { x: 70, y: 0 },
    facing: -1,
    live: true,
    gutter: "right",
  },
  skills: {
    section: "skills",
    selector: "#skills .section-head h2",
    ref: "right-bottom",
    offset: { x: 96, y: 6 },
    facing: -1,
    point: "#skills .skill-card",
  },
  projects: {
    section: "projects",
    selector: "#projects .section-head h2",
    ref: "right-bottom",
    offset: { x: 96, y: 6 },
    facing: -1,
    point: "#projects .proj",
  },
  education: {
    section: "education",
    selector: "#education .section-head h2",
    ref: "right-bottom",
    offset: { x: 96, y: 6 },
    facing: -1,
    point: "#education .scholarship",
  },
  contact: {
    // Right gutter beside the card — he was standing ON the card before.
    section: "contact",
    selector: "#contact .contact-card",
    ref: "right-bottom",
    offset: { x: 62, y: -10 },
    facing: -1,
    gutter: "right",
    point: "#contact [data-copy]",
  },
  footer: {
    section: "footer",
    selector: "footer .foot-right",
    ref: "left-bottom",
    offset: { x: -64, y: 0 },
    facing: 1,
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

/** Resolve an anchor against a specific element (also used for sub-anchoring). */
export function resolveElementAnchor(
  el: Element,
  ref: RefCorner,
  offset: { x: number; y: number },
  facing: -1 | 1,
  gutter: "left" | "right" | undefined,
  vw: number,
  vh: number,
): ResolvedAnchor {
  const r = el.getBoundingClientRect();
  const sy = window.scrollY;

  let scalePx = BASE_SCALE_PX;
  if (gutter) {
    const room = gutter === "right" ? vw - r.right : r.left;
    if (room < 90) return dockAnchor(vw, vh);
    if (room < 124) scalePx = BASE_SCALE_PX * 0.75;
  }

  const refX = ref === "right-bottom" || ref === "top-right" ? r.right : r.left;
  const refY = ref === "top-right" || ref === "top-left" ? r.top : r.bottom;

  const halfW = (scalePx * ROBOT_W_RATIO) / 2;
  const x = clamp(refX + offset.x, 12 + halfW, vw - 12 - halfW);
  return { x, y: refY + sy + offset.y, space: "doc", facing, scalePx, docked: false };
}

export function resolveAnchor(
  spec: AnchorSpec,
  vw: number,
  vh: number,
): ResolvedAnchor {
  if (vw < DOCK_BELOW_VW) return dockAnchor(vw, vh);
  const el = document.querySelector(spec.selector);
  if (!el) return dockAnchor(vw, vh);
  return resolveElementAnchor(el, spec.ref, spec.offset, spec.facing, spec.gutter, vw, vh);
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
