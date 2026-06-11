/**
 * px ↔ world mapping for the robot overlay canvas.
 *
 * The camera is FIXED at (0, 0, CAM_Z) looking down −Z and never moves or
 * rotates, and the robot lives on the z = 0 plane — so projection collapses
 * to a linear map. No matrices, valid every frame.
 */
export const CAM_Z = 10;
export const CAM_FOV = 50; // vertical, degrees

/** Visible world-plane height at z = 0. ≈ 9.326 wu. */
export const PLANE_H = 2 * CAM_Z * Math.tan((CAM_FOV * Math.PI) / 360);

/** World units per CSS pixel for a given viewport height. */
export const worldPerPixel = (vh: number) => PLANE_H / vh;

export const pxToWorldX = (xPx: number, vw: number, vh: number) =>
  (xPx - vw / 2) * (PLANE_H / vh);

export const pxToWorldY = (yPx: number, vh: number) => (vh / 2 - yPx) * (PLANE_H / vh);

export const worldToPxX = (x: number, vw: number, vh: number) => vw / 2 + x * (vh / PLANE_H);

export const worldToPxY = (y: number, vh: number) => vh / 2 - y * (vh / PLANE_H);
