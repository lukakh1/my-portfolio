/**
 * Tiny verlet physics for the skills bin: each pill is two particles joined
 * by a stick (a capsule), which gives free rotation from pure position
 * updates. Collisions are circle-circle between all particles plus container
 * walls, relaxed over a few iterations. ~2 kB instead of matter.js's ~87 kB —
 * visually indistinguishable for "pills tumble into a box and can be flicked".
 */

export interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  r: number;
}

export interface PillBody {
  a: Particle;
  b: Particle;
  /** rest length of the stick between a and b */
  len: number;
  w: number;
  h: number;
  el: HTMLElement;
  grabbed: boolean;
}

const ITERATIONS = 5;
const FRICTION = 0.995;
const WALL_BOUNCE = 0.4;
/** Slack kept between a pill's painted edge and the bin wall, in px. */
const WALL_MARGIN = 3;
const SLEEP_V = 0.018;
const SLEEP_FRAMES = 45;

export class VerletWorld {
  bodies: PillBody[] = [];
  width = 0;
  height = 0;
  gravity = 1900;
  /** frames during which every body has been under the sleep threshold */
  private calmFrames = 0;

  setBounds(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  addPill(el: HTMLElement, w: number, h: number, x: number, y: number): PillBody {
    const r = h / 2;
    const half = Math.max(0.1, w / 2 - r);
    const jitter = (Math.random() - 0.5) * 0.6;
    const body: PillBody = {
      a: { x: x - half, y: y + jitter, px: x - half, py: y + jitter, r },
      b: { x: x + half, y: y - jitter, px: x + half, py: y - jitter, r },
      len: half * 2,
      w,
      h,
      el,
      grabbed: false,
    };
    this.bodies.push(body);
    return body;
  }

  /** True while things are still moving; false once everything sleeps. */
  step(dt: number): boolean {
    const g = this.gravity * dt * dt;
    let maxV = 0;

    for (const body of this.bodies) {
      if (body.grabbed) continue;
      for (const p of [body.a, body.b]) {
        const vx = (p.x - p.px) * FRICTION;
        const vy = (p.y - p.py) * FRICTION;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + g;
        const v = Math.abs(vx) + Math.abs(vy);
        if (v > maxV) maxV = v;
      }
    }

    for (let it = 0; it < ITERATIONS; it++) {
      for (const body of this.bodies) this.constrainStick(body);
      this.collideAll();
      for (const body of this.bodies) this.constrainWalls(body);
    }

    if (maxV < SLEEP_V * Math.max(1, this.height / 400)) {
      this.calmFrames++;
    } else {
      this.calmFrames = 0;
    }
    const alive = this.calmFrames < SLEEP_FRAMES;
    if (!alive) {
      // Integration velocity is near zero, but the heap may still hold
      // residual overlap (constraint corrections don't count toward maxV).
      // Squeeze it out before freezing so nothing sleeps half-sunk.
      for (let it = 0; it < 10; it++) {
        for (const body of this.bodies) this.constrainStick(body);
        this.collideAll();
        for (const body of this.bodies) this.constrainWalls(body);
      }
      for (const body of this.bodies) {
        for (const p of [body.a, body.b]) {
          p.px = p.x;
          p.py = p.y;
        }
      }
    }
    return alive;
  }

  wake() {
    this.calmFrames = 0;
  }

  private constrainStick(body: PillBody) {
    const { a, b, len } = body;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    const diff = ((d - len) / d) * 0.5;
    if (body.grabbed) return;
    a.x += dx * diff;
    a.y += dy * diff;
    b.x -= dx * diff;
    b.y -= dy * diff;
  }

  /**
   * Capsule-capsule collision via sample circles along each stick (long
   * pills need mid-body samples or they interpenetrate mid-section).
   * Corrections on interior samples are distributed to the two endpoint
   * particles weighted by the sample's position on the stick.
   */
  private collideAll() {
    const n = this.bodies.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const A = this.bodies[i];
        const B = this.bodies[j];
        // quick reject: capsule bounding circles
        const acx = (A.a.x + A.b.x) / 2;
        const acy = (A.a.y + A.b.y) / 2;
        const bcx = (B.a.x + B.b.x) / 2;
        const bcy = (B.a.y + B.b.y) / 2;
        const reach = A.len / 2 + A.a.r + B.len / 2 + B.a.r;
        if ((bcx - acx) ** 2 + (bcy - acy) ** 2 > reach * reach) continue;

        const sa = Math.max(2, Math.ceil(A.len / A.a.r) + 1);
        const sb = Math.max(2, Math.ceil(B.len / B.a.r) + 1);
        for (let u = 0; u < sa; u++) {
          const t = sa === 1 ? 0.5 : u / (sa - 1);
          const px = A.a.x + (A.b.x - A.a.x) * t;
          const py = A.a.y + (A.b.y - A.a.y) * t;
          for (let v = 0; v < sb; v++) {
            const s = sb === 1 ? 0.5 : v / (sb - 1);
            const qx = B.a.x + (B.b.x - B.a.x) * s;
            const qy = B.a.y + (B.b.y - B.a.y) * s;
            const dx = qx - px;
            const dy = qy - py;
            const min = A.a.r + B.a.r;
            const d2 = dx * dx + dy * dy;
            if (d2 >= min * min || d2 === 0) continue;
            const d = Math.sqrt(d2);
            const push = ((min - d) / d) * 0.5 * 0.85;
            const ox = dx * push;
            const oy = dy * push;
            if (!A.grabbed) {
              A.a.x -= ox * (1 - t);
              A.a.y -= oy * (1 - t);
              A.b.x -= ox * t;
              A.b.y -= oy * t;
            }
            if (!B.grabbed) {
              B.a.x += ox * (1 - s);
              B.a.y += oy * (1 - s);
              B.b.x += ox * s;
              B.b.y += oy * s;
            }
          }
        }
      }
    }
  }

  private constrainWalls(body: PillBody) {
    if (body.grabbed) return;

    /**
     * The solver simulates a capsule, but the browser paints a rounded
     * RECTANGLE. Those agree only when the pill is axis-aligned; at any other
     * angle the rectangle's corners stick out past the capsule by
     *
     *     r * (|sin a| + |cos a| - 1)
     *
     * peaking at r * 0.414 when the pill sits at 45°. Clamping on the capsule
     * radius alone therefore let tilted pills poke through the bin's clipped
     * edge and come out visually sliced. Clamp on the painted extent instead.
     */
    const dx = body.b.x - body.a.x;
    const dy = body.b.y - body.a.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    const sin = Math.abs(dy / d);
    const cos = Math.abs(dx / d);

    for (const p of [body.a, body.b]) {
      // +MARGIN absorbs transient overshoot: collision resolution can rotate a
      // body after this frame's clamp, and a pill wedged between neighbours
      // can be pushed a pixel or two past a wall before the pile relaxes.
      const padX = p.r * (cos + sin - 1) + p.r + WALL_MARGIN;
      const padY = padX; // symmetric for a capsule of uniform radius
      if (p.x < padX) {
        p.x = padX;
        p.px = p.x + (p.x - p.px) * WALL_BOUNCE;
      } else if (p.x > this.width - padX) {
        p.x = this.width - padX;
        p.px = p.x + (p.x - p.px) * WALL_BOUNCE;
      }
      if (p.y > this.height - padY) {
        p.y = this.height - padY;
        p.py = p.y + (p.y - p.py) * WALL_BOUNCE;
        // ground friction
        p.px = p.x - (p.x - p.px) * 0.92;
      } else if (p.y < padY) {
        p.y = padY;
        p.py = p.y + (p.y - p.py) * WALL_BOUNCE;
      }
    }
  }
}

export const bodyCenter = (b: PillBody) => ({
  x: (b.a.x + b.b.x) / 2,
  y: (b.a.y + b.b.y) / 2,
});

export const bodyAngle = (b: PillBody) =>
  Math.atan2(b.b.y - b.a.y, b.b.x - b.a.x);
