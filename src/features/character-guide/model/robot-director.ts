import { sceneStore } from "@/shared/three";

import { pick } from "../lib/curves";
import { debugFlags } from "../lib/debug";
import {
  ANCHORS,
  measureSections,
  resolveAnchor,
  resolveElementAnchor,
  type SectionRange,
} from "./anchors";
import { QUIPS, SCRIPT, type RobotLine } from "./robot-script";
import {
  robotStore,
  type RobotEmote,
  type RobotSection,
  type TravelHint,
} from "./robot-store";

/**
 * The DOM-side brain. Decides WHERE the robot should be and WHAT it should
 * say (section tracking, settle debounce, anchor resolution, dialogue and
 * event scheduling) — the rig decides HOW it gets there and performs.
 *
 * Driven by a single external tick (the layer's rAF); holds no React state.
 * Module-level memory (greeted sections, quip budgets) deliberately survives
 * unmount/remount across the 700px eligibility boundary.
 */

const SETTLE_VEL = 5; // |lenis velocity| below this counts as calm
const SETTLE_CALM_MS = 150;
const SETTLE_CAP_MS = 500;
const HYSTERESIS_PX = 80;
const GREET_DELAY_MS = 350;
const FAST_SCROLL_VEL = 50;
const CLICK_EMOTES: RobotEmote[] = ["hop", "spin", "bow"];

/* ---- persistent (module) memory ---- */
const greeted = new Set<RobotSection>();
const retried = new Set<RobotSection>();
const pointed = new Set<RobotSection>();
const bonusIdx: Partial<Record<RobotSection, number>> = {};
let clickCount = 0;
let emoteIdx = 0;
let fsQuipCount = 0;

/* ---- per-run state ---- */
let running = false;
let startedAt = 0;
let sections: SectionRange[] = [];
let measureDirty = true;
let committed: RobotSection | null = null;
let candidate: RobotSection | null = null;
let candidateSince = 0;
let velCalmSince = 0;
let pendingGreet: { section: RobotSection; line: RobotLine; isGreet: boolean } | null = null;
let greetReadyAt = 0;
let greetActive: { section: RobotSection; isGreet: boolean } | null = null;
let greetDoneFor: RobotSection | null = null;
let pendingWave = false;
let fsHighSince = 0;
let fsCooldownUntil = 0;
let copyCooldownUntil = 0;
let hoverTimes: number[] = [];
let hoverQuipCooldownUntil = 0;
let lastRecondense = 0;
let cleanups: Array<() => void> = [];

const now = () => performance.now();

/* ------------------------------------------------------------------ */

function finalizeGreet() {
  if (!greetActive) return;
  const s = robotStore.get();
  if (s.currentLine) return; // still on screen
  const { section, isGreet } = greetActive;
  greetActive = null;
  if (!isGreet) return;
  if (s.speakingProgress >= 0.5) {
    greeted.add(section);
    greetDoneFor = section;
  } else if (retried.has(section)) {
    greeted.add(section); // interrupted twice — let it go
  } else {
    retried.add(section); // one retry on the next visit
  }
}

function allowGreet(section: RobotSection) {
  return !greeted.has(section);
}

