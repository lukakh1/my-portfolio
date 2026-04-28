"use client";

import { useEffect } from "react";

export function ProjectCardGlowRoot() {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".proj");
    const handlers: Array<{ el: HTMLElement; fn: (e: MouseEvent) => void }> =
      [];

    cards.forEach((card) => {
      const fn = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty(
          "--mx",
          `${((e.clientX - r.left) / r.width) * 100}%`,
        );
        card.style.setProperty(
          "--my",
          `${((e.clientY - r.top) / r.height) * 100}%`,
        );
      };
      card.addEventListener("mousemove", fn);
      handlers.push({ el: card, fn });
    });

    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener("mousemove", fn));
    };
  }, []);

  return null;
}
