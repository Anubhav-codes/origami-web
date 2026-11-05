import {
  type M3,
  type V2,
  type V3,
  I3,
  ap3,
  apply,
  compose,
  cross2,
  dist2,
  lineRange,
  mul3,
  norm2,
  paperEase,
  phase,
  reflect,
  rotAxis,
  rotLine,
  rotation,
  sideOf,
  sub2,
  translate3,
  smooth,
  easeInOut,
} from './geom';
import { type Annot, type Core, type Item, type Op, cUp, withIntro } from './plan';
import {
  type Facet,
  type FlatState,
  type Sel,
  all,
  bbox,
  clone,
  curPoly,
  info,
  splitFacet,
} from './state';

export type Place = 'top' | 'bottom' | { above: Sel } | { below: Sel };

export interface FoldSpec {
  /** fold line in current coordinates */
  line: [V2, V2];
  /** any point on the side of the line that moves */
  move: V2;
  /** facets allowed to move (default: every layer) */
  sel?: Sel;
  dir?: 'valley' | 'mountain';
  /** where the moved layers end up in the stack */
  place?: Place;
  /** finger position (current coords); false = none */
  lead?: V2 | false;
  /** arrow tweaks */
  arrow?: false | { bend?: number; from?: V2; to?: V2 };
  /** draw the fold line symbol (default true) */
  showLine?: boolean;
  /** extra diagram symbols */
  annots?: Annot[];
}

interface Group {
  spec: FoldSpec;
  ids: Set<number>;
  a: V2;
  b: V2;
  sign: number; // signed rotation direction
  lead: V2 | null;
  extent: [V2, V2];
}

/** Split the selected facets along each spec line and work out the moving groups. */
function prepare(s0: FlatState, specs: FoldSpec[]): { s: FlatState; groups: Group[] } {
  const s = clone(s0);
  const groups: Group[] = [];
  const movingAll = new Set<number>();
  for (const spec of specs) {
    const [a, b] = spec.line;
    const sel = spec.sel ?? all;
    const moveLeft = sideOf(spec.move, a, b) >= 0;
    const ids = new Set<number>();
    const touched: V2[][] = [];
    const out: Facet[] = [];
    s.facets.forEach((f, k) => {
      if (movingAll.has(f.id) || !sel(info(s, f, k), s)) {
        out.push(f);
        return;
      }
      touched.push(curPoly(f));
      const [L, R] = splitFacet(s, f, a, b);
      const mv = moveLeft ? L : R;
      const st = moveLeft ? R : L;
      if (st) out.push(st);
      if (mv) {
        out.push(mv);
        ids.add(mv.id);
      }
    });
    s.facets = out;
    ids.forEach((id) => movingAll.add(id));

    const u = norm2(sub2(b, a));
    const side = cross2(u, sub2(spec.move, a)) >= 0 ? 1 : -1;
    const sign = (spec.dir ?? 'valley') === 'valley' ? side : -side;

    // fold-line extent over the paper it crosses
    let lo = Infinity;
    let hi = -Infinity;
    for (const poly of touched) {
      const r = lineRange(poly, a, b);
      if (r) {
        lo = Math.min(lo, r[0]);
        hi = Math.max(hi, r[1]);
      }
    }
    if (!(lo < hi)) {
      lo = 0;
      hi = 1;
    }
    const pad = (hi - lo) * 0.06;
    const d = sub2(b, a);
    const extent: [V2, V2] = [
      [a[0] + d[0] * (lo - pad), a[1] + d[1] * (lo - pad)],
      [a[0] + d[0] * (hi + pad), a[1] + d[1] * (hi + pad)],
    ];

    // default finger: the moving vertex farthest from the line
    let lead: V2 | null = null;
    if (spec.lead !== false) {
      if (spec.lead) lead = spec.lead;
      else {
        let best = -1;
        for (const f of s.facets)
          if (ids.has(f.id))
            for (const p of curPoly(f)) {
              const dd = Math.abs(sideOf(p, a, b));
              if (dd > best + 1e-9) {
                best = dd;
                lead = p;
              }
            }
      }
    }
    groups.push({ spec, ids, a, b, sign, lead, extent });
  }
  return { s, groups };
}

function insertIndex(staticList: Facet[], place: Place, s: FlatState): number {
  if (place === 'top') return staticList.length;
  if (place === 'bottom') return 0;
  const idx = (f: Facet) => s.facets.indexOf(f);
  if ('above' in place) {
    let k = -1;
    staticList.forEach((f, i) => {
      if (place.above(info(s, f, idx(f)), s)) k = i;
    });
    return k + 1;
  }
  let k = staticList.length;
  for (let i = staticList.length - 1; i >= 0; i--) {
    const f = staticList[i];
    if (place.below(info(s, f, idx(f)), s)) k = i;
  }
  return k;
}

