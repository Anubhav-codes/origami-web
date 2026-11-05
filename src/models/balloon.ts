import type { V2 } from '../engine/geom';
import { pose3d } from '../engine/mechanisms';
import type { ModelDef, StepDef } from '../engine/model';
import { fold, turnOver } from '../engine/ops';
import { hold, prefold, seq } from '../engine/plan';
import { layersAt } from '../engine/state';
import { SQ, waterbombSteps } from './bases';
import { P } from './palettes';

// Waterbomb base: apex (0,0), base corners (±1,−1), bottom centre (0,−1).
const corners = () =>
  fold(
    { line: [[0, -1], [0.5, -0.5]], move: [0.9, -0.95], sel: layersAt([0.6, -0.85], 2), lead: [1, -1] },
    { line: [[-0.5, -0.5], [0, -1]], move: [-0.9, -0.95], sel: layersAt([-0.6, -0.85], 2), lead: [-1, -1] },
  );
const sides = () =>
  fold(
    { line: [[0.25, -0.75], [0.25, -0.25]], move: [0.45, -0.5], sel: layersAt([0.4, -0.5], 4), lead: [0.5, -0.5] },
    { line: [[-0.25, -0.25], [-0.25, -0.75]], move: [-0.45, -0.5], sel: layersAt([-0.4, -0.5], 4), lead: [-0.5, -0.5] },
  );
const tips = () =>
  fold(
    { line: [[0, -0.25], [0.25, -0.25]], move: [0.06, -0.08], sel: layersAt([0.07, -0.12], 2), lead: [0, 0] },
    { line: [[-0.25, -0.25], [0, -0.25]], move: [-0.06, -0.08], sel: layersAt([-0.07, -0.12], 2), lead: false, arrow: false },
  );
const R: [V2, V2] = [[0.25, -0.25], [0, -0.5]];
const L: [V2, V2] = [[0, -0.5], [-0.25, -0.25]];
const tuck = () =>
  fold(
    { line: R, move: [0.06, -0.33], sel: layersAt([0.07, -0.33], 4), place: { below: layersAt([0.17, -0.5], 1) }, lead: [0.03, -0.3] },
    { line: L, move: [-0.06, -0.33], sel: layersAt([-0.07, -0.33], 4), place: { below: layersAt([-0.17, -0.5], 1) }, lead: [-0.03, -0.3] },
  );

const side = (back: boolean): StepDef[] => [
  {
    title: back ? 'Back: corners up' : 'Corners up to the top',
    text: back
      ? 'Fold the bottom corners of the two flaps on this side up to the top point.'
      : 'Fold the bottom corners of the two front flaps up to the top point. The front becomes a square diamond.',
    op: corners(),
  },
  {
    title: back ? 'Back: sides in' : 'Sides to the centre',
    text: 'Fold the left and right corners of the front layers in to the vertical centre line.',
    op: sides(),
  },
  {
    title: back ? 'Back: tips down' : 'Top points down',
    text: 'Fold the two loose points at the top down so their tips meet the centre line, making two small triangles.',
    op: tips(),
  },
  {
    title: back ? 'Back: tuck' : 'Tuck into the pockets',
    text: 'Fold each small triangle again along the top edge of the side flap and slide it into the pocket of that flap. It fits the pocket exactly.',
    tip: 'Open the pocket slightly with a fingernail and guide the point all the way in.',
    op: tuck(),
  },
];

const def: ModelDef = {
  id: 'balloon',
  title: 'Waterbomb balloon',
  palette: P.mustard,
  start: () => prefold(SQ(), waterbombSteps().map((s) => s.op)),
  steps: [
    { title: 'Waterbomb base', text: 'Crease midlines and diagonals, then collapse into the waterbomb base (lesson 2.4), point at the top.', op: hold() },
    ...side(false),
    { title: 'Turn over', text: 'Turn the model over.', op: turnOver() },
    ...side(true),
    {
      title: 'Blow it up',
      text: 'Find the small hole at the bottom. Open the flaps slightly and blow gently into the hole while pressing the top corner down. The model inflates into a cube-like balloon.',
      tip: 'If it will not inflate, the paper is probably too thick or a point is not fully tucked. Pinch the top corner and try again.',
      op: pose3d({ hinges: [], inflate: 0.3, sort: 'depth', camera: { tilt: -20, turn: 38, spin: 25 }, motion: 3, annots: [{ type: 'inflate', at: [0, -1.05] }] }),
    },
  ],
};
export default def;
void seq;
