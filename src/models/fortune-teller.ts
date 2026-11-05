import type { ModelDef } from '../engine/model';
import { collapse } from '../engine/mechanisms';
import { crease, fold, turnOver } from '../engine/ops';
import { hold, seq } from '../engine/plan';
import { sheet, square } from '../engine/state';
import { P } from './palettes';

const def: ModelDef = {
  id: 'fortune-teller',
  title: 'Fortune teller',
  palette: P.sky,
  start: () => sheet(square(1), true),
  steps: [
    {
      title: 'Diagonals',
      text: 'Coloured side up. Fold and unfold both diagonals to mark the centre.',
      op: seq(crease({ line: [[-1, -1], [1, 1]], move: [0.5, -0.5] }), crease({ line: [[1, -1], [-1, 1]], move: [-0.5, -0.5] })),
    },
    {
      title: 'Corners to the centre',
      text: 'Fold all four corners to the centre.',
      op: fold(
        { line: [[1, 0], [0, 1]], move: [0.9, 0.9] },
        { line: [[0, 1], [-1, 0]], move: [-0.9, 0.9] },
        { line: [[-1, 0], [0, -1]], move: [-0.9, -0.9] },
        { line: [[0, -1], [1, 0]], move: [0.9, -0.9] },
      ),
    },
    {
      title: 'Turn over',
      text: 'Turn the model over.',
      op: turnOver(),
    },
    {
      title: 'Corners to the centre again',
      text: 'Fold the four new corners to the centre. This face now shows four triangular flaps meeting in the middle; the other face shows four small squares.',
      op: fold(
        { line: [[0.5, -0.5], [0.5, 0.5]], move: [0.9, 0] },
        { line: [[-0.5, 0.5], [-0.5, -0.5]], move: [-0.9, 0] },
        { line: [[0.5, 0.5], [-0.5, 0.5]], move: [0, 0.9] },
        { line: [[-0.5, -0.5], [0.5, -0.5]], move: [0, -0.9] },
      ),
    },
    {
      title: 'Label it',
      text: 'Colour or name the four squares on the outside. Write a number on each triangular flap, then lift the flaps and write a fortune on the triangles underneath.',
      op: hold(),
    },
    {
      title: 'Crease in half both ways',
      text: 'With the flap side facing you, fold the model in half both ways to crease it, then unfold.',
      op: seq(crease({ line: [[-0.5, 0], [0.5, 0]], move: [0, 0.3] }), crease({ line: [[0, -0.5], [0, 0.5]], move: [-0.3, 0] })),
    },
    {
      title: 'Into play',
      text: 'Slide your thumbs and index fingers into the four pockets under the coloured squares and push the four points together. Pinch them open one way, then the other.',
      tip: 'Picking a colour, spell it while opening and closing; pick a number, and so on, until a fortune is revealed.',
      op: collapse({
        O: [0, 0],
        spine: [45, 135, 225, 315],
        partial: { elevation: 56, tilt: 52, turn: 24 },
        annots: [
          { type: 'push', at: [0.25, 0.25], dir: [-1, -1] },
          { type: 'push', at: [-0.25, 0.25], dir: [1, -1] },
          { type: 'push', at: [-0.25, -0.25], dir: [1, 1] },
          { type: 'push', at: [0.25, -0.25], dir: [-1, 1] },
        ],
      }),
    },
  ],
};
export default def;
