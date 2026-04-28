"use client";

import { useEffect } from "react";

export function StatCounters() {
  useEffect(() => {
    const counters = document.querySelectorAll<HTMLElement>(".counter");
    const cio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const to = parseInt(el.dataset.to ?? "0", 10);
          const dur = 1400;
          const start = performance.now();
          const ease = (t: number) => 1 - (1 - t) ** 3;
          function step(now: number) {
            const t = Math.min(1, (now - start) / dur);
            el.textContent = Math.floor(ease(t) * to).toString();
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = to.toString();
          }
          requestAnimationFrame(step);
          cio.unobserve(el);
        }
      },
      { threshold: 0.4 },
    );
    counters.forEach((c) => cio.observe(c));
    return () => cio.disconnect();
  }, []);

  return null;
}
