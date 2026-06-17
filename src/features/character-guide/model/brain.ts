import { sceneStore } from "@/shared/three";

import {
  clamp,
  clamp01,
  cubicBezier,
  easeInOutCubic,
  easeOutQuint,
  lerp,
  rand,
  smoothstep01,
  wrapAngle,
  type Pt,
} from "../lib/curves";
import {
  pxToWorldX,
  pxToWorldY,
  worldPerPixel,
  worldToPxX,
  worldToPxY,
  CAM_Z,
  PLANE_H,
} from "../lib/screen-world";
import { laneGeometry, clampOutOfContent } from "../lib/lane";
import { Spring1, Spring3, expApproach } from "../lib/springs";
import { FOOT_LIFT, LEG_L, ROBOT_NATIVE_H, robotMats, type RobotRefs } from "./rig";
import { robotStore, type RobotSection } from "./robot-store";
import type { DustHandle } from "../ui/DustPuff";
import type { ShockHandle } from "../ui/ShockRing";

/**
 * The rig-side brain: ONE update per frame, zero React state. The director
 * says where to stand and what to say; this decides HOW — locomotion FSM,
 * spring-driven gait, jet-dash beats, gaze/blink/breath, gestures.
 *
 * Core principles:
 *  - Nothing writes a ref from a closed-form curve. Behaviors write spring
 *    TARGETS (or kick velocities); springs write the refs.
 *  - WALK-FIRST: the robot rides the page 1:1 while you scroll (no float
 *    lag) and walks/jogs to anything reachable. Jet dashes, rope descents
 *    and ground slides are reserved for genuinely far jumps — spectacle,
 *    not commute.
 */

type Mode =
  | "hidden"
  | "ground"
  | "dashAnt"
  | "dashFly"
  | "dashLand"
  | "exitUp"
  | "ropeDown"
  | "slide"
  | "flyOff"
  | "offsite";

type TravelKind = "dash" | "rope" | "ropeFromTop" | "slide";

/** Sections entered (scrolling down) by rappelling in on the energy cable. */
const ROPE_SECTIONS = new Set<RobotSection>(["experience", "about", "education"]);

type GestureKind = "wave" | "hop" | "spin" | "bow" | "poke" | "hover" | "point" | "dance";

interface Gesture {
  kind: GestureKind;
  t: number;
  dur: number;
  side: 1 | -1; // which arm: 1 = right (+x), -1 = left
  /** point target, world */
  px?: number;
  py?: number;
}

const HALF_PI = Math.PI / 2;
const TWO_PI = Math.PI * 2;

const MAX_SPEED = 1.45; // wu/s at scale 1, multiplied by `hurry` when far
const GAIT_ON_SPEED = 0.12;
const BRACE_ON = 50;
const BRACE_OFF = 8;
const NAV_CLEAR_PX = 76; // nav 64 + margin
/** Targets within this stay on foot; beyond it the jetpack/rope earns its keep. */
const WALK_DIST = 7.5;
/** Vertical gaps walking can't sell — beyond this, fly/rope/slide. */
const WALK_DY = 1.35;
/** Page-riding window: scroll deltas larger than this are a fling, not a ride. */
const RIDE_MAX_PX = 140;

export interface BrainEnv {
  dt: number;
  t: number; // elapsed seconds
  vw: number;
  vh: number;
  dust: DustHandle | null;
  ring: ShockHandle | null;
}

export interface BrainDebug {
  mode: string;
  speed: number;
  gaitPhase: number;
  vel: number;
  thr: number;
}

export class RobotBrain {
  /* ---- root channels (world units) ---- */
  rootX = new Spring1(2.0, 1);
  rootY = new Spring1(2.4, 1);
  yaw = new Spring1(1.3, 0.85);
  scaleW = new Spring1(2.0, 1, 0.9);

  /* ---- body channels (source units / radians) ---- */
  bodyTilt = new Spring3(2.2, 0.9);
  bodyOff = new Spring3(2.5, 1);
  torsoYaw = new Spring1(2.8, 0.8);
  torsoRoll = new Spring1(2.8, 0.8);
  shL = new Spring3(3.2, 0.85);
  shR = new Spring3(3.2, 0.85);
  elL = new Spring1(2.4, 0.65);
  elR = new Spring1(2.4, 0.65);
  hipL = new Spring1(3.8, 0.95);
  hipR = new Spring1(3.8, 0.95);
  kneeL = new Spring1(4.2, 0.8);
  kneeR = new Spring1(4.2, 0.8);
  ankL = new Spring1(5.0, 0.9);
  ankR = new Spring1(5.0, 0.9);
  head = new Spring3(2.6, 0.85);
  pupilX = new Spring1(6, 1);
  pupilY = new Spring1(6, 1);
  eyeMood = new Spring1(5, 0.9, 1);
  brow = new Spring1(4, 0.9);
  mouthOpen = new Spring1(10, 1);
  antX = new Spring1(3.2, 0.1);
  antZ = new Spring1(3.2, 0.1);
  squash = new Spring1(4.5, 0.55, 1);
  thruster = new Spring1(7, 1);

  /* ---- state ---- */
  private mode: Mode = "hidden";
  private stateT = 0;
  // matches the store's initial travelSeq — the first REAL commit bumps it
  private lastSeq = 0;
  private pendingTravel: TravelKind | null = null;
  private pendingEnterLeft = false;
  private fromEnter = false;
  private landFrom: "dash" | "rope" | "slide" = "dash";
  private heroLand = false;
  private heroSpun = false;

  /* rope descent */
  private ropeDur = 1;
  private ropeX0 = 0;
  private ropeY0 = 0;
  private ropeRetractT = -1;

  /* ground slide */
  private slidePreX = 0;
  private slideDir: 1 | -1 = 1;
  private slideDropDur = 0.32;
  private slideDustNext = 0;

  private pupilDil = new Spring1(5, 1, 1);

  private dashP0: Pt = { x: 0, y: 0 };
  private dashP1: Pt = { x: 0, y: 0 };
  private dashP2: Pt = { x: 0, y: 0 };
  private dashP3: Pt = { x: 0, y: 0 };
  private dashDur = 0.8;
  private dashPrev: Pt = { x: 0, y: 0 };
  private dashScratch: Pt = { x: 0, y: 0 };
  private launchGroundY = 0;

  private gaitPhase = 0;
  private gaitAmp = 0;
  private prevStepSign = 1;

  private blinkNext = 1.5;
  private blinkT = -1;
  private saccNext = 1;
  private microX = 0;
  private microY = 0;

  private breathPhase = 0;
  private breathBoostUntil = 0;

  private fidget: { kind: number; t: number; dur: number; side: 1 | -1 } | null = null;
  private fidgetNext = 5;

  /* idle pacing — little strolls around the anchor */
  private wanderOff = 0;
  private wanderUntil = 0;
  private wanderNext = 9;

  private prevScrollY = Number.NaN;
  private selfTravelNext = 0;
  /** Trails hide briefly after any root teleport — drei's Trail would
      otherwise draw a stale streak from the old position. */
  private trailSuppressT = 0;

  private gesture: Gesture | null = null;
  private emoteSeen = 0;
  private pointSeen = 0;
  private prevHovered = false;

  private beatNext = 0;
  private beat: { t: number; dur: number; side: 1 | -1 } | null = null;
  private nodNext = 0;

  private braceActive = false;
  private braceCalmSince = 0;

  private hopVy = 0;
  private hopY = 0;
  private spinT = -1;

  private mouthNext = 0;
  private mouthShape: "smile" | "flat" | "o" = "smile";

  private arrivedFrames = 0;

  readonly debug: BrainDebug = { mode: "hidden", speed: 0, gaitPhase: 0, vel: 0, thr: 0 };

  constructor(private refs: RobotRefs) {}

  /* ================================================================ */

