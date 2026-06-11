import * as THREE from "three";

/**
 * Rig contract shared by the body (ui/Robot.tsx builds the groups and fills
 * `RobotRefs`) and the brain (model/brain.ts writes spring outputs onto
 * them). Materials are module singletons — shared across remounts, animated
 * directly (emissives), and never auto-disposed by R3F.
 */

/* ---- dimensions ---- */
/** Robot height (feet → antenna tip) in world units at root scale 1. */
export const ROBOT_NATIVE_H = 1.6;
/** Foot soles sit at -0.25 in source body space; the body group lifts by this. */
export const FOOT_LIFT = 0.25;
/** Source body space height (foot sole → antenna tip). */
export const RAW_H = 3.31;
export const BUILD_S = ROBOT_NATIVE_H / RAW_H;
/** Hip→sole length in world units at root scale 1 (drives stride length). */
export const LEG_L = 1.1 * BUILD_S;

/* ---- palette ---- */
export const PANEL = "#2a2f3a";
export const HEAD_COLOR = "#303646";
export const JOINT = "#14161f";
export const TRIM = "#7c3aed";
export const SCREEN = "#0a0a14";
export const GLOW = "#fff4d6";
export const ORANGE = "#ff5500";
export const PUPIL = "#10101a";

export const robotMats = {
  panel: new THREE.MeshStandardMaterial({
    color: "#39404f",
    roughness: 0.34,
    metalness: 0.6,
    envMapIntensity: 1.15,
  }),
  head: new THREE.MeshStandardMaterial({
    color: "#3d4456",
    roughness: 0.34,
    metalness: 0.6,
    envMapIntensity: 1.15,
  }),
  joint: new THREE.MeshStandardMaterial({
    color: "#1a1c26",
    roughness: 0.5,
    metalness: 0.55,
    envMapIntensity: 0.7,
  }),
  trim: new THREE.MeshStandardMaterial({
    color: TRIM,
    roughness: 0.4,
    metalness: 0.5,
    emissive: TRIM,
    emissiveIntensity: 0.55,
  }),
  screen: new THREE.MeshPhysicalMaterial({
    color: SCREEN,
    roughness: 0.15,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.25,
    emissive: "#1a1a36",
    emissiveIntensity: 0.6,
  }),
  rope: new THREE.MeshBasicMaterial({
    color: "#8b7cf8",
    transparent: true,
    opacity: 0.85,
    toneMapped: false,
  }),
  glow: new THREE.MeshBasicMaterial({ color: GLOW, toneMapped: false }),
  pupil: new THREE.MeshBasicMaterial({ color: PUPIL, toneMapped: false }),
  white: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
  antBall: new THREE.MeshStandardMaterial({
    color: "#391c08",
    emissive: ORANGE,
    emissiveIntensity: 3.0,
    toneMapped: false,
  }),
  core: new THREE.MeshStandardMaterial({
    color: "#391c08",
    emissive: ORANGE,
    emissiveIntensity: 2.2,
    toneMapped: false,
  }),
  flameInner: new THREE.MeshBasicMaterial({
    color: "#fff7ed",
    transparent: true,
    opacity: 0.95,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
  flameOuter: new THREE.MeshBasicMaterial({
    color: ORANGE,
    transparent: true,
    opacity: 0.7,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
};

export interface RobotRefs {
  root: THREE.Group | null;
  squash: THREE.Group | null;
  body: THREE.Group | null;
  torso: THREE.Group | null;
  head: THREE.Group | null;
  brow: THREE.Mesh | null;
  eyeL: THREE.Group | null;
  eyeR: THREE.Group | null;
  pupilL: THREE.Group | null;
  pupilR: THREE.Group | null;
  mouthSmile: THREE.Mesh | null;
  mouthFlat: THREE.Mesh | null;
  mouthO: THREE.Group | null;
  antPivot: THREE.Group | null;
  antSpin: THREE.Group | null;
  shL: THREE.Group | null;
  shR: THREE.Group | null;
  elL: THREE.Group | null;
  elR: THREE.Group | null;
  hipL: THREE.Group | null;
  hipR: THREE.Group | null;
  kneeL: THREE.Group | null;
  kneeR: THREE.Group | null;
  ankL: THREE.Group | null;
  ankR: THREE.Group | null;
  flameL: THREE.Group | null;
  flameR: THREE.Group | null;
  footFlameL: THREE.Group | null;
  footFlameR: THREE.Group | null;
  flameGlow: THREE.Mesh | null;
  rope: THREE.Group | null;
  trailL: THREE.Group | null;
  trailR: THREE.Group | null;
  shadow: THREE.Mesh | null;
  shadowMat: THREE.MeshBasicMaterial | null;
}

export const createRobotRefs = (): RobotRefs => ({
  root: null,
  squash: null,
  body: null,
  torso: null,
  head: null,
  brow: null,
  eyeL: null,
  eyeR: null,
  pupilL: null,
  pupilR: null,
  mouthSmile: null,
  mouthFlat: null,
  mouthO: null,
  antPivot: null,
  antSpin: null,
  shL: null,
  shR: null,
  elL: null,
  elR: null,
  hipL: null,
  hipR: null,
  kneeL: null,
  kneeR: null,
  ankL: null,
  ankR: null,
  flameL: null,
  flameR: null,
  footFlameL: null,
  footFlameR: null,
  flameGlow: null,
  rope: null,
  trailL: null,
  trailR: null,
  shadow: null,
  shadowMat: null,
});
