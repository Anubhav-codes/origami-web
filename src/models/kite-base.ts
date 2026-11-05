import type { ModelDef } from '../engine/model';
import { crease, fold } from '../engine/ops';
import { hold } from '../engine/plan';
import { sheet } from '../engine/state';
import { P } from './palettes';

const k = Math.SQRT2 - 1; // 0.4142
const def: ModelDef = {
  id: 'kite-base',
  title: 'Kite base',
  palette: P.mustard,
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
      title: 'Centre diagonal',
      text: 'Place the square as a diamond, white side up. Fold it in half along the vertical diagonal and unfold.',
      op: crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] }),
    },
    {
      title: 'Edges to the centre',
      text: 'Fold the two lower edges in so they meet along the centre crease. The creases start at the bottom corner.',
      tip: 'Line the edge up along the whole crease, starting at the bottom point, before you press.',
      op: fold(
        { line: [[0, -1], [-(1 - k), k]], move: [-0.8, 0], lead: [-1, 0] },
        { line: [[1 - k, k], [0, -1]], move: [0.8, 0], lead: [1, 0] },
      ),
    },
    {
      title: 'Check',
      text: 'A kite: broad at the top, a narrow point at the bottom. Both edges lie on the crease with no gap, and the kite is symmetrical when held up to the light.',
      op: hold(),
    },
  ],
};
export default def;