  update(env: BrainEnv) {
    const { dt, t, vw, vh } = env;
    const rs = robotStore.get();
    const sc = sceneStore.get();
    const refs = this.refs;
    if (!refs.root || !refs.body || !refs.torso || !refs.head) return;

    const wpp = worldPerPixel(vh);
    this.scaleW.target = (rs.scalePx * wpp) / ROBOT_NATIVE_H;
    const S = this.scaleW.value;

    // Robi rests in the empty gutters (left or right) and LEAPS across between
    // them. clampOutOfContent keeps every resting/landing frame off the content;
    // the jet-dash itself is exempt, so soaring over the column is the show.
    const lane = laneGeometry(vw);
    const laneOn = !lane.collapsed;

    /* ---- resolve target (viewport px → world) ---- */
    const scrollY = typeof window !== "undefined" ? window.scrollY : sc.scroll;
    const dScroll = Number.isFinite(this.prevScrollY) ? scrollY - this.prevScrollY : 0;
    this.prevScrollY = scrollY;
    let tvx = rs.targetX;
    let tvy = rs.targetSpace === "doc" ? rs.targetY - scrollY : rs.targetY;
    const hPx = rs.scalePx;
    // order-safe: on very short windows the bounds can cross
    tvy = clamp(tvy, NAV_CLEAR_PX + hPx, Math.max(NAV_CLEAR_PX + hPx, vh - 10));
    tvx = clamp(tvx, 12 + hPx * 0.25, Math.max(12 + hPx * 0.25, vw - 12 - hPx * 0.25));
    if (laneOn) tvx = clampOutOfContent(tvx, lane);
    const twx = pxToWorldX(tvx, vw, vh);
    const twy = pxToWorldY(tvy, vh);

    /* ---- brace (fast scroll) with hysteresis ---- */
    const vel = sc.velocity;
    if (!this.braceActive) {
      if (Math.abs(vel) > BRACE_ON && this.mode === "ground") this.braceActive = true;
    } else {
      if (Math.abs(vel) > BRACE_OFF) this.braceCalmSince = t;
      if (t - this.braceCalmSince > 0.3) this.braceActive = false;
    }

    /* ---- new travel? Walk-first: special travel only for far jumps. ---- */
    if (rs.travelSeq !== this.lastSeq) {
      this.lastSeq = rs.travelSeq;
      this.wanderOff = 0;
      this.wanderNext = t + 8;
      const hint = rs.travelHint;
      if (hint === "exitRight") {
        if (this.mode !== "hidden" && this.mode !== "flyOff" && this.mode !== "offsite") {
          this.startFlyOff();
        }
      } else if (hint === "enterLeft") {
        if (this.mode === "hidden" || this.mode === "offsite") {
          this.startEnterLeft(twx, twy, vw, vh);
        } else {
          this.pendingEnterLeft = true; // mid fly-off; consumed in "offsite"
        }
      } else if (this.mode === "hidden") {
        if (hint === "ropeIn") this.startEnterRope(twx, twy, vh);
        else this.startEnter(twx, twy, vh);
      } else if (this.mode === "ground" || this.mode === "dashAnt") {
        // every new commit supersedes whatever travel was still queued —
        // otherwise a stale dash/rope re-fires after the robot has arrived
        this.pendingTravel = null;
        const dxw = twx - this.rootX.value;
        const dyw = twy - this.rootY.value;
        const dist = Math.hypot(dxw, dyw);
        if (dist >= 0.5) {
          const walkable = dist <= WALK_DIST && Math.abs(dyw) <= WALK_DY;
          if (!walkable) {
            const crossGutter = Math.abs(dxw) > 3;
            if (crossGutter) {
              // changing sides → a dramatic aerial leap across the page
              this.pendingTravel = "dash";
            } else if (hint === "down") {
              const sect = rs.activeSection;
              if (sect && ROPE_SECTIONS.has(sect)) {
                this.pendingTravel = dyw < -0.3 ? "rope" : "ropeFromTop";
              } else if (dyw < 0.6 && Math.abs(dxw) > 0.8) {
                // level-ish or below with horizontal room → ground skid
                this.pendingTravel = "slide";
              } else {
                this.pendingTravel = "dash";
              }
            } else {
              this.pendingTravel = "dash";
            }
          }
          // walkable → no mode change; the root springs + gait do the rest
        }
      }
      // mid-flight: new target is picked up by the live handoff/landing
    }
    if (this.pendingTravel && !this.braceActive && this.mode === "ground") {
      const kind = this.pendingTravel;
      this.pendingTravel = null;
      // re-validate at consumption — the queue may be older than the world
      // (page-riding during a brace can move the robot past the target)
      const dyw = twy - this.rootY.value;
      const dist = Math.hypot(twx - this.rootX.value, dyw);
      if (dist >= 0.5) {
        if (kind === "rope") {
          if (dyw < -0.3) this.beginRopeDescent(twx, twy);
          else this.startDashAnt();
        } else if (kind === "ropeFromTop") {
          this.startExitUp();
        } else if (kind === "slide") {
          this.startSlide(twx, twy);
        } else {
          this.startDashAnt();
        }
      }
    }

    /* ---- base pose targets, EVERY frame — layers below add/override.
       (Resetting here is what keeps `+=` layers bounded.) ---- */
    this.bodyTilt.setTarget(0, 0, 0);
    this.shL.setTarget(0, 0, -0.14);
    this.shR.setTarget(0, 0, 0.14);
    this.elL.target = 0.16;
    this.elR.target = 0.16;
    this.hipL.target = 0;
    this.hipR.target = 0;
    this.kneeL.target = 0.06;
    this.kneeR.target = 0.06;
    this.ankL.target = 0;
    this.ankR.target = 0;
    this.torsoYaw.target = 0;
    this.torsoRoll.target = 0;
    this.head.setTarget(0, 0, 0);
    this.eyeMood.target = 1;
    this.brow.target = 0;

    /* ---- mode machine ---- */
    this.stateT += dt;
    switch (this.mode) {
      case "hidden":
        break;

      case "dashAnt": {
        this.thruster.target = 0.3;
        this.squash.target = 0.84;
        this.bodyOff.setTarget(0, -0.42, 0);
        this.bodyTilt.setTarget(-0.12, 0, 0);
        this.hipL.target = -0.5;
        this.hipR.target = -0.5;
        this.kneeL.target = 0.95;
        this.kneeR.target = 0.95;
        this.ankL.target = 0.3;
        this.ankR.target = 0.3;
        this.shL.setTarget(0.4, 0, -0.2);
        this.shR.setTarget(0.4, 0, 0.2);
        this.eyeMood.target = 0.88;
        this.brow.target = 0.1;
        if (this.stateT >= 0.18) this.startDashFly(twx, twy);
        break;
      }

      case "dashFly": {
        const u = clamp01(this.stateT / this.dashDur);
        const e = easeInOutCubic(u);
        const p = cubicBezier(e, this.dashP0, this.dashP1, this.dashP2, this.dashP3, this.dashScratch);
        const pvx = (p.x - this.dashPrev.x) / Math.max(dt, 1e-4);
        const pvy = (p.y - this.dashPrev.y) / Math.max(dt, 1e-4);
        this.dashPrev.x = p.x;
        this.dashPrev.y = p.y;
        this.rootX.value = p.x;
        this.rootY.value = p.y;
        this.rootX.vel = pvx;
        this.rootY.vel = pvy;

        this.thruster.target = 1;
        this.yaw.target = 0;
        // quadcopter banking + flight pose
        this.bodyTilt.setTarget(
          clamp(-pvy * 0.08 + 0.18, -0.3, 0.35),
          0,
          clamp(-pvx * 0.18, -0.45, 0.45),
        );
        this.bodyOff.setTarget(0, 0, 0);
        this.hipL.target = 0.25;
        this.hipR.target = 0.32;
        this.kneeL.target = 1.2;
        this.kneeR.target = 0.9;
        this.ankL.target = -0.3;
        this.ankR.target = -0.3;
        this.shL.setTarget(0.55, 0, -0.25);
        this.shR.setTarget(0.55, 0, 0.25);
        this.elL.target = 0.35;
        this.elR.target = 0.35;
        this.squash.target = pvy > 0.2 ? 1.12 : 1.05;
        this.eyeMood.target = 0.88;

        if (u >= 0.92) this.landDash(twx, twy, env);
        break;
      }

      case "dashLand": {
        this.thruster.target = 0;
        if (this.heroLand) {
          /* superhero landing: one knee + fist planted, beat, rise */
          const u = this.stateT / 0.62;
          if (u < 0.45) {
            this.hipL.target = -1.25;
            this.kneeL.target = 2.0;
            this.ankL.target = 0.5;
            this.hipR.target = -0.3;
            this.kneeR.target = 0.5;
            this.bodyOff.setTarget(0, -0.62, 0);
            this.bodyTilt.setTarget(0.32, 0, 0);
            this.shR.setTarget(-0.3, 0, 0.4);
            this.elR.target = 0.2;
            this.shL.setTarget(0.7, 0, -0.5);
            this.elL.target = 0.6;
            this.head.x.target = u < 0.22 ? 0.4 : -0.15;
            this.eyeMood.target = 0.85;
          } else {
            this.bodyOff.setTarget(0, 0, 0);
            if (!this.heroSpun) {
              this.heroSpun = true;
              this.spinT = 0; // victory antenna spin on the rise
            }
          }
          if (this.stateT >= 0.62) {
            this.mode = "ground";
            this.stateT = 0;
            this.squash.target = 1;
            this.heroLand = false;
          }
          break;
        }
        if (this.stateT < 0.12 && this.landFrom === "dash") {
          this.hipL.target = -0.7;
          this.hipR.target = -0.7;
          this.kneeL.target = 1.3;
          this.kneeR.target = 1.3;
          this.bodyOff.setTarget(0, -0.3, 0);
          this.shL.setTarget(-0.5, 0, -0.18);
          this.shR.setTarget(-0.5, 0, 0.18);
        }
        if (this.stateT >= 0.35) {
          this.mode = "ground";
          this.stateT = 0;
          this.squash.target = 1;
        }
        break;
      }

      case "exitUp": {
        // jet straight up off-screen, then rappel back down from the top
        const u = clamp01(this.stateT / 0.3);
        const vy = lerp(2.5, 14, u * u);
        this.rootY.value += vy * dt;
        this.rootY.vel = vy;
        this.thruster.target = 1;
        this.squash.target = 1.12;
        this.hipL.target = 0.3;
        this.hipR.target = 0.35;
        this.kneeL.target = 1.1;
        this.kneeR.target = 0.95;
        this.shL.setTarget(0.5, 0, -0.2);
        this.shR.setTarget(0.5, 0, 0.2);
        this.bodyTilt.setTarget(0.1, 0, 0);
        const topWorld = pxToWorldY(0, vh);
        if (this.rootY.value > topWorld + 0.9) {
          this.rootX.set(twx + 0.12);
          this.beginRopeDescent(twx, twy);
        }
        break;
      }

      case "ropeDown": {
        const u = clamp01(this.stateT / this.ropeDur);
        const e = easeInOutCubic(u);
        const sway = 0.16 * Math.sin(env.t * 3.6) * (1 - u);
        const nx = lerp(this.ropeX0, twx, clamp01(u * 2.0)) + sway * 0.6;
        const ny = lerp(this.ropeY0, twy, e);
        this.rootX.vel = (nx - this.rootX.value) / Math.max(dt, 1e-4);
        this.rootY.vel = (ny - this.rootY.value) / Math.max(dt, 1e-4);
        this.rootX.value = nx;
        this.rootY.value = ny;
        this.yaw.target = 0;
        this.thruster.target = 0;
        // hang pose: right hand grips overhead, free arm out for balance
        this.shR.setTarget(-0.1, 0, 2.5);
        this.elR.target = 0.3;
        this.shL.setTarget(-0.15, 0, -0.6);
        this.elL.target = 0.35;
        this.hipL.target = -0.3;
        this.hipR.target = -0.2;
        this.kneeL.target = 0.6;
        this.kneeR.target = 0.5;
        this.ankL.target = -0.15;
        this.ankR.target = -0.15;
        this.bodyTilt.setTarget(0.05, 0, -0.5 * sway);
        this.eyeMood.target = 0.9;
        if (u < 0.4) this.head.x.target += 0.3; // glance down at the landing
        if (u >= 1) {
          this.landFrom = "rope";
          this.rootX.target = twx;
          this.rootY.target = twy;
          this.mode = "dashLand";
          this.stateT = 0;
          this.squash.target = 0.88;
          this.squash.kick(-4);
          this.antX.kick(-5);
          env.dust?.burst(twx, twy, 0.45);
          env.ring?.burst(twx, twy, 0.8);
          this.ropeRetractT = 0;
        }
        break;
      }

      case "slide": {
        if (this.stateT <= this.slideDropDur) {
          // shallow arc drop toward the skid start, foot jets braking
          const u = clamp01(this.stateT / this.slideDropDur);
          const e = easeInOutCubic(u);
          const p = cubicBezier(e, this.dashP0, this.dashP1, this.dashP2, this.dashP3, this.dashScratch);
          this.rootX.vel = (p.x - this.rootX.value) / Math.max(dt, 1e-4);
          this.rootY.vel = (p.y - this.rootY.value) / Math.max(dt, 1e-4);
          this.rootX.value = p.x;
          this.rootY.value = p.y;
          this.thruster.target = 0.45;
          this.bodyTilt.setTarget(-0.1, 0, clamp(-this.rootX.vel * 0.1, -0.3, 0.3));
          this.kneeL.target = 0.9;
          this.kneeR.target = 0.8;
          this.hipL.target = 0.1;
          this.hipR.target = 0.15;
        } else {
          // ground skid: lean back, lead leg plowing, dust ribbon
          const u = clamp01((this.stateT - this.slideDropDur) / 0.55);
          const x = lerp(this.slidePreX, twx, 1 - Math.pow(1 - u, 3));
          this.rootX.vel = (x - this.rootX.value) / Math.max(dt, 1e-4);
          this.rootX.value = x;
          this.rootY.value = twy;
          this.rootY.vel = 0;
          const d = this.slideDir;
          this.thruster.target = 0.2 * (1 - u);
          this.yaw.target = d * 1.1;
          this.bodyTilt.setTarget(-0.26 * (1 - u * 0.6), 0, d * 0.06);
          const hipLead = d === 1 ? this.hipR : this.hipL;
          const kneeLead = d === 1 ? this.kneeR : this.kneeL;
          const ankLead = d === 1 ? this.ankR : this.ankL;
          const hipBack = d === 1 ? this.hipL : this.hipR;
          const kneeBack = d === 1 ? this.kneeL : this.kneeR;
          hipLead.target = -0.55;
          kneeLead.target = 0.15;
          ankLead.target = 0.3;
          hipBack.target = 0.3;
          kneeBack.target = 0.85;
          // trailing arm drags the ground, lead arm out for balance
          this.shL.setTarget(d === 1 ? -0.3 : 0.6, 0, -0.5);
          this.shR.setTarget(d === 1 ? 0.6 : -0.3, 0, 0.5);
          this.squash.target = 0.95;
          if (env.t > this.slideDustNext && u < 0.85) {
            this.slideDustNext = env.t + 0.09;
            env.dust?.burst(this.rootX.value - d * 0.2, twy, 0.3);
          }
          if (u >= 1) {
            this.landFrom = "slide";
            this.rootX.target = twx;
            this.rootY.target = twy;
            this.mode = "dashLand";
            this.stateT = 0;
            this.squash.kick(-2.5);
            this.antX.kick(-4);
            env.ring?.burst(twx, twy, 0.7);
          }
        }
        break;
      }

      case "flyOff": {
        // intro cinematic: crouch beat, then jet horizontally off the right edge
        if (this.stateT < 0.16) {
          this.squash.target = 0.84;
          this.bodyOff.setTarget(0, -0.4, 0);
          this.kneeL.target = 1.0;
          this.kneeR.target = 1.0;
          this.hipL.target = -0.5;
          this.hipR.target = -0.5;
          this.yaw.target = HALF_PI * 0.9;
          this.thruster.target = 0.4;
          this.eyeMood.target = 0.86;
        } else {
          const a = Math.min(1, (this.stateT - 0.16) / 0.5);
          const vx = lerp(3, 22, a * a);
          this.rootX.value += vx * dt;
          this.rootX.vel = vx;
          this.rootY.vel = 0;
          this.thruster.target = 1;
          this.yaw.target = HALF_PI * 0.95;
          this.squash.target = 1.14;
          this.bodyOff.setTarget(0, 0, 0);
          this.bodyTilt.setTarget(0.15, 0, clamp(-vx * 0.04, -0.6, 0));
          this.hipL.target = 0.3;
          this.hipR.target = 0.38;
          this.kneeL.target = 1.0;
          this.kneeR.target = 0.85;
          this.shL.setTarget(0.6, 0, -0.3);
          this.shR.setTarget(0.6, 0, 0.3);
          this.eyeMood.target = 0.86;
          const rightWorld = pxToWorldX(vw * 1.18, vw, vh);
          if (this.rootX.value > rightWorld) {
            this.mode = "offsite";
            this.stateT = 0;
            this.rootX.vel = 0;
          }
        }
        break;
      }

      case "offsite": {
        // parked past the right edge while the page slides in
        this.thruster.target = 0.25;
        this.rootX.vel = 0;
        this.rootY.vel = 0;
        if (this.pendingEnterLeft) {
          this.pendingEnterLeft = false;
          this.startEnterLeft(twx, twy, vw, vh);
        }
        break;
      }

      case "ground": {
        // PAGE-RIDING: glued to the page during normal scrolling — the fix
        // for the floaty "robot lags the content" feel. Flings still brace;
        // big jumps still travel.
        if (
          !this.braceActive &&
          rs.targetSpace === "doc" &&
          dScroll !== 0 &&
          Math.abs(dScroll) < RIDE_MAX_PX
        ) {
          this.rootY.value += dScroll * wpp;
        }

        // live-anchor watchdog: a big VERTICAL jump (sticky sub-anchors,
        // resized layout) must not become a long spring drift — fly it.
        if (!this.braceActive && t > this.selfTravelNext) {
          const dyT = twy - this.rootY.value;
          const distT = Math.hypot(twx - this.rootX.value, dyT);
          if (distT > 1.25 && Math.abs(dyT) > 1.2) {
            this.selfTravelNext = t + 1.5;
            this.pendingTravel = dyT < 0.6 && Math.abs(twx - this.rootX.value) > 0.8 ? "slide" : "dash";
          }
        }

        if (this.braceActive) {
          // hold position while the user is flinging the page
          this.rootX.target = this.rootX.value;
          this.rootY.target = this.rootY.value;
        } else {
          // idle pacing: when settled and quiet, take a little stroll
          if (
            !this.gesture &&
            !rs.speaking &&
            !rs.currentLine &&
            !rs.hovered &&
            this.arrivedFrames > 40 &&
            t > this.wanderNext
          ) {
            this.wanderOff = (Math.random() < 0.5 ? -1 : 1) * rand(0.45, 0.85);
            this.wanderUntil = t + rand(2.2, 3.4);
            this.wanderNext = t + rand(7, 13);
          }
          if (t > this.wanderUntil) this.wanderOff = 0;
          const margin = pxToWorldX(clamp(24 + hPx * 0.25, 24, 200), vw, vh);
          const wx = clamp(twx + this.wanderOff, margin, -margin);
          this.rootX.target = this.wanderOff !== 0 ? wx : twx;
          if (laneOn) {
            this.rootX.target = pxToWorldX(
              clampOutOfContent(worldToPxX(this.rootX.target, vw, vh), lane),
              vw,
              vh,
            );
          }
          this.rootY.target = twy;
        }
        this.squash.target = 1;
        this.thruster.target = 0;
        this.bodyOff.setTarget(0, 0, 0);
        break;
      }
    }

    /* ---- step root, clamp speed (direct-drive modes write root themselves).
       Walking far away? Hurry: speed scales with remaining distance. ---- */
    const distToTarget = Math.hypot(twx - this.rootX.value, twy - this.rootY.value);
    const hurry = this.mode === "ground" && !this.braceActive ? clamp(distToTarget / 1.4, 1, 2.6) : 1;
    const maxV = MAX_SPEED * S * hurry;
    const directDrive =
      this.mode === "dashFly" ||
      this.mode === "ropeDown" ||
      this.mode === "slide" ||
      this.mode === "exitUp" ||
      this.mode === "flyOff" ||
      this.mode === "offsite";
    if (!directDrive) {
      this.rootX.step(dt);
      this.rootY.step(dt);
      // momentum-preserving touchdown: dashLand keeps most of its arrival energy
      const landRelax = this.mode === "dashLand" ? 2.4 : 1;
      this.rootX.vel = clamp(this.rootX.vel, -maxV * landRelax, maxV * landRelax);
      this.rootY.vel = clamp(this.rootY.vel, -maxV * 1.4 * landRelax, maxV * 1.4 * landRelax);
    }
    // Rest off the content: in the grounded / landing states snap the robot
    // out of the content column to the nearer gutter. Travel (dash/rope/slide)
    // is exempt — leaping over the content is the whole show.
    if (laneOn && (this.mode === "ground" || this.mode === "dashLand")) {
      const px = worldToPxX(this.rootX.value, vw, vh);
      const cpx = clampOutOfContent(px, lane);
      if (Math.abs(cpx - px) > 0.5) {
        this.rootX.value = pxToWorldX(cpx, vw, vh);
        if ((cpx < px && this.rootX.vel > 0) || (cpx > px && this.rootX.vel < 0)) {
          this.rootX.vel = 0;
        }
      }
    }
    this.scaleW.step(dt);

    const speed = Math.abs(this.rootX.vel);
    const grounded = this.mode === "ground";

    /* ---- gait (velocity-fed phase → feet can't moonwalk) ---- */
    let bobY = 0;
    if (grounded) {
      const s01 = clamp01(speed / maxV);
      const gaitTarget = this.braceActive ? 0 : smoothstep01(speed / GAIT_ON_SPEED - 0.4);
      this.gaitAmp = expApproach(this.gaitAmp, gaitTarget, 8, dt);
      const g = this.gaitAmp;
      if (g > 0.02) {
        const L = Math.max(0.05, LEG_L * S);
        const hipAmp = 0.3 + 0.3 * s01;
        const stride = Math.max(0.05, 2 * L * Math.sin(hipAmp));
        this.gaitPhase += TWO_PI * (speed / stride) * dt;
        const f = this.gaitPhase;
        const fo = f + Math.PI * 1.03;
        const sin = Math.sin;
        const dir = Math.sign(this.rootX.vel) || 1;

        // legs (rotations about X; converted to travel direction via yaw)
        this.hipL.target += sin(f) * hipAmp * g;
        this.hipR.target += sin(fo) * hipAmp * 0.97 * g;
        this.kneeL.target += Math.pow(Math.max(0, sin(f - 0.6)), 1.5) * (0.85 + 0.3 * s01) * g;
        this.kneeR.target += Math.pow(Math.max(0, sin(fo - 0.6)), 1.5) * (0.82 + 0.3 * s01) * g;
        this.ankL.target += (0.3 * Math.max(0, sin(f + 2.5)) - 0.22 * Math.max(0, sin(f - 2.5))) * g;
        this.ankR.target += (0.3 * Math.max(0, sin(fo + 2.5)) - 0.22 * Math.max(0, sin(fo - 2.5))) * g;
        // arms counter-swing with elbow drag (underdamped elbow springs)
        this.shL.x.target += sin(fo) * (0.4 + 0.15 * s01) * g;
        this.shR.x.target += sin(f) * (0.4 + 0.15 * s01) * 0.97 * g;
        this.elL.target += (0.15 + 0.25 * Math.max(0, sin(fo - 0.9))) * g;
        this.elR.target += (0.15 + 0.25 * Math.max(0, sin(f - 0.9))) * g;
        // torso: lean into travel, hip drop, pelvis/chest counter-rotation
        this.bodyTilt.x.target += 0.14 * s01 * g;
        this.bodyTilt.y.target += 0.08 * sin(f) * g;
        this.bodyTilt.z.target += 0.05 * sin(f) * g;
        this.torsoYaw.target += -0.12 * sin(f) * g;
        this.torsoRoll.target += -0.03 * sin(f) * g;
        // head bob (double frequency, slight lag — head spring adds more)
        this.head.x.target += 0.03 * sin(2 * f + 0.7) * g;
        bobY = 0.045 * S * (0.5 - 0.5 * Math.cos(2 * f - 0.55)) * g;
        // antenna kicks on footfalls
        const stepSign = sin(f) >= 0 ? 1 : -1;
        if (stepSign !== this.prevStepSign) {
          this.prevStepSign = stepSign;
          this.antX.kick(1.2 * (0.3 + s01) * g * stepSign);
        }
        // face travel while striding
        this.yaw.target = dir * 1.2 * clamp01(speed / (0.35 * maxV)) * g;
      } else {
        this.gaitPhase = 0;
        this.yaw.target = rs.facing * 0.22;
      }
    }

    /* ---- consume emotes / hover / point ---- */
    if (rs.emote && rs.emote.at !== this.emoteSeen) {
      if (grounded) {
        this.emoteSeen = rs.emote.at;
        this.startGesture(rs.emote.kind, rs.facing);
      } else if (performance.now() - rs.emote.at > 6000) {
        this.emoteSeen = rs.emote.at; // too stale to buffer — drop it
      }
      // otherwise: keep it queued until he's back on the ground
    }
    if (rs.hovered && !this.prevHovered && grounded && !this.gesture) {
      this.startGesture("hover", rs.facing);
    }
    this.prevHovered = rs.hovered;
    const nowMs = performance.now();
    if (rs.pointUntil > nowMs && this.pointSeen !== rs.pointUntil && grounded && !this.gesture) {
      this.pointSeen = rs.pointUntil;
      const px = pxToWorldX(rs.pointAtX, vw, vh);
      const py = pxToWorldY(rs.pointAtY - scrollY, vh);
      const g: Gesture = {
        kind: "point",
        t: 0,
        dur: Math.min(2.2, (rs.pointUntil - nowMs) / 1000),
        side: px > this.rootX.value ? 1 : -1,
        px,
        py,
      };
      this.gesture = g;
    }

    /* ---- gesture layer ---- */
    const gestureOwnsArms = this.runGesture(dt, t, env, S);

    /* ---- talk layer (mouth + nods + beat gestures) ---- */
    const speaking = rs.speaking && grounded;
    this.runTalk(speaking, t, gestureOwnsArms, rs.facing);

    /* ---- brace pose (overrides talk/gait arms, not click gestures) ---- */
    if (this.braceActive && grounded && !this.gesture) {
      const sgn = Math.sign(vel) || 1;
      this.bodyTilt.x.target = -0.2 * sgn;
      this.shR.setTarget(-2.2, 0, 0.35);
      this.elR.target = 1.3;
      this.hipL.target = 0.12;
      this.hipR.target = -0.12;
      this.eyeMood.target = 1.35;
      this.brow.target = 0.12;
    }

    /* ---- gaze ---- */
    this.runGaze(sc, vw, vh, t);

    /* ---- alive-ness: micro-wander, idle arm sway, dilation, talk lean ---- */
    // nobody holds their head perfectly still
    this.head.y.target += 0.025 * Math.sin(t * 0.61 + 1.7) + 0.014 * Math.sin(t * 1.27);
    this.head.x.target += 0.014 * Math.sin(t * 0.47 + 0.5);
    this.head.z.target += 0.008 * Math.sin(t * 0.83 + 2.1);
    if (grounded && !this.gesture && this.gaitAmp < 0.1) {
      this.shL.x.target += 0.022 * Math.sin(t * 0.8);
      this.shR.x.target += 0.02 * Math.sin(t * 0.8 + 1.4);
      this.elL.target += 0.02 * Math.sin(t * 0.66 + 0.6);
      this.elR.target += 0.02 * Math.sin(t * 0.66 + 2.0);
    }
    if (speaking) this.bodyTilt.x.target += 0.05; // lean in while talking
    this.pupilDil.target = this.braceActive ? 0.85 : rs.hovered || speaking ? 1.3 : 1;

    /* ---- breath / blink / fidget ---- */
    this.runBreath(speaking, t, dt);
    this.runBlink(t, dt);
    if (grounded && !this.gesture && !speaking && this.gaitAmp < 0.1 && !this.braceActive) {
      this.runFidget(t, dt);
    } else {
      this.fidget = null;
    }

    /* ---- antenna follows body lean ---- */
    this.antX.target = -this.bodyTilt.x.value * 1.5;
    this.antZ.target = -this.bodyTilt.z.value * 1.2;

    /* ---- hop ballistic (click emote) ---- */
    if (this.hopVy !== 0 || this.hopY > 0) {
      this.hopVy -= 9.8 * dt;
      this.hopY += this.hopVy * dt;
      if (this.hopY <= 0) {
        if (Math.abs(this.hopVy) > 0.5) {
          this.squash.target = 1;
          this.squash.kick(-6);
          env.dust?.burst(this.rootX.value, this.rootY.value, 0.5);
          env.ring?.burst(this.rootX.value, this.rootY.value, 0.55);
          this.antX.kick(-5);
        }
        this.hopY = 0;
        this.hopVy = 0;
      }
    }

    /* ---- step all springs ---- */
    this.yaw.step(dt);
    this.bodyTilt.step(dt);
    this.bodyOff.step(dt);
    this.torsoYaw.step(dt);
    this.torsoRoll.step(dt);
    this.shL.step(dt);
    this.shR.step(dt);
    this.elL.step(dt);
    this.elR.step(dt);
    this.hipL.step(dt);
    this.hipR.step(dt);
    this.kneeL.step(dt);
    this.kneeR.step(dt);
    this.ankL.step(dt);
    this.ankR.step(dt);
    this.head.step(dt);
    this.pupilX.step(dt);
    this.pupilY.step(dt);
    this.eyeMood.step(dt);
    this.brow.step(dt);
    this.mouthOpen.step(dt);
    this.antX.step(dt);
    this.antZ.step(dt);
    this.squash.step(dt);
    this.thruster.step(dt);
    this.pupilDil.step(dt);

    /* ---- write refs ---- */
    this.write(rs, env, bobY, t, twy);

    /* ---- arrival + reporting ---- */
    const effTx = this.mode === "ground" && this.wanderOff !== 0 ? this.rootX.target : twx;
    const distPx = Math.hypot(this.rootX.value - effTx, this.rootY.value - twy) / wpp;
    if (grounded && distPx < 8 && Math.abs(this.rootX.vel) < 0.08) {
      this.arrivedFrames++;
    } else {
      this.arrivedFrames = 0;
    }
    robotStore.setArrived(this.arrivedFrames >= 3);
    robotStore.setMode(
      this.mode === "hidden"
        ? "hidden"
        : this.mode === "ground"
          ? "ground"
          : this.mode === "ropeDown"
            ? "rope"
            : this.mode === "slide"
              ? "slide"
              : this.fromEnter
                ? "enter"
                : "dash",
    );

    this.debug.mode = this.mode;
    this.debug.speed = speed;
    this.debug.gaitPhase = this.gaitPhase;
    this.debug.vel = vel;
    this.debug.thr = this.thruster.value;
  }

