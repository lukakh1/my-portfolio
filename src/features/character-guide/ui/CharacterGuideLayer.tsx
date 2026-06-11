"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { dprFor, sceneStore } from "@/shared/three";

import { clamp } from "../lib/curves";
import { debugFlags } from "../lib/debug";
import { CAM_FOV, CAM_Z } from "../lib/screen-world";
import { director } from "../model/robot-director";
import { robotStore } from "../model/robot-store";
import { RobotHitArea } from "./RobotHitArea";
import { RobotRig } from "./RobotRig";
import { RobotSpeech } from "./RobotSpeech";

/**
 * Composition layer: the transparent overlay canvas, the DOM bubble + hit
 * area, the director lifecycle, and the ONE external rAF that ticks the
 * director and writes DOM transforms (composited only — no layout writes).
 */
export function CharacterGuideLayer({ tier }: { tier: "low" | "high" }) {
  const hitRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const flags = debugFlags();

  useEffect(() => {
    const stopDirector = director.start();
    let raf = 0;
    let lastW = 0;
    let lastH = 0;

    let warned = false;
    const loop = () => {
      // A transient DOM error must not kill the robot for the whole session.
      try {
        tickOnce();
      } catch (err) {
        if (!warned) {
          warned = true;
          console.error("[character-guide] tick failed:", err);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    const tickOnce = () => {
      director.tick();
      const s = robotStore.get();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const hit = hitRef.current;
      if (hit) {
        const show = s.visible && s.gateCleared && s.mode === "ground" && !s.modalOpen;
        hit.style.display = show ? "" : "none";
        if (show) {
          const w = Math.max(44, s.boundsW);
          const h = Math.max(60, s.boundsH);
          if (Math.abs(w - lastW) > 2 || Math.abs(h - lastH) > 2) {
            hit.style.width = `${w}px`;
            hit.style.height = `${h}px`;
            lastW = w;
            lastH = h;
          }
          hit.style.transform = `translate3d(${s.screenX - w / 2}px, ${s.screenY - h}px, 0)`;
        }
      }

      const bub = bubbleRef.current;
      // Imperative guard: never show a bubble mid-dash/slide/modal, regardless
      // of React's flush timing relative to this rAF. Rope descents DO talk —
      // and a line that survives a landing gets re-shown once grounded.
      const canSpeak = s.mode === "ground" || s.mode === "rope";
      if (bub && bub.dataset.state === "shown" && (!s.currentLine || !canSpeak || s.modalOpen)) {
        bub.dataset.state = "hidden";
      } else if (bub && bub.dataset.state === "hidden" && s.currentLine && canSpeak && !s.modalOpen) {
        bub.dataset.state = "shown";
      }
      if (bub && bub.dataset.state === "shown") {
        const bw = bub.offsetWidth;
        const bh = bub.offsetHeight;
        const bx = clamp(s.headX - 30, 12, Math.max(12, vw - bw - 12));
        let by = s.headY - bh - 14;
        let tail: "down" | "up" = "down";
        if (by < 76) {
          by = s.screenY + 14;
          tail = "up";
        }
        bub.style.transform = `translate3d(${bx}px, ${by}px, 0)`;
        if (bub.dataset.tail !== tail) bub.dataset.tail = tail;
        bub.style.setProperty("--tail-x", `${clamp(s.headX - bx - 5, 12, bw - 26)}px`);
      }

      const hud = hudRef.current;
      if (hud) {
        hud.textContent = `robi ▸ mode:${s.mode} sect:${s.activeSection ?? "-"} arr:${s.arrived ? 1 : 0} vel:${sceneStore.get().velocity.toFixed(1)} feet:${Math.round(s.screenX)},${Math.round(s.screenY)}`;
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      stopDirector();
    };
  }, []);

  return (
    <>
      <Canvas
        className="robot-canvas"
        style={{ position: "fixed", inset: 0 }}
        dpr={dprFor(tier)}
        gl={{ alpha: true, antialias: true, stencil: false, powerPreference: "default" }}
        camera={{ position: [0, 0, CAM_Z], fov: CAM_FOV, near: 0.1, far: 30 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          // Survive GPU context loss without taking the page down.
          gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
      >
        <RobotRig tier={tier} />
      </Canvas>
      <RobotSpeech bubbleRef={bubbleRef} />
      <RobotHitArea hitRef={hitRef} />
      {flags.hud && <div className="robot-hud" ref={hudRef} aria-hidden="true" />}
    </>
  );
}
