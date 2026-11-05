/**
 * Multi-crease folds that move several facets with different rigid motions at once.
 * Each one is a small kinematic model of the real paper, so the in-between frames are physically plausible
 * and the end state is exactly the flat-folded result.
 */
import {
  type Aff,
  type M3,
  type V2,
  type V3,
  I3,
  ap3,
  apply,
  compose,
  cross2,
  cross3,
  dir3,
  dot3,
  easeInOut,
  frameMap,
  m3ToAff,
  mul3,
  norm2,
  paperEase,
  phase,
  partialRot,
  reflect,
  rotAxis,
  rotLine,
  sideOf,
  sub2,
  sub3,
  centroid,
  translate3,
  smooth,
} from './geom';
import { type Annot, type Core, type Item, type Op, cUp, withIntro } from './plan';
import { type Facet, type FlatState, type Sel, clone, curPoly, info, splitFacet } from './state';

const v3 = (p: V2): V3 => [p[0], p[1], 0];

/** A gentle camera tilt that peaks mid-motion, so 3D mechanisms read as depth. */
const tiltCam = (t: number, deg: number): M3 => rotAxis([0, 0, 0], [1, 0, 0], -Math.sin(Math.PI * t) * deg * (Math.PI / 180));

/** Apply a rigid 3D map that keeps z=0 on z=0 to a facet's flat placement. */
const settle = (f: Facet, T: M3): Facet => ({ ...f, m: compose(m3ToAff(T), f.m) as Aff });

function splitSelected(s: FlatState, sel: Sel, a: V2, b: V2): void {
  const out: Facet[] = [];
  s.facets.forEach((f, k) => {
    if (!sel(info(s, f, k), s)) return void out.push(f);
    const [L, R] = splitFacet(s, f, a, b);
    if (L) out.push(L);
    if (R) out.push(R);
  });
  s.facets = out;
}

function idsOf(s: FlatState, sel: Sel): Set<number> {
  const ids = new Set<number>();
  s.facets.forEach((f, k) => {
    if (sel(info(s, f, k), s)) ids.add(f.id);
  });
  return ids;
}

/* =============================================================== squash */

export interface SquashSpec {
  /** the closed corner where hinge and spine meet */
  O: V2;
  /** a point along the hinge (the edge the flap is attached by) */
  hinge: V2;
  /** a point along the spine (the flap's folded edge that gets pressed down onto the hinge line) */
  spine: V2;
  /** the flap's top layer (swings across to the other side) */
  near: Sel;
  /** the flap's inner layer (comes back down where it was) */
  far: Sel;
}

/**
 * Squash fold: lift the flap upright on its hinge, open it, and press the spine down onto the hinge line.
 * Kinematics: the spine half of each layer folds about the bisector by φ, chosen so the spine stays in the
 * plane of symmetry: tan(φ/2) = cos(β/2)·cot θ (β = angle between hinge and spine, θ = layer lift).
 */
