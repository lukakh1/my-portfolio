"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { robotStore } from "../model/robot-store";

const CPS = 28;

function delayFor(ch: string) {
  const base = 1000 / CPS;
  if (",;:".includes(ch)) return base + 120;
  if (".!?".includes(ch)) return base + 220;
  if (ch === "—") return base + 180;
  return base;
}

/**
 * The terminal-style speech bubble. Typewriter mutates `textContent` inside
 * its own timer chain — no React state per character. Positioning (follows
 * the robot's head, flips, clamps) is done by the layer's rAF on the same
 * element via `bubbleRef`.
 */
export function RobotSpeech({ bubbleRef }: { bubbleRef: React.RefObject<HTMLDivElement | null> }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSyncExternalStore(
    robotStore.subscribe,
    () => robotStore.get().version,
    () => 0,
  );
  const s = robotStore.get();
  const lineId = s.currentLine?.id ?? null;
  const lineText = s.currentLine?.text ?? "";
  const ff = s.fastForwardAt;

  /* run the typewriter on line change */
  useEffect(() => {
    const el = textRef.current;
    const bub = bubbleRef.current;
    if (!el || !bub) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!lineId) {
      bub.dataset.state = "hidden";
      // keep the last progress — the director uses it to detect interruptions
      robotStore.setSpeaking(false, robotStore.get().speakingProgress);
      return;
    }

    let i = 0;
    let cancelled = false;
    el.textContent = "";
    bub.dataset.state = "shown";
    robotStore.setSpeaking(true, 0);

    const tick = () => {
      if (cancelled) return;
      i++;
      el.textContent = lineText.slice(0, i);
      robotStore.setSpeaking(i < lineText.length, i / lineText.length);
      if (i < lineText.length) {
        timerRef.current = setTimeout(tick, delayFor(lineText[i - 1]));
      } else {
        timerRef.current = setTimeout(
          () => {
            if (robotStore.get().currentLine?.id === lineId) robotStore.setLine(null);
          },
          2600 + 40 * lineText.length,
        );
      }
    };
    timerRef.current = setTimeout(tick, 80);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lineId, lineText, bubbleRef]);

  /* click on the robot mid-line → finish instantly */
  useEffect(() => {
    if (!lineId) return;
    const el = textRef.current;
    if (!el || el.textContent === lineText) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    el.textContent = lineText;
    robotStore.setSpeaking(false, 1);
    timerRef.current = setTimeout(
      () => {
        if (robotStore.get().currentLine?.id === lineId) robotStore.setLine(null);
      },
      2600 + 40 * lineText.length,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ff is the trigger
  }, [ff]);

  return (
    <div className="robot-bubble" ref={bubbleRef} data-state="hidden" data-tail="down" aria-hidden="true">
      <span className="rb-prompt">robi&gt; </span>
      <span ref={textRef} />
      <span className="rb-caret">▌</span>
    </div>
  );
}
