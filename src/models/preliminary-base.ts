import type { ModelDef } from '../engine/model';
import { hold } from '../engine/plan';
import { SQ, prelimSteps } from './bases';
import { P } from './palettes';

const def: ModelDef = {
  id: 'preliminary-base',
  title: 'Preliminary (square) base',
  palette: P.indigo,
  start: SQ,
  steps: [
    ...prelimSteps(),
    {
      title: 'Check',
      text: 'A square standing on its point: the closed corner (the centre of the paper) at the top, the four free corners together at the bottom, two flaps on each side. Each face shows one flat layer with a centre crease.',
      op: hold(),
    },
  ],
};
export default def;
