import type { ModelDef } from '../engine/model';
import { crease, fold, turnOver } from '../engine/ops';
import { hold, seq } from '../engine/plan';
import { sheet } from '../engine/state';
import { P } from './palettes';

// Diamond with corners at (0,±1), (±1,0); white side up.
// Step 3 puts the folded edge at y = −0.25; the 45° folds from (0,−0.25) meet the sides at (∓0.625, 0.375)
// and swing the old side corners up to (∓0.25, 0.75): two square lobes.
const def: ModelDef = {
  id: 'heart',
  title: 'Heart',
  palette: P.rose,
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
      title: 'Diagonals',
      text: 'Place the square as a diamond, white side up. Fold and unfold both diagonals.',
      op: seq(crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] }), crease({ line: [[-1, 0], [1, 0]], move: [0, 0.5] })),
    },
    {
      title: 'Top corner to the centre',
      text: 'Fold the top corner down to the centre point.',
      op: fold({ line: [[-0.5, 0.5], [0.5, 0.5]], move: [0, 0.9] }),
    },
    {
      title: 'Bottom corner to the top edge',
      text: 'Fold the bottom corner up so it touches the middle of the top edge.',
      op: fold({ line: [[0.75, -0.25], [-0.75, -0.25]], move: [0, -0.9] }),
    },
    {
      title: 'Edges up along the centre',
      text: 'Fold the left and right halves of the bottom edge up so they lie along the vertical centre crease. The old side corners rise above the top edge as two square lobes.',
      tip: 'Start each fold exactly at the centre of the bottom edge — that point becomes the tip of the heart.',
      op: fold(
        { line: [[0, -0.25], [-0.625, 0.375]], move: [-0.7, -0.1], lead: [-1, 0] },
        { line: [[0.625, 0.375], [0, -0.25]], move: [0.7, -0.1], lead: [1, 0] },
      ),
    },
    {
      title: 'Turn over',
      text: 'Turn the heart over.',
      op: turnOver(),
    },
    {
      title: 'Blunt the lobes',
      text: 'Fold the top corner of each lobe down a little.',
      op: fold({ line: [[-0.5, 0.63], [0.5, 0.63]], move: [0, 0.74] }),
    },
    {
      title: 'Round the sides',
      text: 'Fold the outer corner of each lobe in by the same small amount.',
      op: fold(
        { line: [[0.53, 0.2], [0.53, 0.55]], move: [0.62, 0.38] },
        { line: [[-0.53, 0.55], [-0.53, 0.2]], move: [-0.62, 0.38] },
      ),
    },
    {
      title: 'Turn over',
      text: 'Turn the heart over. Done.',
      op: turnOver(),
    },
    {
      title: 'Finished',
      text: 'A smooth, coloured heart with the folds hidden on the back.',
      op: hold(),
    },
  ],
};
export default def;
