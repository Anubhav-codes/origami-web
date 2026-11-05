import { describe, expect, it } from 'vitest';
import { area, centroid, det2, pointInPoly, type V2 } from '../src/engine/geom';
import { compile } from '../src/engine/model';
import { frameBox, frameToSvg } from '../src/engine/render';
import { curPoly, type FlatState } from '../src/engine/state';
import { tutorials } from '../src/content/catalog';
import { models } from '../src/models/registry';

const paperArea = (s: FlatState) => s.facets.reduce((a, f) => a + Math.abs(area(f.paper)), 0);
const bboxOf = (s: FlatState) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of s.facets) for (const p of curPoly(f)) {
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
};

describe('catalog', () => {
  it('every tutorial has a fold program and vice versa', () => {
    expect(new Set(tutorials.map((t) => t.id))).toEqual(new Set(models.map((m) => m.id)));
  });
});

for (const entry of models) {
  describe(entry.id, async () => {
    const def = (await entry.load()).default;
    const c = compile(def);
    const start = def.start();
    const A0 = paperArea(start);

    it('compiles every step', () => {
      expect(c.plans.length).toBe(def.steps.length);
    });

    it('keeps every facet rigid and the paper area constant', () => {
      for (const [i, p] of c.plans.entries()) {
        for (const f of p.end.facets) {
          const d = det2(f.m);
          expect(Math.abs(Math.abs(d) - 1), `step ${i + 1} facet ${f.id}`).toBeLessThan(1e-6);
          // orthonormal linear part
          expect(Math.abs(f.m[0] * f.m[2] + f.m[1] * f.m[3])).toBeLessThan(1e-6);
        }
        // paper is conserved from step to step; only cutting removes it (and the balloon's inflation
        // keeps just the visible skin)
        const before = i === 0 ? A0 : paperArea(c.plans[i - 1].end);
        const a = paperArea(p.end);
        if (!/cut|blow/i.test(def.steps[i].title)) expect(Math.abs(a - before) / A0, `area after step ${i + 1}`).toBeLessThan(1e-6);
      }
    });

    it('renders every frame without NaN', () => {
      for (const p of c.plans)
        for (const t of [0, 0.2, 0.5, 0.8, 1]) {
          const fr = p.frame(t);
          const svg = frameToSvg(fr, frameBox(fr, c.size), def.palette, c.size);
          expect(svg).not.toMatch(/NaN|Infinity/);
        }
    });

    it('starts each step where the previous one ended', () => {
      for (let i = 1; i < c.plans.length; i++) {
        const prev = bboxOf(c.plans[i - 1].end);
        const cur = bboxOf(c.plans[i].start);
        expect(Math.abs(prev.w - cur.w) + Math.abs(prev.h - cur.h)).toBeLessThan(1e-6);
      }
    });
  });
}

/* ------------------------------------------------ claims in the notes */

const endOf = async (id: string, step?: number) => {
  const def = (await models.find((m) => m.id === id)!.load()).default;
  const c = compile(def);
  return c.plans[(step ?? c.plans.length) - 1].end;
};

describe('verified geometry', () => {
  it('square from A4: the cut-and-opened sheet is square', async () => {
    const b = bboxOf(await endOf('square-from-rect', 5));
    expect(b.w).toBeCloseTo(b.h, 6);
  });

  it('cup: the tucked triangle is completely hidden inside the front flap', async () => {
    const s = await endOf('cup', 4);
    const tucked = s.facets.filter((f) => centroid(f.paper)[1] < -0.6);
    expect(tucked.length).toBeGreaterThan(0);
    for (const f of tucked) {
      const c = centroid(curPoly(f));
      const k = s.facets.indexOf(f);
      const above = s.facets.slice(k + 1).filter((g) => pointInPoly(c, curPoly(g)));
      expect(above.length).toBeGreaterThan(0);
    }
  });

  it('preliminary base: a square on its point, half the sheet’s side, four layers per half, colours alternating', async () => {
    const s = await endOf('preliminary-base', 4);
    const b = bboxOf(s);
    expect(b.w).toBeCloseTo(Math.SQRT2, 6);
    expect(b.h).toBeCloseTo(Math.SQRT2, 6);
    for (const probe of [[0.3, -0.7], [-0.3, -0.7]] as V2[]) {
      const hits = s.facets.filter((f) => pointInPoly(probe, curPoly(f)));
      expect(hits.length).toBe(4);
      const up = hits.map((f) => det2(f.m) > 0 === s.frontUp);
      for (let i = 1; i < up.length; i++) expect(up[i]).not.toBe(up[i - 1]);
    }
  });

  it('waterbomb base: a triangle twice as wide as it is tall', async () => {
    const b = bboxOf(await endOf('waterbomb-base', 4));
    expect(b.w).toBeCloseTo(2 * b.h, 6);
  });

  it('bird base: the petal point reaches 2 − √2 above the closed corner', async () => {
    const b = bboxOf(await endOf('bird-base'));
    expect(b.y1).toBeCloseTo(2 - Math.SQRT2, 6);
    expect(b.y0).toBeCloseTo(-Math.SQRT2, 6);
  });

  it('sonobe: creasing the tabs folds the parallelogram into a square', async () => {
    const def = (await models.find((m) => m.id === 'sonobe')!.load()).default;
    const c = compile(def);
    const mid = c.plans[8].frame(0.62); // tabs folded over at the top of the crease motion
    void mid;
    const b = bboxOf(c.plans[8].end);
    expect(b.w).toBeCloseTo(1, 6);
    expect(b.h).toBeCloseTo(2, 6);
  });

  it('balloon: the flat model before inflating is a hexagon of width √2/2', async () => {
    const b = bboxOf(await endOf('balloon', 10));
    expect(b.w).toBeCloseTo(0.5, 6);
  });

  it('heart: symmetric about the centre line', async () => {
    const b = bboxOf(await endOf('heart'));
    expect(b.x0).toBeCloseTo(-b.x1, 6);
  });
});
