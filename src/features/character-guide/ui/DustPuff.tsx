"use client";

/* eslint-disable react-hooks/immutability -- particle pool: pre-allocated
   scratch state mutated per-frame inside useFrame, never during render. */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 8;
const LIFE = 0.45;

export interface DustHandle {
  burst(x: number, y: number, strength: number): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  size: number;
  active: boolean;
}

/**
 * Tiny one-draw-call landing puff: 8 additive radial sprites kicked outward
 * in a ring, faded by darkening their instance color (additive blending turns
 * black into invisible — no per-instance alpha needed).
 */
export function DustPuff({ register }: { register: (h: DustHandle) => void }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        age: LIFE,
        size: 0.1,
        active: false,
      })),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(16, 16, 1, 16, 16, 15);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    register({
      burst(x, y, strength) {
        for (let i = 0; i < COUNT; i++) {
          const p = particles[i];
          const a = (i / COUNT) * Math.PI * 2 + Math.random() * 0.6;
          const speed = (0.6 + Math.random() * 0.6) * strength;
          p.x = x + Math.cos(a) * 0.12;
          p.y = y + 0.03;
          p.vx = Math.cos(a) * speed;
          p.vy = 0.3 + Math.random() * 0.25 * strength;
          p.age = 0;
          p.size = 0.07 + Math.random() * 0.05;
          p.active = true;
        }
      },
    });
  }, [register, particles]);

  useFrame((_, rawDt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(rawDt, 1 / 30);
    let any = false;
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      if (p.active) {
        p.age += dt;
        if (p.age >= LIFE) p.active = false;
        p.vy -= 1.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - 2.5 * dt;
      }
      const t = p.active ? p.age / LIFE : 1;
      const s = p.active ? p.size * (1 + t * 2.4) : 0.0001;
      dummy.position.set(p.x, p.y, 0.2);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.9, 0.6, 0.36).multiplyScalar(p.active ? (1 - t) * 0.55 : 0);
      mesh.setColorAt(i, color);
      if (p.active) any = true;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.visible = any;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