  /* ================================================================ */

  private startEnter(twx: number, twy: number, vh: number) {
    this.fromEnter = true;
    this.trailSuppressT = 0.3;
    const skyY = pxToWorldY(-0.25 * vh, vh);
    this.rootX.set(twx);
    this.rootY.set(skyY);
    this.yaw.set(0);
    this.scaleW.set(this.scaleW.target);
    this.launchGroundY = twy;
    this.dashP0.x = twx;
    this.dashP0.y = skyY;
    this.dashP3.x = twx;
    this.dashP3.y = twy;
    this.dashP1.x = twx + 0.3;
    this.dashP1.y = skyY + 0.3;
    this.dashP2.x = twx - 0.2;
    this.dashP2.y = twy + 1.2;
    this.dashPrev.x = twx;
    this.dashPrev.y = skyY;
    this.dashDur = 1.0;
    this.mode = "dashFly";
    this.stateT = 0;
    this.thruster.set(1);
  }

  /** Intro stage entrance: rappel in from the sky on the energy cable.
      Faster than a regular descent — he has a show to start. */
  private startEnterRope(twx: number, twy: number, vh: number) {
    this.fromEnter = false;
    this.trailSuppressT = 0.5;
    this.rootX.set(twx + 0.1);
    this.rootY.set(pxToWorldY(-0.08 * vh, vh));
    this.yaw.set(0);
    this.scaleW.set(this.scaleW.target);
    this.beginRopeDescent(twx, twy);
    this.ropeDur = Math.min(this.ropeDur, 1.0);
  }

