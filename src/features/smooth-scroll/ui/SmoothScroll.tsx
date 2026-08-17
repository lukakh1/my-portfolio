"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { gsap, ScrollTrigger } from "@/shared/lib/gsap";

import { lenisInstance } from "../lib/lenis-instance";

/**
 * Owns the single Lenis instance (the premium smooth-scroll feel) and is the
 * one scroll authority on the page:
 *  - bridges Lenis to GSAP ScrollTrigger (shared ticker, synced updates)
 *  - handles `#anchor` links via `lenis.scrollTo`
 *
 * Lenis scrolls the real document, so window `scroll` events still fire — the
 * stat counters and scroll-spy keep working untouched. Disabled on touch
 * (native momentum is better) and under reduced-motion (native scroll);
 * ScrollTrigger then runs off native scroll and the anchor offset is covered
 * by CSS `scroll-padding-top`.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none)").matches;
    if (reduce || touch) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisInstance.set(lenis);

    // Drive Lenis from GSAP's ticker so ScrollTrigger and Lenis share one
    // clock, and keep ScrollTrigger in sync with the smoothed scroll.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!a) return;
      // The skip link must do a native jump: preventDefault here would scroll
      // the page but leave focus stranded on the link, which defeats the point
      // of having one.
      if (a.classList.contains("skip-link")) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      // Lenis honors CSS scroll-padding-top, so that's the single offset source
      // (also covers the native-scroll fallback) — no extra offset here.
      lenis.scrollTo(el as HTMLElement);
    };
    document.addEventListener("click", onClick);

    return () => {
      gsap.ticker.remove(tick);
      document.removeEventListener("click", onClick);
      lenisInstance.set(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
