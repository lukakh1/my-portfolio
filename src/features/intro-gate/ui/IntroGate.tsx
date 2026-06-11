"use client";

/* eslint-disable react-hooks/set-state-in-effect -- one-time client-only init:
   localStorage / sessionStorage / matchMedia are unavailable during SSR, and
   `show` / `soundOn` must be sticky, mutable React state. */

import { useCallback, useEffect, useRef, useState } from "react";

import { createAmbient, type Ambient } from "@/features/sound";
import { sceneStore } from "@/shared/three";

type Phase = "loading" | "ready" | "entering" | "done";

const LOAD_MS = 2000;
const ENTER_MS = 750;

/**
 * Cinematic "noise → signal" loader — now a two-hander with the robot.
 *
 * While the bar fills, Robi rappels onto the stage and walks the bar tip
 * (the character-guide director reads `sceneStore.introProgress` + the
 * `.intro-bar` rect; `html.robi-stage` lifts his canvas above the gate).
 * On enter he jets off the right edge, the gate fades, the page slides in
 * right-to-left (`html.page-enter`), and he flies back in from the left.
 *
 * Perf: the progress loop writes refs + sceneStore directly — zero React
 * re-renders per frame, and only compositor-friendly properties animate
 * (transform / opacity / filter; the old letter-spacing thrash is gone).
 * Shown once per session; skipped entirely under reduced-motion.
 */
export function IntroGate() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [soundOn, setSoundOn] = useState(false);
  const ambientRef = useRef<Ambient | null>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("loading");
  const enteredRef = useRef(false);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    setSoundOn(localStorage.getItem("sound-on") === "1");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("intro-seen") === "1";
    if (!reduce && !seen) {
      setShow(true);
      sceneStore.setGatePhase("loading");
      document.documentElement.classList.add("robi-stage");
    } else {
      sceneStore.setGatePhase("none");
    }
    return () => {
      document.documentElement.classList.remove("robi-stage", "page-enter");
    };
  }, []);

  // Count-up while loading — refs only, no state per frame.
  useEffect(() => {
    if (!show || phase !== "loading") return;
    let raf = 0;
    const start = performance.now();
    const loop = (nowT: number) => {
      const t = Math.min(1, (nowT - start) / LOAD_MS);
      const p = 1 - Math.pow(1 - t, 3);
      sceneStore.setIntroProgress(p);
      if (wordRef.current) {
        wordRef.current.style.filter = `blur(${(1 - p) * 14}px)`;
        wordRef.current.style.opacity = `${0.15 + p * 0.85}`;
        wordRef.current.style.transform = `scale(${1.06 - p * 0.06})`;
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      if (statusRef.current) {
        statusRef.current.textContent = `compiling… ${Math.round(p * 100)}%`;
      }
      if (t < 1) {
        raf = requestAnimationFrame(loop);
      } else {
        if (statusRef.current) statusRef.current.textContent = "enter ▸";
        setPhase("ready");
        sceneStore.setGatePhase("ready");
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [show, phase]);

  const enter = useCallback(() => {
    // side effects live OUT of the setState updater (purity under
    // StrictMode/concurrent re-runs); enteredRef makes the click one-shot
    if (enteredRef.current || phaseRef.current !== "ready") return;
    enteredRef.current = true;
    phaseRef.current = "entering";
    sessionStorage.setItem("intro-seen", "1");
    if (soundOn) {
      ambientRef.current = ambientRef.current ?? createAmbient();
      ambientRef.current.start();
    }
    sceneStore.setGatePhase("entering");
    document.documentElement.classList.add("page-enter");
    window.setTimeout(() => {
      setPhase("done");
      sceneStore.setGatePhase("done");
      document.documentElement.classList.remove("robi-stage");
    }, ENTER_MS);
    // the slide-in animation is finished by then; drop the hook class
    window.setTimeout(() => {
      document.documentElement.classList.remove("page-enter");
    }, 2200);
    setPhase("entering");
  }, [soundOn]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      // don't hijack a focused button (sound toggle) — its own activation
      // must not double as "enter the site"
      if ((e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.key === "Enter" || e.key === " ") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, enter]);

  const toggleSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSoundOn((v) => {
      const next = !v;
      localStorage.setItem("sound-on", next ? "1" : "0");
      if (next) {
        ambientRef.current = ambientRef.current ?? createAmbient();
        ambientRef.current.start();
      } else {
        ambientRef.current?.stop();
      }
      return next;
    });
  }, []);

  if (!show) return null;

  // After the wipe, keep only a small persistent sound toggle.
  if (phase === "done") {
    return (
      <button
        type="button"
        className="sound-toggle"
        onClick={toggleSound}
        aria-pressed={soundOn}
      >
        {soundOn ? "♪ sound on" : "♪ sound off"}
      </button>
    );
  }

  return (
    <div
      className={`intro ${phase}`}
      onClick={enter}
      role="presentation"
      aria-hidden
    >
      <div className="intro-inner">
        <div
          ref={wordRef}
          className="intro-word"
          style={{ filter: "blur(14px)", opacity: 0.15, transform: "scale(1.06)" }}
        >
          LUKA
        </div>
        <div className="intro-bar">
          <span ref={fillRef} style={{ transform: "scaleX(0)" }} />
        </div>
        <div ref={statusRef} className="intro-status">
          compiling… 0%
        </div>
        <button
          type="button"
          className="intro-sound"
          onClick={toggleSound}
          aria-pressed={soundOn}
        >
          {soundOn ? "♪ sound on" : "♪ sound off"}
        </button>
      </div>
    </div>
  );
}
