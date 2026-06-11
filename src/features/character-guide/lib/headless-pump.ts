/**
 * DEV-ONLY headless-preview shim (side-effect module).
 *
 * Headless preview tooling reports `document.hidden === true`, which freezes
 * every rAF loop on the page (R3F, Lenis, the robot director) and the CSS
 * animation timeline — nothing ever paints or animates, so the site can't be
 * verified there. With `?robi=pump` in development this swaps rAF for a
 * setTimeout pump, lies about `document.hidden` (ParticleField guards on it),
 * and force-finishes `.reveal` transitions.
 *
 * Imported for side effects by CharacterGuide.client.tsx — the whole block is
 * dead-code-eliminated in production builds.
 */
import { sceneStore } from "@/shared/three";

import { robotStore } from "../model/robot-store";

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  try {
    // dev hooks for eval-based verification tooling
    (window as unknown as { __robotStore: typeof robotStore }).__robotStore = robotStore;
    (window as unknown as { __sceneStore: typeof sceneStore }).__sceneStore = sceneStore;
    // surface uncaught errors to eval-based tooling (preview console only
    // captures console.* calls, not uncaught exceptions)
    const errs: string[] = [];
    (window as unknown as { __robiErrs: string[] }).__robiErrs = errs;
    window.addEventListener("error", (e) =>
      errs.push(String((e.error as Error | undefined)?.stack ?? e.message)),
    );
    window.addEventListener("unhandledrejection", (e) =>
      errs.push(`rejection: ${String((e.reason as Error | undefined)?.stack ?? e.reason)}`),
    );
    const wantsPump = new URLSearchParams(window.location.search).get("robi")?.includes("pump");
    if (wantsPump && document.hidden) {
      window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
        window.setTimeout(() => cb(performance.now()), 16)) as typeof window.requestAnimationFrame;
      window.cancelAnimationFrame = ((h: number) =>
        window.clearTimeout(h)) as typeof window.cancelAnimationFrame;
      Object.defineProperty(document, "hidden", { get: () => false, configurable: true });
      Object.defineProperty(document, "visibilityState", {
        get: () => "visible",
        configurable: true,
      });
      const style = document.createElement("style");
      style.textContent =
        ".reveal{opacity:1!important;transform:none!important;transition:none!important}";
      document.head.appendChild(style);
    }
  } catch {
    /* never break the page over a debug aid */
  }
}

export {};
