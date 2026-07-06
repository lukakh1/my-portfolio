/**
 * Single source of truth for every animation feature's bail-out decisions.
 * All physics/scroll features must consult these instead of rolling their
 * own media queries, so the whole site degrades consistently.
 */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isTouchLike = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

export const isSmallScreen = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

/** Full playful experience: fine pointer, big screen, motion allowed. */
export const fullMotionOk = () =>
  !prefersReducedMotion() && !isTouchLike() && !isSmallScreen();
