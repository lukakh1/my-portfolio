"use client";

/* eslint-disable react-hooks/immutability -- imperative R3F rig: joint groups
   register themselves on the shared `refs` container inside ref callbacks,
   which run at commit (not during render). The brain mutates them per-frame
   in useFrame. This is the standard escape hatch for imperative three.js. */

import { RoundedBox, Trail } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import { FOOT_LIFT, BUILD_S, ORANGE, robotMats, type RobotRefs } from "../model/rig";

/** Cached radial glow textures (client-only module). */
const glowTexCache = new Map<string, THREE.CanvasTexture>();
function radialTex(key: string, stops: Array<[number, string]>): THREE.CanvasTexture {
  let tex = glowTexCache.get(key);
  if (tex) return tex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  for (const [at, color] of stops) grad.addColorStop(at, color);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  tex = new THREE.CanvasTexture(c);
  glowTexCache.set(key, tex);
  return tex;
}
const coolHalo = () =>
  radialTex("cool", [
    [0, "rgba(216, 251, 255, 0.85)"],
    [0.5, "rgba(140, 220, 255, 0.22)"],
    [1, "rgba(140, 220, 255, 0)"],
  ]);
const orangeHalo = () =>
  radialTex("orange", [
    [0, "rgba(255, 160, 60, 0.95)"],
    [0.5, "rgba(255, 90, 10, 0.45)"],
    [1, "rgba(255, 80, 0, 0)"],
  ]);

