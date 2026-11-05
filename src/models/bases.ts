/**
 * Shared step sequences for the traditional bases, so later lessons can start from a finished base
 * (via `prefold`) or replay the base as part of a full tutorial.
 */
import type { V2 } from '../engine/geom';
import { collapse, petal } from '../engine/mechanisms';
import type { StepDef } from '../engine/model';
import { crease, fold, turnOver } from '../engine/ops';
import { seq } from '../engine/plan';
import { and, layersAt, or, paper, rank, sheet, square, within, at, type FlatState } from '../engine/state';

export const SQ = () => sheet(square(1), true); // side A (coloured) up
/** Same, but side A is white: the base ends up with the colour inside, so petal folds and wings show colour. */
export const SQW = () => sheet(square(1), false);

const R2 = Math.SQRT2;

/* ---------------------------------------------------- preliminary base */

export const prelimSteps = (): StepDef[] => [
  {
    title: 'Diagonals',
    text: 'Place the square with side A (the coloured side) up. Fold it in half along one diagonal and unfold, then along the other diagonal and unfold. Both are valley folds.',
    op: seq(
      crease({ line: [[-1, -1], [1, 1]], move: [-0.5, 0.5] }),
      crease({ line: [[1, -1], [-1, 1]], move: [0.5, 0.5] }),
    ),
  },
  {
    title: 'Turn over',
    text: 'Turn the paper over to side B.',
    op: turnOver(),
  },
  {
    title: 'Midlines',
    text: 'Fold it in half edge to edge and unfold, both ways. Seen from side B the diagonals are now mountain folds and the midlines valley folds.',
    op: seq(
      crease({ line: [[-1, 0], [1, 0]], move: [0, 0.5] }),
      crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] }),
    ),
  },
  {
    title: 'Collapse',
    text: 'Push the midpoints of all four edges toward the centre. The corners rise and come together at one point; let the paper fold along the creases you made, then flatten it with two flaps on each side.',
    tip: 'If the collapse twists, unfold and re-crease every fold firmly in both directions.',
    op: collapse({
      O: [0, 0],
      spine: [45, 135, 225, 315],
      flatten: 45,
      annots: [
        { type: 'line', kind: 'mountain', a: [-1, -1], b: [1, 1] },
        { type: 'line', kind: 'mountain', a: [1, -1], b: [-1, 1] },
        { type: 'push', at: [1, 0], dir: [-1, 0] },
        { type: 'push', at: [-1, 0], dir: [1, 0] },
        { type: 'push', at: [0, 1], dir: [0, -1] },
        { type: 'push', at: [0, -1], dir: [0, 1] },
      ],
    }),
  },
];

/* ------------------------------------------------------ waterbomb base */

export const waterbombSteps = (): StepDef[] => [
  {
    title: 'Midlines',
    text: 'With side A (coloured) up, fold the square in half edge to edge and unfold, both ways. These are valley folds.',
    op: seq(
      crease({ line: [[-1, 0], [1, 0]], move: [0, 0.5] }),
      crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] }),
    ),
  },
  {
    title: 'Turn over',
    text: 'Turn the paper over to side B.',
    op: turnOver(),
  },
  {
    title: 'Diagonals',
    text: 'Fold both diagonals as valley folds and unfold. From this side the diagonals are valleys and the midlines are mountains — the reverse of the preliminary base.',
    op: seq(
      crease({ line: [[-1, -1], [1, 1]], move: [-0.5, 0.5] }),
      crease({ line: [[1, -1], [-1, 1]], move: [0.5, 0.5] }),
    ),
  },
  {
    title: 'Collapse',
    text: 'Pinch the midpoints of the left and right edges toward each other. The sheet folds down into a triangle with a closed point at the top and two flaps on each face.',
    op: collapse({
      O: [0, 0],
      spine: [0, 90, 180, 270],
      flatten: 0,
      annots: [
        { type: 'line', kind: 'mountain', a: [-1, 0], b: [1, 0] },
        { type: 'line', kind: 'mountain', a: [0, -1], b: [0, 1] },
        { type: 'pinch', a: [-1.15, 0], b: [1.15, 0] },
      ],
    }),
  },
];