/** Draw/final order: statics with each moving group spliced in at its anchor. */
function orderWith(s: FlatState, groups: Group[], flipped: boolean[]): Facet[] {
  const moving = new Set<number>();
  groups.forEach((g) => g.ids.forEach((id) => moving.add(id)));
  const statics = s.facets.filter((f) => !moving.has(f.id));
  const inserts = groups.map((g, gi) => {
    const place = g.spec.place ?? ((g.spec.dir ?? 'valley') === 'valley' ? 'top' : 'bottom');
    const list = s.facets.filter((f) => g.ids.has(f.id));
    return { at: insertIndex(statics, place, s), list: flipped[gi] ? list.reverse() : list, gi };
  });
  const out: Facet[] = [];
  for (let i = 0; i <= statics.length; i++) {
    for (const ins of inserts) if (ins.at === i) out.push(...ins.list);
    if (i < statics.length) out.push(statics[i]);
  }
  return out;
}

function foldAnnots(groups: Group[], kind: 'fold' | 'crease'): Annot[] {
  const out: Annot[] = [];
  for (const g of groups) {
    if (g.spec.annots) out.push(...g.spec.annots);
    const dir = g.spec.dir ?? 'valley';
    if (g.spec.showLine !== false) out.push({ type: 'line', kind: dir, a: g.extent[0], b: g.extent[1] });
    if (g.spec.arrow !== false && g.lead) {
      const from = (g.spec.arrow && g.spec.arrow.from) || g.lead;
      const to = (g.spec.arrow && g.spec.arrow.to) || apply(reflect(g.a, g.b), from);
      if (dist2(from, to) > 1e-6)
        out.push({
          type: 'arrow',
          kind: kind === 'crease' ? 'foldunfold' : dir,
          from,
          to,
          bend: (g.spec.arrow && g.spec.arrow.bend) ?? 0.32,
        });
    }
  }
  return out;
}

/**
 * Fold (one or more simultaneous) flaps by 180° about lines.
 * Valley folds swing toward the viewer and land on top; mountain folds swing away and land underneath.
 */
export function fold(...specs: FoldSpec[]): Op {
  return {
    plan(s0) {
      const { s, groups } = prepare(s0, specs);
      const endOrder = orderWith(s, groups, groups.map(() => true));
      const end: FlatState = { ...s, facets: [] };
      const reflected = new Map<number, Facet>();
      for (const g of groups) {
        const R = reflect(g.a, g.b);
        for (const f of s.facets) if (g.ids.has(f.id)) reflected.set(f.id, { ...f, m: compose(R, f.m) });
      }
      end.facets = endOrder.map((f) => reflected.get(f.id) ?? f);
      const order0 = orderWith(s, groups, groups.map(() => false));
      const order1 = endOrder;
      const core: Core = {
        start: s,
        end,
        motion: 1.45,
        annots: foldAnnots(groups, 'fold'),
        frame(t) {
          const e = paperEase(t);
          const theta = Math.PI * e;
          const Ts = groups.map((g) => rotLine(g.a, g.b, g.sign * theta));
          const which = new Map<number, number>();
          groups.forEach((g, gi) => g.ids.forEach((id) => which.set(id, gi)));
          const order = theta > Math.PI / 2 ? order1 : order0;
          const items: Item[] = order.map((f) => {
            const gi = which.get(f.id);
            return { f, T: gi === undefined ? I3 : Ts[gi], cUp: cUp(s, f) };
          });
          const g0 = groups.find((g) => g.lead);
          const lead = g0 && g0.lead && t > 0 && t < 1 ? ap3(Ts[groups.indexOf(g0)], [g0.lead[0], g0.lead[1], 0]) : null;
          return { items, sort: 'stack', lead };
        },
      };
      return withIntro(core);
    },
  };
}