export function squash(spec: SquashSpec): Op {
  return {
    plan(s0) {
      const s = clone(s0);
      const { O, hinge: B, spine: A } = spec;
      const uh = norm2(sub2(B, O));
      const us = norm2(sub2(A, O));
      const um = norm2([uh[0] + us[0], uh[1] + us[1]]);
      const M: V2 = [O[0] + um[0], O[1] + um[1]];
      const beta = Math.acos(Math.max(-1, Math.min(1, uh[0] * us[0] + uh[1] * us[1])));
      const nearIds0 = idsOf(s, spec.near);
      const farIds0 = idsOf(s, spec.far);
      const flapSel: Sel = (i) => nearIds0.has(i.f.id) || farIds0.has(i.f.id);
      // remember which original facet each piece came from
      const origin = new Map<number, 'near' | 'far'>();
      const out: Facet[] = [];
      const hingeSide = Math.sign(sideOf(B, O, M));
      const halves = new Map<number, 'h' | 's'>();
      s.facets.forEach((f, k) => {
        if (!flapSel(info(s, f, k), s)) return void out.push(f);
        const role = nearIds0.has(f.id) ? 'near' : 'far';
        const [L, R] = splitFacet(s, f, O, M);
        for (const p of [L, R]) {
          if (!p) continue;
          origin.set(p.id, role);
          halves.set(p.id, Math.sign(sideOf(centroid(curPoly(p)), O, M)) === hingeSide ? 'h' : 's');
          out.push(p);
        }
      });
      s.facets = out;
      const sgnH = Math.sign(cross2(uh, sub2(A, O))) || 1;
      const sgnM = Math.sign(cross2(um, sub2(A, O))) || 1;
      const p1 = 0.3;
      const pose = (t: number) => {
        let tf: number;
        let tn: number;
        let phi: number;
        if (t < p1) {
          tf = tn = (Math.PI / 2) * easeInOut(t / p1);
          phi = 0;
        } else {
          const e = easeInOut((t - p1) / (1 - p1));
          tf = (Math.PI / 2) * (1 - e);
          tn = Math.PI / 2 + (Math.PI / 2) * e;
          phi = tf < 1e-7 ? Math.PI : 2 * Math.atan(Math.cos(beta / 2) / Math.tan(tf));
        }
        const Rf = rotLine(O, B, sgnH * tf);
        const Rn = rotLine(O, B, sgnH * tn);
        return {
          farH: Rf,
          farS: mul3(Rf, rotLine(O, M, sgnM * phi)),
          nearH: Rn,
          nearS: mul3(Rn, rotLine(O, M, -sgnM * phi)),
        };
      };
      const key = (id: number) => (origin.get(id)! + (halves.get(id) === 'h' ? 'H' : 'S')) as 'farH' | 'farS' | 'nearH' | 'nearS';
      // final order
      const statics = s.facets.filter((f) => !origin.has(f.id));
      const firstFar = s.facets.findIndex((f) => origin.get(f.id) === 'far');
      const farAt = s.facets.slice(0, firstFar).filter((f) => !origin.has(f.id)).length;
      const pick = (k: string) => s.facets.filter((f) => origin.has(f.id) && key(f.id) === k);
      const farGroup = [...pick('farH'), ...pick('farS').reverse()];
      const nearGroup = [...pick('nearH').reverse(), ...pick('nearS')];
      const order = [...statics.slice(0, farAt), ...farGroup, ...statics.slice(farAt), ...nearGroup];
      const fin = pose(1);
      const end: FlatState = {
        ...s,
        facets: order.map((f) => (origin.has(f.id) ? settle(f, fin[key(f.id)]) : f)),
      };
      const mid: V2 = [(O[0] + A[0]) / 2, (O[1] + A[1]) / 2];
      const core: Core = {
        start: s,
        end,
        motion: 2.4,
        annots: [
          { type: 'line', kind: 'valley', a: O, b: [O[0] + um[0] * 0.95 * Math.hypot(A[0] - O[0], A[1] - O[1]), O[1] + um[1] * 0.95 * Math.hypot(A[0] - O[0], A[1] - O[1])] },
          { type: 'push', at: mid, dir: sub2(B, A) },
        ],
        frame(t) {
          const P = pose(t);
          const items: Item[] = order.map((f) => ({ f, T: origin.has(f.id) ? P[key(f.id)] : I3, cUp: cUp(s, f) }));
          const lead = t > 0 && t < 1 ? ap3(t < p1 ? P.nearS : P.farS, v3(mid)) : null;
          return { items, sort: 'stack', lead, camera: tiltCam(t, 26) };
        },
      };
      return withIntro(core, 0.8);
    },
  };
}

/* ======================================================= degree-4 vertex */

/**
 * Rigid motion of a degree-4 vertex V with crease directions c1..c4 (counter-clockwise, as current-space unit
 * vectors). Panel 1 (between c1, c2) is driven about c1 by α; panel 3 (between c3, c4) turns about c4 by δ; panel 2
 * follows. Solves δ(α) and returns the panel transforms. Branch chosen by continuity from δ = 0.
 */
