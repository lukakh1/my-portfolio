"use client";

import { useEffect } from "react";

import { sceneStore } from "@/shared/three";

/**
 * One-shot reveal transitions. Observation is deferred until the intro gate
 * starts lifting — otherwise the hero's entrance plays invisibly behind the
 * opaque overlay and the visitor arrives to a static page.
 */
export function RevealOnScroll() {
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io?.unobserve(e.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      );
      document.querySelectorAll(".reveal").forEach((el) => io!.observe(el));
    };

    const ready = (phase: string) =>
      phase === "none" || phase === "entering" || phase === "done";

    if (ready(sceneStore.get().gatePhase)) start();
    const unsub = sceneStore.subscribe((s) => {
      if (ready(s.gatePhase)) start();
    });
    // never block reveals forever (headless runs, gate errors) — but stand
    // down while the gate is demonstrably alive and covering the page: the
    // subscription above starts reveals the moment the visitor enters
    const tid = window.setTimeout(() => {
      const p = sceneStore.get().gatePhase;
      if (p === "loading" || p === "ready") return;
      start();
    }, 6000);

    return () => {
      unsub();
      window.clearTimeout(tid);
      io?.disconnect();
    };
  }, []);

  return null;
}