/* ------------------------------------------------------------ bird base */

// Geometry of the preliminary base after `collapse` (closed point O at the origin, open end down).
export const PB = {
  O: [0, 0] as V2,
  B: [0, -R2] as V2,
  M1: [-R2 / 2, -R2 / 2] as V2,
  M2: [R2 / 2, -R2 / 2] as V2,
  P1: [1 - R2, 1 - R2] as V2, // where the kite crease meets the upper edge
  P2: [R2 - 1, 1 - R2] as V2,
};
const hY = 1 - R2;

const front2 = (probe: V2) => layersAt(probe, 2);
const nearCentre = paper((p) => Math.hypot(p[0], p[1]) < 0.5);

export const birdSteps = (side: 'front' | 'back'): StepDef[] => {
  const label = side === 'front' ? '' : ' (back)';
  return [
    {
      title: 'Kite folds' + label,
      text:
        side === 'front'
          ? 'Hold the base with the open end down. Fold the lower left and right edges of the front flaps in to the centre line, making a kite shape. Crease firmly.'
          : 'Fold the lower edges of the front flaps in to the centre line again.',
      op: fold(
        { line: [PB.B, PB.P1], move: [-0.6, -0.8], sel: front2([-0.45, -0.75]), lead: PB.M1 },
        { line: [PB.P2, PB.B], move: [0.6, -0.8], sel: front2([0.45, -0.75]), lead: PB.M2 },
      ),
    },
    {
      title: 'Top triangle down' + label,
      text: 'Fold the small triangle at the top down over the kite folds, along the line joining their top ends. Crease firmly.',
      op: fold({
        line: [PB.P1, PB.P2],
        move: [0, -0.15],
        sel: or(front2([-0.12, -0.25]), front2([0.12, -0.25])),
        lead: PB.O,
      }),
    },
    {
      title: 'Unfold' + label,
      text: 'Unfold the triangle and the two kite folds. You now have three reference creases on the front.',
      op: seq(
        fold({ line: [PB.P1, PB.P2], move: [0, -0.6], sel: and(nearCentre, at((c) => c[1] < hY)), lead: false, arrow: false }),
        fold(
          { line: [PB.B, PB.P1], move: [0.1, -0.8], sel: layersAt([-0.12, -0.85], 2), lead: false, arrow: false, dir: 'valley' },
          { line: [PB.P2, PB.B], move: [-0.1, -0.8], sel: layersAt([0.12, -0.85], 2), lead: false, arrow: false, dir: 'valley' },
        ),
      ),
    },
    {
      title: 'Petal fold' + label,
      text: 'Lift the bottom corner of the front layer and swing it up along the horizontal crease. The sides fold in to the centre line on their own; flatten the long point.',
      tip: 'Wiggle the flap open rather than pulling — thin kami tears at the top of the kite creases.',
      op: petal({
        P1: PB.P1,
        P2: PB.P2,
        B: PB.B,
        M1: PB.M1,
        M2: PB.M2,
        kite: and(rank(0), within([PB.P1, PB.B, PB.P2])),
        outerFront: and(rank(0), (i, s) => within([PB.P1, PB.M1, PB.B])(i, s) || within([PB.P2, PB.M2, PB.B])(i, s)),
        outerBack: and(rank(1), (i, s) => within([PB.P1, PB.M1, PB.B])(i, s) || within([PB.P2, PB.M2, PB.B])(i, s)),
      }),
    },
  ];
};

export const birdBaseSteps = (): StepDef[] => [
  ...birdSteps('front'),
  { title: 'Turn over', text: 'Turn the model over, keeping the open end at the bottom.', op: turnOver() },
  ...birdSteps('back'),
];

export type { FlatState };
