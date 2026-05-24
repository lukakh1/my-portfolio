"use client";

import { useEffect } from "react";

/**
 * Animates `.counter` elements into view: a brief "decode" (digits scramble)
 * reads as the number being computed, then it resolves and counts up to the
 * target. Uses IntersectionObserver, so it fires off real scroll position
 * (compatible with Lenis).
 */
export function StatCounters() {
  useEffect(() => {
    const counters = document.querySelectorAll<HTMLElement>(".counter");
    const cio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const to = parseInt(el.dataset.to ?? "0", 10);
          const dur = 1500;
          const start = performance.now();
          const ease = (t: number) => 1 - (1 - t) ** 3;
          let lastScramble = 0;
          let scrambleVal = 0;

          const step = (now: number) => {
            const t = Math.min(1, (now - start) / dur);
            if (t < 0.5) {
              if (now - lastScramble > 55) {
                scrambleVal = Math.floor(Math.random() * (to + 1));
                lastScramble = now;
              }
              el.textContent = scrambleVal.toString();
            } else {
              const lt = (t - 0.5) / 0.5;
              el.textContent = Math.floor(ease(lt) * to).toString();
            }
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = to.toString();
          };

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
