"use client";

import { useEffect } from "react";

import { Draggable, fullMotionOk, gsap } from "@/shared/lib/gsap";

/**
 * Turns the project grid into a playful "desk" of tossable cards on desktop.
 * Headless: it enhances the existing server-rendered grid in place, so touch,
 * small screens, reduced-motion, and no-JS all keep the plain CSS grid.
 *
 * Cards are links — a real drag must not trigger navigation, so clicks are
 * suppressed whenever the pointer actually moved (Draggable's pointerMoved).
 */
export function DraggableProjectsRoot() {
  useEffect(() => {
    if (!fullMotionOk()) return;

    const grid = document.getElementById("projGrid");
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".proj"));
    if (!cards.length) return;

    let draggables: globalThis.Draggable[] = [];
    let active = false;
    let homes: { x: number; y: number; w: number }[] = [];

    const activate = () => {
      if (active) return;
      // Claim the cards from the reveal system: their entrance is the loose
      // scatter itself. Killing any in-flight reveal tween is critical — if the
      // page is refreshed while the Projects section is already on screen, that
      // tween is mid-animation, and its `clearProps`/`autoAlpha` on complete
      // would later wipe the absolute positioning we set below (the "strange
      // things on refresh" bug).
      cards.forEach((card) => {
        card.classList.remove("reveal");
        gsap.killTweensOf(card);
        gsap.set(card, { clearProps: "all" });
      });
      const gridRect = grid.getBoundingClientRect();
      homes = cards.map((c) => {
        const r = c.getBoundingClientRect();
        return { x: r.left - gridRect.left, y: r.top - gridRect.top, w: r.width };
      });
      grid.style.height = `${grid.offsetHeight}px`;
      grid.classList.add("proj-grid--loose");

      cards.forEach((card, i) => {
        const home = homes[i];
        gsap.set(card, {
          position: "absolute",
          left: 0,
          top: 0,
          width: home.w,
          x: home.x,
          y: home.y,
          rotation: gsap.utils.random(-2.5, 2.5),
        });
        card.setAttribute("data-cursor", "drag");
        card.addEventListener("click", onCardClick, true);
      });

      draggables = Draggable.create(cards, {
        type: "x,y",
        bounds: grid,
        inertia: true,
        edgeResistance: 0.78,
        zIndexBoost: true,
        onPress() {
          gsap.to(this.target, { scale: 0.97, duration: 0.15, ease: "power2.out" });
        },
        onRelease() {
          gsap.to(this.target, { scale: 1, duration: 0.4, ease: "back.out(2.5)" });
        },
        onDragStart() {
          (this.target as HTMLElement).classList.add("is-dragging");
        },
        onDragEnd() {
          (this.target as HTMLElement).classList.remove("is-dragging");
          gsap.to(this.target, {
            rotation: gsap.utils.random(-4, 4),
            duration: 0.5,
            ease: "power2.out",
          });
          window.dispatchEvent(
            new CustomEvent("sfx", { detail: "whoosh" }),
          );
        },
      }) as globalThis.Draggable[];
      active = true;
    };

    function onCardClick(e: MouseEvent) {
      const card = e.currentTarget as HTMLElement;
      const d = draggables.find((dr) => dr.target === card);
      // A real drag (pointer moved) must not navigate.
      if (d && (d as unknown as { pointerMoved: boolean }).pointerMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    const deactivate = () => {
      if (!active) return;
      draggables.forEach((d) => d.kill());
      draggables = [];
      cards.forEach((card) => {
        card.removeEventListener("click", onCardClick, true);
        card.removeAttribute("data-cursor");
        card.classList.remove("is-dragging");
        gsap.set(card, { clearProps: "all" });
      });
      grid.style.height = "";
      grid.classList.remove("proj-grid--loose");
      active = false;
    };

    const tidy = () => {
      cards.forEach((card, i) => {
        const d = draggables.find((dr) => dr.target === card);
        gsap.to(card, {
          x: homes[i].x,
          y: homes[i].y,
          rotation: 0,
          duration: 0.7,
          ease: "back.out(1.4)",
          delay: i * 0.05,
          onUpdate: () => d?.update(),
        });
      });
      window.dispatchEvent(new CustomEvent("sfx", { detail: "pop" }));
    };

    const tidyBtn = document.querySelector<HTMLButtonElement>("[data-tidy]");
    if (tidyBtn) {
      tidyBtn.hidden = false;
      tidyBtn.addEventListener("click", tidy);
    }

    // Re-measure on resize: revert to the grid, let it reflow, re-activate.
    let resizeT: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeT);
      deactivate();
      resizeT = setTimeout(() => {
        if (fullMotionOk()) activate();
      }, 250);
    };
    window.addEventListener("resize", onResize);

    activate();

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeT);
      tidyBtn?.removeEventListener("click", tidy);
      if (tidyBtn) tidyBtn.hidden = true;
      deactivate();
    };
  }, []);

  return null;
}
