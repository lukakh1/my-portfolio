"use client";

import { useEffect } from "react";

import { fullMotionOk } from "@/shared/lib/gsap";
import { Spring1 } from "@/shared/lib/springs";

interface Letter {
  el: HTMLElement;
  x: Spring1;
  y: Spring1;
  r: Spring1;
  /** Untransformed centre, recomputed each frame (scroll moves it). */
  cx: number;
  cy: number;
}

interface Group {
  root: HTMLElement;
  letters: Letter[];
  /** Influence radius and shove distance, scaled to this heading's type size. */
  radius: number;
  push: number;
  rect: DOMRect;
  built: boolean;
}

/**
 * Per-letter cursor physics for every headline on the page: the hero lockup
 * and all six section titles.
 *
 * ONE listener and ONE rAF for all of them, rather than a loop per headline.
 * Only the group the cursor is actually near is measured or animated, so the
 * per-frame cost is the same as when this drove the hero name alone.
 *
 * Headless by design, matching the rest of the feature layer: the markup comes
 * from <PhysicsText> in the server-rendered widgets, and this only adds
 * behaviour.
 */
export function PhysicsTextRoot() {
  useEffect(() => {
    // Touch, small screens and reduced-motion get the static headings.
    if (!fullMotionOk()) return;

    const roots = Array.from(
      document.querySelectorAll<HTMLElement>("[data-phys-text]"),
    );
    if (!roots.length) return;

    const groups: Group[] = roots.map((root) => ({
      root,
      letters: [],
      radius: 130,
      push: 34,
      rect: root.getBoundingClientRect(),
      built: false,
    }));

    /** Build springs lazily — 180 letters is not worth measuring up front. */
    const build = (g: Group) => {
      if (g.built) return;
      g.built = true;
      const els = Array.from(
        g.root.querySelectorAll<HTMLElement>("[data-letter]"),
      );
      g.letters = els.map((el) => ({
        el,
        x: new Spring1(3.1, 0.34),
        y: new Spring1(3.1, 0.34),
        r: new Spring1(2.6, 0.3),
        cx: 0,
        cy: 0,
      }));
      // Scale the effect to the type size, so a 54px section title isn't
      // shoved as hard as a 260px hero lockup and end up looking broken.
      const fs = els.length
        ? parseFloat(getComputedStyle(els[0]).fontSize) || 40
        : 40;
      g.radius = Math.max(90, Math.min(160, fs * 0.9));
      g.push = Math.max(12, Math.min(34, fs * 0.16));
      g.root.classList.add("is-phys-live");
    };

    let mx = -1e4;
    let my = -1e4;
    let active: Group | null = null;
    let raf = 0;
    let running = false;
    let last = 0;

    // Rects are cached and refreshed on scroll/resize rather than read on every
    // pointermove: with the velocity-skew transforms being written during
    // scroll, per-move rect reads would force a layout flush each time.
    let rectsDirty = true;
    const refreshRects = () => {
      for (const g of groups) g.rect = g.root.getBoundingClientRect();
      rectsDirty = false;
    };

    const settled = (g: Group) =>
      g.letters.every(
        (l) =>
          Math.abs(l.x.value) < 0.05 &&
          Math.abs(l.y.value) < 0.05 &&
          Math.abs(l.x.vel) < 0.5 &&
          Math.abs(l.y.vel) < 0.5,
      );

    const release = (g: Group) => {
      for (const l of g.letters) l.el.style.transform = "";
    };

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      const g = active;
      if (!g) {
        running = false;
        return;
      }

      let anyNear = false;
      for (const l of g.letters) {
        const rect = l.el.getBoundingClientRect();
        l.cx = rect.left + rect.width / 2 - l.x.value;
        l.cy = rect.top + rect.height / 2 - l.y.value;

        const dx = l.cx - mx;
        const dy = l.cy - my;
        const d = Math.hypot(dx, dy);
        if (d < g.radius) {
          anyNear = true;
          const f = (1 - d / g.radius) ** 1.5;
          const inv = d > 1e-3 ? 1 / d : 0;
          l.x.target = dx * inv * g.push * f;
          l.y.target = dy * inv * g.push * f;
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

      if (!anyNear && settled(g)) {
        release(g);
        running = false;
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
      if (rectsDirty) refreshRects();

      // At most one headline can be near the cursor, so find it and ignore
      // the rest entirely.
      let next: Group | null = null;
      for (const g of groups) {
        const r = g.rect;
        const pad = g.built ? g.radius : 160;
        if (
          mx > r.left - pad &&
          mx < r.right + pad &&
          my > r.top - pad &&
          my < r.bottom + pad
        ) {
          next = g;
          break;
        }
      }

      if (next !== active) {
        // Let the previous group spring home rather than snapping.
        if (active) {
          for (const l of active.letters) {
            l.x.target = 0;
            l.y.target = 0;
            l.r.target = 0;
          }
          release(active);
        }
        active = next;
      }
      if (!active) return;
      build(active);
      wake();
    };

    const onScroll = () => {
      rectsDirty = true;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      for (const g of groups) {
        release(g);
        g.root.classList.remove("is-phys-live");
      }
    };
  }, []);

  return null;
}
