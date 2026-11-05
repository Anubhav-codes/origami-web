import { type M3, type V2, type V3, I3, clamp, easeOut, phase } from './geom';
import type { Facet, FlatState } from './state';

/** Diagram symbols, drawn in the coordinates of the start state of a step. */
export type Annot =
  | { type: 'line'; kind: 'valley' | 'mountain' | 'crease' | 'cut'; a: V2; b: V2 }
  | { type: 'arrow'; kind: 'valley' | 'mountain' | 'unfold' | 'foldunfold'; from: V2; to: V2; bend: number }
  | { type: 'push'; at: V2; dir: V2 }
  | { type: 'turn'; vertical: boolean }
  | { type: 'rotate'; angle: number }
  | { type: 'repeat'; at: V2 }
  | { type: 'inflate'; at: V2 }
  | { type: 'pinch'; a: V2; b: V2 };

export interface Item {
  f: Facet;
  /** rigid placement of the facet's current-flat coordinates in 3D */
  T: M3;
  /** coloured side faces +z in the flat state */
  cUp: boolean;
  alpha?: number;
  /** optional per-vertex 3D override (skinned/inflated surfaces) */
  pts?: V3[];
}

export interface Frame {
  items: Item[];
  /** draw order: 'stack' = as given; 'depth' = painter's sort after the camera */
  sort: 'stack' | 'depth';
  annots: { a: Annot; alpha: number; draw: number }[];
  lead?: V3 | null;
  /** extra camera rotation (about the model's centre) */
  camera?: M3;
}

export interface Plan {
  start: FlatState;
  end: FlatState;
  /** seconds */
  duration: number;
  frame(t: number): Frame;
}

export interface Op {
  plan(s: FlatState): Plan;
}

export function staticFrame(s: FlatState): Frame {
  return {
    items: s.facets.map((f) => ({ f, T: I3, cUp: cUp(s, f) })),
    sort: 'stack',
    annots: [],
  };
}

export const cUp = (s: FlatState, f: Facet) => (f.m[0] * f.m[3] - f.m[1] * f.m[2] > 0) === s.frontUp;

export interface Core {
  start: FlatState;
  end: FlatState;
  motion: number;
  annots: Annot[];
  frame(t: number): Omit<Frame, 'annots'>;
}

/**
 * Turns a motion into a diagram step: the symbols draw in first (as in a printed diagram), then the paper
 * moves while the symbols fade out.
 */
export function withIntro(core: Core, intro = 0.75): Plan {
  const total = intro + core.motion;
  const k = intro / total;
  return {
    start: core.start,
    end: core.end,
    duration: total,
    frame(t: number): Frame {
      t = clamp(t);
      if (t < k || core.motion === 0) {
        const d = core.motion === 0 ? clamp(t * 1.4) : easeOut(t / k);
        return { ...core.frame(0), annots: core.annots.map((a) => ({ a, alpha: 1, draw: d })) };
      }
      const u = (t - k) / (1 - k);
      const fade = 1 - phase(u, 0.35, 0.8);
      return { ...core.frame(u), annots: core.annots.map((a) => ({ a, alpha: fade, draw: 1 })) };
    },
  };
}

/** Several operations performed one after another within a single instruction step. */
export function seq(...ops: Op[]): Op {
  return {
    plan(s0) {
      const plans: Plan[] = [];
      let s = s0;
      for (const op of ops) {
        const p = op.plan(s);
        plans.push(p);
        s = p.end;
      }
      const gap = 0.25;
      const total = plans.reduce((a, p) => a + p.duration, 0) + gap * (plans.length - 1);
      return {
        start: plans[0].start,
        end: s,
        duration: total,
        frame(t) {
          let time = clamp(t) * total;
          for (let i = 0; i < plans.length; i++) {
            const p = plans[i];
            if (time <= p.duration || i === plans.length - 1) return p.frame(Math.min(1, time / p.duration));
            time -= p.duration;
            if (time < gap) return p.frame(1);
            time -= gap;
          }
          return plans[plans.length - 1].frame(1);
        },
      };
    },
  };
}

/** A step without movement (e.g. "check your base"), optionally showing symbols. */
export function hold(annots: Annot[] = [], seconds = 1.2): Op {
  return {
    plan(s) {
      return withIntro(
        {
          start: s,
          end: s,
          motion: 0,
          annots,
          frame: () => ({ items: staticFrame(s).items, sort: 'stack' }),
        },
        seconds,
      );
    },
  };
}

/** Run ops without animation and return the folded state (start drills from a finished base). */
export function prefold(s: import('./state').FlatState, ops: Op[]): import('./state').FlatState {
  for (const op of ops) s = op.plan(s).end;
  return s;
}

/** Transform the state before planning an op (e.g. pre-split along creases made earlier). */
export function prep(fn: (s: import('./state').FlatState) => import('./state').FlatState, op: Op): Op {
  return { plan: (s) => op.plan(fn(s)) };
}
