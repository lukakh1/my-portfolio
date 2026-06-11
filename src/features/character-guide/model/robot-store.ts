/**
 * The seam between the three actors of the robot guide, mirroring the
 * scene-store pattern: plain mutable fields for per-frame data (read inside
 * useFrame / the DOM rAF, never emitted), `emit()` only for discrete changes.
 *
 * Writer discipline:
 *  - director  → targets / facing / scale / travel / pointAt / section / line
 *                / visible / gateCleared / modalOpen
 *  - rig       → screen positions / bounds / arrived / mode
 *  - speech    → speaking + speakingProgress
 *  - hit-area  → hovered / emote / fastForward (via director handlers)
 */
export type RobotSection =
  | "hero"
  | "stats"
  | "about"
  | "experience"
  | "skills"
  | "projects"
  | "education"
  | "contact"
  | "footer";

export type RobotMode = "hidden" | "enter" | "ground" | "dash" | "rope" | "slide";

/** Travel direction/style request: "up" must jetpack, "down" may rope/slide. */
export type TravelHint = "auto" | "dash" | "up" | "down";

export type RobotEmote = "wave" | "hop" | "spin" | "bow" | "poke";

export interface RobotLineRef {
  id: string;
  text: string;
}

export interface RobotState {
  /* ---- per-frame mutable (never emitted) ---- */
  /** Desired feet position in px. Space: "doc" scrolls with the page, "viewport" is fixed. */
  targetX: number;
  targetY: number;
  targetSpace: "doc" | "viewport";
  facing: -1 | 1;
  /** Desired robot height in px (anchors may shrink it). */
  scalePx: number;
  /** Bumped on every committed travel; the hint shapes HOW the rig travels. */
  travelSeq: number;
  travelHint: TravelHint;
  /** Gesture target (doc px); active while now < pointUntil. */
  pointAtX: number;
  pointAtY: number;
  pointUntil: number;
  /** Rig → DOM: actual feet / head-top positions + footprint, viewport px. */
  screenX: number;
  screenY: number;
  headX: number;
  headY: number;
  boundsW: number;
  boundsH: number;
  /** Rig → director: near target and settled. */
  arrived: boolean;
  /** Speech → rig: typewriter state (drives the mouth). */
  speaking: boolean;
  speakingProgress: number;

  /* ---- discrete (emitted) ---- */
  version: number;
  visible: boolean;
  gateCleared: boolean;
  modalOpen: boolean;
  mode: RobotMode;
  activeSection: RobotSection | null;
  currentLine: RobotLineRef | null;
  hovered: boolean;
  emote: { kind: RobotEmote; at: number } | null;
  /** Timestamp bump — speech finishes the current line instantly. */
  fastForwardAt: number;
}

const state: RobotState = {
  targetX: 0,
  targetY: 0,
  targetSpace: "viewport",
  facing: -1,
  scalePx: 140,
  travelSeq: 0,
  travelHint: "auto",
  pointAtX: Number.NaN,
  pointAtY: Number.NaN,
  pointUntil: 0,
  screenX: 0,
  screenY: 0,
  headX: 0,
  headY: 0,
  boundsW: 0,
  boundsH: 0,
  arrived: false,
  speaking: false,
  speakingProgress: 1,

  version: 0,
  visible: false,
  gateCleared: false,
  modalOpen: false,
  mode: "hidden",
  activeSection: null,
  currentLine: null,
  hovered: false,
  emote: null,
  fastForwardAt: 0,
};

type Listener = (s: Readonly<RobotState>) => void;
const listeners = new Set<Listener>();
function emit() {
  state.version++;
  for (const fn of listeners) fn(state);
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export const robotStore = {
  get: (): Readonly<RobotState> => state,

  /* per-frame (no emit) */
  setTarget(
    x: number,
    y: number,
    space: "doc" | "viewport",
    facing: -1 | 1,
    scalePx: number,
  ) {
    state.targetX = x;
    state.targetY = y;
    state.targetSpace = space;
    state.facing = facing;
    state.scalePx = scalePx;
  },
  commitTravel(hint: TravelHint) {
    state.travelHint = hint;
    state.travelSeq++;
  },
  setPointAt(x: number, y: number, until: number) {
    state.pointAtX = x;
    state.pointAtY = y;
    state.pointUntil = until;
  },
  setScreen(x: number, y: number, headX: number, headY: number, w: number, h: number) {
    state.screenX = x;
    state.screenY = y;
    state.headX = headX;
    state.headY = headY;
    state.boundsW = w;
    state.boundsH = h;
  },
  setArrived(a: boolean) {
    state.arrived = a;
  },
  setSpeaking(speaking: boolean, progress: number) {
    state.speaking = speaking;
    state.speakingProgress = progress;
  },

  /* discrete (emit) */
  setVisible(v: boolean) {
    if (state.visible === v) return;
    state.visible = v;
    emit();
  },
  setGateCleared(v: boolean) {
    if (state.gateCleared === v) return;
    state.gateCleared = v;
    emit();
  },
  setModalOpen(v: boolean) {
    if (state.modalOpen === v) return;
    state.modalOpen = v;
    emit();
  },
  setMode(m: RobotMode) {
    if (state.mode === m) return;
    state.mode = m;
    emit();
  },
  setActiveSection(s: RobotSection | null) {
    if (state.activeSection === s) return;
    state.activeSection = s;
    emit();
  },
  setLine(line: RobotLineRef | null) {
    if (state.currentLine === line) return;
    state.currentLine = line;
    emit();
  },
  setHovered(h: boolean) {
    if (state.hovered === h) return;
    state.hovered = h;
    emit();
  },
  requestEmote(kind: RobotEmote) {
    state.emote = { kind, at: now() };
    emit();
  },
  fastForward() {
    state.fastForwardAt = now();
    emit();
  },

  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
