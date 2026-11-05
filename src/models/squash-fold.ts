import type { ModelDef } from '../engine/model';
import { squash } from '../engine/mechanisms';
import { hold, prefold } from '../engine/plan';
import { layersAt } from '../engine/state';
import { PB, SQ, prelimSteps } from './bases';
import { P } from './palettes';

const def: ModelDef = {
  id: 'squash-fold',
  title: 'Squash fold',
  palette: P.plum,
  start: () => prefold(SQ(), prelimSteps().map((s) => s.op)),
  steps: [
    {
      title: 'Start with a preliminary base',
      text: 'Hold a preliminary base with the closed point at the top. The right half is two flaps; you will squash the front one.',
      op: hold([{ type: 'push', at: [0.38, -0.38], dir: [-1, -0.2] }]),
    },
    {
      title: 'Lift, open and squash',
      text: 'Lift the front-right flap until it stands straight up along the centre line. Open its two layers, then press down on the folded edge so it lands on the centre crease. Keep both sides mirrored as you flatten.',
      tip: 'If one side ends up higher, the diamond twists — re-centre the spine on the crease before pressing.',
      op: squash({
        O: PB.O,
        hinge: PB.B,
        spine: PB.M2,
        near: layersAt([0.3, -0.7], 1),
        far: layersAt([0.3, -0.7], 1, 1),
      }),
    },
    {
      title: 'Check',
      text: 'A symmetric diamond (a kite shape) sits on the centre line, its point at the top. The new creases run from the top point to the sides.',
      op: hold(),
    },
  ],
};
export default def;