export function vertex4Solver(V: V2, c1: V2, c2: V2, c3: V2, c4: V2, alphaMax: number, n = 240) {
  const P: V3 = v3(V);
  const C1 = v3(norm2(c1));
  const C2 = v3(norm2(c2));
  const C3 = v3(norm2(c3));
  const C4 = v3(norm2(c4));
  const K = dot3(C2, C3);
  const cc = dot3(C4, C3);
  const perp: V3 = sub3(C3, [C4[0] * cc, C4[1] * cc, C4[2] * cc]);
  const cr = cross3(C4, C3);
  const table: number[] = [0];
  let prev = 0;
  for (let i = 1; i <= n; i++) {
    const al = (alphaMax * i) / n;
    const v2 = dir3(rotAxis([0, 0, 0], C1, al), C2);
    const A = cc * dot3(v2, C4);
    const Bc = dot3(v2, perp);
    const Cc = dot3(v2, cr);
    const R = Math.hypot(Bc, Cc);
    let best = prev;
    if (R > 1e-9) {
      const x = Math.max(-1, Math.min(1, (K - A) / R));
      const p0 = Math.atan2(Cc, Bc);
      const ac = Math.acos(x);
      let bd = Infinity;
      for (const r of [p0 + ac, p0 - ac]) {
        // unwrap near prev
        let rr = r;
        while (rr - prev > Math.PI) rr -= 2 * Math.PI;
        while (rr - prev < -Math.PI) rr += 2 * Math.PI;
        const d = Math.abs(rr - prev);
        // the very first step leaves the flat state: prefer the root that actually moves
        const penalty = i === 1 && Math.abs(rr) < 1e-6 ? 1e-3 : 0;
        if (d + penalty < bd) {
          bd = d + penalty;
          best = rr;
        }
      }
    }
    table.push(best);
    prev = best;
  }
  const deltaAt = (al: number) => {
    const x = (Math.abs(al) / Math.abs(alphaMax || 1)) * n;
    const i = Math.min(n - 1, Math.floor(x));
    const f = x - i;
    return table[i] + (table[i + 1] - table[i]) * f;
  };
  return (al: number) => {
    const R1 = rotAxis(P, C1, al);
    const d = deltaAt(al);
    const R3 = rotAxis(P, C4, d);
    const v2 = dir3(R1, C2);
    const v3_ = dir3(R3, C3);
    const R2 = frameMap(P, C2, C3, v2, v3_);
    return { R1, R2, R3, delta: d };
  };
}

export interface RabbitSpec {
  /** where the bisectors meet */
  I: V2;
  /** ends of the two folded edges: driver fold I→A, follower fold I→C */
  A: V2;
  C: V2;
  /** corner that becomes the flap */
  B: V2;
  /** foot of the perpendicular from I on the edge B–C (the flap's hinge) */
  F: V2;
  /** panels: [A,B,I] side, flap half [I,B,F], [C,I,F] side */
  pA: Sel;
  pFlap: Sel;
  pC: Sel;
}

