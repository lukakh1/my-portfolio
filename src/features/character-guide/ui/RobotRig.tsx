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
import { ShockRing, type ShockHandle } from "./ShockRing";

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
  const ringRef = useRef<ShockHandle | null>(null);
  const size = useThree((s) => s.size);

  // Dev-only: under the headless-preview pump, fiber's shared loop can stall
  // if its first rAF was scheduled pre-shim — keep poking it back to life.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!new URLSearchParams(window.location.search).get("robi")?.includes("pump")) return;
    const id = window.setInterval(() => invalidate(), 250);
    return () => window.clearInterval(id);
  }, []);

  // Warm ember under-glow "shadow" — a dark blob is invisible on a near-black
  // site, so the ground contact is a soft light pool instead.
  const shadowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, "rgba(255, 150, 70, 0.8)");
    grad.addColorStop(0.55, "rgba(230, 95, 40, 0.3)");
    grad.addColorStop(1, "rgba(180, 60, 20, 0)");
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
      ring: ringRef.current,
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
      {/* Warm key / cool teal rim / cyan kicker — keeps the orange shell
          saturated while tying him to the cold observatory world. */}
      <ambientLight intensity={0.55} color="#cfd8ff" />
      <directionalLight position={[3, 6, 5]} intensity={2.2} color="#fff1e0" />
      <directionalLight position={[-4, 2, -4]} intensity={1.6} color="#22d3ee" />
      <directionalLight position={[2, 1, -2]} intensity={0.7} color="#38e1ff" />

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
      <ShockRing
        register={(h) => {
          ringRef.current = h;
        }}
      />
    </>
  );
}
