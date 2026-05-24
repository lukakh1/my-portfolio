"use client";

import { useEffect } from "react";

/**
 * Drives the Experience timeline's "thread being traced" effect: sets a
 * `--tl-progress` (0..1) on the timeline as it scrolls through the viewport and
 * ignites each `.tl-item` as the trace point reaches its dot. Pure scroll-linked
 * DOM, so it works with or without Lenis.
 */
export function TimelineTrace() {
  useEffect(() => {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;
    const items = Array.from(
      timeline.querySelectorAll<HTMLElement>(".tl-item"),
    );

    const update = () => {
      const rect = timeline.getBoundingClientRect();
      const tracePoint = window.innerHeight * 0.55;
      const p = Math.min(
        1,
        Math.max(0, (tracePoint - rect.top) / (rect.height || 1)),
      );
      timeline.style.setProperty("--tl-progress", p.toFixed(4));
      for (const item of items) {
        const dot = item.querySelector(".tl-dot");
        if (!dot) continue;
        item.classList.toggle(
          "lit",
          dot.getBoundingClientRect().top <= tracePoint,
        );
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}
