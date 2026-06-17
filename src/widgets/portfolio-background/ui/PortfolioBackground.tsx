"use client";

import { useSyncExternalStore } from "react";

import { getTier, type Tier } from "@/shared/three";

const subscribe = () => () => {};
const serverTier = (): Tier => "off";

/**
 * Fixed background stage for the deep-space observatory. A cinematic ambient
 * video (the station's window onto the starfield) drifts at the very bottom of
 * the stack; the cool `.bg-fx` gradient + grain wash over it and the WebGL
 * starfield draws on top. On the "off" tier (reduced-motion / no WebGL2 /
 * phone) it degrades to the static poster still, so there is never a black
 * void — only the observatory at rest.
 */
export function PortfolioBackground() {
  const tier = useSyncExternalStore(subscribe, getTier, serverTier);
  const motion = tier !== "off";

  return (
    <>
      <div className="bg-stage" aria-hidden>
        {motion ? (
          // Decorative ambient loop — no audio track.
          <video
            className="bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/observatory/ambient-poster.jpg"
          >
            <source src="/observatory/ambient-loop.mp4" type="video/mp4" />
          </video>
        ) : (
          // Static fallback; a plain <img> is correct for a full-bleed decorative backdrop.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="bg-poster" src="/observatory/ambient-poster.jpg" alt="" />
        )}
      </div>
      <div className="bg-fx" aria-hidden />
      <div className="noise" aria-hidden />
    </>
  );
}
