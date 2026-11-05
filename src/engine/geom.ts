/**
 * Small, allocation-light geometry kit used by the fold simulator.
 *
 * Conventions
 *  - Model space is right-handed: x to the right, y up, z toward the viewer.
 *  - `Aff` is a 2D affine map [a, b, c, d, e, f]:  x' = a·x + c·y + e,  y' = b·x + d·y + f.
 *  - `M3` is a 3D rigid map stored row-major as 3×4: [r00 r01 r02 tx, r10 r11 r12 ty, r20 r21 r22 tz].
 */

export type V2 = [number, number];
export type V3 = [number, number, number];
export type Aff = [number, number, number, number, number, number];
export type M3 = [number, number, number, number, number, number, number, number, number, number, number, number];

export const EPS = 1e-9;
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (x: number, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ 2D */

export const add2 = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
export const sub2 = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
export const scale2 = (a: V2, s: number): V2 => [a[0] * s, a[1] * s];
export const dot2 = (a: V2, b: V2) => a[0] * b[0] + a[1] * b[1];
export const cross2 = (a: V2, b: V2) => a[0] * b[1] - a[1] * b[0];
export const len2 = (a: V2) => Math.hypot(a[0], a[1]);
export const dist2 = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const lerp2 = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const mid2 = (a: V2, b: V2): V2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const perp2 = (a: V2): V2 => [-a[1], a[0]];
export function norm2(a: V2): V2 {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
}
/** Point at `angle` (radians) and distance r from c. */
export const polar = (c: V2, angle: number, r: number): V2 => [c[0] + Math.cos(angle) * r, c[1] + Math.sin(angle) * r];

/** Signed distance of p from the directed line a→b (positive = left side). */
export function sideOf(p: V2, a: V2, b: V2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return (dx * (p[1] - a[1]) - dy * (p[0] - a[0])) / l;
}

/** Intersection of lines (a,b) and (c,d); null when parallel. */
export function intersect(a: V2, b: V2, c: V2, d: V2): V2 | null {
  const r = sub2(b, a);
  const s = sub2(d, c);
  const den = cross2(r, s);
  if (Math.abs(den) < EPS) return null;
  const t = cross2(sub2(c, a), s) / den;
  return [a[0] + r[0] * t, a[1] + r[1] * t];
}

/** Reflection of p across the line (a, b). */
export function reflectPoint(p: V2, a: V2, b: V2): V2 {
  return apply(reflect(a, b), p);
}

/** Foot of the perpendicular from p on line (a,b). */
export function project(p: V2, a: V2, b: V2): V2 {
  const u = norm2(sub2(b, a));
  const t = dot2(sub2(p, a), u);
  return [a[0] + u[0] * t, a[1] + u[1] * t];
}

/* -------------------------------------------------------------- affine */

export const I2: Aff = [1, 0, 0, 1, 0, 0];

export function apply(m: Aff, p: V2): V2 {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
}

/** m1 ∘ m2 (apply m2 first). */
export function compose(m1: Aff, m2: Aff): Aff {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

export function invert(m: Aff): Aff {
  const det = m[0] * m[3] - m[1] * m[2];
  const a = m[3] / det;
  const b = -m[1] / det;
  const c = -m[2] / det;
  const d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}

export const det2 = (m: Aff) => m[0] * m[3] - m[1] * m[2];

export function reflect(a: V2, b: V2): Aff {
  const [ux, uy] = norm2(sub2(b, a));
  const r00 = 2 * ux * ux - 1;
  const r01 = 2 * ux * uy;
  const r11 = 2 * uy * uy - 1;
  // p' = R (p - a) + a
  return [r00, r01, r01, r11, a[0] - (r00 * a[0] + r01 * a[1]), a[1] - (r01 * a[0] + r11 * a[1])];
}

export function rotation(c: V2, ang: number): Aff {
  const co = Math.cos(ang);
  const si = Math.sin(ang);
  return [co, si, -si, co, c[0] - (co * c[0] - si * c[1]), c[1] - (si * c[0] + co * c[1])];
}

export const translation = (dx: number, dy: number): Aff => [1, 0, 0, 1, dx, dy];

/* ------------------------------------------------------------ polygons */

export function area(poly: V2[]): number {
  let s = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
}

export function centroid(poly: V2[]): V2 {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    const w = p[0] * q[1] - q[0] * p[1];
    a += w;
    cx += (p[0] + q[0]) * w;
    cy += (p[1] + q[1]) * w;
  }
  if (Math.abs(a) < EPS) {
    // degenerate: vertex average
    let x = 0;
    let y = 0;
    for (const p of poly) {
      x += p[0];
      y += p[1];
    }
    return [x / poly.length, y / poly.length];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export function pointInPoly(p: V2, poly: V2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export interface SplitResult {
  left: V2[] | null;
  leftSoft: boolean[] | null;
  right: V2[] | null;
  rightSoft: boolean[] | null;
}

/**
 * Split a convex polygon by the directed line a→b. Edge flags ("soft" edges are
 * not stroked by the renderer) are carried over; the new cut edge gets `cutSoft`.
 */
export function splitPoly(poly: V2[], soft: boolean[] | undefined, a: V2, b: V2, cutSoft = false, eps = 1e-9): SplitResult {
  const n = poly.length;
  const d = poly.map((p) => sideOf(p, a, b));
  const sg = d.map((v) => (v > eps ? 1 : v < -eps ? -1 : 0));
  const build = (S: 1 | -1) => {
    const pts: V2[] = [];
    const fl: boolean[] = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const p = poly[i];
      const q = poly[j];
      const f = soft ? soft[i] : false;
      const sp = sg[i];
      const sq = sg[j];
      const pIn = sp === S || sp === 0;
      const qIn = sq === S || sq === 0;
      if (pIn) {
        pts.push(p);
        fl.push(sp === 0 && !qIn ? cutSoft : f);
      }
      if (sp * sq < 0) {
        const t = d[i] / (d[i] - d[j]);
        pts.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
        fl.push(sp === S ? cutSoft : f);
      }
    }
    return { pts, fl };
  };
  const L = build(1);
  const R = build(-1);
  const minA = 1e-10;
  return {
    left: L.pts.length >= 3 && Math.abs(area(L.pts)) > minA ? L.pts : null,
    leftSoft: L.fl,
    right: R.pts.length >= 3 && Math.abs(area(R.pts)) > minA ? R.pts : null,
    rightSoft: R.fl,
  };
}

/** Parameter range [t0,t1] where the infinite line a + t·(b−a) crosses a convex polygon, or null. */
export function lineRange(poly: V2[], a: V2, b: V2): [number, number] | null {
  const dir = sub2(b, a);
  let lo = Infinity;
  let hi = -Infinity;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    const sp = sideOf(p, a, b);
    const sq = sideOf(q, a, b);
    const ll = dot2(dir, dir);
    if (Math.abs(sp) < 1e-7) {
      const t = dot2(sub2(p, a), dir) / ll;
      lo = Math.min(lo, t);
      hi = Math.max(hi, t);
    }
    if (sp * sq < 0) {
      const x = lerp2(p, q, sp / (sp - sq));
      const t = dot2(sub2(x, a), dir) / ll;
      lo = Math.min(lo, t);
      hi = Math.max(hi, t);
    }
  }
  return lo <= hi ? [lo, hi] : null;
}

/* ------------------------------------------------------------------ 3D */

export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale3 = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export function norm3(a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export const I3: M3 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

export function ap3(m: M3, p: V3): V3 {
  return [
    m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3],
    m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7],
    m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11],
  ];
}

