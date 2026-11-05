import type { ModelDef } from '../engine/model';
import { crease, fold } from '../engine/ops';
import { seq } from '../engine/plan';
import { and, at, rank, sheet, square } from '../engine/state';
import { P } from './palettes';

const def: ModelDef = {
  id: 'warmup',
  title: 'Warm-up drills',
  palette: P.mustard,
  start: () => sheet(square(1), false),
  steps: [
    {
      title: 'Half and half',
      text: 'Fold the square in half edge to edge and unfold, then in half the other way and unfold. Do not move on until the edges meet within a millimetre.',
      op: seq(crease({ line: [[-1, 0], [1, 0]], move: [0, -0.5] }), crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] })),
    },
    {
      title: 'Diagonals',
      text: 'Repeat on both diagonals. You now have the four creases every later base is built on.',
      op: seq(crease({ line: [[-1, -1], [1, 1]], move: [0.5, -0.5] }), crease({ line: [[1, -1], [-1, 1]], move: [-0.5, -0.5] })),
    },
    {
      title: 'Corners to the centre',
      text: 'Fold each corner to the point where the creases cross. The four tips should meet with no gap and no overlap.',
      op: fold(
        { line: [[1, 0], [0, 1]], move: [0.9, 0.9] },
        { line: [[0, 1], [-1, 0]], move: [-0.9, 0.9] },
        { line: [[-1, 0], [0, -1]], move: [-0.9, -0.9] },
        { line: [[0, -1], [1, 0]], move: [0.9, -0.9] },
      ),
    },
    {
      title: 'Open the corners',
      text: 'Unfold the four corners again, ready for the next drill.',
      op: fold(
        { line: [[1, 0], [0, 1]], move: [0.3, 0.3], sel: and(rank(0), at((c) => c[0] > 0 && c[1] > 0)), arrow: false },
        { line: [[0, 1], [-1, 0]], move: [-0.3, 0.3], sel: and(rank(0), at((c) => c[0] < 0 && c[1] > 0)), arrow: false },
        { line: [[-1, 0], [0, -1]], move: [-0.3, -0.3], sel: and(rank(0), at((c) => c[0] < 0 && c[1] < 0)), arrow: false },
        { line: [[0, -1], [1, 0]], move: [0.3, -0.3], sel: and(rank(0), at((c) => c[0] > 0 && c[1] < 0)), arrow: false },
      ),
    },
    {
      title: 'Pleat: valley',
      text: 'For the pleat, fold the bottom edge up to the centre crease (a valley fold).',
      op: fold({ line: [[-1, -0.5], [1, -0.5]], move: [0, -0.9] }),
    },
    {
      title: 'Pleat: back again',
      text: 'Fold the flap back down so its edge returns to the first crease. Seen from the side, the two creases make a Z — that is a pleat.',
      tip: 'Pleats are how paper steps sideways: you will use them for necks, tails and texture.',
      op: fold({ line: [[1, -0.25], [-1, -0.25]], move: [0, -0.05], sel: and(rank(0), at((c) => c[1] > -0.5)), lead: [0, 0] }),
    },
  ],
};
export default def;
