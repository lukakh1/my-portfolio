"use client";

import { director } from "../model/robot-director";

/**
 * The only interactive piece — a fixed div tracking the robot's screen rect
 * (positioned by the layer's rAF). Carries [data-cursor] so the site's
 * custom cursor ring swells over it. aria-hidden: the robot is decorative;
 * everything it says duplicates the page content.
 */
export function RobotHitArea({ hitRef }: { hitRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={hitRef}
      className="robot-hit"
      data-cursor
      aria-hidden="true"
      style={{ display: "none" }}
      onMouseEnter={() => director.handleHoverChange(true)}
      onMouseLeave={() => director.handleHoverChange(false)}
      onClick={() => director.handleClick()}
    />
  );
}
