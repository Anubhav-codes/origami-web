import { openFlatten } from '../engine/mechanisms';
import type { ModelDef } from '../engine/model';
import { crease, fold, rotate, turnOver } from '../engine/ops';
import { hold } from '../engine/plan';
import { and, at, frontHalf, rank, rect, sheet } from '../engine/state';
import { P } from './palettes';

// A4 portrait in units of half its width: x ∈ [−1, 1], y ∈ [−1.414, 1.414].
const H = 297 / 210;

const def: ModelDef = {
  id: 'boat',
  title: 'Traditional boat',
  palette: P.kraft,
  start: () => sheet(rect(2, 2 * H), true),
  steps: [
    {
      title: 'Centre crease',
      text: 'Lay the sheet portrait (short edges at top and bottom). Fold it in half left to right and unfold, leaving a vertical centre crease.',
      op: crease({ line: [[0, -H - 0.1], [0, H + 0.1]], move: [-0.5, 0] }),
    },
    {
      title: 'Top to bottom',
      text: 'Fold the top edge down to the bottom edge. The fold is now at the top and the paper is two layers thick.',
      op: fold({ line: [[1, 0], [-1, 0]], move: [0, 1] }),
    },
    {
      title: 'Corners to the centre',
      text: 'Fold both top corners down so the top edge meets the centre crease. You have a triangle sitting on a band.',
      tip: 'On A4 this leaves a band about 44 mm deep — enough for the brim.',
      op: fold({ line: [[0, 0], [-1, -1]], move: [-0.9, -0.05], lead: [-1, 0] }, { line: [[1, -1], [0, 0]], move: [0.9, -0.05], lead: [1, 0] }),
    },
    {
      title: 'Front brim up',
      text: 'Fold the front layer of the band up along the bottom edge of the triangle.',
      op: fold({ line: [[1, -1], [-1, -1]], move: [0, -1.2], sel: and(rank(0), at((c) => c[1] < -1)), byPiece: true, lead: [0, -H] }),
    },
    {
      title: 'Wrap the brim corners',
      text: 'The brim is wider than the triangle. Fold the two overhanging corners of the brim behind, along the slanted edges of the triangle.',
      op: fold(
        { line: [[0, 0], [-1, -1]], move: [-0.95, -0.7], sel: and(rank(0), at((c) => c[0] < c[1])), byPiece: true, dir: 'mountain', lead: [-1, -0.62] },
        { line: [[1, -1], [0, 0]], move: [0.95, -0.7], sel: and(rank(0), at((c) => -c[0] < c[1])), byPiece: true, dir: 'mountain', lead: [1, -0.62] },
      ),
    },
    { title: 'Turn over', text: 'Turn the model over.', op: turnOver() },
    {
      title: 'Back brim up',
      text: 'Fold the other layer of the band up the same way.',
      op: fold({ line: [[1, -1], [-1, -1]], move: [0, -1.2], sel: and(rank(0), at((c) => c[1] < -1)), byPiece: true, lead: [0, -H] }),
    },
    {
      title: 'Wrap these corners too',
      text: 'Fold this brim’s overhanging corners behind as well. This is the paper hat — stop here if a hat is what you want.',
      op: fold(
        { line: [[0, 0], [-1, -1]], move: [-0.95, -0.7], sel: and(rank(0), at((c) => c[0] < c[1])), byPiece: true, dir: 'mountain', lead: [-1, -0.62] },
        { line: [[1, -1], [0, 0]], move: [0.95, -0.7], sel: and(rank(0), at((c) => -c[0] < c[1])), byPiece: true, dir: 'mountain', lead: [1, -0.62] },
      ),
    },

    {
      title: 'Open into a diamond',
      text: 'Put your fingers inside the hat and pull the front and back apart at the bottom. The two bottom corners come together; flatten the model into a diamond.',
      op: openFlatten({ A: [0, 0], w: 1 }),
    },
    {
      title: 'Front corner up',
      text: 'Fold the lower corner of the front layers up to the top corner.',
      op: fold({ line: [[0.71, -0.707], [-0.71, -0.707]], move: [0, -1.1], sel: frontHalf, byPiece: true, lead: [0, -1.41] }),
    },
    { title: 'Turn over', text: 'Turn the model over.', op: turnOver() },
    {
      title: 'Back corner up',
      text: 'Fold the lower corner of this side up to the top corner too. You have a triangle again.',
      op: fold({ line: [[0.71, -0.707], [-0.71, -0.707]], move: [0, -1.1], byPiece: true, lead: [0, -1.41] }),
    },
    {
      title: 'Open into a smaller diamond',
      text: 'Open the bottom again and bring the two corners together, flattening a smaller diamond.',
      op: openFlatten({ A: [0, 0], w: Math.SQRT1_2 }),
    },
    {
      title: 'Points up',
      text: 'Turn the diamond so the two loose points (where the corners met) are at the top.',
      op: rotate(180),
    },
    {
      title: 'Pull it into a boat',
      text: 'Take one loose point in each hand and pull them apart. The model opens into the boat, the middle rising as the sail between the two halves of the hull. Flatten the base so it floats.',
      tip: 'Pull gently and evenly — the paper is many layers thick at the sail and tears if one side goes first.',
      op: hold([
        { type: 'push', at: [-0.2, -0.1], dir: [-1, 0.25] },
        { type: 'push', at: [0.2, -0.1], dir: [1, 0.25] },
      ], 2.4),
    },
  ],
};
export default def;
