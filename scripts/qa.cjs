// Functional QA: visit every route, exercise the player, report console errors.
const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2] || 'http://127.0.0.1:5173/';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror ' + p.url() + ': ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + p.url() + ': ' + m.text()); });
  const routes = ['#/', '#/levels', ...[0,1,2,3,4,5,6,7].map((n) => `#/level/${n}`), '#/folds', '#/paper', '#/plan', '#/appendix', '#/notes'];
  for (const r of routes) { await p.goto(base + r); await p.waitForTimeout(400); }
  const ids = ['square-from-rect','warmup','cup','boat','fortune-teller','kite-base','preliminary-base','waterbomb-base','squash-fold','rabbit-ear','balloon','heart','bird-base','crane','reverse-folds','masu-box','sonobe','crimp-pleat'];
  for (const id of ids) {
    await p.goto(base + `#/fold/${id}?autoplay=0`);
    await p.waitForSelector('.fold-svg', { timeout: 5000 });
    const n = await p.locator('.steps li').count();
    // next twice, scrub to the end, check caption + url
    await p.click('[data-act=next]'); await p.waitForTimeout(150);
    await p.click('.steps li:last-child .step'); await p.waitForTimeout(100);
    await p.keyboard.press('End'); await p.waitForTimeout(100);
    const cap = await p.textContent('[data-caption]');
    const paths = await p.locator('.fold-svg path').count();
    const url = p.url();
    console.log(id.padEnd(18), 'steps', String(n).padStart(2), '| end caption:', cap.trim().slice(0, 40).padEnd(40), '| svg paths', paths, '|', url.split('#')[1]);
  }
  // scrubbing + step mode on the crane
  await p.goto(base + '#/fold/crane?autoplay=0');
  await p.waitForSelector('.fold-svg');
  const tl = await p.locator('[data-timeline]').boundingBox();
  await p.mouse.click(tl.x + tl.width * 0.5, tl.y + tl.height / 2);
  console.log('scrub 50% ->', (await p.textContent('[data-caption]')).trim());
  await p.click('label.switch:has([data-opt=step])');
  await p.click('[data-act=play]'); await p.waitForTimeout(6000);
  console.log('step mode playing?', await p.getAttribute('[data-act=play]', 'aria-label'), '|', (await p.textContent('[data-caption]')).trim());
  // a checkbox persists
  await p.goto(base + '#/level/1'); await p.waitForTimeout(300);
  await p.click('.checklist label >> nth=0'); await p.reload(); await p.waitForTimeout(400);
  console.log('skill check persisted:', await p.isChecked('[data-check="1:0"]'));
  console.log(errs.length ? errs.join('\n') : 'no console errors');
  await b.close();
})();
