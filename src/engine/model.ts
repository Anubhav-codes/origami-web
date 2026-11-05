import type { Op, Plan } from './plan';
import type { Palette } from './render';
import type { FlatState } from './state';

export interface StepDef {
  /** short label used in the timeline */
  title: string;
  /** the instruction, plain text with optional <b>/<i> */
  text: string;
  /** optional tip / common mistake */
  tip?: string;
  op: Op;
}

export interface ModelDef {
  id: string;
  title: string;
  palette: Palette;
  start: () => FlatState;
  steps: StepDef[];
  /** seconds to hold at the end of each step during playback */
  hold?: number;
}

export interface Compiled {
  def: ModelDef;
  plans: Plan[];
  /** size of the unfolded sheet (for perspective & framing) */
  size: number;
}

export function compile(def: ModelDef): Compiled {
  let s = def.start();
  const plans: Plan[] = [];
  for (const st of def.steps) {
    const p = st.op.plan(s);
    plans.push(p);
    s = p.end;
  }
  const f0 = def.start();
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const f of f0.facets)
    for (const p of f.paper) {
      x0 = Math.min(x0, p[0]);
      x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    }
  return { def, plans, size: Math.max(x1 - x0, y1 - y0) };
}