function commitSection(
  section: RobotSection,
  opts: { entrance?: boolean; lineOverride?: RobotLine | null } = {},
) {
  finalizeGreet();
  robotStore.setLine(null);
  robotStore.setPointAt(Number.NaN, Number.NaN, 0);
  const prev = committed;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spec = ANCHORS[section];
  const resolved = resolveAnchor(spec, vw, vh);
  robotStore.setTarget(resolved.x, resolved.y, resolved.space, resolved.facing, resolved.scalePx);

  const s = robotStore.get();
  // Scroll direction shapes the travel: up = always jetpack; down = the rig
  // picks rope/slide per section. Same-section / entrance falls back to dash.
  let hint: TravelHint = "auto";
  if (opts.entrance) {
    hint = "dash";
  } else if (prev && prev !== section) {
    const prevIdx = sections.findIndex((x) => x.id === prev);
    const newIdx = sections.findIndex((x) => x.id === section);
    if (prevIdx >= 0 && newIdx >= 0) hint = newIdx > prevIdx ? "down" : "up";
  }
  if (hint === "auto") {
    const tvy = resolved.space === "doc" ? resolved.y - window.scrollY : resolved.y;
    const dx = resolved.x - s.screenX;
    const dy = tvy - s.screenY;
    if (Math.hypot(dx, dy) > 260 || Math.abs(dy) > 120) hint = "dash";
  }
  robotStore.commitTravel(hint);
  robotStore.setActiveSection(section);
  committed = section;

  const line =
    opts.lineOverride !== undefined
      ? opts.lineOverride
      : allowGreet(section)
        ? SCRIPT[section].greet
        : null;
  pendingGreet = line ? { section, line, isGreet: opts.lineOverride === undefined } : null;
  greetReadyAt = now() + GREET_DELAY_MS;
  if (opts.entrance || section === "footer") pendingWave = true;
}

function measure() {
  sections = measureSections();
  measureDirty = false;
  // Layout may have shifted the current anchor — refresh it in place.
  if (committed) {
    const resolved = resolveAnchor(ANCHORS[committed], window.innerWidth, window.innerHeight);
    robotStore.setTarget(resolved.x, resolved.y, resolved.space, resolved.facing, resolved.scalePx);
  }
  if (debugFlags().anchors) renderAnchorMarkers();
}

function clearGate() {
  robotStore.setGateCleared(true);
  robotStore.setVisible(true);
  measure();
  commitSection("hero", { entrance: true });
}

function gateCheck(t: number) {
  const introEl = document.querySelector(".intro");
  const introDone = sceneStore.get().introDone;
  if (debugFlags().gate || (introDone && !introEl)) {
    clearGate();
    return;
  }
  // Headless/preview fallback: ParticleField's document.hidden guard can keep
  // introDone false forever. If no overlay is blocking, enter after 4s anyway.
  if (!introEl && t - startedAt > 4000) clearGate();
}

/** Within #experience, stand beside whichever card spans the viewport center. */
function refreshExperienceSubAnchor(vw: number, vh: number) {
  const cards = document.querySelectorAll<HTMLElement>("#experience .tl-card");
  if (!cards.length) return;
  const centerY = vh / 2;
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  for (const card of cards) {
    const r = card.getBoundingClientRect();
    if (r.top <= centerY && r.bottom >= centerY) {
      best = card;
      bestDist = 0;
      break;
    }
    const d = Math.min(Math.abs(r.top - centerY), Math.abs(r.bottom - centerY));
    if (d < bestDist) {
      bestDist = d;
      best = card;
    }
  }
  if (!best) return;
  const spec = ANCHORS.experience;
  const resolved = resolveElementAnchor(
    best,
    spec.ref,
    spec.offset,
    spec.facing,
    spec.gutter,
    vw,
    vh,
  );
  robotStore.setTarget(resolved.x, resolved.y, resolved.space, resolved.facing, resolved.scalePx);
}

function refreshLiveAnchor(vw: number, vh: number) {
  if (!committed) return;
  const spec = ANCHORS[committed];
  if (!spec.live) return;
  if (committed === "experience") {
    refreshExperienceSubAnchor(vw, vh);
    return;
  }
  const resolved = resolveAnchor(spec, vw, vh);
  robotStore.setTarget(resolved.x, resolved.y, resolved.space, resolved.facing, resolved.scalePx);
}

