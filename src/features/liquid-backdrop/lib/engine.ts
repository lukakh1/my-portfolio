import { QUALITY } from "@/shared/gl/lib/quality";
import type { Tier } from "@/shared/gl/lib/capabilities";
import { glStore } from "@/shared/gl/model/gl-store";
import { FRAG, VERT } from "@/shared/gl/shaders/liquid.glsl";

/**
 * Raw WebGL2 — deliberately no three.js.
 *
 * This layer draws three vertices. three.js would add ~183 KB gz to do that,
 * and would put the backdrop behind the whole engine's download. Hand-rolled
 * it is ~3 KB, arrives about a second after paint instead of four, and means
 * phones get the lava lamp without ever fetching the 3D stage.
 */

const CSS_VARS = ["--bg", "--bg-2", "--signal", "--amber", "--blue"] as const;

function readPalette(): Float32Array {
  const cs = getComputedStyle(document.documentElement);
  const out = new Float32Array(CSS_VARS.length * 3);
  CSS_VARS.forEach((name, i) => {
    const hex = cs.getPropertyValue(name).trim();
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
    // Fall back to mid-grey rather than black: a failed parse should look
    // wrong-but-neutral, not punch a dark hole in a cream page.
    const [r, g, b] = m
      ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
      : [128, 128, 128];
    out[i * 3] = r / 255;
    out[i * 3 + 1] = g / 255;
    out[i * 3 + 2] = b / 255;
  });
  return out;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`liquid shader: ${log}`);
  }
  return sh;
}

export type LiquidEngine = {
  draw: (timeSec: number, dt: number) => void;
  resize: () => void;
  dispose: () => void;
};

export function createLiquid(canvas: HTMLCanvasElement, tier: Tier): LiquidEngine | null {
  const q = QUALITY[tier];
  if (!q.liquidScale) return null;

  const gl = canvas.getContext("webgl2", {
    // Opaque: the shader composites against the page colour itself, so there
    // is no blending, no premultiply surprises, and full palette control.
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  let program: WebGLProgram | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let vs: WebGLShader | null = null;
  let fs: WebGLShader | null = null;

  try {
    vs = compile(gl, gl.VERTEX_SHADER, VERT);
    fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`liquid link: ${gl.getProgramInfoLog(program)}`);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn(err);
    return null;
  }

  gl.useProgram(program);
  // WebGL2 still requires a bound VAO even when drawing zero attributes.
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const u = (n: string) => gl.getUniformLocation(program!, n);
  const uRes = u("uRes"), uTime = u("uTime"), uCursor = u("uCursor");
  const uAmt = u("uPointerAmt"), uScroll = u("uScroll"), uVel = u("uVel");
  const uSteps = u("uSteps"), uBalls = u("uBalls"), uK = u("uK");
  const uCream = u("uCream"), uBg2 = u("uBg2"), uCoral = u("uCoral");
  const uAmber = u("uAmber"), uCobalt = u("uCobalt");

  const pal = readPalette();
  gl.uniform3f(uCream, pal[0], pal[1], pal[2]);
  gl.uniform3f(uBg2, pal[3], pal[4], pal[5]);
  gl.uniform3f(uCoral, pal[6], pal[7], pal[8]);
  gl.uniform3f(uAmber, pal[9], pal[10], pal[11]);
  gl.uniform3f(uCobalt, pal[12], pal[13], pal[14]);
  gl.uniform1i(uSteps, q.steps);
  gl.uniform1i(uBalls, q.balls);
  gl.uniform1f(uK, q.k);

  let w = 0;
  let h = 0;

  const resize = () => {
    // Scale the BACKING STORE and let the compositor upscale. Hardware
    // bilinear filtering is exactly right for a soft gooey field, and it
    // avoids an FBO plus a second full-screen blit.
    const nw = Math.max(1, Math.round(window.innerWidth * q.liquidDpr * q.liquidScale));
    const nh = Math.max(1, Math.round(window.innerHeight * q.liquidDpr * q.liquidScale));
    if (nw === w && nh === h) return;
    // Mobile browsers fire `resize` every time the URL bar collapses or
    // expands — i.e. constantly, mid-scroll, with a height delta of ~10%.
    // Reallocating the drawing buffer for that costs a GPU buffer realloc on
    // the critical path and shows up as a hitch. The field is a soft, blurred,
    // out-of-focus blob; nobody can see a 10% vertical stretch in it, so
    // absorb small height-only changes instead of reallocating.
    if (w && nw === w && Math.abs(nh - h) / h < 0.2) return;
    w = nw;
    h = nh;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  };
  resize();

  let idleFrames = 0;

  const draw = (timeSec: number, dt: number) => {
    // A lava lamp at 30fps is indistinguishable from one at 60, and most of a
    // session is spent reading rather than moving. Halve the rate once the
    // pointer and the scroll have both been still for a moment.
    const still = glStore.pointerAmt < 0.02 && Math.abs(glStore.velocity) < 0.02;
    idleFrames = still ? idleFrames + 1 : 0;
    if (idleFrames > 180 && (idleFrames & 1)) return;

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform1f(uTime, timeSec % 3600);
    gl.uniform2f(uCursor, glStore.smoothX, glStore.smoothY);
    gl.uniform1f(uAmt, glStore.pointerAmt);
    gl.uniform1f(uScroll, glStore.scroll);
    gl.uniform1f(uVel, glStore.velocity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    void dt;
  };

  const dispose = () => {
    gl.bindVertexArray(null);
    if (vao) gl.deleteVertexArray(vao);
    if (program) gl.deleteProgram(program);
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };

  return { draw, resize, dispose };
}
