"use client";

import { useEffect, useRef } from "react";

import { fullMotionOk } from "@/shared/lib/gsap";
import { Spring1 } from "@/shared/lib/springs";

export interface HeadlineLine {
  text: string;
  className?: string;
}

interface LetterState {
  el: HTMLSpanElement;
  x: Spring1;
  y: Spring1;
  r: Spring1;
  /** Untransformed center, cached and corrected for current offsets. */
  cx: number;
  cy: number;
}

const RADIUS = 130;
const PUSH = 34;

/**
 * The hero name with per-letter spring physics: letters shy away from the
 * cursor and wobble back into place. Markup is SSR-rendered spans (the h1
 * carries the accessible text via aria-label), so with JS off — or on
 * touch/reduced-motion — it's simply a static headline with zero CLS.
 */
export function PhysicsHeadline({ lines }: { lines: HeadlineLine[] }) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!fullMotionOk()) return;
    const root = rootRef.current;
    if (!root) return;

    const els = Array.from(
      root.querySelectorAll<HTMLSpanElement>("[data-letter]"),
    );
    const letters: LetterState[] = els.map((el) => ({
      el,
      x: new Spring1(3.1, 0.34),
      y: new Spring1(3.1, 0.34),
      r: new Spring1(2.6, 0.3),
      cx: 0,
      cy: 0,
    }));

    const measure = () => {
      for (const l of letters) {
        const rect = l.el.getBoundingClientRect();
        l.cx = rect.left + rect.width / 2 - l.x.value;
        l.cy = rect.top + rect.height / 2 - l.y.value;
      }
    };

    let mx = -1e4;
    let my = -1e4;
    let raf = 0;
    let running = false;
    let last = 0;

    const settled = () =>
      letters.every(
        (l) =>
          Math.abs(l.x.value) < 0.05 &&
          Math.abs(l.y.value) < 0.05 &&
          Math.abs(l.x.vel) < 0.5 &&
          Math.abs(l.y.vel) < 0.5,
      );

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      measure();
      let anyNear = false;
      for (const l of letters) {
        const dx = l.cx - mx;
        const dy = l.cy - my;
        const d = Math.hypot(dx, dy);
        if (d < RADIUS) {
          anyNear = true;
          const f = (1 - d / RADIUS) ** 1.5;
          const inv = d > 1e-3 ? 1 / d : 0;
          l.x.target = dx * inv * PUSH * f;
          l.y.target = dy * inv * PUSH * f;
          l.r.target = dx * inv * f * 9;
        } else {
          l.x.target = 0;
          l.y.target = 0;
          l.r.target = 0;
        }
        l.x.step(dt);
        l.y.step(dt);
        l.r.step(dt);
        l.el.style.transform = `translate3d(${l.x.value.toFixed(2)}px, ${l.y.value.toFixed(2)}px, 0) rotate(${l.r.value.toFixed(2)}deg)`;
      }
      if (!anyNear && settled()) {
        running = false;
        for (const l of letters) l.el.style.transform = "";
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // Only bother waking when the pointer is anywhere near the headline.
      const rect = root.getBoundingClientRect();
      if (
        mx > rect.left - RADIUS &&
        mx < rect.right + RADIUS &&
        my > rect.top - RADIUS &&
        my < rect.bottom + RADIUS
      ) {
        wake();
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const label = lines.map((l) => l.text).join(" ");

  return (
    <span className="phys-headline" ref={rootRef} aria-label={label} role="text">
      {lines.map((line, li) => (
        <span key={li} className={line.className}>
          {li > 0 && <br aria-hidden />}
          {Array.from(line.text).map((ch, ci) => (
            <span
              key={ci}
              data-letter={ch === " " ? undefined : ""}
              aria-hidden
              className="phys-letter"
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