  /** Cinematic re-entry: fly in low from the left edge, superhero-land. */
  private startEnterLeft(twx: number, twy: number, vw: number, vh: number) {
    this.fromEnter = true;
    this.trailSuppressT = 0.32;
    const x0 = pxToWorldX(-0.12 * vw, vw, vh);
    const y0 = twy + 1.0;
    this.rootX.set(x0);
    this.rootY.set(y0);
    this.yaw.set(HALF_PI * 0.9);
    this.scaleW.set(this.scaleW.target);
    this.launchGroundY = twy;
    const D = Math.hypot(twx - x0, twy - y0);
    this.dashP0.x = x0;
    this.dashP0.y = y0;
    this.dashP1.x = x0 + (twx - x0) * 0.35;
    this.dashP1.y = y0 + 0.25;
    this.dashP2.x = twx - 1.6;
    this.dashP2.y = twy + 0.5;
    this.dashP3.x = twx;
    this.dashP3.y = twy;
    this.dashPrev.x = x0;
    this.dashPrev.y = y0;
    this.dashDur = clamp(0.55 + 0.04 * D, 0.7, 1.0);
    this.mode = "dashFly";
    this.stateT = 0;
    this.thruster.set(1);
  }

  private startFlyOff() {
    this.gesture = null;
    this.beat = null;
    this.pendingTravel = null;
    this.ropeRetractT = -1;
    if (this.refs.rope) this.refs.rope.visible = false;
    this.mode = "flyOff";
    this.stateT = 0;
    this.squash.kick(4);
    this.antX.kick(5);
  }

