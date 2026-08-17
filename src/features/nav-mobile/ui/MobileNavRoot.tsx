"use client";

import { useEffect } from "react";

import { lenisInstance } from "@/features/smooth-scroll";

/**
 * Drives the narrow-viewport nav sheet. Headless, like the rest of the feature
 * layer: the markup is server-rendered by PortfolioNav and this only wires
 * behaviour onto it.
 *
 * Before this existed the section links were simply `display: none` below
 * 880px with no replacement, so About/Experience/Skills/Projects/Education
 * were unreachable on every phone.
 */
export function MobileNavRoot() {
  useEffect(() => {
    const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
    const sheet = document.getElementById("navSheet");
    if (!toggle || !sheet) return;

    const desktop = window.matchMedia("(min-width: 881px)");
    let open = false;

    const focusables = () =>
      Array.from(
        sheet.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ).filter((el) => el.offsetParent !== null);

    const setOpen = (next: boolean) => {
      if (next === open) return;
      open = next;
      toggle.setAttribute("aria-expanded", String(next));
      document.documentElement.classList.toggle("nav-open", next);

      if (next) {
        sheet.hidden = false;
        // The transition can't run in the same frame the element stops being
        // `hidden`, so hand the browser a frame to lay it out first.
        requestAnimationFrame(() => sheet.classList.add("is-open"));
        // Lenis keeps scrolling the page underneath otherwise.
        lenisInstance.get()?.stop();
        focusables()[0]?.focus();
      } else {
        sheet.classList.remove("is-open");
        lenisInstance.get()?.start();
        // Keep it in the a11y tree until the wipe finishes, then remove it so
        // it can never be tabbed into while invisible.
        const done = () => {
          if (!open) sheet.hidden = true;
          sheet.removeEventListener("transitionend", done);
        };
        sheet.addEventListener("transitionend", done);
        // transitionend never fires under reduced motion (no transition).
        setTimeout(done, 600);
        toggle.focus();
      }
    };

    const onToggle = () => setOpen(!open);

    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      // Trap focus: the sheet covers the page, so tabbing behind it is a trap
      // of its own — the user would be typing into content they can't see.
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Close on navigation. This listener sits on the sheet, so it runs before
    // SmoothScroll's document-level anchor handler — Lenis is restarted before
    // it is asked to scroll.
    const onSheetClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']");
      if (a) setOpen(false);
    };

    // Resizing past the breakpoint must not leave a stuck overlay.
    const onDesktop = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };

    toggle.addEventListener("click", onToggle);
    sheet.addEventListener("click", onSheetClick);
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);

    return () => {
      toggle.removeEventListener("click", onToggle);
      sheet.removeEventListener("click", onSheetClick);
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
      document.documentElement.classList.remove("nav-open");
      lenisInstance.get()?.start();
    };
  }, []);

  return null;
}
