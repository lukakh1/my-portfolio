"use client";

import { useEffect } from "react";

import { sectionIds } from "@/shared/config/portfolio-content";

const NAV_OFFSET = 120;

export function ScrollSpyNav() {
  useEffect(() => {
    const nav = document.getElementById("nav");
    if (!nav) return;

    const linkEls = document.querySelectorAll<HTMLAnchorElement>(
      ".nav-links a[href^=\"#\"]",
    );
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const setActive = (id: string) => {
      linkEls.forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === `#${id}`),
      );
    };

    // When a link is clicked the page smooth-scrolls over ~1s; hold the clicked
    // section highlighted (optimistic) until the scroll actually arrives, so the
    // indicator doesn't crawl through every section in between.
    let locked: string | null = null;
    let lockTimer: ReturnType<typeof setTimeout> | undefined;

    const currentSection = () => {
      let active = "";
      const y = window.scrollY + NAV_OFFSET;
      for (const s of sections) if (s.offsetTop <= y) active = s.id;
      return active;
    };

    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 24);
      const active = currentSection();
      if (locked) {
        // Release the lock once the scroll reaches the target.
        if (active === locked) {
          locked = null;
          clearTimeout(lockTimer);
        } else {
          return;
        }
      }
      setActive(active);
    };

    const onLinkClick = (e: Event) => {
      const id = (e.currentTarget as HTMLAnchorElement)
        .getAttribute("href")
        ?.slice(1);
      if (!id) return;
      locked = id;
      setActive(id); // optimistic — move the indicator now
      clearTimeout(lockTimer);
      // Safety release in case the target never becomes the computed section
      // (e.g. it's the last section and can't scroll fully under the offset).
      lockTimer = setTimeout(() => {
        locked = null;
        onScroll();
      }, 1600);
    };

    linkEls.forEach((a) => a.addEventListener("click", onLinkClick));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      clearTimeout(lockTimer);
      linkEls.forEach((a) => a.removeEventListener("click", onLinkClick));
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
