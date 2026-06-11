"use client";

/* eslint-disable react-hooks/immutability -- pooled effect: pre-allocated
   ring state mutated per-frame inside useFrame, never during render. */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { CAM_Z } from "../lib/screen-world";

const COUNT = 3;
const LIFE = 0.42;
/** Rings sit at z=-0.3 — projection factor keeps them under the feet. */
const K = (CAM_Z + 0.3) / CAM_Z;

export interface ShockHandle {
  burst(x: number, y: number, strength: number): void;
}

interface Ring {
  x: number;
  y: number;
  age: number;
  strength: number;
  active: boolean;
}

/**
 * Pooled ground-impact shock rings: flattened additive ellipses that expand
 * and fade on dash/rope/hop landings. One InstancedMesh, fade by darkening
 * instance color (additive blending turns black invisible).
 */
export function ShockRing({ register }: { register: (h: ShockHandle) => void }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const rings = useMemo<Ring[]>(
    () => Array.from({ length: COUNT }, () => ({ x: 0, y: 0, age: LIFE, strength: 1, active: false })),
    [],
  );
  const next = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    register({
      burst(x, y, strength) {
        const r = rings[next.current % COUNT];
        next.current++;
        r.x = x;
        r.y = y;
        r.age = 0;
        r.strength = strength;
        r.active = true;
      },
    });
  }, [register, rings]);

  useFrame((_, rawDt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(rawDt, 1 / 30);
    let any = false;
    for (let i = 0; i < COUNT; i++) {
      const r = rings[i];
      if (r.active) {
        r.age += dt;
        if (r.age >= LIFE) r.active = false;
      }
      const t = r.active ? r.age / LIFE : 1;
      const ease = 1 - Math.pow(1 - t, 3);
      const s = r.active ? (0.25 + 1.15 * ease) * r.strength : 0.0001;
      dummy.position.set(r.x * K, (r.y + 0.02) * K, -0.3);
      dummy.scale.set(s, s * 0.34, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.5, 0.85, 1).multiplyScalar(r.active ? (1 - t) * 0.8 : 0);
      mesh.setColorAt(i, color);
      if (r.active) any = true;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.visible = any;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} visible={false}>
      <ringGeometry args={[0.88, 1, 40]} />
      <meshBasicMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
