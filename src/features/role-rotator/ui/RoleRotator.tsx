"use client";

import { useEffect, useRef } from "react";

import { heroRoles } from "@/shared/config/portfolio-content";

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
    <span className="role-rotator" id="rotator" ref={elRef}>
      {heroRoles[0]}
    </span>
  );
}