/** Rabbit ear: both bisectors fold at once; the excess rises as a flap and lies down to one side. */
export function rabbitEar(spec: RabbitSpec): Op {
  return {
    plan(s0) {
      const s = clone(s0);
      const { I, A, B, C, F } = spec;
      const dA = sub2(A, I);
      const sgn = Math.sign(cross2(dA, sub2(B, I))) || 1; // driver panel lies on the B side of IA
      // valley: panel ABI must rise toward +z
      const alphaMax = sgn * Math.PI;
      const solve = vertex4Solver(I, dA, sub2(B, I), sub2(F, I), sub2(C, I), alphaMax);
      const idsA = idsOf(s, spec.pA);
      const idsF = idsOf(s, spec.pFlap);
      const idsC = idsOf(s, spec.pC);
      const T = (al: number) => {
        const r = solve(al);
        return { a: r.R1, f: r.R2, c: r.R3 };
      };
      const fin = T(alphaMax);
      const moving = (f: Facet) => idsA.has(f.id) || idsF.has(f.id) || idsC.has(f.id);
      const statics = s.facets.filter((f) => !moving(f));
      const grp = (ids: Set<number>, rev: boolean) => {
        const l = s.facets.filter((f) => ids.has(f.id));
        return rev ? l.reverse() : l;
      };
      const order = [...statics, ...grp(idsC, true), ...grp(idsF, false), ...grp(idsA, true)];
      const end: FlatState = {
        ...s,
        facets: order.map((f) => (idsA.has(f.id) ? settle(f, fin.a) : idsF.has(f.id) ? settle(f, fin.f) : idsC.has(f.id) ? settle(f, fin.c) : f)),
      };
      const Bend = apply(m3ToAff(fin.f), B);
      const core: Core = {
        start: s,
        end,
        motion: 2.3,
        annots: [
          { type: 'line', kind: 'valley', a: A, b: I },
          { type: 'line', kind: 'valley', a: C, b: I },
          { type: 'line', kind: 'mountain', a: I, b: B },
          { type: 'arrow', kind: 'valley', from: B, to: Bend, bend: 0.4 },
        ],
        frame(t) {
          const P = T(alphaMax * paperEase(t));
          const items: Item[] = order.map((f) => ({
            f,
            T: idsA.has(f.id) ? P.a : idsF.has(f.id) ? P.f : idsC.has(f.id) ? P.c : I3,
            cUp: cUp(s, f),
          }));
          return { items, sort: 'stack', lead: t > 0 && t < 1 ? ap3(P.f, v3(B)) : null, camera: tiltCam(t, 24) };
        },
      };
      return withIntro(core, 0.9);
    },
  };
}

/* ================================================================ petal */

export interface PetalSpec {
  /** the fold that the point swings over: P1 (left end) → P2 (right end) */
  P1: V2;
  P2: V2;
  /** the point that lifts */
  B: V2;
  /** outer corners below P1 and P2 (ends of the flap edges that close in) */
  M1: V2;
  M2: V2;
  /** front layer between the kite creases (lifts) */
  kite: Sel;
  /** front layer outside the kite creases (tucks under the lifted point) */
  outerFront: Sel;
  /** the layer behind those (folds in along the kite creases) */
  outerBack: Sel;
}

