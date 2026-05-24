import type Lenis from "lenis";

// Shared handle to the live Lenis instance so other features (e.g. a modal that
// needs to lock background scroll) can stop/start it without prop-drilling.
let current: Lenis | null = null;

export const lenisInstance = {
  get: () => current,
  set: (l: Lenis | null) => {
    current = l;
  },
};