function Halo({
  tex,
  radius,
  opacity,
  position,
}: {
  tex: THREE.CanvasTexture;
  radius: number;
  opacity: number;
  position: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <circleGeometry args={[radius, 20]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Small jet flame (apex-down cone pair) used on the backpack and the feet. */
function Flame({
  refCb,
  scale = 1,
  position,
}: {
  refCb: (g: THREE.Group | null) => void;
  scale?: number;
  position: [number, number, number];
}) {
  return (
    <group ref={refCb} position={position} scale={[1, 0.001, 1]}>
      <mesh position={[0, -0.1 * scale, 0]} rotation={[Math.PI, 0, 0]} material={robotMats.flameInner}>
        <coneGeometry args={[0.035 * scale, 0.2 * scale, 10]} />
      </mesh>
      <mesh position={[0, -0.16 * scale, 0]} rotation={[Math.PI, 0, 0]} material={robotMats.flameOuter}>
        <coneGeometry args={[0.07 * scale, 0.34 * scale, 10]} />
      </mesh>
    </group>
  );
}

/**
 * The robot body — procedural primitives only. Warm-orange "toy shell" skin
 * (K-VRC energy): big rounded helmet with cream racing stripes, glowing
 * cyan-white ∩ eyes on dark glass, graphite joints, cyan seam rings. Orange
 * stays reserved for antenna ball + chest core + thrusters.
 *
 * Geometry is static; every group with a ref is a joint the brain animates
 * via springs. Heights are sacred (RAW_H) — widths were tuned X-only for the
 * cuter, squatter silhouette.
 *
 * Local space: feet at y = 0, total height = ROBOT_NATIVE_H world units.
 */

function Hand({ side }: { side: "left" | "right" }) {
  const thumbX = side === "left" ? 0.1 : -0.1;
  const thumbZ = side === "left" ? -Math.PI / 2.3 : Math.PI / 2.3;
  return (
    <group position={[0, -0.24, 0]} scale={0.78}>
      <RoundedBox args={[0.2, 0.09, 0.18]} radius={0.04} smoothness={3} material={robotMats.joint} />
      {[-0.065, 0, 0.065].map((x) => (
        <group key={x} position={[x, -0.05, 0.015]} rotation={[0.15, 0, 0]}>
          <mesh position={[0, -0.04, 0]} material={robotMats.joint}>
            <capsuleGeometry args={[0.022, 0.055, 4, 10]} />
          </mesh>
          <mesh position={[0, -0.095, 0]} material={robotMats.joint}>
            <sphereGeometry args={[0.024, 10, 8]} />
          </mesh>
          <group position={[0, -0.095, 0]} rotation={[0.35, 0, 0]}>
            <mesh position={[0, -0.04, 0]} material={robotMats.joint}>
              <capsuleGeometry args={[0.02, 0.045, 4, 10]} />
            </mesh>
          </group>
        </group>
      ))}
      <group position={[thumbX, -0.02, 0.015]} rotation={[0, 0, thumbZ]}>
        <mesh position={[0, -0.035, 0]} material={robotMats.joint}>
          <capsuleGeometry args={[0.022, 0.05, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.085, 0]} material={robotMats.joint}>
          <sphereGeometry args={[0.023, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function Arm({ side, refs }: { side: "left" | "right"; refs: RobotRefs }) {
  const x = side === "left" ? -0.48 : 0.48;
  return (
    <group
      ref={(g) => {
        if (side === "left") refs.shL = g;
        else refs.shR = g;
      }}
      position={[x, 0.7, 0]}
    >
      <mesh material={robotMats.joint}>
        <sphereGeometry args={[0.15, 20, 14]} />
      </mesh>
      <group position={[0, -0.2, 0]}>
        <mesh material={robotMats.panel}>
          <capsuleGeometry args={[0.115, 0.14, 6, 16]} />
        </mesh>
        <group
          ref={(g) => {
            if (side === "left") refs.elL = g;
            else refs.elR = g;
          }}
          position={[0, -0.2, 0]}
        >
          <mesh material={robotMats.joint}>
            <sphereGeometry args={[0.12, 20, 14]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={robotMats.trim}>
            <torusGeometry args={[0.13, 0.013, 6, 28]} />
          </mesh>
          <group position={[0, -0.18, 0]}>
            <mesh material={robotMats.panel}>
              <capsuleGeometry args={[0.105, 0.13, 6, 16]} />
            </mesh>
            <mesh position={[0, -0.16, 0]} material={robotMats.joint}>
              <cylinderGeometry args={[0.115, 0.105, 0.05, 18]} />
            </mesh>
            <Hand side={side} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Leg({ side, refs }: { side: "left" | "right"; refs: RobotRefs }) {
  const x = side === "left" ? -0.35 : 0.35;
  return (
    <group
      ref={(g) => {
        if (side === "left") refs.hipL = g;
        else refs.hipR = g;
      }}
      position={[x, 0.85, 0]}
    >
      <mesh material={robotMats.joint}>
        <sphereGeometry args={[0.145, 20, 14]} />
      </mesh>
      <group position={[0, -0.22, 0]}>
        <mesh material={robotMats.panel}>
          <capsuleGeometry args={[0.145, 0.22, 6, 16]} />
        </mesh>
        <group
          ref={(g) => {
            if (side === "left") refs.kneeL = g;
            else refs.kneeR = g;
          }}
          position={[0, -0.28, 0]}
        >
          <mesh material={robotMats.joint}>
            <sphereGeometry args={[0.145, 20, 14]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={robotMats.trim}>
            <torusGeometry args={[0.155, 0.014, 6, 28]} />
          </mesh>
          <group position={[0, -0.24, 0]}>
            <mesh material={robotMats.panel}>
              <capsuleGeometry args={[0.135, 0.22, 6, 16]} />
            </mesh>
            <group
              ref={(g) => {
                if (side === "left") refs.ankL = g;
                else refs.ankR = g;
              }}
              position={[0, -0.24, 0]}
            >
              {/* Chunky shell boot + cream toe stripe — cartoon sneaker energy */}
              <RoundedBox
                args={[0.42, 0.17, 0.48]}
                radius={0.07}
                smoothness={4}
                position={[0, -0.04, 0.08]}
                material={robotMats.shell}
              />
              <RoundedBox
                args={[0.16, 0.035, 0.2]}
                radius={0.015}
                smoothness={2}
                position={[0, 0.05, 0.18]}
                material={robotMats.stripe}
              />
              {/* foot jets — fire together with the backpack when dashing */}
              <Flame
                refCb={(g) => {
                  if (side === "left") refs.footFlameL = g;
                  else refs.footFlameR = g;
                }}
                scale={0.85}
                position={[0, -0.13, 0.06]}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Cream racing stripe hugging the helmet's rounded top, front-to-back. */
function HelmetStripe({ x }: { x: number }) {
  return (
    <group position={[x, 0.03, 0]} rotation={[0.31, 0, 0]}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <mesh rotation={[0, 0, Math.PI * 0.17]} material={robotMats.stripe}>
          <torusGeometry args={[0.36, 0.04, 8, 48, Math.PI * 0.66]} />
        </mesh>
      </group>
    </group>
  );
}

/** Glyphs sit proud of the glass and tilt up toward the camera — flush decals
    vanish at grazing angles because the fixed camera looks down at him. */
const GLYPH_TILT = -0.14;

function Head({ refs }: { refs: RobotRefs }) {
  return (
    <group ref={(g) => void (refs.head = g)} position={[0, 1.42, 0]}>
      {/* Helmet — near-capsule rounded shell */}
      <RoundedBox args={[1.22, 0.8, 0.88]} radius={0.36} smoothness={6} material={robotMats.head} />
      <HelmetStripe x={-0.1} />
      <HelmetStripe x={0.1} />

      {/* Face glass */}
      <RoundedBox
        args={[0.78, 0.5, 0.05]}
        radius={0.14}
        smoothness={4}
        position={[0, 0.05, 0.43]}
        material={robotMats.screen}
      />

      {/* Slim brow bar (expressive) */}
      <RoundedBox
        ref={(m) => void (refs.brow = m)}
        args={[0.66, 0.05, 0.05]}
        radius={0.02}
        smoothness={3}
        position={[0, 0.36, 0.42]}
        material={robotMats.joint}
      />

      {/* Eyes — happy ∩ arcs. Group scaleY = blink/mood, pupil group = gaze. */}
      {([-0.24, 0.24] as const).map((x) => {
        const left = x < 0;
        return (
          <group
            key={x}
            ref={(g) => {
              if (left) refs.eyeL = g;
              else refs.eyeR = g;
            }}
            position={[x, 0.1, 0.49]}
            rotation={[GLYPH_TILT, 0, 0]}
          >
            <Halo tex={coolHalo()} radius={0.12} opacity={0.25} position={[0, 0.02, -0.004]} />
            {/* outer arc */}
            <mesh material={robotMats.glow}>
              <torusGeometry args={[0.105, 0.032, 8, 24, Math.PI]} />
            </mesh>
            <group
              ref={(g) => {
                if (left) refs.pupilL = g;
                else refs.pupilR = g;
              }}
            >
              {/* brighter core arc */}
              <mesh position={[0, 0, 0.005]} material={robotMats.glowCore}>
                <torusGeometry args={[0.096, 0.013, 6, 20, Math.PI]} />
              </mesh>
              {/* glossy sparkle */}
              <mesh position={[-0.045, 0.055, 0.008]} material={robotMats.white}>
                <circleGeometry args={[0.017, 12]} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Mouths — visibility-swapped shapes, floating off the glass */}
      <mesh
        ref={(m) => void (refs.mouthSmile = m)}
        position={[0, -0.06, 0.482]}
        rotation={[GLYPH_TILT, 0, Math.PI]}
        material={robotMats.glow}
      >
        <torusGeometry args={[0.1, 0.024, 8, 24, Math.PI]} />
      </mesh>
      <mesh
        ref={(m) => void (refs.mouthFlat = m)}
        position={[0, -0.09, 0.482]}
        rotation={[GLYPH_TILT, 0, Math.PI / 2]}
        material={robotMats.glow}
        visible={false}
      >
        <capsuleGeometry args={[0.018, 0.1, 4, 8]} />
      </mesh>
      <group
        ref={(g) => void (refs.mouthO = g)}
        position={[0, -0.09, 0.482]}
        rotation={[GLYPH_TILT, 0, 0]}
        visible={false}
      >
        <mesh material={robotMats.glow}>
          <torusGeometry args={[0.05, 0.016, 8, 20]} />
        </mesh>
        <mesh position={[0, 0, -0.001]} material={robotMats.pupil}>
          <circleGeometry args={[0.045, 16]} />
        </mesh>
      </group>

      {/* Ear pods */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.61, 0.02, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={robotMats.shell}>
            <cylinderGeometry args={[0.19, 0.19, 0.13, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[s * 0.066, 0, 0]} material={robotMats.trim}>
            <torusGeometry args={[0.185, 0.015, 6, 36]} />
          </mesh>
          <mesh rotation={[0, (s * Math.PI) / 2, 0]} position={[s * 0.072, 0, 0]} material={robotMats.glow}>
            <circleGeometry args={[0.07, 24]} />
          </mesh>
          <mesh rotation={[0, (s * Math.PI) / 2, 0]} position={[s * 0.073, 0, 0]} material={robotMats.pupil}>
            <circleGeometry args={[0.025, 16]} />
          </mesh>
        </group>
      ))}

      {/* Antenna — pivot (wobble springs) → spin (tricks) → stem + ball */}
      <group ref={(g) => void (refs.antPivot = g)} position={[0.14, 0.38, 0]} rotation={[0, 0, -0.12]}>
        <group ref={(g) => void (refs.antSpin = g)}>
          <mesh position={[0, 0.1, 0]} material={robotMats.joint}>
            <cylinderGeometry args={[0.022, 0.028, 0.2, 12]} />
          </mesh>
          <mesh position={[0, 0.27, 0]} material={robotMats.antBall}>
            <sphereGeometry args={[0.065, 18, 14]} />
          </mesh>
          <Halo tex={orangeHalo()} radius={0.17} opacity={0.7} position={[0, 0.27, 0.07]} />
        </group>
      </group>
    </group>
  );
}

function FlameGlowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, "rgba(255, 160, 60, 0.95)");
    grad.addColorStop(0.5, "rgba(255, 90, 10, 0.45)");
    grad.addColorStop(1, "rgba(255, 80, 0, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
}

function ThrusterPod({ refs, withTrail }: { refs: RobotRefs; withTrail: boolean }) {
  const glowTex = FlameGlowTexture();
  return (
    <group position={[0, 0.32, -0.34]}>
      <RoundedBox args={[0.38, 0.42, 0.18]} radius={0.06} smoothness={3} material={robotMats.panel} />
      {/* Omnidirectional exhaust glow — flames hide behind the body from the
          front; this additive sprite is what sells thrust at any angle. */}
      <mesh
        ref={(m) => void (refs.flameGlow = m)}
        position={[0, -0.42, 0.12]}
        scale={0.001}
        visible={false}
      >
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.12, -0.26, 0]} rotation={[0.12, 0, s * -0.24]}>
          <mesh material={robotMats.joint}>
            <cylinderGeometry args={[0.05, 0.058, 0.1, 14]} />
          </mesh>
          <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={robotMats.trim}>
            <torusGeometry args={[0.055, 0.011, 6, 20]} />
          </mesh>
          {/* Flame — scaled by the brain; cones extend downward */}
          <group
            ref={(g) => {
              if (s < 0) refs.flameL = g;
              else refs.flameR = g;
            }}
            position={[0, -0.08, 0]}
            scale={[1, 0.001, 1]}
          >
            <mesh position={[0, -0.1, 0]} rotation={[Math.PI, 0, 0]} material={robotMats.flameInner}>
              <coneGeometry args={[0.035, 0.2, 10]} />
            </mesh>
            <mesh position={[0, -0.16, 0]} rotation={[Math.PI, 0, 0]} material={robotMats.flameOuter}>
              <coneGeometry args={[0.07, 0.34, 10]} />
            </mesh>
          </group>
          {withTrail && (
            <group
              ref={(g) => {
                if (s < 0) refs.trailL = g;
                else refs.trailR = g;
              }}
              visible={false}
            >
              <Trail width={0.34} length={6} decay={2.2} color={ORANGE} attenuation={(t) => t * t}>
                <mesh position={[0, -0.1, 0]} visible={false}>
                  <sphereGeometry args={[0.01, 4, 4]} />
                </mesh>
              </Trail>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

export function Robot({ refs, withTrail }: { refs: RobotRefs; withTrail: boolean }) {
  // Tapered torso profile — wider chest, narrower waist (from the prototype).
  const bodyPoints = useMemo(() => {
    const p: Array<[number, number]> = [
      [0, 0],
      [0.2, 0],
      [0.24, 0.08],
      [0.27, 0.2],
      [0.31, 0.36],
      [0.34, 0.55],
      [0.32, 0.7],
      [0.24, 0.82],
      [0.12, 0.9],
      [0, 0.92],
    ];
    return p.map(([x, y]) => new THREE.Vector2(x, y));
  }, []);

  return (
    <group ref={(g) => void (refs.root = g)} visible={false}>
      {/* Energy cable for rope descents — raised hand grips it at ~1.5 units.
          Sibling of the squash group so squash/stretch never bends the rope. */}
      <group ref={(g) => void (refs.rope = g)} visible={false} position={[0.17, 0, 0]}>
        <mesh position={[0, 9.4, 0]} material={robotMats.rope}>
          <cylinderGeometry args={[0.014, 0.014, 16, 6]} />
        </mesh>
        {/* grip nub glides at hand height */}
        <mesh position={[0, 1.52, 0]} material={robotMats.trim}>
          <sphereGeometry args={[0.045, 10, 8]} />
        </mesh>
      </group>
      <group ref={(g) => void (refs.squash = g)}>
        <group scale={BUILD_S}>
          <group ref={(g) => void (refs.body = g)} position={[0, FOOT_LIFT, 0]}>
            {/* TORSO unit (chest + neck + head + arms + pod) — pivots at the
                waist (body y 1.0) so counter-rotation and breathing scale
                swing the chest/shoulders naturally. Children sit at
                (source body y − 1.0). */}
            <group ref={(g) => void (refs.torso = g)} position={[0, 1.0, 0]}>
              <group position={[0, 0.05, 0]}>
                <mesh scale={[1.32, 1, 0.82]} material={robotMats.shell}>
                  <latheGeometry args={[bodyPoints, 40]} />
                </mesh>
                {/* Chest screen + orange core lens */}
                <RoundedBox
                  args={[0.44, 0.3, 0.04]}
                  radius={0.06}
                  smoothness={3}
                  position={[0, 0.55, 0.27]}
                  material={robotMats.screen}
                />
                <mesh position={[0, 0.55, 0.29]} rotation={[Math.PI / 2, 0, 0]} material={robotMats.joint}>
                  <cylinderGeometry args={[0.07, 0.07, 0.03, 20]} />
                </mesh>
                <mesh position={[0, 0.55, 0.305]} material={robotMats.core}>
                  <circleGeometry args={[0.05, 20]} />
                </mesh>
                <mesh position={[0, 0.55, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={robotMats.trim}>
                  <torusGeometry args={[0.072, 0.01, 6, 24]} />
                </mesh>
                <Halo tex={orangeHalo()} radius={0.16} opacity={0.55} position={[0, 0.55, 0.32]} />
              </group>

              {/* NECK (body y 2.0) */}
              <mesh position={[0, 1.0, 0]} material={robotMats.joint}>
                <cylinderGeometry args={[0.09, 0.11, 0.08, 18]} />
              </mesh>

              <Head refs={refs} />
              <Arm side="left" refs={refs} />
              <Arm side="right" refs={refs} />
              <ThrusterPod refs={refs} withTrail={withTrail} />
            </group>

            {/* HIPS bar */}
            <mesh position={[0, 0.95, 0]} rotation={[0, 0, Math.PI / 2]} material={robotMats.joint}>
              <cylinderGeometry args={[0.15, 0.15, 0.76, 18]} />
            </mesh>

            {/* LEGS */}
            <Leg side="left" refs={refs} />
            <Leg side="right" refs={refs} />
          </group>
        </group>
      </group>
    </group>
  );
}
