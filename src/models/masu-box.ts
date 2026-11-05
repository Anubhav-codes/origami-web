import { type M3, type V2, easeInOut, mul3, phase, rotAxis, rotLine, smooth, translate3 } from '../engine/geom';
import { rig } from '../engine/mechanisms';
import type { ModelDef } from '../engine/model';
import { crease, fold, rotate } from '../engine/ops';
import { seq } from '../engine/plan';
import { and, at, rank, sheet, square, within } from '../engine/state';
import { P } from './palettes';

// After the blintz and a 45° turn the model is a square of half-side W; the floor is the middle square of
// half-side a; the walls are a tall; the unfolded end flaps reach 2W.
const W = Math.SQRT1_2;
const a = W / 2;
const D = Math.PI / 180;
const e = (t: number, s: number, f: number) => easeInOut(phase(t, s, f));
const TIP = -1;

const R = (p: V2, q: V2, deg: number): M3 => rotLine(p, q, deg * D);
/** Rotate about p→q so that `side` lifts toward +z for positive degrees. */
const L = (p: V2, q: V2, side: V2, deg: number): M3 => {
  const sg = Math.sign((q[0] - p[0]) * (side[1] - p[1]) - (q[1] - p[1]) * (side[0] - p[0])) || 1;
  return R(p, q, sg * deg);
};
const wallsUp = (t: number) => e(t, 0, 0.3) * 90;
const endsUp = (t: number) => e(t, 0.25, 0.55) * 90;
const gusset = (t: number) => e(t, 0.3, 0.6) * 180;
const flapIn = (t: number) => e(t, 0.6, 0.85) * 180;
const tipIn = (t: number) => e(t, 0.75, 1) * 90;

// walls rise toward the viewer (the inside of the box faces us)
const leftWall = (t: number) => L([-a, -1], [-a, 1], [-0.6, 0], wallsUp(t));
const rightWall = (t: number) => L([a, 1], [a, -1], [0.6, 0], wallsUp(t));
const topEnd = (t: number) => L([1, a], [-1, a], [0, 0.6], endsUp(t));
const botEnd = (t: number) => L([-1, -a], [1, -a], [0, -0.6], endsUp(t));

/** End-wall groups for one end (s = +1 top, −1 bottom). */
function endGroups(s: 1 | -1) {
  const end = s > 0 ? topEnd : botEnd;
  const yb = s * a; // floor edge
  const yt = s * W; // top of the end wall
  const yf = s * (2 * W - a); // crease across the flap: wall height → floor
  const inEnd = (c: V2) => s * c[1] > a;
  const corner = (c: V2, sx: number) => sx * c[0] > a && s * c[1] > a && s * c[1] <= W + 1e-9;
  const groups = [] as { sel: (i: { c: V2 }) => boolean; T: (t: number) => M3 }[];
  // tucked layers sit a hair inside the wall so depth sorting never sees them as coplanar
  const inset = (d: number, f: (t: number) => M3) => (t: number) => mul3(translate3([0, -s * d * endsUp(t) / 90, 0]), f(t));
  for (const sx of [-1, 1] as const) {
    const xl = sx * a;
    // T2: the half of the corner square on the end-wall side of the diagonal turns inside against the end wall
    const t2 = (c: V2) => corner(c, sx) && Math.abs(c[0]) < Math.abs(c[1]);
    const t1 = (c: V2) => corner(c, sx) && Math.abs(c[0]) >= Math.abs(c[1]);
    const T2 = (t: number) => mul3(end(t), L([xl, s * 2], [xl, -s * 2], [sx * 0.6, s * 0.62], gusset(t)));
    // T1 folds onto T2 along the diagonal, so the pair forms one gusset
    const diagA: V2 = [xl, yb];
    const diagB: V2 = [sx * W, yt];
    const T1 = (t: number) => mul3(T2(t), L(diagA, diagB, [sx * 0.62, s * 0.45], gusset(t)));
    groups.push({ sel: (i) => t2(i.c), T: inset(0.01, T2) }, { sel: (i) => t1(i.c), T: inset(0.015, T1) });
  }
  // the end flap folds over the wall's top edge into the box, and its point lies on the floor
  const flap = (t: number) => mul3(end(t), L([1, yt], [-1, yt], [0, s * 1.0], flapIn(t)));
  const tip = (t: number) => mul3(flap(t), L([1, yf], [-1, yf], [0, s * 1.3], TIP * tipIn(t)));
  groups.push({ sel: (i) => s * i.c[1] > 2 * W - a, T: (t) => mul3(translate3([0, 0, 0.012 * tipIn(t) / 90]), tip(t)) });
  // the flap's two corner pieces are attached to the gussets, so they fold in with them
  for (const sx of [-1, 1] as const) {
    const side = (t: number) => mul3(flap(t), L([sx * a, s * 2], [sx * a, -s * 2], [sx * 0.62, s * 0.8], gusset(t)));
    groups.push({ sel: (i) => s * i.c[1] > W && sx * i.c[0] > a, T: inset(0.02, side) });
  }
  groups.push({ sel: (i) => s * i.c[1] > W, T: inset(0.025, flap) });
  groups.push({ sel: (i) => inEnd(i.c) && Math.abs(i.c[0]) <= a + 1e-9, T: end });
  return groups;
}