/** Fold and unfold to leave a crease (the flap swings all the way over, is pressed, and opens again). */
export function crease(...specs: FoldSpec[]): Op {
  return {
    plan(s0) {
      const { s, groups } = prepare(s0, specs);
      const order0 = orderWith(s, groups, groups.map(() => false));
      const order1 = orderWith(s, groups, groups.map(() => true));
      const which = new Map<number, number>();
      groups.forEach((g, gi) => g.ids.forEach((id) => which.set(id, gi)));
      const core: Core = {
        start: s,
        end: s,
        motion: 2.1,
        annots: foldAnnots(groups, 'crease'),
        frame(t) {
          const e = paperEase(phase(t, 0, 0.47)) - easeInOut(phase(t, 0.58, 1));
          const theta = Math.PI * e;
          const Ts = groups.map((g) => rotLine(g.a, g.b, g.sign * theta));
          const order = theta > Math.PI / 2 ? order1 : order0;
          const items: Item[] = order.map((f) => {
            const gi = which.get(f.id);
            return { f, T: gi === undefined ? I3 : Ts[gi], cUp: cUp(s, f) };
          });
          const g0 = groups.find((g) => g.lead);
          const lead = g0 && g0.lead && t > 0 && t < 1 ? ap3(Ts[groups.indexOf(g0)], [g0.lead[0], g0.lead[1], 0]) : null;
          return { items, sort: 'stack', lead };
        },
      };
      return withIntro(core, 0.7);
    },
  };
}

/** Pre-split facets along lines without moving them (e.g. creases made "by eye" in an earlier step). */
export function split(lines: [V2, V2][], sel: Sel = all, soft = false) {
  return (s0: FlatState): FlatState => {
    const s = clone(s0);
    for (const [a, b] of lines) {
      const out: Facet[] = [];
      s.facets.forEach((f, k) => {
        if (!sel(info(s, f, k), s)) return void out.push(f);
        const [L, R] = splitFacet(s, f, a, b, soft);
        if (L) out.push(L);
        if (R) out.push(R);
      });
      s.facets = out;
    }
    return s;
  };
}

/** Apply a pure state transform (no motion) as an op – used for invisible bookkeeping. */
export function silent(fn: (s: FlatState) => FlatState): Op {
  return {
    plan(s0) {
      const s = fn(s0);
      return {
        start: s,
        end: s,
        duration: 0.001,
        frame: () => ({ items: s.facets.map((f) => ({ f, T: I3, cUp: cUp(s, f) })), sort: 'stack', annots: [] }),
      };
    },
  };
}

function centre(s: FlatState): V2 {
  const [x0, y0, x1, y1] = bbox(s);
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}

/** Turn the model over like a page (about a vertical axis by default). */
export function turnOver(opts: { vertical?: boolean; about?: V2 } = {}): Op {
  const vertical = opts.vertical ?? true;
  return {
    plan(s) {
      const c = opts.about ?? centre(s);
      const [x0, y0, x1, y1] = bbox(s);
      const size = Math.max(x1 - x0, y1 - y0);
      const a: V2 = c;
      const b: V2 = vertical ? [c[0], c[1] + 1] : [c[0] + 1, c[1]];
      const R = reflect(a, b);
      const end: FlatState = { ...s, facets: s.facets.map((f) => ({ ...f, m: compose(R, f.m) })).reverse() };
      const rev = s.facets.slice().reverse();
      const core: Core = {
        start: s,
        end,
        motion: 1.5,
        annots: [{ type: 'turn', vertical }],
        frame(t) {
          const e = easeInOut(t);
          const lift = Math.sin(Math.PI * e) * size * 0.12;
          const T = mul3(translate3([0, 0, lift]), rotAxis([c[0], c[1], 0], vertical ? [0, 1, 0] : [1, 0, 0], Math.PI * e));
          const order = e > 0.5 ? rev : s.facets;
          return { items: order.map((f) => ({ f, T, cUp: cUp(s, f) })), sort: 'stack', lead: null };
        },
      };
      return withIntro(core, 0.6);
    },
  };
}

/** Rotate the model flat on the table. Positive = counter-clockwise. */
export function rotate(angleDeg: number, about?: V2): Op {
  const ang = (angleDeg * Math.PI) / 180;
  return {
    plan(s) {
      const c = about ?? centre(s);
      const R = rotation(c, ang);
      const end: FlatState = { ...s, facets: s.facets.map((f) => ({ ...f, m: compose(R, f.m) })) };
      const core: Core = {
        start: s,
        end,
        motion: 1.1,
        annots: [{ type: 'rotate', angle: angleDeg }],
        frame(t) {
          const T = rotAxis([c[0], c[1], 0], [0, 0, 1], ang * easeInOut(t));
          return { items: s.facets.map((f) => ({ f, T, cUp: cUp(s, f) })), sort: 'stack', lead: null };
        },
      };
      return withIntro(core, 0.5);
    },
  };
}

