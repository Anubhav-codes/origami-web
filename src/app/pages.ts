import { tutorials, type TutorialMeta } from '../content/catalog';
import { FOLDS, GLOSSARY, GRADES, HISTORY, LEVELS, PAPER, PAPER_ADV, PLAN, RULES, SOURCES, SYMBOLS, TROUBLE, type Practice } from '../content/book';
import { NOTES } from '../content/notes';
import { esc, icon, prefersReducedMotion, store } from './dom';

type Thumbs = typeof import('../generated/thumbs');
let thumbsP: Promise<Thumbs> | null = null;
const thumbs = () => (thumbsP ??= import('../generated/thumbs'));

/** Fill every [data-thumb] / [data-cp] placeholder once the (separately chunked) pictures arrive. */
async function hydrate(root: HTMLElement) {
  const t = await thumbs();
  root.querySelectorAll<HTMLElement>('[data-thumb]').forEach((el) => {
    const svg = t.THUMBS[el.dataset.thumb!];
    if (svg) el.innerHTML = svg;
  });
  root.querySelectorAll<HTMLElement>('[data-cp]').forEach((el) => {
    const svg = t.CPS[el.dataset.cp!];
    if (svg)
      el.innerHTML = `<figure class="cp"><div class="cp-art">${svg}</div><figcaption>The crane, unfolded: every crease the simulation made, drawn on the flat sheet. Find the preliminary base (the X and +), the kite and petal creases, and the short reverse-fold creases near the corners.</figcaption></figure>`;
  });
}

const card = (t: TutorialMeta) => `
  <a class="tcard" href="#/fold/${t.id}">
    <span class="tcard-art" data-thumb="${t.id}"></span>
    <span class="tcard-meta"><span class="tcard-lesson">${esc(t.lesson)}</span>${t.drill ? '<span class="tcard-tag">technique</span>' : ''}</span>
    <span class="tcard-title">${esc(t.title)}</span>
    <span class="tcard-sum">${esc(t.summary)}</span>
    <span class="tcard-foot">${esc(t.grade)} · ${esc(t.time)}</span>
  </a>`;

const practiceTable = (rows: Practice[], withDesigner = false) => `
  <div class="table-wrap"><table class="practice"><thead><tr><th>Model</th>${withDesigner ? '<th>Designer</th>' : ''}<th>Grade</th><th>Time</th>${withDesigner ? '' : '<th>Trains</th>'}</tr></thead><tbody>
  ${rows
    .map(
      (r) => `<tr><td><a href="${r.url}" target="_blank" rel="noopener" class="ext">${esc(r.model)}</a></td>${withDesigner ? `<td>${esc(r.designer ?? '')}</td>` : ''}<td>${esc(r.grade)}</td><td class="nowrap">${esc(r.time)}</td>${withDesigner ? '' : `<td>${esc(r.trains)}</td>`}</tr>`,
    )
    .join('')}
  </tbody></table></div>`;

/* ------------------------------------------------------------------ home */

