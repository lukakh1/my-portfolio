"use client";

import { useEffect, useRef } from "react";

import { Spring1 } from "@/shared/lib/springs";

const INTERACTIVE =
  "a, button, .btn, .nav-cta, [data-cursor], input, textarea, select";

const TRAIL = 5;

/**
 * Context-aware custom cursor: a solid dot that tracks the pointer exactly, a
 * springy ring that morphs per context (link / drag / text via the
 * `data-cursor` attribute protocol), and a short spring-staggered trail of
 * dots. Desktop / fine-pointer only; bails on touch and reduced-motion.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none)").matches;
    if (reduce || touch) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const trailWrap = trailRef.current;
    if (!dot || !ring || !trailWrap) return;

    const root = document.documentElement;
    root.classList.add("cursor-custom");

    const trailDots = Array.from(trailWrap.children) as HTMLElement[];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const rx = new Spring1(6.5, 0.9, cx);
    const ry = new Spring1(6.5, 0.9, cy);
    const rs = new Spring1(4.5, 0.55, 1);
    const trail = trailDots.map((_, i) => ({
      x: new Spring1(4.6 - i * 0.55, 0.85, cx),
      y: new Spring1(4.6 - i * 0.55, 0.85, cy),
    }));

    let mx = cx;
    let my = cy;
    let shown = false;

    // pointermove (not mousemove): GSAP Draggable capture suppresses mouse
    // events during a drag, which froze the cursor mid-throw.
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      if (!shown) {
        shown = true;
        root.classList.add("cursor-on");
      }
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const ctx = t?.closest?.("[data-cursor]") as HTMLElement | null;
      const mode = ctx?.dataset.cursor ?? (t?.closest?.(INTERACTIVE) ? "link" : "");
      ring.dataset.mode = mode;
      rs.target = mode === "link" ? 1.7 : mode === "drag" ? 1.35 : mode === "text" ? 0.9 : 1;
      if (mode === "link" || mode === "drag") rs.kick(3);
    };

    const onLeaveDoc = () => {
      root.classList.remove("cursor-on");
      shown = false;
    };

    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      rx.target = mx;
      ry.target = my;
      ring.style.transform = `translate3d(${rx.step(dt)}px, ${ry.step(dt)}px, 0) translate(-50%, -50%) scale(${rs.step(dt).toFixed(3)})`;
      trail.forEach((s, i) => {
        s.x.target = mx;
        s.y.target = my;
        trailDots[i].style.transform = `translate3d(${s.x.step(dt)}px, ${s.y.step(dt)}px, 0) translate(-50%, -50%)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeaveDoc);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeaveDoc);
      root.classList.remove("cursor-custom", "cursor-on");
    };
  }, []);

  return (
    <>
      <div className="cursor-trail" ref={trailRef} aria-hidden>
        {Array.from({ length: TRAIL }).map((_, i) => (
          <span key={i} className="cursor-trail-dot" style={{ opacity: 0.28 - i * 0.045 }} />
        ))}
      </div>
      <div className="cursor-dot" ref={dotRef} aria-hidden />
      <div className="cursor-ring" ref={ringRef} aria-hidden>
        <span className="cursor-label" />
      </div>
    </>
  );
}