function trackSections(t: number, vh: number) {
  if (!sections.length || !committed) return;
  const center = window.scrollY + vh / 2;
  let idx = sections.findIndex((s) => s.id === committed);
  if (idx < 0) idx = 0;
  while (idx + 1 < sections.length && center > sections[idx + 1].top + HYSTERESIS_PX) idx++;
  while (idx > 0 && center < sections[idx].top - HYSTERESIS_PX) idx--;
  // A short footer never reaches the viewport-center band. Hand over to the
  // footer (farewell) only once contact has had its moment — otherwise the
  // page-bottom position belongs to the contact section itself.
  const atBottom =
    window.scrollY + vh >= document.documentElement.scrollHeight - 8;
  if (atBottom && greeted.has("contact") && sections[idx].id === "contact") {
    idx = sections.length - 1;
  }
  const next = sections[idx].id;

  if (next !== candidate) {
    candidate = next;
    candidateSince = t;
  }
  const vel = Math.abs(sceneStore.get().velocity);
  if (vel >= SETTLE_VEL) velCalmSince = t;

  if (
    candidate !== committed &&
    (t - velCalmSince > SETTLE_CALM_MS || t - candidateSince > SETTLE_CAP_MS)
  ) {
    commitSection(candidate);
  }
}

function issueDialogue(t: number) {
  const s = robotStore.get();

  // Pending greet → speak once landed and settled — or right away while
  // rappelling in ("explains things on the way down the rope").
  const onRope = s.mode === "rope";
  if (
    pendingGreet &&
    !s.currentLine &&
    (onRope || (t >= greetReadyAt && s.arrived && s.mode === "ground"))
  ) {
    robotStore.setLine(pendingGreet.line);
    greetActive = { section: pendingGreet.section, isGreet: pendingGreet.isGreet };
    pendingGreet = null;
    if (pendingWave) {
      robotStore.requestEmote("wave");
      pendingWave = false;
    }
    return;
  }

  // Point at the section's highlight once the greet finished.
  if (
    committed &&
    greetDoneFor === committed &&
    !pointed.has(committed) &&
    !s.currentLine &&
    s.arrived &&
    s.mode === "ground"
  ) {
    const sel = ANCHORS[committed].point;
    if (sel) {
      const el = document.querySelector(sel);
      if (el) {
        const r = el.getBoundingClientRect();
        robotStore.setPointAt(
          r.left + r.width / 2,
          r.top + r.height / 2 + window.scrollY,
          t + 1800,
        );
      }
    }
    pointed.add(committed);
  }

  // Fast-scroll quip (pose brace is rig-side and automatic).
  const vel = Math.abs(sceneStore.get().velocity);
  if (vel > FAST_SCROLL_VEL) {
    if (fsHighSince === 0) fsHighSince = t;
    if (
      t - fsHighSince > SETTLE_CALM_MS &&
      fsQuipCount < 2 &&
      t > fsCooldownUntil &&
      !s.currentLine &&
      s.mode === "ground"
    ) {
      robotStore.setLine(pick(QUIPS.fastScroll));
      fsQuipCount++;
      fsCooldownUntil = t + 30_000;
    }
  } else {
    fsHighSince = 0;
  }
}

/* ---- debug: anchor markers ---- */
let markerHost: HTMLDivElement | null = null;
function renderAnchorMarkers() {
  markerHost?.remove();
  markerHost = document.createElement("div");
  markerHost.style.cssText = "position:absolute;top:0;left:0;z-index:9000;pointer-events:none;";
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (const spec of Object.values(ANCHORS)) {
    const a = resolveAnchor(spec, vw, vh);
    if (a.space !== "doc") continue;
    const m = document.createElement("div");
    m.style.cssText = `position:absolute;left:${a.x - 5}px;top:${a.y - 5}px;width:10px;height:10px;border-radius:50%;background:magenta;opacity:.8;`;
    m.title = spec.section;
    markerHost.appendChild(m);
  }
  document.body.appendChild(markerHost);
}

/* ------------------------------------------------------------------ */

