import { type V2, reflectPoint } from '../engine/geom';
import type { ModelDef } from '../engine/model';
import { crease, fold, reverseFold } from '../engine/ops';
import { hold, seq } from '../engine/plan';
import { all, at, sheet } from '../engine/state';
import { P } from './palettes';

const k = Math.SQRT2 - 1;
const halfL = (i: { pc: V2 }) => i.pc[0] < 0;
const halfR = (i: { pc: V2 }) => i.pc[0] >= 0;
// crimp = inside reverse fold, then an outside reverse fold a little further along: the point steps sideways
const A1: [V2, V2] = [[-0.02, -0.38], [0.45, -0.2]];
const A2: [V2, V2] = [[-0.02, -0.5], [0.45, -0.32]];
const tip1 = reflectPoint([0, -1], A1[0], A1[1]);
const B2: [V2, V2] = [reflectPoint(A2[0], A1[0], A1[1]), reflectPoint(A2[1], A1[0], A1[1])];

const def: ModelDef = {
  id: 'crimp-pleat',
  title: 'Pleats and crimps',
  palette: P.plum,
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
      title: 'Narrow point',
      text: 'Fold a kite base (crease the vertical diagonal, bring the lower edges to it).',
      op: seq(
        crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] }),
        fold(
          { line: [[0, -1], [-(1 - k), k]], move: [-0.8, 0], lead: [-1, 0] },
          { line: [[1 - k, k], [0, -1]], move: [0.8, 0], lead: [1, 0] },
        ),
      ),
    },
    {
      title: 'Fold in half',
      text: 'Fold it in half along the centre so the point has two layers, joined along the left edge.',
      op: fold({ line: [[0, -1.2], [0, 1.2]], move: [-0.3, 0.2], sel: all }),
    },
    {
      title: 'Pre-crease both lines',
      text: 'A crimp is two reverse folds side by side. Fold and unfold along two nearly parallel lines across the point, a short distance apart.',
      op: seq(
        crease({ line: A1, move: [0.05, -0.9] }),
        crease({ line: A2, move: [0.05, -0.95] }),
      ),
    },
    {
      title: 'First line inward',
      text: 'Push the point in along the upper crease as an inside reverse fold. The point swings up between the layers.',
      op: reverseFold({ line: A1, move: [0.04, -0.9], flap: all, halfA: halfL, halfB: halfR, kind: 'inside', lead: [0.02, -0.98] }),
    },
    {
      title: 'Second line outward',
      text: 'Along the second crease, wrap the point back around the outside (an outside reverse fold). It now continues in its original direction, stepped sideways — a crimp.',
      tip: 'Crimps make necks, tails and elbows. Pleats do the same job on a single layer, and repeated pleats make scales, feathers and fans.',
      op: reverseFold({ line: B2, move: tip1, flap: at((c) => c[0] < 0), halfA: halfL, halfB: halfR, kind: 'outside', lead: tip1 }),
    },
    { title: 'Check', text: 'The point leaves the body, steps sideways, and continues. Flatten it and compare both sides: they should be mirror images.', op: hold() },
  ],
};
export default def;
