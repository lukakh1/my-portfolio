import { curlNoise } from "./curl.glsl";

/**
 * GPGPU position-update fragment shader (run by GPUComputationRenderer).
 * `texturePosition` (previous positions) and `resolution` are injected by the
 * compute renderer. Each texel is one particle: xyz = position, w = stable seed.
 *
 * Forces: a spring toward the (optionally scattered) morph target, an ambient
 * curl-noise drift for life, and a pointer repel + swirl.
 */
export const simulationFragment = /* glsl */ `
uniform sampler2D uTargetA;   // sphere
uniform sampler2D uTargetB;   // wordmark
uniform float uMorph;         // 0 = sphere, 1 = wordmark
uniform float uScatter;       // 0 = on target, 1 = dispersed
uniform float uTime;
uniform float uFlow;          // ambient drift amount
uniform vec3  uMouse;         // pointer position in local space
uniform float uMouseStrength;
uniform vec3  uOffset;        // group offset, so the wordmark resolves centered

${curlNoise}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 cur = texture2D(texturePosition, uv);
  vec3 pos = cur.xyz;
  float seed = cur.w;

  vec3 tA = texture2D(uTargetA, uv).xyz;
  vec3 tB = texture2D(uTargetB, uv).xyz;
  // Sphere sits at the group's offset; cancel the offset for the wordmark so it
  // resolves centered on screen.
  vec3 target = mix(tA, tB - uOffset, uMorph);

  // When dispersing, push the target outward and warp it with noise.
  vec3 dir = normalize(target + 0.0001);
  target += dir * uScatter * 7.0;
  target += curlNoise(target * 0.15 + uTime * 0.02) * uScatter * 4.5;

  // Spring toward the target.
  vec3 vel = (target - pos) * 0.055;

  // Ambient curl drift (per-particle phase via seed) — slow and gentle.
  vel += curlNoise(pos * 0.2 + uTime * 0.02 + seed * 6.2831) * uFlow * 0.045;

  // Pointer force: repel + tangential swirl, falling off with distance.
  vec3 d = pos - uMouse;
  float f = uMouseStrength / (dot(d, d) + 0.7);
  vel += normalize(d + 0.0001) * f * 0.6;
  vel += vec3(-d.y, d.x, 0.0) * f * 0.3;

  pos += vel;
  gl_FragColor = vec4(pos, seed);
}
`;
