import type { Tier } from "../lib/capabilities";

/**
 * A tiny module-level store shared between non-React code (Lenis scroll
 * subscription, global pointer listener) and the R3F render loop.
 *
 * Per-frame values (scroll, pointer) are plain mutable fields read inside
 * `useFrame` — deliberately NOT React state, so updating them never triggers a
 * re-render. Discrete changes (tier, intro state) go through `subscribe`.
 */
export interface SceneState {
  tier: Tier;
  /** Absolute scroll offset in px (from Lenis, or window fallback). */
  scroll: number;
  /** Whole-page scroll progress, 0..1. */
  progress: number;
  /** Smoothed scroll velocity (px/frame-ish). */
  velocity: number;
  /** Pointer in normalized device coords, -1..1. */
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  /** Hero "first condense" finished — gates the one-time wordmark reveal. */
  introDone: boolean;
  /** Bumped (timestamp) to re-trigger the hero condense, e.g. back-to-top. */
  recondenseAt: number;
  /**
   * Intro gate lifecycle, written by IntroGate. "none" = gate skipped
   * (repeat visit / reduced motion). "unknown" until the gate mounts.
   */
  gatePhase: GatePhase;
  /** Intro loader progress 0..1 (per-frame mutable — drives the robot's bar walk). */
  introProgress: number;
}

export type GatePhase = "unknown" | "none" | "loading" | "ready" | "entering" | "done";

const state: SceneState = {
  tier: "high",
  scroll: 0,
  progress: 0,
  velocity: 0,
  pointerX: 0,
  pointerY: 0,
  pointerActive: false,
  introDone: false,
  recondenseAt: 0,
  gatePhase: "unknown",
  introProgress: 0,
};

type Listener = (s: Readonly<SceneState>) => void;
const listeners = new Set<Listener>();
function emit() {
  for (const fn of listeners) fn(state);
}

export const sceneStore = {
  get: (): Readonly<SceneState> => state,

  setScroll(scroll: number, progress: number, velocity: number) {
    state.scroll = scroll;
    state.progress = progress;
    state.velocity = velocity;
  },
  setPointer(x: number, y: number) {
    state.pointerX = x;
    state.pointerY = y;
  },
  setPointerActive(active: boolean) {
    state.pointerActive = active;
  },
  setTier(tier: Tier) {
    state.tier = tier;
    emit();
  },
  setIntroDone(done: boolean) {
    state.introDone = done;
    emit();
  },
  setGatePhase(phase: GatePhase) {
    if (state.gatePhase === phase) return;
    state.gatePhase = phase;
    emit();
  },
  setIntroProgress(p: number) {
    state.introProgress = p;
  },
  triggerRecondense() {
    state.recondenseAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    emit();
  },

  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