export async function homePage(root: HTMLElement) {
  document.title = 'Fold — The Complete Origami Textbook';
  const done = store.get<Record<string, boolean>>('checks', {});
  const levelProgress = (n: number) => {
    const total = LEVELS[n].check.length;
    const got = LEVELS[n].check.filter((_, i) => done[`${n}:${i}`]).length;
    return { got, total };
  };
  root.innerHTML = `
  <section class="hero wrap">
    <div class="hero-text">
      <p class="eyebrow">The Complete Origami Textbook</p>
      <h1>From the first fold<br/>to the master folder.</h1>
      <p class="lede">Eight levels, from choosing paper to reading crease patterns. Every lesson is an animated diagram you can play like a video, pause on any step, or scrub crease by crease — and every animation is simulated from the real geometry of the paper.</p>
      <div class="hero-cta">
        <a class="btn" href="#/level/0">Start at Level 0 ${icon('arrow')}</a>
        <a class="btn ghost" href="#/fold/crane">Fold a crane</a>
      </div>
    </div>
    <figure class="hero-stage">
      <div class="stage hero-mat" data-hero aria-label="A crane folding itself, from the bird base"></div>
      <figcaption><span data-hero-cap>Crane, from the bird base</span><a href="#/fold/crane">Open the lesson ${icon('arrow')}</a></figcaption>
    </figure>
  </section>

  <section class="wrap how">
    <div><h3>Diagrams that move</h3><p>Each step draws its fold line and arrow first, the way a printed diagram does, then the paper swings, lands and is pressed flat — with a fingertip showing where to hold.</p></div>
    <div><h3>Folded by geometry</h3><p>Nothing is hand-animated. Flaps rotate about their real creases, layers stack in the order paper allows, and a base collapses as a true 3D mechanism.</p></div>
    <div><h3>Checked, then corrected</h3><p>Simulating each lesson exposed a few steps that cannot be folded as originally written. They are fixed here, and <a href="#/notes">every change is listed</a>.</p></div>
  </section>

  <section class="wrap toc" aria-labelledby="toc-h">
    <div class="sec-head"><h2 id="toc-h">The eight levels</h2><p>Move up when the skill check feels easy, not before.</p></div>
    <ol class="levels">
      ${LEVELS.map((l) => {
        const p = levelProgress(l.n);
        return `<li><a href="#/level/${l.n}" class="level-row">
          <span class="lv-n">${l.n}</span>
          <span class="lv-main"><span class="lv-name">${esc(l.name)}</span><span class="lv-grade">${esc(l.grade)}</span><span class="lv-goal">${esc(l.goal)}</span></span>
          <span class="lv-cap"><span class="lv-cap-label">Capstone</span>${esc(l.capstone)}${p.got ? `<span class="lv-prog">${p.got}/${p.total} checks</span>` : ''}</span>
          <span class="lv-art" data-thumb="${l.hero}"></span>
        </a></li>`;
      }).join('')}
    </ol>
  </section>

  <section class="wrap rules">
    <div class="sec-head"><h2>Five rules for learning faster</h2></div>
    <ol>${RULES.map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join('')}</ol>
  </section>

  <section class="wrap" aria-labelledby="all-h">
    <div class="sec-head"><h2 id="all-h">Every animated lesson</h2><p>${tutorials.length} lessons and drills, in teaching order.</p></div>
    <div class="tgrid">${tutorials.map(card).join('')}</div>
  </section>`;
  hydrate(root);

  // live hero: the crane sequence from the bird base, looping, started when the browser is idle
  const host = root.querySelector<HTMLElement>('[data-hero]')!;
  let player: import('../engine/player').Player | null = null;
  let cancelled = false;
  let io: IntersectionObserver | null = null;
  const start = async () => {
    const [{ compile }, { Player }, crane] = await Promise.all([import('../engine/model'), import('../engine/player'), import('../models/crane')]);
    if (cancelled) return;
    const def = crane.default;
    const c = compile(def);
    const cap = root.querySelector<HTMLElement>('[data-hero-cap]');
    let last = -1;
    player = new Player(host, c, {
      loop: true,
      speed: 1.25,
      hold: 0.5,
      showFinger: true,
      onChange: (p) => {
        const s = p.step;
        if (s !== last && cap) {
          last = s;
          cap.textContent = `${s + 1}. ${def.steps[s].title}`;
        }
      },
    });
    if (prefersReducedMotion()) player.gotoEnd(def.steps.length - 1);
    else {
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? player?.play() : player?.pause()));
      io.observe(host);
    }
  };
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (idle) idle(() => void start());
  else setTimeout(() => void start(), 200);
  return () => {
    cancelled = true;
    io?.disconnect();
    player?.destroy();
  };
}

/* ---------------------------------------------------------------- levels */

