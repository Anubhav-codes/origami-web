import {
  type Aff,
  type V2,
  I2,
  apply,
  centroid,
  det2,
  invert,
  pointInPoly,
  sideOf,
  splitPoly,
} from './geom';

/**
 * A facet is a convex piece of the sheet that never bends. `paper` is its outline in the
 * coordinates of the unfolded sheet; `m` places it in the current flat-folded model.
 * Facets are immutable: operations replace them.
 */
export interface Facet {
  id: number;
  paper: V2[];
  m: Aff;
  /** per-edge flag; true = smooth edge that is not drawn (used for subdivision) */
  soft?: boolean[];
}

/** A flat-folded model: facets ordered from the bottom layer to the top layer. */
export interface FlatState {
  facets: Facet[];
  nextId: number;
  /** whether the coloured side faces the viewer for facets whose `m` is orientation-preserving */
  frontUp: boolean;
}

export function sheet(poly: V2[], colouredUp: boolean): FlatState {
  return { facets: [{ id: 1, paper: poly, m: I2 }], nextId: 2, frontUp: colouredUp };
}

export const square = (half = 1): V2[] => [
  [-half, -half],
  [half, -half],
  [half, half],
  [-half, half],
];

export const rect = (w: number, h: number): V2[] => [
  [-w / 2, -h / 2],
  [w / 2, -h / 2],
  [w / 2, h / 2],
  [-w / 2, h / 2],
];

export const curPoly = (f: Facet): V2[] => f.paper.map((p) => apply(f.m, p));

/** Is the coloured side of this facet facing the viewer (in the flat state)? */
export const colouredUp = (s: FlatState, f: Facet) => det2(f.m) > 0 === s.frontUp;

export function clone(s: FlatState): FlatState {
  return { facets: s.facets.slice(), nextId: s.nextId, frontUp: s.frontUp };
}

export function bbox(s: FlatState): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const f of s.facets)
    for (const p of curPoly(f)) {
      if (p[0] < x0) x0 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[0] > x1) x1 = p[0];
      if (p[1] > y1) y1 = p[1];
    }
  return [x0, y0, x1, y1];
}

/**
 * Split facet f by the current-space line a→b. Returns [leftPiece, rightPiece] (either may be null).
 * The pieces get fresh ids from `s.nextId` (mutates s.nextId only).
 */
export function splitFacet(s: FlatState, f: Facet, a: V2, b: V2, cutSoft = false): [Facet | null, Facet | null] {
  const mi = invert(f.m);
  const pa = apply(mi, a);
  const pb = apply(mi, b);
  const r = splitPoly(f.paper, f.soft, pa, pb, cutSoft);
  if (!r.left || !r.right) {
    // not crossed: classify whole facet
    const c = centroid(curPoly(f));
    return sideOf(c, a, b) >= 0 ? [f, null] : [null, f];
  }
  const mk = (paper: V2[], soft: boolean[] | null): Facet => {
    const nf: Facet = { id: s.nextId++, paper, m: f.m };
    if (soft && soft.some(Boolean)) nf.soft = soft;
    return nf;
  };
  const p1 = mk(r.left, r.leftSoft);
  const p2 = mk(r.right, r.rightSoft);
  // r.left is left in *paper* space; map to current-space sides
  const c1 = centroid(curPoly(p1));
  return sideOf(c1, a, b) >= 0 ? [p1, p2] : [p2, p1];
}

/** Lightweight view of a facet used by selectors. */
export interface FInfo {
  f: Facet;
  index: number;
  cur: V2[];
  /** centroid in current coordinates */
  c: V2;
  /** centroid in paper coordinates */
  pc: V2;
}

export function info(_s: FlatState, f: Facet, index: number): FInfo {
  const cur = curPoly(f);
  return { f, index, cur, c: centroid(cur), pc: centroid(f.paper) };
}

/** Facet selector. */
export type Sel = (i: FInfo, s: FlatState) => boolean;

