/** List the layers at probe points after step N: npx tsx scripts/probe.ts <model> <stepIndex(1-based end)> x,y [x,y...] */
import { compile } from '../src/engine/model';
import { curPoly, colouredUp } from '../src/engine/state';
import { centroid, pointInPoly, type V2 } from '../src/engine/geom';
import { models } from '../src/models/registry';
const [id, stepStr, ...pts] = process.argv.slice(2);
const def = (await models.find((m) => m.id === id)!.load()).default;
const c = compile(def);
const s = c.plans[+stepStr - 1].end;
for (const ps of pts) {
  const p = ps.split(',').map(Number) as V2;
  console.log(`probe ${ps}:`);
  for (let k = s.facets.length - 1, r = 0; k >= 0; k--) {
    const f = s.facets[k];
    if (pointInPoly(p, curPoly(f))) {
      const pc = centroid(f.paper).map((v) => v.toFixed(2)).join(',');
      const cc = centroid(curPoly(f)).map((v) => v.toFixed(2)).join(',');
      console.log(`  r${r++} id${f.id} idx${k} paper(${pc}) cur(${cc}) ${colouredUp(s, f) ? 'C' : 'w'} n${f.paper.length}`);
    }
  }
}
