import { Spring1 } from "@/shared/lib/springs";

/**
 * Shared state for every GL layer. A plain module object, NOT React state:
 * these values change every frame and must never trigger a render.
 *
 * Deliberately three.js-free so the gate components and headless features can
 * import it without pulling the engine into the main bundle.
 */

export type GlStore = {
  /** Pointer in normalised device coords, -1..1, y up. */
  pointerX: number;
  pointerY: number;
  /** Spring-smoothed pointer, so the field lags the cursor with some weight. */
  smoothX: number;
  smoothY: number;
  /** 0..1, ramps in on first pointer move and decays when idle. */
  pointerAmt: number;
  /** Page scroll progress, 0..1. */
  scroll: number;
  /** Lenis scroll velocity, normalised-ish. */
  velocity: number;
  /** Set once the liquid layer has drawn a frame. */
  liquidLive: boolean;
};

export const glStore: GlStore = {
  pointerX: 0,
  pointerY: 0,
  smoothX: 0,
  smoothY: 0,
  pointerAmt: 0,
  scroll: 0,
  velocity: 0,
  liquidLive: false,
};

const sx = new Spring1(2.0, 0.75);
const sy = new Spring1(2.0, 0.75);

let lastMove = 0;
let attached = 0;

const onPointerMove = (e: PointerEvent) => {
  glStore.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
  glStore.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
  sx.target = glStore.pointerX;
  sy.target = glStore.pointerY;
  lastMove = performance.now();
};

const onPointerLeave = () => {
  lastMove = 0;
};

/**
 * One passive listener for every GL layer. Reference-counted so the liquid
 * backdrop and the stage can each attach without fighting over it.
 */
export function attachPointer(): () => void {
  attached++;
  if (attached === 1) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }
  return () => {
    attached--;
    if (attached === 0) {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    }
  };
}

/** Advance the pointer springs and the idle ramp. Call once per frame. */
export function stepPointer(dt: number) {
  glStore.smoothX = sx.step(dt);
  glStore.smoothY = sy.step(dt);
  // Ramp in over ~400ms on first move; fade out after 2s of stillness.
  const idle = lastMove === 0 || performance.now() - lastMove > 2000;
  const target = idle ? 0 : 1;
  const rate = idle ? 1.1 : 2.5;
  glStore.pointerAmt += (target - glStore.pointerAmt) * Math.min(1, rate * dt);
}