export function dir3(m: M3, v: V3): V3 {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[4] * v[0] + m[5] * v[1] + m[6] * v[2], m[8] * v[0] + m[9] * v[1] + m[10] * v[2]];
}

/** A ∘ B (apply B first). */
export function mul3(A: M3, B: M3): M3 {
  const r: number[] = new Array(12);
  for (let i = 0; i < 3; i++) {
    const a0 = A[i * 4];
    const a1 = A[i * 4 + 1];
    const a2 = A[i * 4 + 2];
    r[i * 4] = a0 * B[0] + a1 * B[4] + a2 * B[8];
    r[i * 4 + 1] = a0 * B[1] + a1 * B[5] + a2 * B[9];
    r[i * 4 + 2] = a0 * B[2] + a1 * B[6] + a2 * B[10];
    r[i * 4 + 3] = a0 * B[3] + a1 * B[7] + a2 * B[11] + A[i * 4 + 3];
  }
  return r as M3;
}

/** Rotation by `ang` about the line through p with unit direction u (right-hand rule). */
export function rotAxis(p: V3, u: V3, ang: number): M3 {
  const [x, y, z] = norm3(u);
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const t = 1 - c;
  const r00 = t * x * x + c;
  const r01 = t * x * y - s * z;
  const r02 = t * x * z + s * y;
  const r10 = t * x * y + s * z;
  const r11 = t * y * y + c;
  const r12 = t * y * z - s * x;
  const r20 = t * x * z - s * y;
  const r21 = t * y * z + s * x;
  const r22 = t * z * z + c;
  return [
    r00, r01, r02, p[0] - (r00 * p[0] + r01 * p[1] + r02 * p[2]),
    r10, r11, r12, p[1] - (r10 * p[0] + r11 * p[1] + r12 * p[2]),
    r20, r21, r22, p[2] - (r20 * p[0] + r21 * p[1] + r22 * p[2]),
  ];
}

