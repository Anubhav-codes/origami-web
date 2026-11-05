import type { ModelDef } from '../engine/model';
import { hold } from '../engine/plan';
import { SQ, waterbombSteps } from './bases';
import { P } from './palettes';

const def: ModelDef = {
  id: 'waterbomb-base',
  title: 'Waterbomb base',
  palette: P.teal,
  start: SQ,
  steps: [
    ...waterbombSteps(),
    {
      title: 'Check',
      text: 'An isosceles triangle, flat, with the closed point at the top and no loose corner. Two flaps lie on each face.',
      op: hold(),
    },
  ],
};
export default def;
