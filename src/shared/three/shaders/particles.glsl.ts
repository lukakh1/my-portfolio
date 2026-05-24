/**
 * Render shaders for the THREE.Points. The vertex shader reads each particle's
 * position from the GPGPU output texture (via a per-vertex `ref` uv), sizes it
 * by depth, and the fragment shader draws a soft round sprite tinted cyan→violet
 * by depth.
 */
export const particlesVertex = /* glsl */ `
uniform sampler2D uPositions;
uniform float uSize;
uniform float uScale;
attribute vec2 ref;
varying float vDepth;

void main() {
  vec3 pos = texture2D(uPositions, ref).xyz;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float dist = -mv.z;
  vDepth = clamp((dist - 2.5) / 7.0, 0.0, 1.0);
  gl_PointSize = uSize * uScale / max(0.1, dist);
  gl_Position = projectionMatrix * mv;
}
`;

export const particlesFragment = /* glsl */ `
uniform vec3 uColorNear;  // cyan
uniform vec3 uColorFar;   // violet
uniform float uOpacity;
varying float vDepth;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.0, d);
  vec3 col = mix(uColorNear, uColorFar, vDepth);
  float bright = mix(1.0, 0.45, vDepth);
  gl_FragColor = vec4(col * bright, alpha * uOpacity);
}
`;
