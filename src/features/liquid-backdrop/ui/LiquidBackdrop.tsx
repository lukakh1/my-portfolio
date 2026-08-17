"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { lenisInstance } from "@/features/smooth-scroll";
import {
  getServerTier,
  getTier,
  subscribeTier,
} from "@/shared/gl/lib/capabilities";
import { QUALITY } from "@/shared/gl/lib/quality";
import { attachPointer, glStore, stepPointer } from "@/shared/gl/model/gl-store";
import { gsap } from "@/shared/lib/gsap";

import type { LiquidEngine } from "../lib/engine";

/**
 * The lava-lamp backdrop.
 *
 * Mounts nothing during SSR or on the first client render, then loads a ~3 KB
 * engine once the browser is idle. The CSS `.bg-fx` layer underneath stays
 * visible until the first frame lands, so there is never a bare patch.
 */
export function LiquidBackdrop() {
  const tier = useSyncExternalStore(subscribeTier, getTier, getServerTier);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [armed, setArmed] = useState(false);

  // Arm after paint. requestIdleCallback explicitly hands the browser
  // permission to slot the work into a gap rather than competing with
  // hydration for the main thread.
  useEffect(() => {
    if (!QUALITY[tier].liquidScale) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) setArmed(true);
    };
    // Safari only shipped requestIdleCallback recently, so this is a real
    // runtime check even though the DOM types claim it always exists.
    const hasRic = typeof window.requestIdleCallback === "function";
    const handle: number = hasRic
      ? window.requestIdleCallback(run, { timeout: 600 })
      : window.setTimeout(run, 400);
    return () => {
      cancelled = true;
      if (hasRic) window.cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, [tier]);

  useEffect(() => {
    if (!armed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: LiquidEngine | null = null;
    let disposed = false;
    let detachPointer: (() => void) | null = null;
    let tick: ((time: number) => void) | null = null;
    let cleanupResize: (() => void) | null = null;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      // Hand the page back to the CSS fallback rather than freezing a dead
      // canvas over it.
      document.documentElement.removeAttribute("data-gl-liquid");
      glStore.liquidLive = false;
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    import("../lib/engine")
      .then(({ createLiquid }) => {
        if (disposed) return;
        engine = createLiquid(canvas, tier);
        if (!engine) return;

        detachPointer = attachPointer();

        let last = 0;
        let first = true;
        tick = (time: number) => {
          // gsap.ticker hands out SECONDS and already runs Lenis, so reading
          // velocity here is guaranteed to see this frame's value, not the
          // previous one. One rAF drives the whole page.
          const dt = last ? Math.min(0.05, time - last) : 1 / 60;
          last = time;

          const lenis = lenisInstance.get();
          glStore.velocity = lenis ? lenis.velocity * 0.03 : 0;
          glStore.scroll =
            document.documentElement.scrollHeight > window.innerHeight
              ? window.scrollY /
                (document.documentElement.scrollHeight - window.innerHeight)
              : 0;
          stepPointer(dt);
          engine!.draw(time, dt);

          if (first) {
            first = false;
            glStore.liquidLive = true;
            // Reveal only once a real frame exists, so no garbage first paint.
            document.documentElement.setAttribute("data-gl-liquid", "on");
          }
        };
        // Registered after SmoothScroll (mounted first in PortfolioHomePage),
        // so Lenis and ScrollTrigger always update before this reads them.
        gsap.ticker.add(tick, false, false);

        const onResize = () => engine?.resize();
        window.addEventListener("resize", onResize, { passive: true });
        cleanupResize = () => window.removeEventListener("resize", onResize);
      })
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") console.warn(err);
      });

    return () => {
      disposed = true;
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (tick) gsap.ticker.remove(tick);
      cleanupResize?.();
      detachPointer?.();
      engine?.dispose();
      glStore.liquidLive = false;
      document.documentElement.removeAttribute("data-gl-liquid");
    };
  }, [armed, tier]);

  if (!QUALITY[tier].liquidScale) return null;
  return <canvas ref={canvasRef} className="fx-liquid" aria-hidden />;
}
