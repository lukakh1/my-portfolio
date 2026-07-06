"use client";

import { useEffect, useState } from "react";

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tbilisi",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * Live local time in Kutaisi (UTC+4), ticking each second. Renders a stable
 * placeholder on the server and for the first client paint (state starts null),
 * so there's no hydration mismatch from reading the clock during render.
 */
export function NavClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="nav-clock" aria-hidden>
      <span className="dot" />
      <span className="nav-clock-label">Kutaisi</span>
      <span className="nav-clock-time">{time ?? "--:--:--"}</span>
    </span>
  );
}
