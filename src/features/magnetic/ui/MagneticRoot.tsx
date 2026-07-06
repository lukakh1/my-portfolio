"use client";

import { useEffect } from "react";

// Buttons and CTAs site-wide, plus anything explicitly opted in.
const SELECTOR = ".btn, .nav-cta, [data-magnetic]";
const STRENGTH = 0.3;

/**
 * Global "magnetic" behavior: interactive targets ease toward the cursor while
 * it hovers within their bounds, then spring back on leave. Mirrors the existing
 * ProjectCardGlowRoot pattern (one client root managing DOM) so the server-
 * rendered buttons don't need to become client components. Disabled on touch.
 */
export function MagneticRoot() {
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
    const cleanups: Array<() => void> = [];

    els.forEach((el) => {
      let raf = 0;
      let tx = 0;
      let ty = 0;
      let cx = 0;
      let cy = 0;
      let sTarget = 1; // pressed squash — composed here because the inline
      let s = 1; //        magnetic transform would override a CSS :active rule

      const tick = () => {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        s += (sTarget - s) * 0.35;
        el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) scale(${s.toFixed(3)})`;
        if (
          Math.abs(tx - cx) > 0.1 ||
          Math.abs(ty - cy) > 0.1 ||
          Math.abs(sTarget - s) > 0.005
        ) {
          raf = requestAnimationFrame(tick);
        } else {
          el.style.transform =
            tx === 0 && ty === 0 && sTarget === 1
              ? ""
              : `translate3d(${tx}px, ${ty}px, 0) scale(${sTarget})`;
          raf = 0;
        }
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * STRENGTH;
        ty = (e.clientY - (r.top + r.height / 2)) * STRENGTH;
        schedule();
      };
      const onLeave = () => {
        tx = 0;
        ty = 0;
        sTarget = 1;
        schedule();
      };
      const onDown = () => {
        sTarget = 0.94;
        schedule();
      };
      const onUp = () => {
        sTarget = 1;
        schedule();
      };

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
      cleanups.push(() => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = "";
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
