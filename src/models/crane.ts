import { type V2, reflectPoint } from '../engine/geom';
import { pose3d } from '../engine/mechanisms';
import type { ModelDef } from '../engine/model';
import { fold, reverseFold, turnOver } from '../engine/ops';
import { hold, prefold } from '../engine/plan';
import { and, at, layersAt, nearXMidline, nearYMidline, quadrantAt } from '../engine/state';
import { SQW, birdBaseSteps, prelimSteps } from './bases';
import { P } from './palettes';

const R2 = Math.SQRT2;
const h = 1 - R2; // −0.414: the horizontal crease of the petal folds (bottom of the wings)
const B: V2 = [0, -R2]; // bottom point (both legs)
const t11 = Math.tan((11.25 * Math.PI) / 180);
const K: V2 = [-t11, h]; // narrowing crease meets the wing's lower edge
const K2: V2 = [t11, h];

// Inside reverse fold for the neck (left leg): a line rising 15° from the outer edge to the centre line,
// 0.15 below the wings. The leg swings up to 30° from vertical.
const yE = h - 0.15;
const xE = -t11 * (yE + R2); // on the narrowed outer edge
const ang = (15 * Math.PI) / 180;
const N1: V2 = [xE - 0.05 * Math.cos(ang), yE - 0.05 * Math.sin(ang)];
const N2: V2 = [0.02, yE + (0.02 - xE) * Math.tan(ang)];
const T1: V2 = [-N1[0], N1[1]];
const T2: V2 = [-N2[0], N2[1]];
const neckTip = reflectPoint(B, N1, N2);
// head: a small inside reverse fold 0.24 from the tip, so the head points forward and slightly down
const nd: V2 = [neckTip[0] - (N1[0] + N2[0]) / 2, neckTip[1] - (N1[1] + N2[1]) / 2];
const nl = Math.hypot(nd[0], nd[1]);
const u: V2 = [nd[0] / nl, nd[1] / nl];
const Hc: V2 = [neckTip[0] - u[0] * 0.24, neckTip[1] - u[1] * 0.24];
const hAng = (160 * Math.PI) / 180;
const H1: V2 = [Hc[0] - Math.cos(hAng) * 0.2, Hc[1] - Math.sin(hAng) * 0.2];
const H2: V2 = [Hc[0] + Math.cos(hAng) * 0.2, Hc[1] + Math.sin(hAng) * 0.2];

const leftLeg = quadrantAt([-0.06, -1.0]);
const rightLeg = quadrantAt([0.06, -1.0]);

const def: ModelDef = {
  id: 'crane',
  title: 'Crane',
  palette: P.vermilion,
  start: () => prefold(SQW(), [...prelimSteps(), ...birdBaseSteps()].map((s) => s.op)),
  steps: [
    {
      title: 'Bird base',
      text: 'Start with a bird base (lesson 3.1): wings (the petal flaps) at the top, the two legs at the bottom.',
      op: hold(),
    },
    {
      title: 'Narrow the legs',
      text: 'Fold the lower left and right slanting edges of the front layer in to the centre line. Leaving a hair’s gap at the centre makes the next steps easier.',
      op: fold(
        { line: [B, K], move: [-0.3, -0.55], sel: layersAt([-0.22, -0.6], 2), lead: [-0.36, -0.6] },
        { line: [K2, B], move: [0.3, -0.55], sel: layersAt([0.22, -0.6], 2), lead: [0.36, -0.6] },
      ),
    },
    { title: 'Turn over', text: 'Turn the model over.', op: turnOver() },
    {
      title: 'Narrow the back',
      text: 'Narrow the legs on this side the same way. Both legs are now thin points.',
      op: fold(
        { line: [B, K], move: [-0.3, -0.55], sel: layersAt([-0.22, -0.6], 2), lead: [-0.36, -0.6] },
        { line: [K2, B], move: [0.3, -0.55], sel: layersAt([0.22, -0.6], 2), lead: [0.36, -0.6] },
      ),
    },
    {
      title: 'Neck',
      text: 'Crease the left leg at an angle just below the wings. Open the leg’s layers slightly and push it up inside itself along the crease — an inside reverse fold. It now points up and slightly outward.',
      tip: 'If the neck will not stay up, the leg was not narrowed enough or the reverse fold is not creased sharply.',
      op: reverseFold({
        line: [N1, N2],
        move: [-0.04, -1.2],
        flap: leftLeg,
        halfA: nearXMidline,
        halfB: nearYMidline,
        kind: 'inside',
        lead: [-0.02, -1.3],
      }),
    },
    {
      title: 'Tail',
      text: 'Do the same with the right leg. One point is the neck, the other the tail.',
      op: reverseFold({
        line: [T2, T1],
        move: [0.04, -1.2],
        flap: rightLeg,
        halfA: nearXMidline,
        halfB: nearYMidline,
        kind: 'inside',
        lead: [0.02, -1.3],
      }),
    },
    {
      title: 'Head',
      text: 'Crease the tip of the neck downward and make a small inside reverse fold so the head points forward.',
      op: reverseFold({
        line: [H1, H2],
        move: neckTip,
        flap: and(quadrantAt([neckTip[0] + u[0] * -0.08, neckTip[1] + u[1] * -0.08]), at((c) => c[0] < -0.2)),
        halfA: nearXMidline,
        halfB: nearYMidline,
        kind: 'inside',
        lead: neckTip,
      }),
    },
    {
      title: 'Wings down',
      text: 'Fold the front wing down along the line between the neck and the tail, and fold the back wing down behind in the same way.',
      op: fold(
        { line: [[1, h], [-1, h]], move: [0, 0.2], sel: quadantFront(), lead: [0, 2 - R2] },
        { line: [[1, h], [-1, h]], move: [0, 0.2], sel: quadantBack(), dir: 'mountain', lead: false, arrow: false, showLine: false },
      ),
    },
    {
      title: 'Shape the body',
      text: 'Hold the crane under the body, gently pull the wings apart until they are level, and press the base so the body rounds out.',
      op: pose3d({
        hinges: [
          { sel: quadrantAt([0.03, -1.0], true), axis: [[-1, h], [1, h]], angle: 88, side: [0, -0.9] },
          { sel: quadrantAt([0.03, -1.0], false), axis: [[-1, h], [1, h]], angle: -88, side: [0, -0.9] },
        ],
        camera: { tilt: -16, turn: 58, spin: 10 },
        motion: 3.2,
      }),
    },
  ],
};

function quadantFront() {
  return quadrantAt([0.03, 0.35], true);
}
function quadantBack() {
  return quadrantAt([0.03, 0.35], false);
}

export default def;