export function levelsPage(root: HTMLElement) {
  document.title = 'Levels — Fold';
  root.innerHTML = `
  <section class="wrap page-head"><p class="eyebrow">Contents</p><h1>Eight levels</h1><p class="lede">Every level has a goal, lessons, a practice list and a skill check so you know when to move on. Lessons with step-by-step instructions are animated; designer models link to their original tutorials.</p></section>
  <section class="wrap">
    <div class="table-wrap"><table class="overview"><thead><tr><th>Level</th><th>Name</th><th>Grade</th><th>You will learn</th><th>Capstone</th></tr></thead><tbody>
    ${LEVELS.map((l) => `<tr><td class="ov-n"><a href="#/level/${l.n}">${l.n}</a></td><td><a href="#/level/${l.n}">${esc(l.name)}</a></td><td>${esc(l.grade)}</td><td>${esc(l.skills)}</td><td>${esc(l.capstone)}</td></tr>`).join('')}
    </tbody></table></div>
    <h2 class="mt">How each level is built</h2>
    <ol class="passes"><li><b>Goal</b> — what you can do at the end of the level.</li><li><b>Skills</b> — the folds and ideas introduced.</li><li><b>Lessons</b> — animated step-by-step projects, or a pointer to the designer’s own tutorial.</li><li><b>Practice list</b> — extra models with grade and folding time.</li><li><b>Skill check</b> — a short self-test, saved in this browser.</li></ol>
  </section>`;
}

export function levelPage(root: HTMLElement, arg: string) {
  const n = +arg;
  const l = LEVELS[n];
  if (!l) {
    root.innerHTML = '<section class="wrap"><h1>No such level</h1></section>';
    return;
  }
  document.title = `Level ${n}: ${l.name} — Fold`;
  const ts = tutorials.filter((t) => t.level === n);
  const done = store.get<Record<string, boolean>>('checks', {});
  root.innerHTML = `
  <article class="level">
    <header class="wrap level-head">
      <span class="level-num" aria-hidden="true">${n}</span>
      <div>
        <p class="eyebrow">Level ${n} · ${esc(l.grade)}</p>
        <h1>${esc(l.name)}</h1>
        <p class="lede"><b>Goal.</b> ${esc(l.goal)}</p>
        <p class="skills"><b>Skills.</b> ${esc(l.skills)}</p>
        ${l.intro ? `<p class="skills">${esc(l.intro)}</p>` : ''}
      </div>
    </header>
    ${ts.length ? `<section class="wrap"><div class="sec-head"><h2>Lessons</h2><p>Animated, step by step.</p></div><div class="tgrid">${ts.map(card).join('')}</div></section>` : ''}
    ${l.sections.length ? `<section class="wrap prose-cols">${l.sections.map((s) => `<div class="prose"><h2>${esc(s.title)}</h2>${s.html}</div>`).join('')}</section>` : ''}
    ${
      l.practice.length
        ? `<section class="wrap"><div class="sec-head"><h2>Practice list</h2><p>${esc(l.practiceNote ?? 'Models from origami.me, opening in a new tab.')}</p></div>${practiceTable(l.practice, n === 6)}</section>`
        : ''
    }
    ${l.practice2 ? `<section class="wrap"><div class="sec-head"><h2>${esc(l.practice2.title)}</h2><p>${esc(l.practice2.note ?? '')}</p></div>${practiceTable(l.practice2.rows, true)}</section>` : ''}
    <section class="wrap check" aria-labelledby="chk">
      <div class="sec-head"><h2 id="chk">Skill check</h2><p>Tick what you can do. Saved in this browser only.</p></div>
      <ul class="checklist">${l.check
        .map(
          (c, i) =>
            `<li><label><input type="checkbox" data-check="${n}:${i}" ${done[`${n}:${i}`] ? 'checked' : ''}><span class="box">${icon('check')}</span><span>${esc(c)}</span></label></li>`,
        )
        .join('')}</ul>
      <p class="check-status" data-check-status></p>
    </section>
    <nav class="wrap level-nav">
      ${n > 0 ? `<a href="#/level/${n - 1}"><span>Previous level</span>${n - 1}. ${esc(LEVELS[n - 1].name)}</a>` : '<span></span>'}
      ${n < 7 ? `<a class="next" href="#/level/${n + 1}"><span>Next level</span>${n + 1}. ${esc(LEVELS[n + 1].name)}</a>` : ''}
    </nav>
  </article>`;
  const status = root.querySelector<HTMLElement>('[data-check-status]')!;
  const upd = () => {
    const d = store.get<Record<string, boolean>>('checks', {});
    const got = l.check.filter((_, i) => d[`${n}:${i}`]).length;
    status.textContent = got === l.check.length ? `All ${got} done — ready for Level ${Math.min(7, n + 1)}.` : `${got} of ${l.check.length} done.`;
  };
  root.querySelectorAll<HTMLInputElement>('[data-check]').forEach((cb) =>
    cb.addEventListener('change', () => {
      const d = store.get<Record<string, boolean>>('checks', {});
      d[cb.dataset.check!] = cb.checked;
      store.set('checks', d);
      upd();
    }),
  );
  upd();
  hydrate(root);
}

