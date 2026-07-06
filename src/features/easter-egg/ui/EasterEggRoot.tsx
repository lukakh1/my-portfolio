"use client";

import { useEffect } from "react";

import { gsap, prefersReducedMotion } from "@/shared/lib/gsap";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const CONFETTI_COLORS = ["#ff5c38", "#ffb000", "#2452ff", "#1a1712"];

/**
 * Konami-code party mode: confetti burst, gravity flips in the skills bin,
 * and a rainbow cursor trail for a few seconds. One-shot per trigger; under
 * reduced motion it's just a friendly console note + toast.
 */
export function EasterEggRoot() {
  useEffect(() => {
    console.log(
      "%c🎮 psst — try ↑↑↓↓←→←→ B A",
      "font-size:13px; color:#ff5c38; font-weight:bold",
    );

    let idx = 0;
    let partying = false;

    const toast = (msg: string) => {
      const el = document.createElement("div");
      el.className = "egg-toast";
      el.textContent = msg;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add("in"));
      setTimeout(() => {
        el.classList.remove("in");
        setTimeout(() => el.remove(), 400);
      }, 2800);
    };

    const confetti = () => {
      const n = 44;
      const frag = document.createDocumentFragment();
      const pieces: HTMLElement[] = [];
      for (let i = 0; i < n; i++) {
        const p = document.createElement("span");
        p.className = "egg-confetti";
        p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        frag.appendChild(p);
        pieces.push(p);
      }
      document.body.appendChild(frag);
      const cx = window.innerWidth / 2;
      pieces.forEach((p) => {
        gsap.fromTo(
          p,
          { x: cx, y: window.innerHeight * 0.35, rotation: 0, opacity: 1 },
          {
            x: cx + gsap.utils.random(-window.innerWidth * 0.45, window.innerWidth * 0.45),
            y: window.innerHeight + 40,
            rotation: gsap.utils.random(-540, 540),
            opacity: 0.9,
            duration: gsap.utils.random(1.3, 2.4),
            ease: "power1.in",
            onComplete: () => p.remove(),
          },
        );
      });
    };

    const party = () => {
      if (partying) return;
      partying = true;
      toast("🎉 you found it — party mode!");
      window.dispatchEvent(new CustomEvent("sfx", { detail: "pop" }));

      if (prefersReducedMotion()) {
        setTimeout(() => (partying = false), 3000);
        return;
      }

      confetti();
      window.dispatchEvent(new CustomEvent("egg:gravity-flip"));
      document.documentElement.classList.add("egg-rainbow");
      setTimeout(() => {
        document.documentElement.classList.remove("egg-rainbow");
        partying = false;
      }, 10000);
    };

    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      idx = key === KONAMI[idx] ? idx + 1 : key === KONAMI[0] ? 1 : 0;
      if (idx === KONAMI.length) {
        idx = 0;
        party();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
