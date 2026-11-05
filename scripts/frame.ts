/** Render a single frame big: npx tsx scripts/frame.ts <model> <step(1-based)> <t> [out] */
import { writeFileSync } from 'node:fs';
import { compile } from '../src/engine/model';
import { frameBox, frameToSvg } from '../src/engine/render';
import { models } from '../src/models/registry';
const [id, st, tt, out = '/tmp/claude-0/-home-user-origami-web/65acb879-56ee-5b07-8cb6-a02e3da869c9/scratchpad/frame'] = process.argv.slice(2);
const def = (await models.find((m) => m.id === id)!.load()).default;
const c = compile(def);
const fr = c.plans[+st - 1].frame(+tt);
const box = frameBox(fr, c.size);
writeFileSync(out + '.html', `<body style="margin:0;background:#e9e2d4">${frameToSvg(fr, box, def.palette, c.size, box.w / 700, true).replace('<svg ', '<svg width="700" height="700" ')}</body>`);
const { createRequire } = await import('node:module');
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 700, height: 700 } });
await p.goto('file://' + out + '.html');
await p.screenshot({ path: out + '.png' });
await b.close();
