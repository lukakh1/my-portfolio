"use client";

import { useEffect, useState } from "react";

import { createSfx, type SfxName } from "../lib/sfx";
import { soundStore } from "../model/sound-store";

/**
 * Mounts the persistent sound toggle and wires micro-feedback: a pop on
 * link/button clicks and custom `sfx` events dispatched by the physics
 * features (card throws, pill flicks). Muted by default; the preference
 * persists in localStorage.
 */
export function SoundFxRoot() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sfx = createSfx();
    const initial = soundStore.init();
    sfx.setEnabled(initial);
    const raf = requestAnimationFrame(() => setOn(initial));

    const unsub = soundStore.subscribe((next) => {
      setOn(next);
      sfx.setEnabled(next);
      if (next) sfx.play("pop");
    });

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("a, button")) sfx.play("pop");
    };
    const onSfx = (e: Event) => {
      const name = (e as CustomEvent<SfxName>).detail;
      if (name === "pop" || name === "tick" || name === "whoosh") sfx.play(name);
    };

    document.addEventListener("click", onClick, { passive: true });
    window.addEventListener("sfx", onSfx);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      document.removeEventListener("click", onClick);
      window.removeEventListener("sfx", onSfx);
    };
  }, []);

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      onClick={() => soundStore.set(!soundStore.get())}
    >
      {on ? "sound: on" : "sound: off"}
    </button>
  );
}
