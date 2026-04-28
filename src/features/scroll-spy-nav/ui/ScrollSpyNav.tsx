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

    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 24);
      let active = "";
      const y = window.scrollY + NAV_OFFSET;
      for (const s of sections) {
        if (s.offsetTop <= y) active = s.id;
      }
      linkEls.forEach((a) => {
        const h = a.getAttribute("href") ?? "";
        a.classList.toggle("active", h === `#${active}`);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