  private startDashAnt() {
    this.mode = "dashAnt";
    this.stateT = 0;
    this.gesture = null;
    this.beat = null;
  }

  private startExitUp() {
    this.mode = "exitUp";
    this.stateT = 0;
    this.gesture = null;
    this.beat = null;
    this.thruster.target = 1;
    this.squash.target = 1.12;
    this.squash.kick(4);
  }

  private beginRopeDescent(twx: number, twy: number) {
    this.gesture = null;
    this.beat = null;
    this.ropeX0 = this.rootX.value;
    this.ropeY0 = this.rootY.value;
    const drop = Math.max(0.2, this.ropeY0 - twy);
    this.ropeDur = clamp(0.5 + 0.16 * drop, 0.7, 1.5);
    this.mode = "ropeDown";
    this.stateT = 0;
    this.thruster.target = 0;
    this.antX.kick(2.5);
  }

  private startSlide(twx: number, twy: number) {
    this.gesture = null;
    this.beat = null;
    const x0 = this.rootX.value;
    const y0 = this.rootY.value;
    const d: 1 | -1 = twx >= x0 ? 1 : -1;
    this.slideDir = d;
    const skidLen = Math.min(1.4, Math.abs(twx - x0) * 0.55);
    this.slidePreX = twx - d * skidLen;
    this.slideDropDur = 0.32;
    this.dashP0.x = x0;
    this.dashP0.y = y0;
    this.dashP3.x = this.slidePreX;
    this.dashP3.y = twy;
    this.dashP1.x = x0 + (this.slidePreX - x0) * 0.3;
    this.dashP1.y = y0 + 0.15;
    this.dashP2.x = this.slidePreX - (this.slidePreX - x0) * 0.15;
    this.dashP2.y = twy + 0.4;
    this.launchGroundY = y0;
    this.mode = "slide";
    this.stateT = 0;
    this.slideDustNext = 0;
    this.squash.target = 1.05;
  }