/* ------------------------------------------------------- folds & symbols */

export function foldsPage(root: HTMLElement) {
  document.title = 'Folds and symbols — Fold';
  root.innerHTML = `
  <section class="wrap page-head"><p class="eyebrow">Level 0 · Reference</p><h1>Folds and symbols</h1><p class="lede">The Yoshizawa–Randlett notation, as drawn at the start of every animated step, and the vocabulary of folds — each linked to the step where you can watch it happen.</p></section>
  <section class="wrap">
    <div class="sec-head"><h2>Diagram symbols</h2><p>Shapes vary slightly between authors; check each diagram’s own key if it has one.</p></div>
    <div class="symbols">${SYMBOLS.map((s) => `<div class="sym"><svg viewBox="0 0 80 60" aria-hidden="true">${s.svg}</svg><div><b>${esc(s.name)}</b><span>${esc(s.meaning)}</span></div></div>`).join('')}</div>
  </section>
  <section class="wrap">
    <div class="sec-head"><h2>Fold vocabulary</h2><p>In the order you will meet them.</p></div>
    <ol class="vocab">${FOLDS.map(
      (f) => `<li>
        <div class="vocab-name"><b>${esc(f.name)}</b><span>Level ${f.level}</span></div>
        <p>${esc(f.does)}</p>
        ${f.demo ? `<a class="vocab-watch" href="#/fold/${f.demo.id}?step=${f.demo.step}">Watch it ${icon('arrow')}</a>` : `<span class="vocab-watch muted">${f.level === 6 ? '<a href="#/level/6">Read the method</a>' : '<a href="#/level/5">Read the method</a>'}</span>`}
      </li>`,
    ).join('')}</ol>
  </section>`;
}

/* ----------------------------------------------------------------- paper */

