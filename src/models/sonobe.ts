import { type M3, type V2, type V3, ap3, dir3, mul3, rotAxis, easeInOut, phase, smooth, clamp, centroid } from '../engine/geom';
import type { ModelDef } from '../engine/model';
import { crease, fold, turnOver } from '../engine/ops';
import { type Core, type Item, type Op, cUp, prep, withIntro } from '../engine/plan';
import { and, at, curPoly, paper, sinkBelow, sheet, square, type FlatState } from '../engine/state';
import { P } from './palettes';

// After the unit is finished and turned over it is the parallelogram P(.5,1) Q(−.5,0) R(−.5,−1) S(.5,0):
// a square (diamond Q-T-S-U) with a triangular tab at each end.
const T: V2 = [0, 0.5];
const S: V2 = [0.5, 0];
const Q: V2 = [-0.5, 0];
const U: V2 = [0, -0.5];
const A_SIDE = Math.SQRT1_2 / 2; // half the square's side

const leftFlap = paper((p) => p[0] < -0.5);
const rightFlap = paper((p) => p[0] > 0.5);

type Face = { A: V3; B: V3; pal: { front: string; back: string } };
const X: V3 = [1, 0, 0];
const Y: V3 = [0, 1, 0];
const Z: V3 = [0, 0, 1];
const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FACES: Face[] = [
  { A: X, B: Y, pal: P.vermilion },
  { A: X, B: neg(Y), pal: P.vermilion },
  { A: Y, B: Z, pal: P.indigo },
  { A: Y, B: neg(Z), pal: P.indigo },
  { A: Z, B: X, pal: P.mustard },
  { A: Z, B: neg(X), pal: P.mustard },
];

/** Six copies of the folded unit assemble into a cube: tabs bend 90° and slide into neighbouring pockets. */
function cube(): Op {
  return {
    plan(s: FlatState) {
      const tabSide = (c: V2) => {
        // tab 1 beyond line T–S, tab 2 beyond line Q–U
        if (c[0] + c[1] > 0.5 + 1e-6) return 1;
        if (c[0] + c[1] < -0.5 - 1e-6) return 2;
        return 0;
      };
      const role = new Map(s.facets.map((f) => [f.id, tabSide(centroid(curPoly(f)))]));
      const r2 = Math.SQRT1_2;
      const place = (face: Face, explode: number, spin: number): M3 => {
        const n = cross(face.A, face.B);
        const ex: V3 = [(face.A[0] - face.B[0]) * r2, (face.A[1] - face.B[1]) * r2, (face.A[2] - face.B[2]) * r2];
        const ey: V3 = [(face.A[0] + face.B[0]) * r2, (face.A[1] + face.B[1]) * r2, (face.A[2] + face.B[2]) * r2];
        const d = A_SIDE + explode;
        const M: M3 = [ex[0], ey[0], n[0], n[0] * d, ex[1], ey[1], n[1], n[1] * d, ex[2], ey[2], n[2], n[2] * d];
        return spin ? mul3(rotAxis([n[0] * d, n[1] * d, n[2] * d], n, spin), M) : M;
      };
      const tabT = (k: number, ang: number): M3 =>
        k === 1 ? rotAxis([T[0], T[1], 0], [S[0] - T[0], S[1] - T[1], 0], -ang) : k === 2 ? rotAxis([Q[0], Q[1], 0], [U[0] - Q[0], U[1] - Q[1], 0], ang) : (null as unknown as M3);
      const core: Core = {
        start: s,
        end: s,
        motion: 6,
        annots: [],
        frame(t) {
          const bend = (Math.PI / 2) * easeInOut(phase(t, 0, 0.22));
          const fly = easeInOut(phase(t, 0.2, 0.8));
          const items: Item[] = [];
          FACES.forEach((face, i) => {
            const delay = i * 0.06;
            const fi = clamp((fly - delay) / (1 - delay * 1.2));
            const M = i === 0 && t < 0.2 ? null : place(face, 1.4 * (1 - smooth(fi)), (1 - smooth(fi)) * 1.2 * (i % 2 ? -1 : 1));
            const alpha = i === 0 ? 1 : smooth(clamp(fly * 4 - i * 0.35));
            if (alpha <= 0.01) return;
            for (const f of s.facets) {
              const k = role.get(f.id)!;
              let L: M3 = k ? tabT(k, bend) : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
              if (M) L = mul3(M, L);
              const nf = i === 0 ? f : { ...f, id: f.id + 100000 * i };
              items.push({ f: nf, T: L, cUp: cUp(s, f), pal: face.pal, alpha: alpha < 1 ? alpha : undefined, zBias: k && fi > 0.9 ? -10 : 0 });
            }
          });
          // camera: from the flat view, swing round to a three-quarter view of the cube and keep turning
          const c = smooth(phase(t, 0.12, 0.7));
          const spin = Math.max(0, t - 0.6) * 1.4;
          const cam = mul3(rotAxis([0, 0, 0], [1, 0, 0], -0.55 * c), rotAxis([0, 0, 0], [0, 1, 0], (0.75 + spin) * c));
          // keep the cube centred where the unit was
          void dir3;
          void ap3;
          return { items, sort: 'depth', lead: null, camera: cam };
        },
      };
      return withIntro(core, 0.4);
    },
  };
}

