"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";

import { getTier, type Tier } from "../lib/capabilities";
import { sceneStore } from "../model/scene-store";

// `ssr: false` is only valid inside a Client Component (confirmed against the
// bundled Next 16 docs). This keeps the whole three.js bundle off the critical
// path — it loads in a separate client chunk after hydration.
const SceneRoot = dynamic(() => import("./SceneRoot").then((m) => m.SceneRoot), {
  ssr: false,
});

const subscribe = () => () => {};
const serverTier = (): Tier => "off";

/**
 * Client-only gate for the WebGL backdrop. `useSyncExternalStore` reads the tier
 * as a client snapshot ("off" on the server), so there's no setState-in-effect
 * and no hydration mismatch. On "off" (reduced-motion / no WebGL2 / phone) it
 * renders nothing and the static CSS `.bg-fx` backdrop remains.
 */
export function SceneRootClient() {
  const tier = useSyncExternalStore(subscribe, getTier, serverTier);

  useEffect(() => {
    sceneStore.setTier(tier);
  }, [tier]);

  if (tier === "off") return null;
  return <SceneRoot tier={tier} />;
}
