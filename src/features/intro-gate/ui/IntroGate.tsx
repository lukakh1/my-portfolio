"use client";

/* eslint-disable react-hooks/set-state-in-effect -- one-time client-only init:
   localStorage / sessionStorage / matchMedia are unavailable during SSR, and
   `show` / `soundOn` must be sticky, mutable React state. */

import { useCallback, useEffect, useRef, useState } from "react";

import { createAmbient, type Ambient } from "@/features/sound";

type Phase = "loading" | "ready" | "entering" | "done";

const LOAD_MS = 1700;

/**
 * Cinematic "noise → signal" loader. A mono progress readout counts up while the
 * "LUKA" wordmark resolves out of blur; at 100% the visitor enters (click / any
 * key), the overlay wipes away to hand off to the hero, and an optional ambient
 * bed can be toggled (off by default, remembered). Shown once per session;
 * skipped entirely under reduced-motion.
 */
export function IntroGate() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const ambientRef = useRef<Ambient | null>(null);

  useEffect(() => {
    setSoundOn(localStorage.getItem("sound-on") === "1");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("intro-seen") === "1";
    if (!reduce && !seen) setShow(true);
  }, []);

  // Count-up while loading.
  useEffect(() => {
    if (!show || phase !== "loading") return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / LOAD_MS);
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(loop);
      else setPhase("ready");
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [show, phase]);

  const enter = useCallback(() => {
    setPhase((p) => {
      if (p !== "ready") return p;
      sessionStorage.setItem("intro-seen", "1");
      if (soundOn) {
        ambientRef.current = ambientRef.current ?? createAmbient();
        ambientRef.current.start();
      }
      window.setTimeout(() => setPhase("done"), 850);
      return "entering";
    });
  }, [soundOn]);

  useEffect(() => {
    if (!show) return;
    const onKey = () => enter();
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

  const p = progress / 100;

  return (
    <div
      className={`intro ${phase}`}
      onClick={enter}
      role="presentation"
      aria-hidden
    >
      <div className="intro-inner">
        <div
          className="intro-word"
          style={{
            filter: `blur(${(1 - p) * 14}px)`,
            opacity: 0.15 + p * 0.85,
            letterSpacing: `${(1 - p) * 0.45}em`,
          }}
        >
          LUKA
        </div>
        <div className="intro-bar">
          <span style={{ transform: `scaleX(${p})` }} />
        </div>
        <div className="intro-status">
          {phase === "ready" ? "enter ▸" : `compiling… ${progress}%`}
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
