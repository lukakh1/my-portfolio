"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import type { Tier } from "../lib/capabilities";
import { dprFor } from "../lib/dpr";
import { ParticleField } from "./ParticleField";
import { PostFx } from "./PostFx";

const VOID_COLOR = new THREE.Color("#050510");

export function SceneRoot({ tier }: { tier: Tier }) {
  return (
    <Canvas
      className="scene-canvas"
      style={{ position: "fixed", inset: 0 }}
      dpr={dprFor(tier)}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 50 }}
      onCreated={({ gl }) => {
        gl.setClearColor(VOID_COLOR, 1);
        // Survive GPU context loss without taking the page down.
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        );
      }}
    >
      <ParticleField tier={tier} />
      {tier === "high" && <PostFx />}
    </Canvas>
  );
}
