// Usage: node scripts/shot.cjs <url> <out.png> [width] [height] [waitMs] [actions-json]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = '1280', h = '900', wait = '1500', actions = '[]'] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  for (const a of JSON.parse(actions)) {
    if (a.click) await p.click(a.click);
    if (a.key) await p.keyboard.press(a.key);
    if (a.wait) await p.waitForTimeout(a.wait);
    if (a.eval) await p.evaluate(a.eval);
  }
  await p.waitForTimeout(+wait);
  await p.screenshot({ path: out, fullPage: false });
  if (errs.length) console.log(errs.join('\n'));
  await b.close();
})();