export const director = {
  start(): () => void {
    if (running) return () => {};
    running = true;
    startedAt = now();
    velCalmSince = startedAt;
    measureDirty = true;

    const onResize = debounce(() => {
      measureDirty = true;
    }, 150);
    window.addEventListener("resize", onResize);
    cleanups.push(() => window.removeEventListener("resize", onResize));

    const main = document.querySelector("main");
    if (main && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(
        debounce(() => {
          measureDirty = true;
        }, 200),
      );
      ro.observe(main);
      cleanups.push(() => ro.disconnect());
    }
    document.fonts?.ready.then(() => {
      measureDirty = true;
    });

    // Experience modal (and any scroll-locking overlay): watch <html> attrs.
    const html = document.documentElement;
    const mo = new MutationObserver(() => {
      const open =
        html.classList.contains("lenis-stopped") || html.style.overflow === "hidden";
      if (open !== robotStore.get().modalOpen) {
        robotStore.setModalOpen(open);
        if (open) robotStore.setLine(null);
      }
    });
    mo.observe(html, { attributes: true, attributeFilter: ["class", "style"] });
    cleanups.push(() => mo.disconnect());

    // Copy-email reaction (ClipboardRoot doesn't stopPropagation — safe).
    const onCopyClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement | null)?.closest?.("[data-copy]")) return;
      const t = now();
      if (t < copyCooldownUntil || !robotStore.get().gateCleared) return;
      copyCooldownUntil = t + 10_000;
      finalizeGreet();
      robotStore.setLine(pick(QUIPS.copyEmail));
      robotStore.requestEmote("spin");
    };
    document.addEventListener("click", onCopyClick);
    cleanups.push(() => document.removeEventListener("click", onCopyClick));

    // Back-to-top recondense → dash home with a quip.
    lastRecondense = sceneStore.get().recondenseAt;
    const unsub = sceneStore.subscribe((s) => {
      if (s.recondenseAt !== lastRecondense) {
        lastRecondense = s.recondenseAt;
        if (robotStore.get().gateCleared) {
          commitSection("hero", { lineOverride: pick(QUIPS.backToTop) });
        }
      }
    });
    cleanups.push(unsub);

    // Remount mid-session (resize across 700px): resume without re-touring.
    if (robotStore.get().gateCleared) {
      committed = robotStore.get().activeSection;
      measureDirty = true;
    }

    return () => director.stop();
  },

  stop() {
    running = false;
    cleanups.forEach((fn) => fn());
    cleanups = [];
    markerHost?.remove();
    markerHost = null;
  },

  /** Called from the layer's rAF. */
  tick() {
    if (!running) return;
    const t = now();
    if (!robotStore.get().gateCleared) {
      gateCheck(t);
      return;
    }
    if (robotStore.get().modalOpen) return;
    if (measureDirty) measure();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    finalizeGreet();
    trackSections(t, vh);
    refreshLiveAnchor(vw, vh);
    issueDialogue(t);
  },

  handleHoverChange(entered: boolean) {
    robotStore.setHovered(entered);
    if (!entered) return;
    const t = now();
    hoverTimes = hoverTimes.filter((h) => t - h < 2000);
    hoverTimes.push(t);
    if (hoverTimes.length >= 3 && t > hoverQuipCooldownUntil) {
      hoverTimes = [];
      hoverQuipCooldownUntil = t + 8000;
      if (!robotStore.get().currentLine) {
        robotStore.setLine(pick(QUIPS.hoverPoke));
        robotStore.requestEmote("poke");
      }
    }
  },

  handleClick() {
    const s = robotStore.get();
    if (!s.gateCleared) return;
    if (s.currentLine && s.speakingProgress < 1) {
      robotStore.fastForward();
      return;
    }
    const section = s.activeSection ?? "hero";
    const list = SCRIPT[section].bonus;
    if (!list.length) return;
    finalizeGreet();
    const i = bonusIdx[section] ?? 0;
    robotStore.setLine(list[i % list.length]);
    bonusIdx[section] = i + 1;
    clickCount++;
    if (clickCount % 2 === 0) {
      robotStore.requestEmote(CLICK_EMOTES[emoteIdx++ % CLICK_EMOTES.length]);
    }
  },
};

function debounce(fn: () => void, ms: number) {
  let h: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (h) clearTimeout(h);
    h = setTimeout(fn, ms);
  };
}
