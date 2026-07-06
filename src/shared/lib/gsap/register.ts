"use client";

import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once per client; safe to import from any feature.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);
}

export { gsap, ScrollTrigger, Draggable, InertiaPlugin };
