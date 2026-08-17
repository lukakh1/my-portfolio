/**
 * Raymarched metaballs — the lava lamp behind the whole page.
 *
 * Shaders live in .ts template literals rather than .glsl files on purpose:
 * Turbopack (the default bundler in Next 16) has no built-in raw-text loader,
 * so a `.glsl` import would need `turbopack.rules` plus `raw-loader`. The
 * `/* glsl *\/` marker keeps editor syntax highlighting working.
 */

export const VERT = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // Fullscreen triangle from gl_VertexID — no attributes, no buffers, and no
  // diagonal seam where two triangles of a quad would meet.
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uCursor;      // smoothed, -1..1
uniform float uPointerAmt;  // 0..1
uniform float uScroll;      // 0..1 page progress
uniform float uVel;         // scroll velocity, normalised
uniform int   uSteps;
uniform int   uBalls;
uniform float uK;
uniform vec3  uCream, uBg2, uCoral, uAmber, uCobalt;

const int MAX_STEPS = 24;
const int MAX_BALLS = 7;

/* Polynomial smooth-min. The usual exponential form costs an exp() and a
   log(); this is ~5 ALU and visually identical at our blend radius. */
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

vec3 ballPos(int i, float t) {
  float fi = float(i);
  float a = fi * 2.3999632;             // golden angle -> decorrelated phases
  return vec3(
    sin(t * (0.17 + 0.031 * fi) + a)        * (1.05 + 0.18 * fi),
    cos(t * (0.13 + 0.027 * fi) + a * 1.7)  * 0.72,
    sin(t * (0.11 + 0.019 * fi) + a * 2.3)  * 0.55);
}

vec3 cursorWorld() {
  return vec3(uCursor.x * 2.1, uCursor.y * 1.25, 0.35);
}

float map(vec3 p) {
  // Scroll stretches and drifts the field, so the lamp reacts to the page.
  p.y *= 1.0 + uVel * 0.18;
  p.y += uScroll * 1.4;

  vec3 cw = cursorWorld();
  float d = length(p - cw) - (0.30 + 0.22 * uPointerAmt);

  for (int i = 0; i < MAX_BALLS; i++) {
    if (i >= uBalls) break;
    vec3 c = ballPos(i, uTime);
    // Gentle attraction toward the cursor, falling off with distance.
    c += (cw - c) * (uPointerAmt * 0.22 / (1.0 + length(cw - c)));
    float r = 0.42 + 0.10 * sin(float(i) * 1.7);
    d = smin(d, length(p - c) - r, uK);
  }
  return d;
}

vec3 calcNormal(vec3 p) {
  // 4-tap tetrahedral gradient: two fewer map() calls than the 6-tap central
  // difference, which matters when map() is the whole cost of the shader.
  const vec2 e = vec2(1.0, -1.0) * 0.0016;
  return normalize(
    e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) +
    e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

/* The miss colour is the PAGE, not black. These three washes mirror the CSS
   fallback in .bg-fx, so the WebGL layer and the no-WebGL layer are the same
   picture and swapping between them is invisible. */
vec3 background(vec2 uv) {
  vec3 col = mix(uCream, uBg2, uv.y);
  float a = 1.0 - smoothstep(0.0, 0.62, distance(uv, vec2(0.18, 0.88)));
  float b = 1.0 - smoothstep(0.0, 0.66, distance(uv, vec2(0.82, 0.82)));
  float c = 1.0 - smoothstep(0.0, 0.75, distance(uv, vec2(0.50, 0.00)));
  col = mix(col, uAmber,  a * 0.16);
  col = mix(col, uCoral,  b * 0.14);
  col = mix(col, uCobalt, c * 0.05);
  return col;
}

void main() {
  vec2 uv = vUv;
  vec2 sp = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);

  vec3 bg = background(uv);

  vec3 ro = vec3(0.0, 0.0, -3.2);
  vec3 rd = normalize(vec3(sp, 1.6));

  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= uSteps) break;
    float d = map(ro + rd * t);
    if (d < 0.0025 * t) { hit = true; break; }
    // Under-relax: a smooth-min field is not Lipschitz-1, so a full step can
    // tunnel straight through a thin neck between two blobs.
    t += d * 0.9;
    if (t > 9.0) break;
  }

  vec3 col = bg;
  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);

    // Shade as translucent warm wax, never as a lit solid: the blobs must
    // read LIGHTER than the cream page or they punch holes in the paper.
    float fres  = pow(1.0 - max(dot(n, -rd), 0.0), 2.2);
    float thick = clamp(exp(-t * 0.35), 0.0, 1.0);
    vec3  wax   = mix(uAmber, uCoral, smoothstep(0.15, 0.85, thick + n.y * 0.25));

    // A soft key from the upper left gives the blobs volume. Without this
    // they render as flat filled silhouettes — the single biggest thing
    // separating "lava lamp" from "orange shape".
    vec3 key = normalize(vec3(-0.45, 0.8, -0.4));
    float lam = max(dot(n, key), 0.0);
    wax = mix(wax * 0.9, wax + 0.10, lam);
    wax += pow(max(dot(reflect(rd, n), key), 0.0), 24.0) * 0.16;

    // Keep it well under the copy: this is atmosphere, not a subject. The
    // silhouette also feathers with fresnel so edges don't read as vector art.
    float amount = 0.26 + 0.20 * fres;
    col = mix(bg, wax, amount);
  }

  // Never touch pure white — the page has to keep reading as paper.
  col = min(col, vec3(0.985));

  // Ordered-ish dither. Cream-on-cream gradients band hard at 8 bits, and
  // upscaling from a 0.4-0.6 backing store makes it worse.
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;

  fragColor = vec4(col, 1.0);
}`;
