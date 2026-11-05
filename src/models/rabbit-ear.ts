import type { V2 } from '../engine/geom';
import { rabbitEar } from '../engine/mechanisms';
import type { ModelDef } from '../engine/model';
import { crease, split } from '../engine/ops';
import { hold, prep } from '../engine/plan';
import { and, at, paper, sheet, within } from '../engine/state';
import { P } from './palettes';

// Diamond A(−1,0) B(0,1) C(1,0) D(0,−1). Triangle ABC has its incentre I where the bisectors of A and C meet.
const r = Math.SQRT2 - 1; // inradius 0.4142
const A: V2 = [-1, 0];
const C: V2 = [1, 0];
const top = { B: [0, 1] as V2, I: [0, r] as V2, F: [(1 - r) / 2, (1 + r) / 2] as V2 }; // F: foot on BC
const bot = { B: [0, -1] as V2, I: [0, -r] as V2, F: [(1 - r) / 2, -(1 + r) / 2] as V2 };
const hitA = (s: number): V2 => [r, s * (1 - r)]; // bisector from A meets the far edge
const hitC = (s: number): V2 => [-r, s * (1 - r)];

const ear = (g: typeof top, s: number) =>
  prep(
    split([[g.I, g.B], [g.I, g.F]], at((c) => s * c[1] > r)),
    rabbitEar({
      I: g.I,
      A,
      C,
      B: g.B,
      F: g.F,
      pA: within([A, g.B, g.I]),
      pFlap: within([g.I, g.B, g.F]),
      pC: within([C, g.I, g.F]),
    }),
  );

const def: ModelDef = {
  id: 'rabbit-ear',
  title: 'Rabbit ear',
  palette: P.moss,
  start: () =>
    sheet(
      [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ],
      false,
    ),
  steps: [
    {
      title: 'Diagonal',
      text: 'Start with a diamond. Fold it in half along the horizontal diagonal and unfold — each half is now a triangle to practise on.',
      op: crease({ line: [[-1, 0], [1, 0]], move: [0, 0.5] }),
    },
    {
      title: 'Bisect the two angles',
      text: 'On the top triangle, fold the left slanted edge down onto the centre crease and unfold, then the right slanted edge. The two creases cross at a point inside the triangle.',
      op: crease(
        { line: [A, hitA(1)], move: [-0.3, 0.6], sel: paper((p) => p[1] > 0) },
      ),
    },
    {
      title: 'Second bisector',
      text: 'Now the right edge: fold it down onto the centre crease and unfold.',
      op: crease({ line: [hitC(1), C], move: [0.3, 0.6], sel: paper((p) => p[1] > 0) }),
    },
    {
      title: 'Rabbit ear',
      text: 'Fold both creases at the same time. The top corner rises as a narrow flap; pinch it in half and lay it down to one side. That is a rabbit ear.',
      tip: 'Push the two edges in together — if you finish one before starting the other, the flap will not form.',
      op: ear(top, 1),
    },
    {
      title: 'Bisect the lower angles',
      text: 'Repeat on the bottom triangle: crease both angle bisectors.',
      op: crease(
        { line: [hitA(-1), A], move: [-0.3, -0.6], sel: and(paper((p) => p[1] < 0), at((c) => c[1] < 0)) },
      ),
    },
    {
      title: 'Second lower bisector',
      text: 'And the other side.',
      op: crease({ line: [C, hitC(-1)], move: [0.3, -0.6], sel: and(paper((p) => p[1] < 0), at((c) => c[1] < 0)) }),
    },
    {
      title: 'Second rabbit ear',
      text: 'Rabbit-ear the bottom corner the same way. Two rabbit ears on opposite sides make a fish base.',
      op: ear(bot, -1),
    },
    {
      title: 'Fish base',
      text: 'A long diamond with two small flaps: the traditional fish base.',
      op: hold(),
    },
  ],
};
export default def;
