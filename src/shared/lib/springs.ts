const TWO_PI = Math.PI * 2;

/**
 * Damped harmonic spring parameterized by natural frequency `f` (Hz) and
 * damping ratio `zeta`. Springs give overlap, drag, settle and
 * follow-through "for free" compared to closed-form easing curves.
 *
 * - zeta >= 1: exact critically-damped exponential step (unconditionally
 *   stable at any dt).
 * - zeta < 1: semi-implicit Euler; very bouncy springs (zeta < 0.4) are
 *   sub-stepped at 120 Hz so a frame spike can't blow them up.
 */
export class Spring1 {
  value: number;
  vel = 0;
  target: number;

  constructor(
    public f: number,
    public zeta: number,
    initial = 0,
  ) {
    this.value = initial;
    this.target = initial;
  }

  /** Teleport — value snaps, velocity clears. */
  set(v: number) {
    this.value = v;
    this.target = v;
    this.vel = 0;
  }

  /** Impulse — the main way to add "life" (pops, landings, boings). */
  kick(v: number) {
    this.vel += v;
  }

  step(dt: number): number {
    const w = TWO_PI * this.f;
    if (this.zeta >= 1) {
      const dx = this.value - this.target;
      const tmp = this.vel + w * dx;
      const e = Math.exp(-w * dt);
      this.value = this.target + (dx + tmp * dt) * e;
      this.vel = (this.vel - tmp * w * dt) * e;
    } else {
      const k = w * w;
      const c = 2 * this.zeta * w;
      const h = this.zeta < 0.4 ? 1 / 120 : dt;
      let left = dt;
      while (left > 1e-6) {
        const s = left > h ? h : left;
        this.vel += (-k * (this.value - this.target) - c * this.vel) * s;
        this.value += this.vel * s;
        left -= s;
      }
    }
    if (!Number.isFinite(this.value) || Math.abs(this.value) > 1e3) {
      this.value = this.target;
      this.vel = 0;
    }
    return this.value;
  }
}

/** Three Spring1s sharing (f, zeta) — for x/y/rotation channel triples. */
export class Spring3 {
  x: Spring1;
  y: Spring1;
  z: Spring1;

  constructor(f: number, zeta: number) {
    this.x = new Spring1(f, zeta);
    this.y = new Spring1(f, zeta);
    this.z = new Spring1(f, zeta);
  }

  setTarget(x: number, y: number, z: number) {
    this.x.target = x;
    this.y.target = y;
    this.z.target = z;
  }

  set(x: number, y: number, z: number) {
    this.x.set(x);
    this.y.set(y);
    this.z.set(z);
  }

  step(dt: number) {
    this.x.step(dt);
    this.y.step(dt);
    this.z.step(dt);
  }
}

/** Cheap frame-rate-independent exponential approach (for weights/fades). */
export const expApproach = (current: number, target: number, rate: number, dt: number) =>
  target + (current - target) * Math.exp(-rate * dt);
