"use client";

import { useEffect, useRef } from "react";

import { fullMotionOk } from "@/shared/lib/gsap";
import { lenisInstance } from "@/features/smooth-scroll";

interface MarqueeProps {
  items: string[];
  /** Separator glyph between items. */
  sep?: string;
  /** Auto-scroll speed in px/s. */
  speed?: number;
  className?: string;
}

/**
 * Seamless, always-full-width marquee with drag-to-scrub.
 *
 * The old strip only duplicated its text twice, so on wide viewports a single
 * copy didn't span the screen — you'd see a bare gap on the right until the loop
 * wrapped. This measures one unit and clones it enough times to cover 2× the
 * viewport, then translates by exactly one unit width and wraps with a modulo,
 * so there's never a gap at any width.
 *
 * Interaction: grab and drag to scrub; releasing with speed flings it and the
 * momentum decays back into the idle crawl. Auto-motion is gated on
 * `fullMotionOk()` (off for reduced-motion), but dragging always works since
 * it's user-initiated. Decorative, so the whole thing is aria-hidden.
 */
export function Marquee({ items, sep = "✦", speed = 55, className }: MarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const unit = track.firstElementChild as HTMLElement | null;
    if (!unit) return;

    const autoOk = fullMotionOk();

    let unitWidth = 0;
    let clones: HTMLElement[] = [];

    // Clone the base unit until the track covers 2× the viewport, so at least a
    // full screen of content is always present ahead of the wrap point.
    const fill = () => {
      for (const c of clones) c.remove();
      clones = [];
      unitWidth = unit.getBoundingClientRect().width;
      if (unitWidth <= 0) return;
      const need = Math.ceil((viewport.clientWidth * 2) / unitWidth) + 1;
      for (let i = 0; i < need; i++) {
        const clone = unit.cloneNode(true) as HTMLElement;
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
        clones.push(clone);
      }
    };

    fill();

    let offset = 0;
    let fling = 0; // px/frame momentum from a drag release
    let last = 0;
    let raf = 0;

    const wrap = (x: number) => {
      if (unitWidth <= 0) return x;
      x %= unitWidth;
      if (x > 0) x -= unitWidth;
      return x;
    };

    let dragging = false;

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;

      if (!dragging) {
        if (autoOk) {
          // Idle crawl, leaning a touch into scroll velocity for life.
          const v = lenisInstance.get()?.velocity ?? 0;
          const lean = 1 + Math.max(-0.9, Math.min(4, v * 0.03));
          offset -= speed * lean * dt;
        }
        offset += fling;
        fling *= 0.92;
        if (Math.abs(fling) < 0.01) fling = 0;
      }

      offset = wrap(offset);
      track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
      raf = requestAnimationFrame(frame);
    };

    last = performance.now();
    raf = requestAnimationFrame(frame);

    // ── drag to scrub ──
    let lastX = 0;
    let vel = 0;

    // Ends the drag and hands the leftover velocity to the idle crawl as a
    // short fling. Shared by pointer-up, cancel, and leaving the strip.
    const endDrag = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      fling = Math.max(-40, Math.min(40, vel));
      viewport.classList.remove("is-dragging");
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      fling = 0;
      lastX = e.clientX;
      vel = 0;
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      // Pointer capture keeps sending moves once the cursor exits; treat
      // leaving the strip as a release so it resumes the auto-scroll.
      const r = viewport.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        endDrag(e);
        return;
      }
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      offset = wrap(offset + dx);
      // Smooth the per-move delta into a frame velocity for the release fling.
      vel = vel * 0.6 + dx * 0.4;
    };

    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // Re-tile when width changes or the font finally lands (which reflows text).
    const ro = new ResizeObserver(() => fill());
    ro.observe(viewport);
    document.fonts?.ready.then(fill).catch(() => {});

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      viewport.removeEventListener("pointerdown", onDown);
      viewport.removeEventListener("pointermove", onMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
      for (const c of clones) c.remove();
    };
  }, [items, sep, speed]);

  return (
    <div
      ref={viewportRef}
      className={`marquee2${className ? ` ${className}` : ""}`}
      data-cursor="drag"
      aria-hidden
    >
      <div ref={trackRef} className="marquee2-track">
        <span className="marquee2-unit">
          {items.map((item) => (
            <span key={item} className="marquee2-item">
              {item}
              <span className="marquee2-sep">{sep}</span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
