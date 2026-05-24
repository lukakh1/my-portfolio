import * as THREE from "three";

/** RGBA float texture of `size`×`size`; xyz = position, w = per-particle seed. */
function makeDataTexture(data: Float32Array, size: number): THREE.DataTexture {
  const tex = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  tex.needsUpdate = true;
  return tex;
}

/** Particle target: an even point distribution on a sphere (golden spiral). */
export function makeSphereTexture(size: number, radius: number): THREE.DataTexture {
  const count = size * size;
  const data = new Float32Array(count * 4);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    data[i * 4] = Math.cos(theta) * r * radius;
    data[i * 4 + 1] = y * radius;
    data[i * 4 + 2] = Math.sin(theta) * r * radius;
    data[i * 4 + 3] = Math.random();
  }
  return makeDataTexture(data, size);
}

/** Scattered starting cloud so particles "condense" inward on first load. */
export function makeScatterTexture(size: number): THREE.DataTexture {
  const count = size * size;
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const r = 7 + Math.random() * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    data[i * 4] = r * Math.sin(phi) * Math.cos(theta);
    data[i * 4 + 1] = r * Math.sin(phi) * Math.sin(theta);
    data[i * 4 + 2] = r * Math.cos(phi);
    data[i * 4 + 3] = Math.random();
  }
  return makeDataTexture(data, size);
}

/**
 * Particle target sampled from rasterized text — lit pixels become particle
 * positions on a plane, so the cloud can briefly resolve into a wordmark.
 */
export function makeTextTexture(
  size: number,
  text: string,
  worldWidth = 9,
): THREE.DataTexture {
  const count = size * size;
  const data = new Float32Array(count * 4);

  const W = 512;
  const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const pts: Array<[number, number]> = [];
  if (ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 200px sans-serif";
    ctx.fillText(text, W / 2, H / 2 + 10);
    const img = ctx.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        if (img[(y * W + x) * 4] > 128) pts.push([x, y]);
      }
    }
  }

  const aspect = H / W;
  const worldHeight = worldWidth * aspect;
  for (let i = 0; i < count; i++) {
    if (pts.length) {
      const [px, py] = pts[i % pts.length];
      data[i * 4] = (px / W - 0.5) * worldWidth;
      data[i * 4 + 1] = -(py / H - 0.5) * worldHeight;
      data[i * 4 + 2] = (Math.random() - 0.5) * 0.5;
    }
    data[i * 4 + 3] = Math.random();
  }
  return makeDataTexture(data, size);
}
