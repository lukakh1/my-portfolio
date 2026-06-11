"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { getTier } from "@/shared/three";

import "../lib/headless-pump";
import { getEligibility, subscribeEligibility } from "../lib/eligibility";

// `ssr: false` is only valid inside a Client Component (same pattern as
// SceneRoot.client.tsx, confirmed against the bundled Next 16 docs). Keeps
// the robot bundle off the critical path entirely.
const CharacterGuideLayer = dynamic(
  () => import("./CharacterGuideLayer").then((m) => m.CharacterGuideLayer),
  { ssr: false },
);

function getSnapshot(): "low" | "high" | null {
  const tier = getTier();
  if (tier === "off" || !getEligibility()) return null;
  return tier;
}
const serverSnapshot = () => null;

/**
 * Client-only gate for the robot tour guide. Desktop-only: requires a
 * non-"off" GPU tier AND a hover-capable fine pointer ≥700px (live media
 * query — shrinking the window unmounts the whole layer and frees the GL
 * context; module-level memory keeps it from re-greeting on remount).
 */
export function CharacterGuide() {
  const tier = useSyncExternalStore(subscribeEligibility, getSnapshot, serverSnapshot);
  if (!tier) return null;
  return <CharacterGuideLayer tier={tier} />;
}