const def: ModelDef = {
  id: 'masu-box',
  title: 'Masu box',
  palette: P.indigo,
  start: () => sheet(square(1), false),
  steps: [
    {
      title: 'Midlines',
      text: 'White side up. Crease both midlines and unfold.',
      op: seq(crease({ line: [[-1, 0], [1, 0]], move: [0, -0.5] }), crease({ line: [[0, -1], [0, 1]], move: [-0.5, 0] })),
    },
    {
      title: 'Corners to the centre',
      text: 'Fold each of the four corners to the centre. You have a smaller square.',
      op: fold(
        { line: [[1, 0], [0, 1]], move: [0.9, 0.9] },
        { line: [[0, 1], [-1, 0]], move: [-0.9, 0.9] },
        { line: [[-1, 0], [0, -1]], move: [-0.9, -0.9] },
        { line: [[0, -1], [1, 0]], move: [0.9, -0.9] },
      ),
    },
    { title: 'Turn 45°', text: 'Rotate the model 45° so it is square to you.', op: rotate(45, [0, 0]) },
    {
      title: 'Top and bottom to the centre',
      text: 'Fold the top edge to the centre and unfold; fold the bottom edge to the centre and unfold.',
      op: crease({ line: [[-1, a], [1, a]], move: [0, 0.6] }, { line: [[1, -a], [-1, -a]], move: [0, -0.6] }),
    },
    {
      title: 'Open two flaps',
      text: 'Unfold the top and bottom corner flaps completely.',
      op: fold(
        { line: [[W, W], [-W, W]], move: [0, 0.3], sel: and(rank(0), within([[-W, W], [W, W], [0, 0]])), lead: [0, 0.02] },
        { line: [[-W, -W], [W, -W]], move: [0, -0.3], sel: and(rank(0), within([[W, -W], [-W, -W], [0, 0]])), lead: [0, -0.02] },
      ),
    },
    {
      title: 'Sides to the centre',
      text: 'Fold the left and right edges to the centre and unfold each.',
      op: crease({ line: [[-a, 1.6], [-a, -1.6]], move: [-0.55, 0] }, { line: [[a, -1.6], [a, 1.6]], move: [0.55, 0] }),
    },
    {
      title: 'Raise and lock',
      text: 'Raise the left and right sides to stand upright. Push the top corners inward so they fold into the box along the diagonal creases, fold the loose top flap down into the box over them and crease its edge. Do the same at the bottom.',
      tip: 'Crease the flap edges firmly so the walls lock. If a flap will not stay down, a dab of glue fixes it. For a lid, fold a second box with the corners stopping about 2 mm short of the centre in step 2.',
      op: rig({
        groups: [
          ...endGroups(1),
          ...endGroups(-1),
          { sel: at((c) => c[0] < -a), T: leftWall },
          { sel: at((c) => c[0] > a), T: rightWall },
        ] as never,
        camera: (t) => mul3(rotAxis([0, 0, 0], [1, 0, 0], -smooth(phase(t, 0, 0.6)) * 52 * D), rotAxis([0, 0, 0], [0, 0, 1], (smooth(phase(t, 0.05, 1)) * 28 + Math.max(0, t - 0.85) * 40) * D)),
        motion: 6,
      }),
    },
  ],
};
export default def;
