"use client";

import { useEffect } from "react";

import { lenisInstance } from "@/features/smooth-scroll";
import { lockScroll, unlockScroll } from "@/shared/lib/scroll-lock";

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
      // The burger doubles as the close control (it morphs into an X), so its
      // label has to say which job it is currently doing.
      toggle.setAttribute("aria-label", next ? "Close menu" : "Open menu");
      document.documentElement.classList.toggle("nav-open", next);

      if (next) {
        sheet.hidden = false;
        // The transition can't run in the same frame the element stops being
        // `hidden`, so hand the browser a frame to lay it out first.
        requestAnimationFrame(() => sheet.classList.add("is-open"));
        // Lenis keeps scrolling the page underneath otherwise — but Lenis only
        // exists on desktop, so on a phone this alone locked nothing and the
        // page scrolled away behind the open menu. lockScroll() covers both.
        lenisInstance.get()?.stop();
        lockScroll();
        focusables()[0]?.focus();
      } else {
        sheet.classList.remove("is-open");
        lenisInstance.get()?.start();
        unlockScroll();
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
      if (a) {
        setOpen(false);
        return;
      }
      // Tapping the empty sand around the links dismisses it, the way any
      // sheet should. Only a direct hit on the sheet itself counts, so taps
      // that land on a link or the CTA are not double-handled.
      if (e.target === sheet) setOpen(false);
    };

    // The shell now sits above the sheet, so its brand/CTA links are live
    // while the menu is open — they must close it too. Bound to the element
    // (not the document) so it still runs before SmoothScroll's handler.
    const shell = document.querySelector<HTMLElement>(".nav-shell");
    const onShellClick = (e: MouseEvent) => {
      if (!open) return;
      const a = (e.target as HTMLElement).closest("a[href^='#']");
      if (a) setOpen(false);
    };

    // Resizing past the breakpoint must not leave a stuck overlay.
    const onDesktop = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };

    toggle.addEventListener("click", onToggle);
    sheet.addEventListener("click", onSheetClick);
    shell?.addEventListener("click", onShellClick);
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);

    return () => {
      toggle.removeEventListener("click", onToggle);
      sheet.removeEventListener("click", onSheetClick);
      shell?.removeEventListener("click", onShellClick);
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
      document.documentElement.classList.remove("nav-open");
      lenisInstance.get()?.start();
      if (open) unlockScroll();
    };
  }, []);

  return null;
}