  private startDashFly(twx: number, twy: number) {
    this.fromEnter = false;
    this.pendingTravel = null; // an in-flight dash retargets live — nothing stays queued
    const x0 = this.rootX.value;
    const y0 = this.rootY.value;
    const dx = twx - x0;
    const dy = twy - y0;
    const D = Math.hypot(dx, dy);
    const dirX = D > 1e-4 ? dx / D : 1;
    // big graceful arcs — he LEAPS up and over the content (the spectacle)
    const up = Math.min(0.6 + 0.2 * D, 2.4);
    const up2 = Math.min(0.5 + 0.16 * D, 2.0);
    this.dashP0.x = x0;
    this.dashP0.y = y0;
    this.dashP1.x = x0 + 0.18 * D * dirX;
    this.dashP1.y = y0 + up;
    this.dashP2.x = twx - 0.22 * D * dirX;
    this.dashP2.y = twy + up2;
    this.dashP3.x = twx;
    this.dashP3.y = twy;
    this.dashPrev.x = x0;
    this.dashPrev.y = y0;
    this.dashDur = clamp(0.55 + 0.1 * D, 0.6, 1.35);
    this.launchGroundY = y0;
    this.mode = "dashFly";
    this.stateT = 0;
    this.squash.target = 1.18;
    this.squash.kick(6);
    this.thruster.target = 1;
  }

  private landDash(twx: number, twy: number, env: BrainEnv) {
    // handoff: springs inherit the path velocity → natural overshoot + settle
    this.landFrom = "dash";
    const dashDist = Math.hypot(this.dashP3.x - this.dashP0.x, this.dashP3.y - this.dashP0.y);
    this.heroLand = this.fromEnter || dashDist > 4.5;
    this.heroSpun = false;
    this.rootX.target = twx;
    this.rootY.target = twy;
    this.mode = "dashLand";
    this.stateT = 0;
    this.fromEnter = false;
    this.squash.target = 0.8;
    this.squash.kick(this.heroLand ? -10 : -8);
    this.antX.kick(-9);
    this.thruster.target = 0;
    env.dust?.burst(twx, twy, this.heroLand ? 1.2 : 1);
    env.ring?.burst(twx, twy, this.heroLand ? 1.3 : 0.9);
    if (Math.random() < 0.6) this.blinkT = 0;
    this.breathBoostUntil = env.t + 2;
  }

  /* ---------------------------------------------------------------- */

  private startGesture(kind: GestureKind, facing: -1 | 1) {
    const side: 1 | -1 = facing === 1 ? -1 : 1; // free arm = away from content
    switch (kind) {
      case "wave":
        this.gesture = { kind, t: 0, dur: 1.4, side };
        break;
      case "hop":
        this.gesture = { kind, t: 0, dur: 0.75, side };
        this.squash.target = 0.88;
        break;
      case "spin":
        this.gesture = { kind, t: 0, dur: 0.85, side };
        this.spinT = 0;
        break;
      case "bow":
        this.gesture = { kind, t: 0, dur: 1.0, side };
        break;
      case "poke":
        this.gesture = { kind, t: 0, dur: 0.6, side };
        this.squash.kick(2.2);
        this.antX.kick(4);
        break;
      case "hover":
        this.gesture = { kind, t: 0, dur: 0.8, side };
        break;
      case "dance":
        this.gesture = { kind, t: 0, dur: 2.4, side };
        break;
      default:
        break;
    }
  }

  /** Returns true while the gesture owns the arm channels. */
  private runGesture(dt: number, t: number, env: BrainEnv, S: number): boolean {
    // antenna spin timeline runs independently of gesture slot
    if (this.spinT >= 0) {
      this.spinT += dt;
      const u = clamp01(this.spinT / 0.65);
      if (this.refs.antSpin) this.refs.antSpin.rotation.y = 4 * Math.PI * easeOutQuint(u);
      // ramp must settle back at the material's authored base (3.0)
      robotMats.antBall.emissiveIntensity = 3.0 + 2.5 * (1 - u);
      if (this.spinT > 0.85) {
        this.spinT = -1;
        if (this.refs.antSpin) this.refs.antSpin.rotation.y = 0;
        this.antX.kick(5);
      }
    }

    const g = this.gesture;
    if (!g) return false;
    g.t += dt;
    if (g.t >= g.dur) {
      if (g.kind === "dance") {
        this.antX.kick(7);
        env.ring?.burst(this.rootX.value, this.rootY.value, 0.6);
      }
      this.gesture = null;
      return false;
    }

    const sh = g.side === 1 ? this.shR : this.shL;
    const el = g.side === 1 ? this.elR : this.elL;
    const sgn = g.side;

    switch (g.kind) {
      case "wave": {
        const u = g.t / g.dur;
        const ramp = smoothstep01(u / 0.2) * smoothstep01((1 - u) / 0.25);
        sh.setTarget(-0.2, 0, sgn * (2.35 * ramp) + sgn * 0.18 * Math.sin(t * TWO_PI * 2.8) * ramp);
        el.target = 0.5 + (0.35 + 0.3 * Math.sin(t * TWO_PI * 2.8)) * ramp;
        this.head.z.target = -sgn * 0.12 * ramp;
        this.eyeMood.target = 0.6;
        return true;
      }
      case "hop": {
        if (g.t > 0.1 && this.hopVy === 0 && this.hopY === 0) {
          this.hopVy = 2.6;
          this.squash.target = 1.12;
          this.squash.kick(5);
        }
        if (this.hopY > 0.02) {
          this.shL.setTarget(0.2, 0, -0.9);
          this.shR.setTarget(0.2, 0, 0.9);
          this.kneeL.target = 1.2;
          this.kneeR.target = 1.1;
          this.hipL.target = -0.4;
          this.hipR.target = -0.45;
        }
        this.eyeMood.target = 0.6;
        return true;
      }
      case "spin": {
        this.head.z.target = 0.05 * Math.sin(t * TWO_PI * 8) * (1 - g.t / g.dur);
        this.eyeMood.target = 0.6;
        return false;
      }
      case "bow": {
        const u = g.t / g.dur;
        const depth = u < 0.3 ? smoothstep01(u / 0.3) : u < 0.55 ? 1 : 1 - smoothstep01((u - 0.55) / 0.45);
        this.bodyTilt.x.target = 0.5 * depth;
        sh.setTarget(-0.8 * depth, 0, sgn * 0.1);
        el.target = 1.4 * depth + 0.16;
        const far = g.side === 1 ? this.shL : this.shR;
        far.setTarget(0.5 * depth, 0, -sgn * 0.25);
        this.head.x.target += 0.25 * depth;
        return true;
      }
      case "poke": {
        const u = g.t / g.dur;
        this.head.z.target = sgn * 0.25 * (1 - u);
        this.eyeMood.target = 0.55;
        return false;
      }
      case "hover": {
        const u = g.t / g.dur;
        const ramp = smoothstep01(u / 0.25) * smoothstep01((1 - u) / 0.3);
        this.head.z.target = sgn * 0.18 * ramp;
        sh.setTarget(-0.3, 0, sgn * 0.5 * ramp);
        el.target = 1.2 * ramp + 0.16 + 0.25 * Math.sin(t * TWO_PI * 3) * ramp;
        this.eyeMood.target = 0.78;
        return true;
      }
      case "dance": {
        // 2.4s groove at ~125BPM: bounce → K-VRC one-leg pose → groove out
        const u = g.t / g.dur;
        const ph = g.t * (125 / 60) * TWO_PI;
        this.eyeMood.target = 0.55;
        if (u < 0.4 || u > 0.65) {
          const s = Math.sin(ph);
          const c = Math.sin(ph * 0.5);
          this.squash.target = 1 + 0.06 * Math.max(0, s);
          this.bodyTilt.setTarget(0.06, 0.12 * c, 0.1 * Math.sin(ph * 0.5 + 1));
          this.shL.setTarget(-0.5 - 0.45 * Math.max(0, s), 0, -0.45);
          this.shR.setTarget(-0.5 - 0.45 * Math.max(0, -s), 0, 0.45);
          this.elL.target = 1.2;
          this.elR.target = 1.2;
          this.hipL.target = -0.1 + 0.1 * s;
          this.hipR.target = -0.1 - 0.1 * s;
          this.kneeL.target = 0.25;
          this.kneeR.target = 0.25;
          this.head.z.target = 0.14 * c;
          this.torsoYaw.target = 0.18 * c;
        } else {
          // the pose
          this.hipL.target = -0.95;
          this.kneeL.target = 1.45;
          this.ankL.target = 0.4;
          this.hipR.target = 0.05;
          this.kneeR.target = 0.18;
          this.shL.setTarget(-2.3, 0, -0.35);
          this.elL.target = 0.25;
          this.shR.setTarget(-0.6, 0, 1.0);
          this.elR.target = 0.9;
          this.bodyTilt.setTarget(-0.04, 0, 0.12);
          this.eyeMood.target = 0.45;
        }
        return true;
      }
      case "point": {
        // the target is a DOC element — re-project every frame so the arm
        // stays on it while the robot rides the scrolling page
        const rsP = robotStore.get();
        if (Number.isFinite(rsP.pointAtX)) {
          g.px = pxToWorldX(rsP.pointAtX, env.vw, env.vh);
          g.py = pxToWorldY(rsP.pointAtY - this.prevScrollY, env.vh);
        }
        const u = g.t / g.dur;
        const ramp = smoothstep01(u / 0.18) * smoothstep01((1 - u) / 0.2);
        const dx = (g.px ?? 0) - this.rootX.value;
        const dy = (g.py ?? 0) - (this.rootY.value + ROBOT_NATIVE_H * S * 0.55);
        const len = Math.hypot(dx, dy) || 1;
        let theta = Math.atan2(dx / len, -dy / len);
        theta = sgn === 1 ? clamp(theta, 0.2, 2.4) : clamp(theta, -2.4, -0.2);
        sh.setTarget(-0.25 * ramp, 0, theta * ramp + sgn * 0.14 * (1 - ramp));
        el.target = 0.12 + 0.04 * (1 - ramp);
        this.bodyTilt.z.target += -sgn * 0.07 * ramp;
        this.bodyTilt.y.target += sgn * 0.1 * ramp;
        return true;
      }
    }
    return false;
  }

