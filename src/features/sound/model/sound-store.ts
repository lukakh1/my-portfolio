const KEY = "portfolio-sound-on";

type Listener = (on: boolean) => void;

let on = false;
const listeners = new Set<Listener>();

/** Tiny localStorage-backed toggle store shared by the toggle UI and SfxRoot. */
export const soundStore = {
  init() {
    try {
      on = localStorage.getItem(KEY) === "1";
    } catch {
      on = false;
    }
    return on;
  },
  get: () => on,
  set(next: boolean) {
    on = next;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // private mode etc. — session-only toggle is fine
    }
    listeners.forEach((l) => l(next));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