export const all: Sel = () => true;
export const none: Sel = () => false;
export const and = (...xs: Sel[]): Sel => (i, s) => xs.every((x) => x(i, s));
export const or = (...xs: Sel[]): Sel => (i, s) => xs.some((x) => x(i, s));
export const not = (x: Sel): Sel => (i, s) => !x(i, s);
/** Select by where the facet came from on the unfolded sheet. */
export const paper = (fn: (p: V2) => boolean): Sel => (i) => fn(i.pc);
export const paperIn = (poly: V2[]): Sel => (i) => pointInPoly(i.pc, poly);
/** Select by where the facet currently is. */
export const at = (fn: (p: V2) => boolean): Sel => (i) => fn(i.c);
export const within = (poly: V2[]): Sel => (i) => pointInPoly(i.c, poly);
/** Facets that currently show their coloured / white side. */
export const showing = (coloured: boolean): Sel => (i, st) => colouredUp(st, i.f) === coloured;

/**
 * The n top-most facets covering the probe point (current coordinates).
 * `skip` ignores that many top layers first.
 */
export function layersAt(probe: V2, n = 1, skip = 0): Sel {
  let cacheState: FlatState | null = null;
  let ids = new Set<number>();
  return (i, s) => {
    if (cacheState !== s) {
      cacheState = s;
      const hits: number[] = [];
      for (let k = s.facets.length - 1; k >= 0; k--) {
        if (pointInPoly(probe, curPoly(s.facets[k]))) hits.push(s.facets[k].id);
      }
      ids = new Set(hits.slice(skip, skip + n));
    }
    return ids.has(i.f.id);
  };
}

/** Every facet stacked above (or below) the k-th layer at a probe point. */
export function aboveLayerAt(probe: V2, kFromTop: number): Sel {
  let cacheState: FlatState | null = null;
  let minIndex = Infinity;
  return (i, s) => {
    if (cacheState !== s) {
      cacheState = s;
      let count = 0;
      minIndex = Infinity;
      for (let k = s.facets.length - 1; k >= 0; k--) {
        if (pointInPoly(probe, curPoly(s.facets[k]))) {
          if (count === kFromTop) {
            minIndex = k;
            break;
          }
          count++;
        }
      }
    }
    return i.index > minIndex;
  };
}

export function select(s: FlatState, sel: Sel): Facet[] {
  return s.facets.filter((f, k) => sel(info(s, f, k), s));
}

/**
 * k-th layer from the top at the facet's own centroid (0 = the facet is on top there).
 * Useful for "the front layer" / "the layer under it" without naming facets.
 */
export function rank(k: number): Sel {
  let cacheState: FlatState | null = null;
  let polys: V2[][] = [];
  return (i, s) => {
    if (cacheState !== s) {
      cacheState = s;
      polys = s.facets.map(curPoly);
    }
    let above = 0;
    for (let j = i.index + 1; j < polys.length; j++) if (pointInPoly(i.c, polys[j])) above++;
    return above === k;
  };
}

/** Facets that are covered by at most `k` layers at their centroid (the top k+1 layers). */
export function rankAtMost(k: number): Sel {
  let cacheState: FlatState | null = null;
  let polys: V2[][] = [];
  return (i, s) => {
    if (cacheState !== s) {
      cacheState = s;
      polys = s.facets.map(curPoly);
    }
    let above = 0;
    for (let j = i.index + 1; j < polys.length; j++) if (pointInPoly(i.c, polys[j])) above++;
    return above <= k;
  };
}

/**
 * Facets from the same quarter of the unfolded sheet (split by the paper's midlines) as the top (or bottom)
 * facet under a probe point. Handy for "the front wing", "the left leg" after the model has been turned.
 */
export function quadrantAt(probe: V2, fromTop = true): Sel {
  let cacheState: FlatState | null = null;
  let q: [number, number] = [0, 0];
  return (i, s) => {
    if (cacheState !== s) {
      cacheState = s;
      const hits = s.facets.filter((f) => pointInPoly(probe, curPoly(f)));
      const f = fromTop ? hits[hits.length - 1] : hits[0];
      const c = f ? centroid(f.paper) : ([0, 0] as V2);
      q = [Math.sign(c[0]), Math.sign(c[1])];
    }
    return Math.sign(i.pc[0]) === q[0] && Math.sign(i.pc[1]) === q[1];
  };
}

/** The half of a paper quarter next to the horizontal (x) midline, or next to the vertical one. */
export const nearXMidline: Sel = (i) => Math.abs(i.pc[0]) >= Math.abs(i.pc[1]);
export const nearYMidline: Sel = (i) => Math.abs(i.pc[0]) < Math.abs(i.pc[1]);
