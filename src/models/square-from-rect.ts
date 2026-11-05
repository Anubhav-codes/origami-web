import type { ModelDef } from '../engine/model';
import { crease, cut, fold } from '../engine/ops';
import { hold } from '../engine/plan';
import { rank, rect, sheet } from '../engine/state';
import { P } from './palettes';

// A4 in units of half its width: 2 × 2.8286 (210 × 297 mm).
const H = (2 * 297) / 210;
const top = H / 2;
const strip = top - 2; // y of the triangle's lower edge (-0.586)

const def: ModelDef = {
  id: 'square-from-rect',
  title: 'A square from A4 or Letter',
  palette: P.white,
  start: () => sheet(rect(2, H), true),
  steps: [
    {
      title: 'Portrait',
      text: 'Lay the sheet with a short edge at the bottom.',
      op: hold(),
    },
    {
      title: 'Top edge to the right edge',
      text: 'Fold the top-left corner down and across until the top edge lies exactly along the right edge. The crease runs at 45° from the top-right corner and makes a triangle at the top.',
      tip: 'Match the corner to the right edge first, then press from the top-right corner outward.',
      op: fold({ line: [[1, top], [-1, strip]], move: [-0.9, top - 0.1], lead: [-1, top] }),
    },
    {
      title: 'Crease the strip',
      text: 'Fold the strip below the triangle up along the triangle’s lower edge, crease it firmly and unfold.',
      op: crease({ line: [[1, strip], [-1, strip]], move: [0, -1.2] }),
    },
    {
      title: 'Cut off the strip',
      text: 'Cut (or tear) along that crease and remove the strip. Tear for speed; cut with a ruler and blade for accuracy.',
      op: cut([[-1, strip], [1, strip]], [0, -1.2]),
    },
    {
      title: 'Open the square',
      text: 'Unfold the triangle. The sheet is now a square: 21 × 21 cm from A4, 8.5 × 8.5 in from Letter.',
      op: fold({ line: [[1, top], [-1, strip]], move: [0.5, 0], sel: rank(0), lead: [1, strip] }),
    },
    {
      title: 'Test the square',
      text: 'Fold along the other diagonal: the corners should land exactly on each other. If they do not, the first fold was off — trim and try again.',
      op: crease({ line: [[-1, top], [1, strip]], move: [-0.5, strip + 0.3] }),
    },
  ],
};
export default def;