const def: ModelDef = {
  id: 'sonobe',
  title: 'Sonobe unit and cube',
  palette: P.vermilion,
  start: () => sheet(square(1), false),
  steps: [
    {
      title: 'Centre crease',
      text: 'White side up. Fold the paper in half vertically and unfold.',
      op: crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] }),
    },
    {
      title: 'Quarter creases',
      text: 'Fold the left and right edges to the centre crease and unfold.',
      op: crease({ line: [[-0.5, -1], [-0.5, 1]], move: [-0.8, 0] }, { line: [[0.5, 1], [0.5, -1]], move: [0.8, 0] }),
    },
    {
      title: 'Two corners',
      text: 'Fold the top-left corner down to the nearest vertical crease, then the bottom-right corner up to its nearest crease.',
      op: fold({ line: [[-0.5, 1], [-1, 0.5]], move: [-0.9, 0.9], lead: [-1, 1] }, { line: [[0.5, -1], [1, -0.5]], move: [0.9, -0.9], lead: [1, -1] }),
    },
    {
      title: 'Edges to the centre',
      text: 'Fold the left and right edges back in to the centre crease, over the folded corners.',
      op: fold(
        { line: [[0.5, -1.1], [0.5, 1.1]], move: [0.8, 0], lead: [1, 0.2] },
        { line: [[-0.5, 1.1], [-0.5, -1.1]], move: [-0.8, 0], lead: [-1, -0.2] },
      ),
    },
    {
      title: 'Diagonal creases',
      text: 'Fold the top-right corner down to the left edge and unfold; fold the bottom-left corner up to the right edge and unfold.',
      op: crease({ line: [[-0.5, 1], [0.5, 0]], move: [0.4, 0.9], lead: [0.5, 1] }, { line: [[0.5, -1], [-0.5, 0]], move: [-0.4, -0.9], lead: [-0.5, -1] }),
    },
    {
      title: 'Tuck the top corner',
      text: 'Refold the top-right corner along its crease and tuck it under the left flap.',
      tip: 'Lift the edge of the flap with a fingernail; the corner slides in up to the crease.',
      op: fold({ line: [[-0.5, 1], [0.5, 0]], move: [0.4, 0.9], place: { below: and(leftFlap, at((c) => c[1] > 0)) }, lead: [0.5, 1] }),
    },
    {
      title: 'Tuck the bottom corner',
      text: 'Do the same with the bottom-left corner, tucking it under the right flap. The unit is now a parallelogram.',
      op: prep(
        sinkBelow(and(leftFlap, at((c) => c[1] < 0)), rightFlap),
        fold({ line: [[0.5, -1], [-0.5, 0]], move: [-0.4, -0.9], place: { below: and(rightFlap, at((c) => c[1] < 0)) }, lead: [-0.5, -1] }),
      ),
    },
    { title: 'Turn over', text: 'Turn the unit over.', op: turnOver() },
    {
      title: 'Crease the tabs',
      text: 'Fold each sharp point across to the opposite corner, so its edge lies along the unit’s long edge and a square forms in the middle. Unfold. These creases make the tabs.',
      op: crease({ line: [T, S], move: [0.45, 0.9], lead: [0.5, 1] }, { line: [Q, U], move: [-0.45, -0.9], lead: [-0.5, -1] }),
    },
    {
      title: 'Six units into a cube',
      text: 'Fold six identical units. Bend both tabs of each unit to 90°, then slide every tab into the pocket of its neighbour: three colours, two units each, opposite faces matching.',
      tip: 'Assemble flat on the desk first, then close the box. Paper clips can hold it until the last unit is in.',
      op: cube(),
    },
  ],
};
export default def;
