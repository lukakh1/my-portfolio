"use client";

/* eslint-disable react-hooks/immutability -- imperative R3F rig: the refs
   container and scene.environment are mutated in ref callbacks / effects
   (commit phase), and the brain animates them per-frame in useFrame. */

import { invalidate, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { RobotBrain } from "../model/brain";
import { createRobotRefs } from "../model/rig";
import { DustPuff, type DustHandle } from "./DustPuff";
import { Robot } from "./Robot";

/**
 * Generated environment map (no network HDR) so the gunmetal panels read as
 * metal instead of flat darkness.
 */
function StudioEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.9;
    return () => {
      scene.environment = null;
      envTex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

export function RobotRig({ tier }: { tier: "low" | "high" }) {
  const refs = useMemo(() => createRobotRefs(), []);
  const brain = useMemo(() => new RobotBrain(refs), [refs]);
  const dustRef = useRef<DustHandle | null>(null);
  const size = useThree((s) => s.size);

  // Dev-only: under the headless-preview pump, fiber's shared loop can stall
  // if its first rAF was scheduled pre-shim — keep poking it back to life.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!new URLSearchParams(window.location.search).get("robi")?.includes("pump")) return;
    const id = window.setInterval(() => invalidate(), 250);
    return () => window.clearInterval(id);
  }, []);

  // Violet under-glow "shadow" — a dark blob is invisible on a near-black
  // site, so the ground contact is a soft light pool instead.
  const shadowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, "rgba(146, 100, 255, 0.85)");
    grad.addColorStop(0.55, "rgba(96, 78, 220, 0.32)");
    grad.addColorStop(1, "rgba(60, 50, 160, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => shadowTex.dispose(), [shadowTex]);

  useFrame((state, delta) => {
    brain.update({
      dt: Math.min(delta, 1 / 30),
      t: state.clock.elapsedTime,
      vw: size.width,
      vh: size.height,
      dust: dustRef.current,
    });
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __robi?: object }).__robi = {
        frames: ((window as unknown as { __robi?: { frames?: number } }).__robi?.frames ?? 0) + 1,
        debug: brain.debug,
        refsReady: !!(refs.root && refs.body && refs.torso && refs.head),
      };
    }
  });

  return (
    <>
      <StudioEnv />
      <ambientLight intensity={0.65} color="#b8c4ff" />
      <directionalLight position={[3, 6, 5]} intensity={2.1} />
      <directionalLight position={[-4, 2, -4]} intensity={1.5} color="#7c3aed" />
      <directionalLight position={[2, 1, -2]} intensity={0.5} color="#3b82f6" />

      <Robot refs={refs} withTrail={tier === "high"} />

      <mesh ref={(m) => void (refs.shadow = m)} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={(m) => void (refs.shadowMat = m)}
          map={shadowTex}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {tier === "high" && (
        <DustPuff
          register={(h) => {
            dustRef.current = h;
          }}
        />
      )}
    </>
  );
}
