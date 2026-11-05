/**
 * Renders every step of a model (start / middle / end frames) into one HTML sheet and screenshots it.
 * Usage: npx tsx scripts/debug-model.ts <modelId> [outDir]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { compile } from '../src/engine/model';
import { frameBox, frameToSvg, unionBox } from '../src/engine/render';
import { models } from '../src/models/registry';

const id = process.argv[2];
const out = process.argv[3] ?? '/tmp/claude-0/-home-user-origami-web/65acb879-56ee-5b07-8cb6-a02e3da869c9/scratchpad';
const mids = (process.argv[4] ?? '0.5').split(',').map((m) => Number(m));
mkdirSync(out, { recursive: true });
const entry = models.find((m) => m.id === id);
if (!entry) throw new Error('unknown model ' + id);
const def = (await entry.load()).default;
const c = compile(def);
let html = `<html><body style="margin:0;background:#efe9dd;font:12px sans-serif"><div style="display:grid;grid-template-columns:repeat(${2 + mids.length},250px);gap:6px;padding:6px">`;
c.plans.forEach((p, i) => {
  const frames = [p.frame(0), ...mids.map((m) => p.frame(m)), p.frame(1)];
  let box = frameBox(frames[0], c.size);
  for (const f of frames) box = unionBox(box, frameBox(f, c.size));
  const px = box.w / 250;
  for (const [j, f] of frames.entries()) {
    const label = j === 0 ? `#${i + 1} ${def.steps[i].title} (start)` : j === frames.length - 1 ? 'end' : `t=${mids[j - 1]}`;
    html += `<div style="background:#faf6ee"><div style="padding:2px 4px">${label}</div>${frameToSvg(f, box, def.palette, c.size, px, j === 0)}</div>`;
  }
});
html += '</div></body></html>';
const file = `${out}/debug-${id}.html`;
writeFileSync(file, html);
const { createRequire } = await import('node:module');
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1100, height: 800 } });
await pg.goto('file://' + file);
await pg.screenshot({ path: `${out}/debug-${id}.png`, fullPage: true });
await b.close();
console.log('wrote', `${out}/debug-${id}.png`);