/** Rotation about an in-plane line (a,b) of the z=0 plane. */
export const rotLine = (a: V2, b: V2, ang: number): M3 => rotAxis([a[0], a[1], 0], [b[0] - a[0], b[1] - a[1], 0], ang);

export const translate3 = (v: V3): M3 => [1, 0, 0, v[0], 0, 1, 0, v[1], 0, 0, 1, v[2]];

/**
 * Rotation about `origin` that maps the orthonormal frame built from (a, b) onto the one built from (a2, b2).
 * The angle between a and b must equal the angle between a2 and b2.
 */
export function frameMap(origin: V3, a: V3, b: V3, a2: V3, b2: V3): M3 {
  const f = (x: V3, y: V3) => {
    const e1 = norm3(x);
    const e2 = norm3(sub3(y, scale3(e1, dot3(y, e1))));
    const e3 = cross3(e1, e2);
    return [e1, e2, e3];
  };
  const [p1, p2, p3] = f(a, b);
  const [q1, q2, q3] = f(a2, b2);
  // R = Q · Pᵀ
  const R = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) R[i * 3 + j] = q1[i] * p1[j] + q2[i] * p2[j] + q3[i] * p3[j];
  return [
    R[0], R[1], R[2], origin[0] - (R[0] * origin[0] + R[1] * origin[1] + R[2] * origin[2]),
    R[3], R[4], R[5], origin[1] - (R[3] * origin[0] + R[4] * origin[1] + R[5] * origin[2]),
    R[6], R[7], R[8], origin[2] - (R[6] * origin[0] + R[7] * origin[1] + R[8] * origin[2]),
  ];
}

/** Axis-angle decomposition of the rotation part of m. */
export function axisAngle(m: M3): { axis: V3; angle: number } {
  const tr = m[0] + m[5] + m[10];
  const angle = Math.acos(clamp((tr - 1) / 2, -1, 1));
  if (angle < 1e-9) return { axis: [0, 0, 1], angle: 0 };
  if (Math.PI - angle < 1e-6) {
    // 180°: axis from the diagonal
    const xx = Math.sqrt(Math.max(0, (m[0] + 1) / 2));
    const yy = Math.sqrt(Math.max(0, (m[5] + 1) / 2));
    const zz = Math.sqrt(Math.max(0, (m[10] + 1) / 2));
    let axis: V3 = [xx, yy, zz];
    if (xx >= yy && xx >= zz) axis = [xx, m[1] / (2 * xx), m[2] / (2 * xx)];
    else if (yy >= zz) axis = [m[1] / (2 * yy), yy, m[6] / (2 * yy)];
    else axis = [m[2] / (2 * zz), m[6] / (2 * zz), zz];
    return { axis: norm3(axis), angle };
  }
  const s = 2 * Math.sin(angle);
  return { axis: [(m[9] - m[6]) / s, (m[2] - m[8]) / s, (m[4] - m[1]) / s], angle };
}

/** Interpolate a rigid map from identity (t=0) to m (t=1) about a fixed pivot. */
export function partialRot(m: M3, t: number, pivot: V3): M3 {
  const { axis, angle } = axisAngle(m);
  const R = rotAxis(pivot, axis, angle * t);
  // add the translation needed so that at t=1 we match m exactly at the pivot
  const target = ap3(m, pivot);
  const corr = sub3(target, pivot);
  return mul3(translate3(scale3(corr, t)), R);
}

/** Embed a 2D affine (rigid, possibly a reflection) of the z=0 plane in 3D. Reflections become 180° turns. */
export function affTo3(m: Aff): M3 {
  const det = det2(m);
  const zz = det >= 0 ? 1 : -1;
  return [m[0], m[2], 0, m[4], m[1], m[3], 0, m[5], 0, 0, zz, 0];
}

/** Extract the 2D affine that a rigid 3D map induces on the z=0 plane (valid when it maps z=0 onto z≈0). */
export function m3ToAff(m: M3): Aff {
  return [m[0], m[4], m[1], m[5], m[3], m[7]];
}

/* ------------------------------------------------------------- easing */

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const sine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
/** Maps t∈[a,b] to [0,1] (clamped). */
export const phase = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
/**
 * Paper-like motion: lifts gently, swings through the middle, then settles with a long soft landing.
 */
export function paperEase(t: number): number {
  t = clamp(t);
  // Two power curves joined with matching slope (C1) at t = a: a quick lift, a long soft landing.
  const a = 0.44;
  const p = 2.4;
  return t < a ? a * Math.pow(t / a, p) : 1 - (1 - a) * Math.pow((1 - t) / (1 - a), p);
}