  private runTalk(speaking: boolean, t: number, gestureOwnsArms: boolean, facing: -1 | 1) {
    const refs = this.refs;
    if (speaking) {
      if (t > this.mouthNext) {
        const r = Math.random();
        this.mouthShape = r < 0.68 ? "o" : r < 0.84 ? "flat" : "smile";
        this.mouthOpen.target = this.mouthShape === "o" ? (Math.random() < 0.4 ? 0.55 : 1) : 0.2;
        this.mouthNext = t + rand(0.07, 0.12);
      }
      if (t > this.nodNext) {
        this.head.x.kick(0.9);
        this.nodNext = t + rand(1.2, 2.2);
      }
      robotMats.core.emissiveIntensity = 3.2;
      // beat gestures while hands are free
      if (!gestureOwnsArms && !this.beat && t > this.beatNext) {
        this.beat = { t: 0, dur: 1.1, side: Math.random() < 0.5 ? (facing as 1 | -1) : ((-facing) as 1 | -1) };
      }
    } else {
      this.mouthShape = "smile";
      this.mouthOpen.target = 0;
      robotMats.core.emissiveIntensity = 2.2;
    }

    if (this.beat) {
      this.beat.t += 1 / 60; // beats are short; frame-rate drift is invisible
      const b = this.beat;
      const u = clamp01(b.t / b.dur);
      if (u >= 1 || !speaking || gestureOwnsArms) {
        this.beat = null;
        this.beatNext = t + rand(1.4, 2.3);
      } else {
        const ramp = smoothstep01(u / 0.45) * smoothstep01((1 - u) / 0.45);
        const sh = b.side === 1 ? this.shR : this.shL;
        const el = b.side === 1 ? this.elR : this.elL;
        sh.x.target += -0.55 * ramp;
        sh.z.target += b.side * 0.3 * ramp;
        el.target += 0.9 * ramp;
      }
    }

    // mouth visibility writes
    if (refs.mouthSmile) refs.mouthSmile.visible = this.mouthShape === "smile";
    if (refs.mouthFlat) refs.mouthFlat.visible = this.mouthShape === "flat";
    if (refs.mouthO) {
      refs.mouthO.visible = this.mouthShape === "o";
      const sy = 0.3 + 0.8 * clamp01(this.mouthOpen.value);
      refs.mouthO.scale.set(1, sy, 1);
    }
  }

  private runGaze(
    sc: ReturnType<typeof sceneStore.get>,
    vw: number,
    vh: number,
    t: number,
  ) {
    // pick gaze target (world x/y on a virtual plane in front of the robot)
    let gx: number;
    let gy: number;
    const headWorldY = this.rootY.value + ROBOT_NATIVE_H * this.scaleW.value * 0.86;
    const g = this.gesture;
    if (g?.kind === "point") {
      gx = g.px ?? 0;
      gy = g.py ?? 0;
    } else if (sc.pointerActive) {
      gx = (sc.pointerX * PLANE_H * (vw / vh)) / 2;
      gy = (sc.pointerY * PLANE_H) / 2;
    } else {
      gx = this.rootX.value * 0.9; // ≈ camera
      gy = headWorldY * 0.4;
    }
    const dx = gx - this.rootX.value;
    const dy = gy - headWorldY;
    // cursor-proximity: the closer your cursor, the more of his body follows it
    let prox = 0;
    if (sc.pointerActive && g?.kind !== "point") {
      prox = 1 - clamp01(Math.hypot(dx, dy) / 3.2);
    }
    const depth = 3; // virtual gaze depth keeps angles sane for on-plane targets
    const yawWorld = Math.atan2(dx, depth);
    const pitch = Math.atan2(dy, Math.hypot(dx, depth));
    const yawLocal = clamp(wrapAngle(yawWorld - this.yaw.value), -0.9, 0.9);
    const headGain = lerp(0.6, 0.85, prox);
    this.head.y.target = yawLocal * headGain;
    this.head.x.target += clamp(-pitch * headGain, -0.4, 0.35);
    this.head.z.target += -this.bodyTilt.z.value * 0.5;
    this.torsoYaw.target += yawLocal * 0.22 * prox;

    // pupils take the remainder + micro-saccades
    if (t > this.saccNext) {
      this.microX = rand(-0.004, 0.004);
      this.microY = rand(-0.003, 0.003);
      this.saccNext = t + rand(0.8, 2.0);
    }
    const rem = yawLocal - this.head.y.value;
    const pw = 1 + 0.6 * prox;
    this.pupilX.target = clamp(rem * 0.05 + this.microX, -0.022 * pw, 0.022 * pw);
    this.pupilY.target = clamp(pitch * 0.04 + this.microY, -0.014 * pw, 0.014 * pw);
  }

  private runBreath(speaking: boolean, t: number, dt: number) {
    const rate = 0.32 * (speaking ? 1.25 : 1) * (t < this.breathBoostUntil ? 1.6 : 1);
    this.breathPhase += TWO_PI * rate * dt;
    // asymmetric: quick-ish inhale, slow exhale
    const b = Math.sin(this.breathPhase + 0.35 * Math.sin(this.breathPhase));
    const refs = this.refs;
    if (refs.torso) {
      refs.torso.scale.set(1 + 0.015 * b, 1 + 0.009 * b, 1 + 0.015 * b);
      refs.torso.rotation.y = this.torsoYaw.value;
      refs.torso.rotation.z = this.torsoRoll.value;
    }
    if (!speaking) {
      robotMats.core.emissiveIntensity = 2.2 * (1 + 0.15 * b);
    }
  }

  private blinkEnv(T: number) {
    if (T < 0) return 1;
    if (T < 0.06) return 1 - (T / 0.06) * 0.92;
    if (T < 0.1) return 0.08;
    if (T < 0.2) return 0.08 + ((T - 0.1) / 0.1) * 0.92;
    return 1;
  }

