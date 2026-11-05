import type { ModelDef } from '../engine/model';
import { fold, turnOver } from '../engine/ops';
import { sheet, paper } from '../engine/state';
import { P } from './palettes';

// Diamond of half-diagonal 1. After the first fold the triangle has its base on y = 0.
// Folding a base corner so that the *left edge* becomes horizontal and the tip lands on the far edge puts the
// crease 0.8284 (= 2√2 − 2) along the base from that corner: about two-fifths of the base, as the book says.
const a = 2 * Math.SQRT2 - 2; // 0.8284
const rim = 0.7071 * a; // height where the tips land = 0.5858
const xc = -1 + a; // -0.1716: crease foot on the base
const xt = xc - (rim * 0.3827) / 0.9239; // -0.4142: crease top on the left edge

const cup: ModelDef = {
  id: 'cup',
  title: 'Classic paper cup',
  palette: P.vermilion,
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
      title: 'Triangle',
      text: 'Place the square as a diamond, white side up. Fold the bottom corner up to the top corner. The long folded edge is now at the bottom.',
      op: fold({ line: [[-1, 0], [1, 0]], move: [0, -0.5], lead: [0, -1] }),
    },
    {
      title: 'Left corner across',
      text: 'Fold the left corner across so it touches the right edge. Keep the top edge of this flap level with the base — the crease starts about two-fifths of the way along the base.',
      tip: 'Check the flap’s top edge against the base, not against the slanted edge.',
      op: fold({ line: [[xc, 0], [xt, rim]], move: [-0.9, 0.02], lead: [-1, 0] }),
    },
    {
      title: 'Right corner across',
      text: 'Fold the right corner across the same way. Its tip lands on the left edge, exactly where the first crease ends, and the two flaps overlap with their top edges level.',
      op: fold({ line: [[-xc, 0], [-xt, rim]], move: [0.9, 0.02], lead: [1, 0] }),
    },
    {
      title: 'Tuck the front triangle',
      text: 'Fold the front layer of the top triangle down and tuck it into the pocket of the flap you folded last (between its two layers).',
      tip: 'The triangle fits the pocket exactly; its left edge runs along the flap’s lower edge.',
      op: fold({
        line: [[-1, rim], [1, rim]],
        move: [0, 0.9],
        sel: paper((p) => p[1] < 0),
        place: { below: paper((p) => p[0] > 0.3 && p[1] > 0) },
        lead: [0, 1],
      }),
    },
    {
      title: 'Turn over',
      text: 'Turn the cup over.',
      op: turnOver(),
    },
    {
      title: 'Fold the back triangle',
      text: 'Fold the remaining triangle down against this side. There is no pocket on the back — just crease it flat.',
      op: fold({ line: [[-1, rim], [1, rim]], move: [0, 0.9], lead: [0, 1] }),
    },
  ],
};

export default cup;