/** Cut through every layer along a line and slide the removed piece away. */
export function cut(line: [V2, V2], remove: V2): Op {
  return {
    plan(s0) {
      const s = clone(s0);
      const [a, b] = line;
      const removeLeft = sideOf(remove, a, b) >= 0;
      const gone = new Set<number>();
      const out: Facet[] = [];
      let lo = Infinity;
      let hi = -Infinity;
      for (const f of s.facets) {
        const r = lineRange(curPoly(f), a, b);
        if (r) {
          lo = Math.min(lo, r[0]);
          hi = Math.max(hi, r[1]);
        }
        const [L, R] = splitFacet(s, f, a, b);
        const rm = removeLeft ? L : R;
        const keep = removeLeft ? R : L;
        if (keep) out.push(keep);
        if (rm) {
          out.push(rm);
          gone.add(rm.id);
        }
      }
      s.facets = out;
      const end: FlatState = { ...s, facets: out.filter((f) => !gone.has(f.id)) };
      const d = sub2(b, a);
      const ext: [V2, V2] = [
        [a[0] + d[0] * (lo - 0.08), a[1] + d[1] * (lo - 0.08)],
        [a[0] + d[0] * (hi + 0.08), a[1] + d[1] * (hi + 0.08)],
      ];
      const nrm = norm2([-d[1], d[0]]);
      const away = removeLeft ? 1 : -1;
      const core: Core = {
        start: s,
        end,
        motion: 1.6,
        annots: [{ type: 'line', kind: 'cut', a: ext[0], b: ext[1] }],
        frame(t) {
          const e = smooth(phase(t, 0.15, 1));
          const T: M3 = translate3([nrm[0] * away * e * 0.6, nrm[1] * away * e * 0.6, 0]);
          const items: Item[] = s.facets.map((f) =>
            gone.has(f.id) ? { f, T, cUp: cUp(s, f), alpha: 1 - e } : { f, T: I3, cUp: cUp(s, f) },
          );
          // scissors travel along the line during the first part
          const sp = phase(t, 0, 0.45);
          const lead: V3 | null = t > 0 && t < 0.5 ? [ext[0][0] + (ext[1][0] - ext[0][0]) * sp, ext[0][1] + (ext[1][1] - ext[0][1]) * sp, 0] : null;
          return { items, sort: 'stack', lead };
        },
      };
      return withIntro(core, 0.6);
    },
  };
}

export interface ReverseSpec {
  line: [V2, V2];
  /** a point on the side that moves (the tip) */
  move: V2;
  /** every facet of the flap being reversed (both halves) */
  flap: Sel;
  /** the two halves of the flap, on either side of its spine */
  halfA: Sel;
  halfB: Sel;
  kind: 'inside' | 'outside';
  lead?: V2;
}

/**
 * Reverse fold: both halves of a flap fold about the same line in opposite directions. Inside: the tip goes in
 * between its own halves (spine inverted); outside: it wraps around them.
 */
export function reverseFold(r: ReverseSpec): Op {
  return {
    plan(s) {
      let maxA = -1;
      let maxB = -1;
      s.facets.forEach((f, k) => {
        const i = info(s, f, k);
        if (!r.flap(i, s)) return;
        if (r.halfA(i, s)) maxA = Math.max(maxA, k);
        if (r.halfB(i, s)) maxB = Math.max(maxB, k);
      });
      const [front, back] = maxA >= maxB ? [r.halfA, r.halfB] : [r.halfB, r.halfA];
      const fSel: Sel = (i, st) => r.flap(i, st) && front(i, st);
      const bSel: Sel = (i, st) => r.flap(i, st) && back(i, st);
      const mid: V2 = [(r.line[0][0] + r.line[1][0]) / 2, (r.line[0][1] + r.line[1][1]) / 2];
      const pushDir = sub2(mid, r.move);
      if (r.kind === 'inside')
        return fold(
          { line: r.line, move: r.move, sel: fSel, dir: 'mountain', place: { below: fSel }, lead: r.lead, annots: [{ type: 'push', at: r.lead ?? r.move, dir: pushDir }] },
          { line: r.line, move: r.move, sel: bSel, dir: 'valley', place: { above: bSel }, lead: false, arrow: false, showLine: false },
        ).plan(s);
      return fold(
        { line: r.line, move: r.move, sel: fSel, dir: 'valley', place: 'top', lead: r.lead },
        { line: r.line, move: r.move, sel: bSel, dir: 'mountain', place: 'bottom', lead: false, arrow: false, showLine: false },
      ).plan(s);
    },
  };
}

export { all };