/** Petal fold: lift a point on a horizontal hinge while both sides narrow in along the kite creases. */
export function petal(spec: PetalSpec): Op {
  return {
    plan(s0) {
      const s = clone(s0);
      const { P1, P2, B, M1, M2 } = spec;
      const kite = idsOf(s, spec.kite);
      const of = idsOf(s, spec.outerFront);
      const ob = idsOf(s, spec.outerBack);
      const midX = (P1[0] + P2[0]) / 2;
      const nx = sub2(P2, P1);
      const leftOf = (f: Facet) => {
        const c = centroid(curPoly(f));
        // which side of the B–(midpoint of hinge) axis
        const axisDir = sub2(B, [midX, (P1[1] + P2[1]) / 2]);
        return cross2(axisDir, sub2(c, B)) * cross2(axisDir, sub2(P1, B)) > 0;
      };
      const sgn = Math.sign(cross2(nx, sub2(B, P1))) || 1;
      const alphaMax = sgn * Math.PI; // rotation about P1→P2 that brings B toward +z
      const left = vertex4Solver(P1, nx, sub2(B, P1), sub2(M1, P1), sub2(B, P1), alphaMax);
      const nx2: V2 = [nx[0], nx[1]];
      const right = vertex4Solver(P2, nx2, sub2(B, P2), sub2(M2, P2), sub2(B, P2), alphaMax);
      const T = (al: number) => {
        const L = left(al);
        const R = right(al);
        return { kite: L.R1, ofL: L.R2, obL: L.R3, ofR: R.R2, obR: R.R3, kiteR: R.R1 };
      };
      const role = (f: Facet): 'kite' | 'ofL' | 'ofR' | 'obL' | 'obR' | null => {
        if (kite.has(f.id)) return 'kite';
        if (of.has(f.id)) return leftOf(f) ? 'ofL' : 'ofR';
        if (ob.has(f.id)) return leftOf(f) ? 'obL' : 'obR';
        return null;
      };
      const roles = new Map<number, ReturnType<typeof role>>();
      for (const f of s.facets) roles.set(f.id, role(f));
      const statics = s.facets.filter((f) => !roles.get(f.id));
      const g = (pred: (r: string) => boolean, rev: boolean) => {
        const l = s.facets.filter((f) => roles.get(f.id) && pred(roles.get(f.id)!));
        return rev ? l.reverse() : l;
      };
      const order = [...statics, ...g((r) => r.startsWith('ob'), true), ...g((r) => r.startsWith('of'), false), ...g((r) => r === 'kite', true)];
      const fin = T(alphaMax);
      const end: FlatState = {
        ...s,
        facets: order.map((f) => {
          const r = roles.get(f.id);
          return r ? settle(f, fin[r]) : f;
        }),
      };
      const Bend = apply(reflect(P1, P2), B);
      const core: Core = {
        start: s,
        end,
        motion: 2.5,
        annots: [
          { type: 'line', kind: 'valley', a: P1, b: P2 },
          { type: 'line', kind: 'valley', a: P1, b: B },
          { type: 'line', kind: 'valley', a: P2, b: B },
          { type: 'arrow', kind: 'valley', from: B, to: Bend, bend: 0.28 },
        ],
        frame(t) {
          const P = T(alphaMax * paperEase(t));
          const items: Item[] = order.map((f) => {
            const r = roles.get(f.id);
            return { f, T: r ? P[r] : I3, cUp: cUp(s, f) };
          });
          return { items, sort: 'stack', lead: t > 0 && t < 1 ? ap3(P.kite, v3(B)) : null, camera: tiltCam(t, 22) };
        },
      };
      return withIntro(core, 0.9);
    },
  };
}

/* ============================================================= collapse */

export interface CollapseSpec {
  O: V2;
  /** azimuths (degrees) of the four rays that rise toward the viewer and become the closed spine */
  spine: [number, number, number, number];
  /** azimuth (degrees) of the plane the flaps are flattened into (must be one of the spine azimuths) */
  flatten?: number;
  /** which side faces the viewer after laying the base down */
  face?: 1 | -1;
  /** for a 3D end pose: stop the spine at this elevation (degrees) and orbit the camera */
  partial?: { elevation: number; tilt: number; turn: number };
  annots?: Annot[];
  motion?: number;
}

const D2R = Math.PI / 180;

/**
 * Collapse a pre-creased square around its centre (preliminary / waterbomb base, fortune-teller shape).
 * Phase 1: 4-fold symmetric rigid folding of the 8 sectors (spine rays rise, flap rays follow).
 * Phase 2: the four closed flaps turn about the spine like pages until they lie in one plane.
 * Phase 3: the base is laid down on the table, spine pointing down the page.
 */
