"use client";

import { useEffect, useRef } from "react";

import { heroRoles } from "@/shared/config/portfolio-content";

/**
 * The widest role, used to reserve the box.
 *
 * `.role-line` is set in JetBrains Mono, so character count IS width — no
 * measurement needed, and it stays correct if the roles change.
 */
const WIDEST_ROLE = heroRoles.reduce((a, b) => (b.length > a.length ? b : a));

export function RoleRotator() {
  const elRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const rotEl = elRef.current;
    if (!rotEl) return;

    const roles = [...heroRoles];
    let rIdx = 0;
    let cIdx = 0;
    let deleting = false;

    const schedule = (fn: () => void, ms: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(fn, ms);
    };

    const tick = () => {
      const word = roles[rIdx];
      if (!deleting) {
        cIdx++;
        rotEl.textContent = word.slice(0, cIdx);
        if (cIdx === word.length) {
          deleting = true;
          schedule(tick, 1800);
          return;
        }
        schedule(tick, 55 + Math.random() * 40);
      } else {
        cIdx--;
        rotEl.textContent = word.slice(0, cIdx);
        if (cIdx === 0) {
          deleting = false;
          rIdx = (rIdx + 1) % roles.length;
          schedule(tick, 220);
          return;
        }
        schedule(tick, 28);
      }
    };

    schedule(tick, 700);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    /**
     * Two grid-stacked cells. The sizer is invisible but holds the WIDEST role
     * permanently, so the box is the same size no matter how much has been
     * typed — the typewriter can never change the line count.
     *
     * Without it, at phone widths "React & React Native Engineer" wraps to a
     * second line while "Next.js & Node" does not, so `.role-line` oscillated
     * between 24px and 48px tall every few hundred ms and shoved the entire
     * hero below it up and down forever, with no scrolling involved.
     */
    <span className="role-rotator">
      <span className="role-rotator-sizer" aria-hidden>
        {WIDEST_ROLE}
      </span>
      <span className="role-rotator-text" id="rotator" ref={elRef}>
        {heroRoles[0]}
      </span>
    </span>
  );
}
