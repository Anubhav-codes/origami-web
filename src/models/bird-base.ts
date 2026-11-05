import type { ModelDef } from '../engine/model';
import { hold, prefold } from '../engine/plan';
import { SQW, birdBaseSteps, prelimSteps } from './bases';
import { P } from './palettes';

const def: ModelDef = {
  id: 'bird-base',
  title: 'Bird base',
  palette: P.indigo,
  start: () => prefold(SQW(), prelimSteps().map((s) => s.op)),
  steps: [
    {
      title: 'Preliminary base',
      text: 'Start with a preliminary base (lesson 2.3) folded with the coloured side inside, the four free corners at the bottom. The petal folds will turn the colour outward.',
      op: hold(),
    },
    ...birdBaseSteps(),
    {
      title: 'Check',
      text: 'A long diamond. Both faces look identical. The two long points at the top are the wings; the two at the bottom are the legs, and they can be swung apart.',
      op: hold(),
    },
  ],
};
export default def;