export function collapse(spec: CollapseSpec): Op {
  return {
    plan(s0) {
      const s = clone(s0);
      const O = spec.O;
      const spineAz = spec.spine.map((d) => d * D2R);
      const flapAz = spineAz.map((a) => a + Math.PI / 4);
      // make sure every facet lies in one sector
      for (const a of spineAz.slice(0, 2).concat(flapAz.slice(0, 2))) {
        splitSelected(s, () => true, O, [O[0] + Math.cos(a), O[1] + Math.sin(a)]);
      }
      const norm = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      type SectorInfo = { s: number; f: number; flap: number };
      const sectorOf = new Map<number, SectorInfo>();
      const stackIndex = new Map<number, number>();
      s.facets.forEach((f, k) => {
        const c = centroid(curPoly(f));
        const ang = norm(Math.atan2(c[1] - O[1], c[0] - O[0]));
        // nearest spine and flap rays
        let bs = 0;
        let bd = Infinity;
        spineAz.forEach((a, i) => {
          const d = Math.abs(((norm(a) - ang + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
          if (d < bd) {
            bd = d;
            bs = i;
          }
        });
        let bf = 0;
        bd = Infinity;
        flapAz.forEach((a, i) => {
          const d = Math.abs(((norm(a) - ang + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
          if (d < bd) {
            bd = d;
            bf = i;
          }
        });
        sectorOf.set(f.id, { s: bs, f: bf, flap: bf });
        void k;
      });
      // layer rank inside each sector (0 = lowest); a single sheet has rank 0 everywhere
      {
        const seen = new Map<string, number>();
        for (const f of s.facets) {
          const si = sectorOf.get(f.id)!;
          const key = si.s + ':' + si.f;
          const r = seen.get(key) ?? 0;
          stackIndex.set(f.id, r);
          seen.set(key, r + 1);
        }
      }
      const k45 = Math.cos(Math.PI / 4);
      const flapElev = (es: number) => {
        const A = k45 * Math.cos(es);
        const Bv = Math.sin(es);
        return Math.atan2(Bv, A) - Math.acos(Math.min(1, k45 / Math.hypot(A, Bv)));
      };
      const flatAz = (spec.flatten ?? spec.spine[0]) * D2R;
      // page targets: each flap goes to the flatten azimuth or its opposite, whichever is nearer
      const target = flapAz.map((b) => {
        const d = Math.cos(b - flatAz);
        let tgt = d >= 0 ? flatAz : flatAz + Math.PI;
        while (tgt - b > Math.PI) tgt -= 2 * Math.PI;
        while (tgt - b < -Math.PI) tgt += 2 * Math.PI;
        return tgt - b;
      });
      const face = spec.face ?? 1;
      // G: spine (z) → screen down (−y); flatten direction → ±x
      const ec: V3 = [Math.cos(flatAz), Math.sin(flatAz), 0];
      const ez: V3 = [0, 0, 1];
      const en = cross3(ec, ez);
      const X: V3 = [face, 0, 0];
      const Y: V3 = [0, -1, 0];
      const Z = cross3(X, Y);
      const G0: M3 = (() => {
        const r = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 3; i++)
          for (let j = 0; j < 3; j++) r[i * 3 + j] = X[i] * ec[j] + Y[i] * ez[j] + Z[i] * en[j];
        const Ov = v3(O);
        return [
          r[0], r[1], r[2], Ov[0] - (r[0] * Ov[0] + r[1] * Ov[1]),
          r[3], r[4], r[5], Ov[1] - (r[3] * Ov[0] + r[4] * Ov[1]),
          r[6], r[7], r[8], -(r[6] * Ov[0] + r[7] * Ov[1]),
        ] as M3;
      })();
      const Ov = v3(O);
      const sectorT = (id: number, es: number, page: number) => {
        const si = sectorOf.get(id)!;
        const a = spineAz[si.s];
        const b = flapAz[si.f];
        const ef = flapElev(es);
        const sFlat: V3 = [Math.cos(a), Math.sin(a), 0];
        const fFlat: V3 = [Math.cos(b), Math.sin(b), 0];
        const s3: V3 = [Math.cos(es) * Math.cos(a), Math.cos(es) * Math.sin(a), Math.sin(es)];
        const f3: V3 = [Math.cos(ef) * Math.cos(b), Math.cos(ef) * Math.sin(b), Math.sin(ef)];
        let T = frameMap(Ov, sFlat, fFlat, s3, f3);
        if (page) T = mul3(rotAxis(Ov, [0, 0, 1], target[si.flap] * page), T);
        return T;
      };
      const partial = spec.partial;
      const pose = (t: number) => {
        if (partial) {
          const e = easeInOut(phase(t, 0, 0.75));
          return { es: partial.elevation * D2R * e, page: 0, g: 0, cam: smooth(phase(t, 0.15, 1)) };
        }
        const es = (Math.PI / 2) * easeInOut(phase(t, 0, 0.5));
        const page = easeInOut(phase(t, 0.52, 0.8));
        const g = easeInOut(phase(t, 0.6, 1));
        return { es, page, g, cam: 0 };
      };
      const size = Math.sqrt(s.facets.reduce((a2, f) => a2 + Math.abs(areaOf(curPoly(f))), 0));
      const eps = size * 0.004;
      const place = (t: number) => {
        const P = pose(t);
        const G = P.g > 0 ? partialRot(G0, P.g, Ov) : I3;
        return s.facets.map((f) => {
          const T = mul3(G, sectorT(f.id, P.es, P.page));
          const n = dir3(T, [0, 0, 1]);
          const off = eps * stackIndex.get(f.id)!;
          const pts = curPoly(f).map((p) => {
            const q = ap3(T, v3(p));
            return [q[0] + n[0] * off, q[1] + n[1] * off, q[2] + n[2] * off] as V3;
          });
          return { f, T, pts };
        });
      };
      let end: FlatState;
      if (partial) end = s;
      else {
        // final order from a nearly-closed configuration
        // flaps almost closed (tiny opening) but pages clearly apart, so flaps never interleave
        const P = { es: (Math.PI / 2) * 0.998, page: 0.9 };
        const zs = s.facets.map((f) => {
          const T = mul3(G0, sectorT(f.id, P.es, P.page));
          const c = centroid(curPoly(f));
          const q = ap3(T, v3(c));
          const n = dir3(T, [0, 0, 1]);
          return { f, z: q[2] + n[2] * eps * stackIndex.get(f.id)! * 0.2 };
        });
        zs.sort((a2, b2) => a2.z - b2.z);
        end = {
          ...s,
          facets: zs.map(({ f }) => settle(f, mul3(G0, sectorT(f.id, Math.PI / 2, 1)))),
        };
      }
      const endOrder = new Map(end.facets.map((f, i) => [f.id, i]));
      const cam = partial
        ? (u: number) => mul3(rotAxis([0, 0, 0], [1, 0, 0], -partial.tilt * D2R * u), rotAxis([0, 0, 0], [0, 0, 1], partial.turn * D2R * u))
        : null;
      const core: Core = {
        start: s,
        end,
        motion: spec.motion ?? (partial ? 2.8 : 3.6),
        annots: spec.annots ?? [],
        frame(t) {
          if (!partial && t >= 0.985) {
            const items: Item[] = end.facets.map((f) => ({ f, T: I3, cUp: cUp(s, f) }));
            // geometric end: interpolate the last bit using the true pose for continuity
            const placed = place(t);
            const byId = new Map(placed.map((p) => [p.f.id, p]));
            const src = new Map(s.facets.map((f) => [f.id, f]));
            items.forEach((it, i) => {
              const p = byId.get(it.f.id)!;
              items[i] = { f: src.get(it.f.id)!, T: p.T, cUp: cUp(s, src.get(it.f.id)!) };
            });
            return { items, sort: 'stack', lead: null };
          }
          const placed = place(t);
          const items: Item[] = placed.map((p) => ({ f: p.f, T: p.T, cUp: cUp(s, p.f), pts: p.pts }));
          if (t > 0.9 && !partial) items.sort((a2, b2) => endOrder.get(a2.f.id)! - endOrder.get(b2.f.id)!);
          const P = pose(t);
          // tilt the view while the sheet is three-dimensional, so the collapse reads as depth
          const tilt = Math.sin(Math.PI * phase(t, 0.02, 0.95)) * 32 * D2R;
          return {
            items,
            sort: t > 0.9 && !partial ? 'stack' : 'depth',
            lead: null,
            camera: cam ? cam(P.cam) : rotAxis([0, 0, 0], [1, 0, 0], -tilt),
          };
        },
      };
      return withIntro(core, 0.9);
    },
  };
}

function pointIn(p: V2, poly: V2[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function areaOf(p: V2[]) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i];
    const r = p[(i + 1) % p.length];
    a += q[0] * r[1] - r[0] * q[1];
  }
  return a / 2;
}

/* ================================================================ poses */

export interface Hinge {
  sel: Sel;
  /** axis in current coordinates */
  axis: [V2, V2];
  /** degrees; positive lifts the selected side toward the viewer */
  angle: number;
  /** a point on the moving side (to resolve the direction) */
  side: V2;
  /** optional parent hinge index: this hinge's axis moves with the parent */
  parent?: number;
}

export interface PoseSpec {
  hinges: Hinge[];
  /** final camera: tilt (deg, about x), turn (deg, about the model's vertical) */
  camera?: { tilt: number; turn: number; spin?: number };
  motion?: number;
  annots?: Annot[];
}

/**
 * A 3D shaping step at the end of a model (open a cup, spread wings, raise walls). Hinges rotate groups by partial
 * angles; the camera swings round to show the result. Layers keep their stacking via small normal offsets.
 */
export function pose3d(spec: PoseSpec): Op {
  return {
    plan(s0) {
      const s = clone(s0);
      const hinges = spec.hinges.map((h) => {
        const ids = idsOf(s, h.sel);
        const u = norm2(sub2(h.axis[1], h.axis[0]));
        const sgn = Math.sign(cross2(u, sub2(h.side, h.axis[0]))) || 1;
        return { ...h, ids, sgn };
      });
      // local layer rank: how many facets lie under this one at its centroid
      const polys = s.facets.map(curPoly);
      const stack = new Map(
        s.facets.map((f, i) => {
          const c = centroid(polys[i]);
          let below = 0;
          for (let j = 0; j < i; j++) if (pointIn(c, polys[j])) below++;
          return [f.id, below];
        }),
      );
      const size0 = Math.sqrt(s.facets.reduce((a, f) => a + Math.abs(areaOf(curPoly(f))), 0));
      const eps = size0 * 0.004;
      const TF = (u: number) => {
        const Ts: M3[] = [];
        hinges.forEach((h, i) => {
          let T = rotLine(h.axis[0], h.axis[1], h.sgn * h.angle * D2R * u);
          if (h.parent !== undefined) T = mul3(Ts[h.parent], T);
          Ts[i] = T;
        });
        return Ts;
      };
      const cam = spec.camera;
      const core: Core = {
        start: s,
        end: s,
        motion: spec.motion ?? 2.6,
        annots: spec.annots ?? [],
        frame(t) {
          const u = easeInOut(phase(t, 0, 0.7));
          const c = smooth(phase(t, 0.1, 1));
          const Ts = TF(u);
          const items: Item[] = s.facets.map((f) => {
            // the last hinge that claims the facet wins (children after parents)
            let T = I3;
            for (let i = hinges.length - 1; i >= 0; i--)
              if (hinges[i].ids.has(f.id)) {
                T = Ts[i];
                break;
              }
            const n = dir3(T, [0, 0, 1]);
            const off = eps * stack.get(f.id)!;
            const pts = curPoly(f).map((p) => {
              const q = ap3(T, v3(p));
              return [q[0] + n[0] * off, q[1] + n[1] * off, q[2] + n[2] * off] as V3;
            });
            return { f, T, cUp: cUp(s, f), pts };
          });
          const camera = cam
            ? mul3(
                rotAxis([0, 0, 0], [1, 0, 0], -cam.tilt * D2R * c),
                rotAxis([0, 0, 0], [0, 1, 0], (cam.turn * c + (cam.spin ?? 0) * Math.max(0, t - 0.7)) * D2R),
              )
            : undefined;
          return { items, sort: 'depth', lead: null, camera };
        },
      };
      return withIntro(core, 0.5);
    },
  };
}

export { translate3 };
