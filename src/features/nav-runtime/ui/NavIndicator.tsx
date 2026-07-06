"use client";

import { useEffect } from "react";

/**
 * Slides the highlight pill behind whichever nav link is currently `.active`
 * (ScrollSpyNav owns that class). Watches each link's class attribute so it
 * moves in lockstep with the scroll-spy, and re-measures on resize and once the
 * display font lands (which reflows link widths). Hidden when no section is
 * active (e.g. up in the hero).
 */
export function NavIndicator() {
  useEffect(() => {
    const wrap = document.querySelector<HTMLElement>(".nav-links");
    const ind = document.querySelector<HTMLElement>(".nav-ind");
    if (!wrap || !ind) return;

    const place = () => {
      const active = wrap.querySelector<HTMLElement>("a.active");
      if (!active) {
        ind.style.opacity = "0";
        return;
      }
      ind.style.opacity = "1";
      ind.style.transform = `translateX(${active.offsetLeft}px)`;
      ind.style.width = `${active.offsetWidth}px`;
    };

    place();

    const mo = new MutationObserver(place);
    wrap.querySelectorAll("a").forEach((a) =>
      mo.observe(a, { attributes: true, attributeFilter: ["class"] }),
    );
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place).catch(() => {});

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  return null;
}
