import { type V2, reflectPoint } from '../engine/geom';
import type { ModelDef } from '../engine/model';
import { crease, fold, reverseFold } from '../engine/ops';
import { hold } from '../engine/plan';
import { all, sheet } from '../engine/state';
import { P } from './palettes';

// A kite base folded in half: a two-layer flap whose spine is the centre line x = 0, point at the bottom.
const k = Math.SQRT2 - 1;
const halfL = (i: { pc: V2 }) => i.pc[0] < 0;
const halfR = (i: { pc: V2 }) => i.pc[0] >= 0;
// inside reverse: the point swings up and out to the right
const L1: [V2, V2] = [[-0.02, -0.5], [0.4, -0.2]];
const tip = reflectPoint([0, -1], L1[0], L1[1]);
const d: V2 = [tip[0] - 0.19, tip[1] - 0.02];
// outside reverse near the new tip
const dir = Math.atan2(tip[1] - 0.25 * 0 - (-0.35), tip[0] - 0.19);
const c: V2 = [tip[0] - Math.cos(dir) * 0.22, tip[1] - Math.sin(dir) * 0.22];
const a2 = dir + (100 * Math.PI) / 180;
const L2: [V2, V2] = [
  [c[0] - Math.cos(a2) * 0.2, c[1] - Math.sin(a2) * 0.2],
  [c[0] + Math.cos(a2) * 0.2, c[1] + Math.sin(a2) * 0.2],
];
void d;

const def: ModelDef = {
  id: 'reverse-folds',
  title: 'Inside and outside reverse folds',
  palette: P.teal,
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
      title: 'Kite',
      text: 'Crease the vertical diagonal of a diamond, then fold the lower edges to it (a kite base).',
      op: crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] }),
    },
    {
      title: 'Kite folds',
      text: 'Fold the two lower edges in to the centre crease.',
      op: fold(
        { line: [[0, -1], [-(1 - k), k]], move: [-0.8, 0], lead: [-1, 0] },
        { line: [[1 - k, k], [0, -1]], move: [0.8, 0], lead: [1, 0] },
      ),
    },
    {
      title: 'Fold in half',
      text: 'Fold the kite in half along the centre, left over right. You now have a narrow two-layer point with its folded edge (the spine) on the left.',
      op: fold({ line: [[0, -1.2], [0, 1.2]], move: [-0.3, 0.2], sel: all }),
    },
    {
      title: 'Inside reverse fold',
      text: 'Crease the point at an angle and unfold. Open the two layers slightly and push the point up between them, so it turns inside out along the crease. Press flat.',
      tip: 'The spine of the point flips from a mountain to a valley — that is what makes it a reverse fold.',
      op: reverseFold({ line: L1, move: [0.04, -0.9], flap: all, halfA: halfL, halfB: halfR, kind: 'inside', lead: [0.02, -0.98] }),
    },
    {
      title: 'Outside reverse fold',
      text: 'Near the new tip, crease another angle. This time open the layers and wrap the tip around the outside, so the paper turns away from the body instead of inside it.',
      tip: 'Use outside reverse folds for heads that bend forward and tails that curl away.',
      op: reverseFold({ line: L2, move: tip, flap: all, halfA: halfL, halfB: halfR, kind: 'outside', lead: tip }),
    },
    {
      title: 'Compare',
      text: 'The lower bend hides its point inside the layers; the upper one wraps around them. Fold each on scrap paper until both feel automatic.',
      op: hold(),
    },
  ],
};
export default def;
