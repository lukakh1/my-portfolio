"use client";

/* eslint-disable react-hooks/immutability -- this is an imperative WebGL render
   loop: react-three-fiber mutates uniforms and three.js objects every frame by
   design, which the React-Compiler immutability heuristic doesn't model. */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three-stdlib";

import type { Tier } from "../lib/capabilities";
import { simSizeFor } from "../lib/dpr";
import {
  makeScatterTexture,
  makeSphereTexture,
  makeTextTexture,
} from "../lib/targets";
import { sceneStore } from "../model/scene-store";
import {
  particlesFragment,
  particlesVertex,
} from "../shaders/particles.glsl";
import { simulationFragment } from "../shaders/simulation.glsl";

const SPHERE_RADIUS = 1.7;
const FIELD_OFFSET = new THREE.Vector3(1.9, 0.5, 0);
const WORDMARK = "LUKA";
const MORPH_START = 2.6; // seconds after mount
const MORPH_END = 5.6;

/**
 * The signature hero effect: a GPGPU particle field that condenses from a
 * scattered cloud into a sphere on load, briefly resolves the "LUKA" wordmark,
 * swirls around the pointer, and disperses as the hero scrolls away.
 */
export function ParticleField({ tier }: { tier: Tier }) {
  const gl = useThree((s) => s.gl);

  const pointsRef = useRef<THREE.Points>(null);
  const startRef = useRef<number | null>(null);
  const introFired = useRef(false);
  const gateWasUp = useRef(false);
  const lastRecondense = useRef(0);
  const worldMouse = useMemo(() => new THREE.Vector3(), []);
  const localMouse = useMemo(() => new THREE.Vector3(999, 999, 999), []);

  const sim = useMemo(() => {
    const size = simSizeFor(tier);
    const gpu = new GPUComputationRenderer(size, size, gl);

    const initial = makeScatterTexture(size);
    const positionVariable = gpu.addVariable(
      "texturePosition",
      simulationFragment,
      initial,
    );
    gpu.setVariableDependencies(positionVariable, [positionVariable]);

    const sphereTex = makeSphereTexture(size, SPHERE_RADIUS);
    const textTex = makeTextTexture(size, WORDMARK);
    const u = positionVariable.material.uniforms;
    u.uTargetA = { value: sphereTex };
    u.uTargetB = { value: textTex };
    u.uMorph = { value: 0 };
    u.uScatter = { value: 0 };
    u.uTime = { value: 0 };
    u.uFlow = { value: 1 };
    u.uMouse = { value: new THREE.Vector3(999, 999, 999) };
    u.uMouseStrength = { value: 0 };
    u.uOffset = { value: FIELD_OFFSET.clone() };

    const error = gpu.init();
    if (error) console.error("[ParticleField] GPGPU init:", error);

    // Render geometry: one vertex per particle, carrying its texture coordinate.
    const count = size * size;
    const refs = new Float32Array(count * 2);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      refs[i * 2] = (i % size) / size;
      refs[i * 2 + 1] = Math.floor(i / size) / size;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("ref", new THREE.BufferAttribute(refs, 2));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPositions: { value: null },
        uSize: { value: tier === "high" ? 2.6 : 2.2 },
        uScale: { value: 30 },
        uColorNear: { value: new THREE.Color("#cff8ff") },
        uColorFar: { value: new THREE.Color("#143a66") },
        uOpacity: { value: 0.34 },
        uTime: { value: 0 },
      },
      vertexShader: particlesVertex,
      fragmentShader: particlesFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    return {
      gpu,
      positionVariable,
      geometry,
      material,
      disposables: [sphereTex, textTex, initial] as THREE.Texture[],
    };
  }, [gl, tier]);

  useEffect(() => {
    return () => {
      sim.geometry.dispose();
      sim.material.dispose();
      sim.disposables.forEach((t) => t.dispose());
      sim.gpu.dispose();
    };
  }, [sim]);

  useFrame((state) => {
    // Don't burn GPU on a backgrounded tab.
    if (typeof document !== "undefined" && document.hidden) return;
    const { gpu, positionVariable, material } = sim;
    const u = positionVariable.material.uniforms;
    const t = state.clock.elapsedTime;
    if (startRef.current === null) startRef.current = t;

    const store = sceneStore.get();

    // The intro gate is an opaque lid — don't burn 65k particles of GPU
    // behind it. When it lifts, replay the condense + wordmark so the
    // signature reveal happens where the visitor can actually see it.
    const gateUp = store.gatePhase === "loading" || store.gatePhase === "ready";
    if (gateUp) {
      gateWasUp.current = true;
      if (pointsRef.current) pointsRef.current.visible = false;
      return;
    }
    if (gateWasUp.current) {
      gateWasUp.current = false;
      startRef.current = t;
      if (pointsRef.current) pointsRef.current.visible = true;
    }

    // Back-to-top (or any recondense trigger) replays the condense + wordmark.
    if (store.recondenseAt !== lastRecondense.current) {
      lastRecondense.current = store.recondenseAt;
      startRef.current = t;
    }
    const local = t - startRef.current;

    u.uTime.value = t;

    // One-time wordmark reveal after the cloud has condensed.
    let morph = 0;
    if (local > MORPH_START && local < MORPH_END) {
      morph = Math.sin(((local - MORPH_START) / (MORPH_END - MORPH_START)) * Math.PI);
    }
    u.uMorph.value = morph;

    // Let the loader hand off once the field is established.
    if (!introFired.current && local > 0.8) {
      introFired.current = true;
      sceneStore.setIntroDone(true);
    }

    // Disperse over the first viewport of scroll; re-converge near the very
    // bottom (the contact "finale").
    const heroProg = Math.min(1, store.scroll / (window.innerHeight || 800));
    const endConverge = THREE.MathUtils.smoothstep(store.progress, 0.8, 0.98);

    // Past the hero the field is ~invisible (opacity 0.066) yet the sim and
    // the 65k-point draw used to run for the whole page. Sleep until the
    // contact finale needs us again — a real scroll-perf win site-wide.
    const persp0 = state.camera as THREE.PerspectiveCamera;
    const asleep = heroProg >= 1 && endConverge <= 0.001 && local > MORPH_END;
    if (pointsRef.current) pointsRef.current.visible = !asleep;
    if (asleep) {
      persp0.position.z = 8.2;
      return;
    }

    u.uScatter.value = heroProg * 1.15 * (1 - endConverge * 0.8);
    // Keep the drift calm and constant (no turbulence ramp on scroll).
    u.uFlow.value = 0.22;
    // Recede behind content: fade the field down to a faint ambient texture as
    // the hero scrolls away, so the copy is always the focus.
    material.uniforms.uOpacity.value = 0.34 * (1 - heroProg * 0.78);
    material.uniforms.uTime.value = t;

    // Pointer → world point on the z=0 plane → particle-local space.
    const persp = state.camera as THREE.PerspectiveCamera;
    const dist = persp.position.z;
    const vFOV = (persp.fov * Math.PI) / 180;
    const planeH = 2 * Math.tan(vFOV / 2) * dist;
    const planeW = planeH * (state.size.width / state.size.height);
    const targetStrength = store.pointerActive ? 1.4 : 0;
    u.uMouseStrength.value = THREE.MathUtils.lerp(
      u.uMouseStrength.value,
      targetStrength,
      store.pointerActive ? 0.12 : 0.05,
    );
    if (pointsRef.current) {
      const ry = pointsRef.current.rotation.y;
      worldMouse.set((store.pointerX * planeW) / 2, (store.pointerY * planeH) / 2, 0);
      const dx = worldMouse.x - FIELD_OFFSET.x;
      const dy = worldMouse.y - FIELD_OFFSET.y;
      const dz = worldMouse.z - FIELD_OFFSET.z;
      const cos = Math.cos(-ry);
      const sin = Math.sin(-ry);
      localMouse.set(dx * cos - dz * sin, dy, dx * sin + dz * cos);
      u.uMouse.value.copy(localMouse);
    }

    gpu.compute();
    material.uniforms.uPositions.value = gpu.getCurrentRenderTarget(
      positionVariable,
    ).texture;
    material.uniforms.uScale.value = (state.size.height * state.viewport.dpr) / 95;

    if (pointsRef.current) {
      pointsRef.current.rotation.y = local * 0.02;
    }
    // Subtle scroll dolly so the field recedes as the page scrolls.
    persp.position.z = 6 + heroProg * 2.2;
  });

  return (
    <points
      ref={pointsRef}
      geometry={sim.geometry}
      material={sim.material}
      position={[FIELD_OFFSET.x, FIELD_OFFSET.y, FIELD_OFFSET.z]}
      frustumCulled={false}
    />
  );
}