const rows4 = (rows: string[][]) => rows.map((r) => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="strong"' : ''}>${c}</td>`).join('')}</tr>`).join('');

export function paperPage(root: HTMLElement) {
  document.title = 'Paper and tools — Fold';
  root.innerHTML = `
  <section class="wrap page-head"><p class="eyebrow">Level 0 · 0.1–0.2</p><h1>Paper and tools</h1><p class="lede">Paper weight is measured in GSM — grams per square metre. Lower is thinner and easier to fold but tears more readily; higher is stronger but harder to crease sharply. Printer paper is 90–100 GSM, which is why it feels stiff for small models.</p></section>
  <section class="wrap">
    <div class="sec-head"><h2>Everyday papers</h2><p>Start with kami or foil; practise on kraft.</p></div>
    <div class="table-wrap"><table><thead><tr><th>Paper</th><th>Approx. GSM</th><th>Best for</th><th>Watch out for</th></tr></thead><tbody>${rows4(PAPER)}</tbody></table></div>
    <div class="sec-head"><h2>Papers for advanced models</h2><p>At Level 6 paper becomes part of the design. Order from specialist shops such as Origami-Shop.com or FoldingPaper.co.uk.</p></div>
    <div class="table-wrap"><table><thead><tr><th>Paper</th><th>Approx. GSM</th><th>Best for</th><th>Caution</th></tr></thead><tbody>${rows4(PAPER_ADV)}</tbody></table></div>
  </section>
  <section class="wrap prose-cols">
    <div class="prose"><h2>Sizes</h2><p>Most tutorials use a 15 × 15 cm (6 × 6 in) square. Very small models use 10 cm. Larger paper makes every model easier; for detailed Level 6 models use 20–30 cm. If a step feels cramped, double the size.</p><p>No square? <a href="#/fold/square-from-rect">Cut one from A4 or Letter</a>: 21 cm from A4, 8.5 in from Letter.</p></div>
    <div class="prose"><h2>Tools</h2><ul class="ticks"><li>A hard, flat, clean table.</li><li>A bone folder or the back of a spoon to sharpen creases.</li><li>A ruler and a very light pencil.</li><li>A paper trimmer, or a craft knife and cutting mat.</li><li>Tweezers or a toothpick for tiny tucks; paper clips to hold layers.</li></ul></div>
  </section>`;
}

/* ------------------------------------------------------------------ plan */

export function planPage(root: HTMLElement) {
  document.title = '12-week plan — Fold';
  const done = store.get<Record<string, boolean>>('weeks', {});
  root.innerHTML = `
  <section class="wrap page-head"><p class="eyebrow">Appendix D</p><h1>A 12-week study plan</h1><p class="lede">One focus a week, about twenty minutes a day. Tick weeks off as you go — progress is kept in this browser.</p><p class="plan-bar"><span data-plan-fill></span></p></section>
  <section class="wrap">
    <ol class="weeks">${PLAN.map(
      ([w, focus, fold, ids]) => `<li class="${done[w] ? 'is-done' : ''}">
        <label class="wk-check"><input type="checkbox" data-week="${w}" ${done[w] ? 'checked' : ''}><span class="box">${icon('check')}</span><span class="sr">Week ${w} done</span></label>
        <span class="wk-n">Week ${w}</span>
        <span class="wk-focus">${esc(focus)}</span>
        <span class="wk-fold">${esc(fold)}</span>
        <span class="wk-links">${ids.map((id) => {
          const t = tutorials.find((x) => x.id === id);
          return t ? `<a href="#/fold/${id}">${esc(t.title)}</a>` : '';
        }).join('')}</span>
      </li>`,
    ).join('')}</ol>
  </section>`;
  const fill = root.querySelector<HTMLElement>('[data-plan-fill]')!;
  const upd = () => {
    const d = store.get<Record<string, boolean>>('weeks', {});
    const n = PLAN.filter(([w]) => d[w]).length;
    fill.style.width = (n / PLAN.length) * 100 + '%';
    fill.textContent = n ? `${n} of 12 weeks` : '';
  };
  root.querySelectorAll<HTMLInputElement>('[data-week]').forEach((cb) =>
    cb.addEventListener('change', () => {
      const d = store.get<Record<string, boolean>>('weeks', {});
      d[cb.dataset.week!] = cb.checked;
      store.set('weeks', d);
      cb.closest('li')!.classList.toggle('is-done', cb.checked);
      upd();
    }),
  );
  upd();
}

/* -------------------------------------------------------------- appendix */

export function appendixPage(root: HTMLElement) {
  document.title = 'Reference — Fold';
  root.innerHTML = `
  <section class="wrap page-head"><p class="eyebrow">Appendices</p><h1>Reference</h1>
    <nav class="jump"><a href="#glossary" data-jump>Glossary</a><a href="#trouble" data-jump>Troubleshooting</a><a href="#grades" data-jump>Grades</a><a href="#history" data-jump>History</a><a href="#sources" data-jump>Sources</a></nav>
  </section>
  <section class="wrap" id="glossary"><div class="sec-head"><h2>Glossary</h2></div>
    <dl class="glossary">${GLOSSARY.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl></section>
  <section class="wrap" id="trouble"><div class="sec-head"><h2>Troubleshooting</h2></div>
    <div class="table-wrap"><table><thead><tr><th>Problem</th><th>Likely cause</th><th>Fix</th></tr></thead><tbody>${rows4(TROUBLE)}</tbody></table></div></section>
  <section class="wrap" id="grades"><div class="sec-head"><h2>What the grades mean</h2><p>The site also tags many models Beginner Level 1 to 4; this book’s Levels 1 to 4 follow those tags.</p></div>
    <div class="table-wrap"><table><thead><tr><th>Grade</th><th>Typical time</th><th>What to expect</th><th>Examples</th></tr></thead><tbody>${rows4(GRADES)}</tbody></table></div>
    <p class="muted">More models of one kind: the <a href="https://origami.me/categories/" target="_blank" rel="noopener" class="ext">category index</a> (animals, flowers, birds, boxes, hearts, stars, modular, dinosaurs, cranes, envelopes, seasonal…).</p></section>
  <section class="wrap" id="history"><div class="sec-head"><h2>A short history</h2></div>
    <ol class="timeline-h">${HISTORY.map(([a, b]) => `<li><span>${a}</span><p>${b}</p></li>`).join('')}</ol></section>
  <section class="wrap" id="sources"><div class="sec-head"><h2>Sources</h2><p>Original writing based on these pages. Where a tutorial belongs to a particular designer, follow the linked page for the designer’s own steps.</p></div>
    <ul class="sources">${SOURCES.map(([a, b]) => `<li><a href="${b}" target="_blank" rel="noopener" class="ext">${esc(a)}</a></li>`).join('')}</ul></section>`;
  root.querySelectorAll<HTMLAnchorElement>('[data-jump]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById(a.getAttribute('href')!.slice(1))?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }),
  );
}

/* ----------------------------------------------------------------- notes */

export function notesPage(root: HTMLElement) {
  document.title = 'Verification notes — Fold';
  const byModel = new Map<string, typeof NOTES>();
  for (const n of NOTES) byModel.set(n.id, [...(byModel.get(n.id) ?? []), n]);
  const counts = { correction: 0, clarification: 0, confirmed: 0 };
  NOTES.forEach((n) => counts[n.kind]++);
  root.innerHTML = `
  <section class="wrap page-head narrow"><p class="eyebrow">How the lessons were checked</p><h1>Verification notes</h1>
    <p class="lede">Every animated lesson is a simulation: flat pieces of paper are reflected across their crease lines, stacked in an order the paper allows, and moved through real 3D hinge motions. If a step cannot be folded as written, the simulation cannot produce it — so each lesson doubles as a check of the instructions.</p>
    <p class="note-sum"><span class="note-kind note-correction">${counts.correction} corrections</span> <span class="note-kind note-clarification">${counts.clarification} clarifications</span> <span class="note-kind note-confirmed">${counts.confirmed} confirmed</span></p>
  </section>
  <section class="wrap narrow">
    ${[...byModel.entries()]
      .map(([id, ns]) => {
        const t = tutorials.find((x) => x.id === id);
        return `<article class="note-block"><h2><a href="#/fold/${id}">${esc(t?.title ?? id)}</a> <span>Lesson ${esc(t?.lesson ?? '')}</span></h2>${ns
          .map(
            (n) => `<div class="note"><span class="note-kind note-${n.kind}">${n.kind}</span>${n.kind !== 'confirmed' ? `<p class="note-was">Textbook: “${esc(n.was)}”</p>` : ''}<p>${esc(n.now)}</p></div>`,
          )
          .join('')}</article>`;
      })
      .join('')}
    <article class="note-block"><h2>Not simulated</h2><p>The jumping frog, tulip, lily and the sink and frog-base methods are given as written guidance with links to their tutorials. The lily outline was corrected to start from a preliminary base (the textbook said waterbomb base; the traditional lily is folded from the frog base, which is built on the preliminary base). Designer models in the practice lists link to their creators’ own instructions.</p></article>
  </section>`;
}
