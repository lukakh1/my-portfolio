"use client";

import { useEffect } from "react";

import { gsap, ScrollTrigger } from "@/shared/lib/gsap";
import { lenisInstance } from "@/features/smooth-scroll";

/**
 * Page-wide scroll choreography. Everything here is progressive enhancement:
 * the CSS default keeps all content fully visible, and this component only
 * hides/moves things *after* mount — so no-JS visitors (and crawlers) always
 * see the full page.
 *
 * - `.reveal` elements: batched enter animations, staggered by `data-delay`.
 * - Section velocity lean: sections skew slightly with scroll speed and
 *   spring back — the "world reacts to you" feel.
 * - Custom scene entrances: the About profile card swings in and its rows
 *   cascade, and the contact card pops with a bounce.
 *
 * (The tech marquee owns its own physics now — see the `marquee` feature.)
 */
export function ScrollFxRoot() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    // Reveals run everywhere except reduced-motion (touch included — they're
    // cheap and make the page feel alive on phones too).
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const reveals = gsap.utils.toArray<HTMLElement>(".reveal");
      reveals.forEach((el) => {
        const delay = Number(el.dataset.delay ?? 0) * 0.09;
        gsap.set(el, { autoAlpha: 0, y: 26 });
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => {
            // Another feature may have claimed this element (e.g. draggable
            // project cards remove .reveal and own their transforms).
            if (!el.classList.contains("reveal")) return;
            gsap.to(el, {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              delay,
              ease: "power3.out",
              clearProps: "transform,visibility,opacity",
            });
          },
        });
      });

      // Elements already in the viewport on load reveal immediately (their
      // trigger fires on refresh below).
      ScrollTrigger.refresh();
    });

    // Velocity effects: desktop, fine pointer, motion allowed.
    mm.add(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (min-width: 768px)",
      () => {
        const sections = gsap.utils.toArray<HTMLElement>("main > section");
        const skewSetters = sections.map((s) =>
          gsap.quickSetter(s, "skewY", "deg"),
        );
        let skew = 0;

        // About: the profile card swings in from the left, then its data
        // rows cascade. Claimed from the generic reveal system.
        const aboutCard = document.querySelector<HTMLElement>(".about-card");
        if (aboutCard) {
          aboutCard.classList.remove("reveal");
          const rows = aboutCard.querySelectorAll<HTMLElement>(".row");
          gsap.set(aboutCard, { autoAlpha: 0, x: -80, rotation: -4 });
          gsap.set(rows, { autoAlpha: 0, x: -20 });
          ScrollTrigger.create({
            trigger: aboutCard,
            start: "top 85%",
            once: true,
            onEnter: () => {
              gsap.to(aboutCard, {
                autoAlpha: 1,
                x: 0,
                rotation: 0,
                duration: 0.9,
                ease: "back.out(1.6)",
                clearProps: "transform,visibility,opacity",
              });
              gsap.to(rows, {
                autoAlpha: 1,
                x: 0,
                duration: 0.5,
                stagger: 0.07,
                delay: 0.3,
                ease: "power2.out",
                clearProps: "all",
              });
            },
          });
        }

        // Contact: the card pops in with a bounce, its content stepping up.
        const contactCard = document.querySelector<HTMLElement>(".contact-card");
        if (contactCard) {
          contactCard.classList.remove("reveal");
          const kids = Array.from(contactCard.children) as HTMLElement[];
          gsap.set(contactCard, { autoAlpha: 0, scale: 0.9, y: 60 });
          gsap.set(kids, { autoAlpha: 0, y: 22 });
          ScrollTrigger.create({
            trigger: contactCard,
            start: "top 82%",
            once: true,
            onEnter: () => {
              gsap.to(contactCard, {
                autoAlpha: 1,
                scale: 1,
                y: 0,
                duration: 0.8,
                ease: "back.out(1.5)",
                clearProps: "transform,visibility,opacity",
              });
              gsap.to(kids, {
                autoAlpha: 1,
                y: 0,
                duration: 0.55,
                stagger: 0.09,
                delay: 0.2,
                ease: "power3.out",
                clearProps: "all",
              });
            },
          });
        }

        const onTick = () => {
          const lenis = lenisInstance.get();
          const v = lenis ? lenis.velocity : 0;
          // Lean sections into the scroll, hard-clamped so text stays legible.
          const target = gsap.utils.clamp(-2.2, 2.2, v * 0.045);
          skew += (target - skew) * 0.12;
          if (Math.abs(skew) < 0.002) skew = 0;
          for (const set of skewSetters) set(skew);
        };
        gsap.ticker.add(onTick);

        return () => {
          gsap.ticker.remove(onTick);
          for (const set of skewSetters) set(0);
        };
      },
    );

    return () => mm.revert();
  }, []);

  return null;
}
