"use client";

import { useEffect, useRef } from "react";

import { sceneStore } from "@/shared/three";

const INTERACTIVE =
  "a, button, .btn, .nav-cta, [data-cursor], input, textarea, select";

/**
 * A two-part custom cursor: a small solid dot that tracks the pointer exactly,
 * and a larger ring that lags with spring easing and swells over interactive
 * elements. Also the single source of normalized pointer coords for the WebGL
 * particle field. Desktop / fine-pointer only; bails on touch and reduced-motion
 * (native cursor remains).
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none)").matches;
    if (reduce || touch) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const root = document.documentElement;
    root.classList.add("cursor-custom");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let scale = 1;
    let scaleTarget = 1;
    let shown = false;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      if (!shown) {
        shown = true;
        root.classList.add("cursor-on");
      }
      sceneStore.setPointer(
        (mx / window.innerWidth) * 2 - 1,
        -((my / window.innerHeight) * 2 - 1),
      );
      sceneStore.setPointerActive(true);
    };

    const onOver = (e: MouseEvent) => {
      const hit = (e.target as HTMLElement | null)?.closest?.(INTERACTIVE);
      scaleTarget = hit ? 1.7 : 1;
      ring.classList.toggle("is-hover", !!hit);
    };

    const onLeaveDoc = () => {
      root.classList.remove("cursor-on");
      shown = false;
      sceneStore.setPointerActive(false);
    };

    let raf = 0;
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      scale += (scaleTarget - scale) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeaveDoc);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeaveDoc);
      root.classList.remove("cursor-custom", "cursor-on");
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden />
      <div className="cursor-ring" ref={ringRef} aria-hidden />
    </>
  );
}