  private runBlink(t: number, dt: number) {
    if (this.blinkT < 0 && t > this.blinkNext) {
      this.blinkT = 0;
      this.blinkNext = t + rand(2.2, 4.8) + (Math.random() < 0.12 ? 0.18 : 0);
    }
    let L = 1;
    let R = 1;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      L = this.blinkEnv(this.blinkT);
      R = this.blinkEnv(this.blinkT - 0.035); // tiny offset — real eyes aren't synced
      if (this.blinkT > 0.24) this.blinkT = -1;
    }
    const mood = this.eyeMood.value;
    const refs = this.refs;
    // floor keeps the ∩ arcs a readable sliver even mid-blink/squint
    refs.eyeL?.scale.set(1, Math.max(0.15, L * mood), 1);
    refs.eyeR?.scale.set(1, Math.max(0.15, R * mood), 1);
  }

  private runFidget(t: number, dt: number) {
    if (!this.fidget) {
      if (t > this.fidgetNext) {
        const kind = Math.floor(Math.random() * 5);
        const dur = [1.4, 1.8, 0.5, 1.6, 1.9][kind];
        this.fidget = { kind, t: 0, dur, side: Math.random() < 0.5 ? 1 : -1 };
        if (kind === 2) {
          this.antX.kick(6);
          this.head.z.kick(0.4);
        }
      }
      return;
    }
    const f = this.fidget;
    f.t += dt;
    if (f.t >= f.dur) {
      this.fidget = null;
      this.fidgetNext = t + rand(4, 9);
      return;
    }
    const u = f.t / f.dur;
    const ramp = smoothstep01(u / 0.3) * smoothstep01((1 - u) / 0.3);
    switch (f.kind) {
      case 0: // weight shift
        this.bodyOff.x.target = 0.05 * f.side * ramp;
        this.bodyTilt.z.target += -0.04 * f.side * ramp;
        (f.side === 1 ? this.kneeR : this.kneeL).target += 0.12 * ramp;
        (f.side === 1 ? this.ankL : this.ankR).target += -0.08 * ramp;
        break;
      case 1: // look around (pupils lead, head follows via springs)
        this.head.y.target = (u < 0.45 ? 0.5 : -0.35) * f.side * ramp;
        this.pupilX.target = clamp(this.head.y.target * 0.06, -0.022, 0.022);
        break;
      case 2: // antenna boing — kicks fired at start
        break;
      case 3: {
        // foot taps
        const tap = Math.max(0, Math.sin(f.t * TWO_PI * 2.5));
        (f.side === 1 ? this.ankR : this.ankL).target += -0.18 * tap * ramp;
        this.bodyOff.x.target = -0.03 * f.side * ramp;
        break;
      }
      case 4: {
        // tiny groove — hums to himself
        const s = Math.sin(f.t * TWO_PI * 1.4);
        this.bodyTilt.z.target += 0.05 * s * ramp;
        this.head.z.target += 0.08 * s * ramp;
        this.squash.target = 1 + 0.02 * Math.max(0, s) * ramp;
        break;
      }
    }
  }

  /* ---------------------------------------------------------------- */

  private write(
    rs: ReturnType<typeof robotStore.get>,
    env: BrainEnv,
    bobY: number,
    t: number,
    groundWorldY: number,
  ) {
    const { vw, vh } = env;
    const refs = this.refs;
    const S = this.scaleW.value;

    const visibleNow = rs.visible && this.mode !== "hidden";
    if (refs.root) {
      refs.root.visible = visibleNow;
      refs.root.position.set(this.rootX.value, this.rootY.value + bobY + this.hopY, 0);
      refs.root.rotation.y = this.yaw.value;
      refs.root.scale.setScalar(S);
    }

    let s = clamp(this.squash.value, 0.78, 1.18);
    if (this.bodyTilt.x.value > 0.3) s = Math.max(s, 0.85); // don't crush a bow
    const inv = 1 / Math.sqrt(s);
    refs.squash?.scale.set(inv, s, inv);

    refs.body?.rotation.set(this.bodyTilt.x.value, this.bodyTilt.y.value, this.bodyTilt.z.value);
    refs.body?.position.set(this.bodyOff.x.value, FOOT_LIFT + this.bodyOff.y.value, 0);

    refs.head?.rotation.set(this.head.x.value, this.head.y.value, this.head.z.value);
    refs.brow?.rotation.set(this.brow.value, 0, 0);

    refs.pupilL?.position.set(this.pupilX.value, this.pupilY.value, 0);
    refs.pupilR?.position.set(this.pupilX.value, this.pupilY.value, 0);
    refs.pupilL?.scale.setScalar(this.pupilDil.value);
    refs.pupilR?.scale.setScalar(this.pupilDil.value);

    refs.shL?.rotation.set(this.shL.x.value, this.shL.y.value, this.shL.z.value);
    refs.shR?.rotation.set(this.shR.x.value, this.shR.y.value, this.shR.z.value);
    refs.elL?.rotation.set(this.elL.value, 0, 0);
    refs.elR?.rotation.set(this.elR.value, 0, 0);
    refs.hipL?.rotation.set(this.hipL.value, 0, 0.03);
    refs.hipR?.rotation.set(this.hipR.value, 0, -0.03);
    refs.kneeL?.rotation.set(this.kneeL.value, 0, 0);
    refs.kneeR?.rotation.set(this.kneeR.value, 0, 0);
    refs.ankL?.rotation.set(this.ankL.value, 0, 0);
    refs.ankR?.rotation.set(this.ankR.value, 0, 0);

    refs.antPivot?.rotation.set(
      clamp(this.antX.value, -0.7, 0.7),
      0,
      -0.12 + clamp(this.antZ.value, -0.7, 0.7),
    );

    // thruster flames + trails
    const f = clamp01(this.thruster.value);
    const flick = 1 + (Math.sin(t * 47) * Math.sin(t * 31)) * 0.18;
    const sy = Math.max(0.001, (0.35 + 0.85 * f) * flick * f);
    const sxz = 0.7 + 0.3 * f;
    refs.flameL?.scale.set(sxz, sy, sxz);
    refs.flameR?.scale.set(sxz, sy, sxz);
    // foot jets fire with the pack (slightly smaller, own flicker phase)
    const fsy = Math.max(0.001, (0.3 + 0.8 * f) * (1 + Math.sin(t * 53) * Math.sin(t * 29) * 0.2) * f);
    refs.footFlameL?.scale.set(sxz, fsy, sxz);
    refs.footFlameR?.scale.set(sxz, fsy * 0.92, sxz);
    if (refs.flameGlow) {
      refs.flameGlow.visible = f > 0.03;
      refs.flameGlow.scale.setScalar(Math.max(0.001, 0.25 + 0.5 * f + 0.06 * flick * f));
    }
    if (this.trailSuppressT > 0) this.trailSuppressT -= env.dt;
    const trailsOn = f > 0.06 && this.trailSuppressT <= 0 && this.mode !== "offsite";
    if (refs.trailL) refs.trailL.visible = trailsOn;
    if (refs.trailR) refs.trailR.visible = trailsOn;

    // rope cable: visible while descending, retracts upward after landing
    if (refs.rope) {
      if (this.mode === "ropeDown") {
        refs.rope.visible = visibleNow;
        refs.rope.position.y = 0;
      } else if (this.ropeRetractT >= 0) {
        this.ropeRetractT += env.dt;
        refs.rope.position.y += 24 * env.dt;
        if (this.ropeRetractT > 0.35) {
          this.ropeRetractT = -1;
          refs.rope.visible = false;
          refs.rope.position.y = 0;
        }
      }
    }


    // blob under-glow shadow
    let shadowY = groundWorldY;
    if (this.mode === "dashFly") {
      const u = easeInOutCubic(clamp01(this.stateT / this.dashDur));
      shadowY = lerp(this.launchGroundY, groundWorldY, u);
    }
    const alt = Math.max(0, this.rootY.value + this.hopY - shadowY);
    if (refs.shadow) {
      refs.shadow.visible = visibleNow && this.mode !== "flyOff" && this.mode !== "offsite";
      // the pool sits at z=-0.45 — scale by the projection factor so it
      // stays under the feet even near the screen edges
      const k = (CAM_Z + 0.45) / CAM_Z;
      refs.shadow.position.set(this.rootX.value * k, (shadowY + 0.02) * k, -0.45);
      const w = (1.1 * S) / (1 + 0.8 * alt);
      refs.shadow.scale.set(w, w * 0.32, 1);
    }
    if (refs.shadowMat) refs.shadowMat.opacity = 0.5 / (1 + 1.6 * alt);

    // screen-space outputs for the DOM layer
    const feetY = this.rootY.value + bobY + this.hopY;
    const sx = worldToPxX(this.rootX.value, vw, vh);
    const syPx = worldToPxY(feetY, vh);
    const topPx = worldToPxY(feetY + ROBOT_NATIVE_H * S * s, vh);
    const hPx2 = ROBOT_NATIVE_H * S * (vh / PLANE_H);
    robotStore.setScreen(sx, syPx, sx, topPx, hPx2 * 0.5, hPx2);
  }
}
