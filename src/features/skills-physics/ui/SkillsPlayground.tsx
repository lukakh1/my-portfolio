"use client";

import { useEffect, useRef, useState } from "react";

import { skillCategories } from "@/shared/config/portfolio-content";
import { fullMotionOk, gsap, ScrollTrigger } from "@/shared/lib/gsap";

import { bodyAngle, bodyCenter, VerletWorld, type PillBody } from "../lib/verlet";

/**
 * Small aesthetic gap between the settled pile and the bin's bottom edge.
 *
 * This used to be 24px and was load-bearing: it was compensating for the bug
 * fixed in `readBounds()` below, and it still wasn't enough — the pile
 * regularly sank ~26px past the clipped edge and the bottom row of pills came
 * out sliced. Now the floor is correct, so this is purely visual breathing
 * room and can be small.
 */
const FLOOR_INSET = 6;

/**
 * The playful skills bin: on capable desktops the static category grid gets a
 * companion "toy box" where every skill pill tumbles in with gravity and can
 * be flicked around. The static grid stays as the SSR/crawler/mobile truth —
 * this bin is aria-hidden garnish.
 *
 * Listens for `egg:gravity-flip` (easter egg) to flip gravity for a moment.
 */
export function SkillsPlayground() {
  const [enabled, setEnabled] = useState(false);
  const binRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Deferred a frame: keeps SSR markup identical and avoids a synchronous
    // setState cascade during hydration.
    const id = requestAnimationFrame(() => {
      if (fullMotionOk()) setEnabled(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const bin = binRef.current;
    if (!bin) return;

    const world = new VerletWorld();
    const pills = Array.from(bin.querySelectorAll<HTMLElement>(".phys-pill"));
    let raf = 0;
    let running = false;
    let spawned = false;
    let inView = false;

    const render = () => {
      for (const b of world.bodies) {
        const c = bodyCenter(b);
        let a = bodyAngle(b);
        // Keep the label readable: a capsule is symmetric, so flipping the
        // rendered angle by 180° never mismatches the physics.
        if (a > Math.PI / 2) a -= Math.PI;
        else if (a < -Math.PI / 2) a += Math.PI;
        const s = b.grabbed ? " scale(1.1)" : "";
        b.el.style.transform = `translate(${(c.x - b.w / 2).toFixed(2)}px, ${(c.y - b.h / 2).toFixed(2)}px) rotate(${a.toFixed(4)}rad)${s}`;
      }
    };

    let last = 0;
    const frame = (t: number) => {
      const dt = Math.min(1 / 30, (t - last) / 1000 || 1 / 60);
      last = t;
      const alive = world.step(dt);
      render();
      if (alive && inView) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
      }
    };

    const wake = () => {
      world.wake();
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    /**
     * The bin's own layout box, in the coordinate space the absolutely
     * positioned pills actually live in.
     *
     * `getBoundingClientRect()` is WRONG here and was the cause of the
     * long-standing "bottom row gets sliced" bug. ScrollFxRoot skews every
     * `main > section` by up to ±2.2° in proportion to scroll velocity, and
     * `spawn()` runs from a ScrollTrigger — i.e. precisely while the page is
     * moving fast. getBoundingClientRect returns the axis-aligned bounds of
     * the *transformed* box, so on a ~1124px-wide bin a 2.18° skew reported
     * 382.85px of height for a 340px element. The floor was then set ~43px
     * below the visible bottom and the pile settled outside the clip.
     *
     * clientWidth/clientHeight are layout values: transform-immune, and they
     * exclude the border, which is exactly the padding box the pills are
     * positioned against.
     */
    const readBounds = () => ({
      w: bin.clientWidth,
      h: bin.clientHeight,
    });

    const spawn = () => {
      if (spawned) return;
      spawned = true;
      const { w: binW, h: binH } = readBounds();
      world.setBounds(binW, binH - FLOOR_INSET);
      pills.forEach((el, i) => {
        setTimeout(() => {
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          const x = gsap.utils.random(w, binW - w);
          const y = -h - gsap.utils.random(0, 120);
          const body = world.addPill(el, w, h, x, y);
          body.a.px = body.a.x + gsap.utils.random(-3, 3);
          body.b.px = body.b.x + gsap.utils.random(-3, 3);
          el.style.visibility = "visible";
          wake();
        }, i * 55);
      });
    };

    // Pointer interaction: grab the pill under the pointer, drag it
    // kinematically, and let release velocity come from the verlet history.
    let grabbed: PillBody | null = null;
    let grabOff = { ax: 0, ay: 0, bx: 0, by: 0 };

    const toLocal = (e: PointerEvent) => {
      const r = bin.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest?.(".phys-pill");
      if (!el) return;
      const body = world.bodies.find((b) => b.el === el);
      if (!body) return;
      e.preventDefault();
      const p = toLocal(e);
      grabbed = body;
      body.grabbed = true;
      grabOff = {
        ax: body.a.x - p.x,
        ay: body.a.y - p.y,
        bx: body.b.x - p.x,
        by: body.b.y - p.y,
      };
      bin.setPointerCapture(e.pointerId);
      el.classList.add("is-grabbed");
      wake();
    };

    const onMove = (e: PointerEvent) => {
      if (!grabbed) return;
      const p = toLocal(e);
      const b = grabbed;
      b.a.px = b.a.x;
      b.a.py = b.a.y;
      b.b.px = b.b.x;
      b.b.py = b.b.y;
      b.a.x = p.x + grabOff.ax;
      b.a.y = p.y + grabOff.ay;
      b.b.x = p.x + grabOff.bx;
      b.b.y = p.y + grabOff.by;
      wake();
    };

    const onUp = () => {
      if (!grabbed) return;
      grabbed.grabbed = false;
      grabbed.el.classList.remove("is-grabbed");
      grabbed = null;
      window.dispatchEvent(new CustomEvent("sfx", { detail: "whoosh" }));
      wake();
    };

    bin.addEventListener("pointerdown", onDown);
    bin.addEventListener("pointermove", onMove);
    bin.addEventListener("pointerup", onUp);
    bin.addEventListener("pointercancel", onUp);

    const onFlip = () => {
      world.gravity = -world.gravity;
      wake();
      setTimeout(() => {
        world.gravity = Math.abs(world.gravity);
        wake();
      }, 2600);
    };
    window.addEventListener("egg:gravity-flip", onFlip);

    // Bounds were previously set once and never revisited, so resizing the
    // window left the floor and walls where they were at spawn time — pills
    // then piled up outside a narrower bin, or floated above a taller one.
    const ro = new ResizeObserver(() => {
      if (!spawned) return;
      const { w, h } = readBounds();
      if (!w || !h) return;
      world.setBounds(w, h - FLOOR_INSET);
      wake(); // let the pile resettle into the new box
    });
    ro.observe(bin);

    const st = ScrollTrigger.create({
      trigger: bin,
      start: "top 85%",
      end: "bottom top",
      onEnter: () => {
        inView = true;
        spawn();
        wake();
      },
      onEnterBack: () => {
        inView = true;
        wake();
      },
      onLeave: () => {
        inView = false;
      },
      onLeaveBack: () => {
        inView = false;
      },
    });

    return () => {
      st.kill();
      ro.disconnect();
      cancelAnimationFrame(raf);
      bin.removeEventListener("pointerdown", onDown);
      bin.removeEventListener("pointermove", onMove);
      bin.removeEventListener("pointerup", onUp);
      bin.removeEventListener("pointercancel", onUp);
      window.removeEventListener("egg:gravity-flip", onFlip);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="skills-bin-wrap reveal" data-delay="2" aria-hidden>
      <div className="skills-bin-label">
        The same stack, as a toy — grab a pill and throw it.
      </div>
      <div className="skills-bin" ref={binRef}>
        {skillCategories.flatMap((cat) =>
          cat.pills.map((pill) => (
            <span
              key={`${cat.id}-${pill}`}
              className="phys-pill"
              data-cat={cat.id}
              style={{ visibility: "hidden" }}
            >
              {pill}
            </span>
          )),
        )}
      </div>
    </div>
  );
}
