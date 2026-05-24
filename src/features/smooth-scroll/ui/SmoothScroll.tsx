"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { sceneStore } from "@/shared/three";

import { lenisInstance } from "../lib/lenis-instance";

/**
 * Owns the single Lenis instance (the premium smooth-scroll feel) and is the
 * one scroll authority on the page:
 *  - publishes smoothed scroll progress into the scene store for the WebGL layer
 *  - handles `#anchor` links via `lenis.scrollTo` (replaces SmoothAnchorScroll)
 *
 * Lenis scrolls the real document, so window `scroll` events still fire — the
 * existing IntersectionObserver reveals, stat counters, and scroll-spy keep
 * working untouched. Disabled on touch (native momentum is better) and under
 * reduced-motion (native scroll); anchor offset is then covered by CSS
 * `scroll-padding-top`.
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

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onScroll = (inst: Lenis) => {
      sceneStore.setScroll(inst.scroll, inst.progress, inst.velocity);
    };
    lenis.on("scroll", onScroll);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      // Lenis honors CSS scroll-padding-top, so that's the single offset source
      // (also covers the native-scroll fallback) — no extra offset here.
      lenis.scrollTo(el as HTMLElement);
      if (id === "#top") sceneStore.triggerRecondense();
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenisInstance.set(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
