import { compile } from '../engine/model';
import { Player } from '../engine/player';
import { byId, tutorials } from '../content/catalog';
import { notesFor } from '../content/notes';
import { models } from '../models/registry';
import { esc, icon, prefersReducedMotion, store } from './dom';

const SPEEDS = [0.5, 0.75, 1, 1.5, 2];

export async function tutorialPage(root: HTMLElement, id: string, query: URLSearchParams): Promise<() => void> {
  const meta = byId(id);
  const entry = models.find((m) => m.id === id);
  if (!meta || !entry) {
    root.innerHTML = `<section class="wrap narrow"><h1>Not found</h1><p>There is no tutorial called “${esc(id)}”. <a href="#/levels">See all levels.</a></p></section>`;
    return () => {};
  }
  document.title = `${meta.title} — Fold`;
  const levelTuts = tutorials.filter((t) => t.level === meta.level);
  const idx = tutorials.indexOf(meta);
  const nextT = tutorials[idx + 1];
  const prevT = tutorials[idx - 1];

  root.innerHTML = `
  <article class="tut">
    <header class="tut-head wrap">
      <p class="crumbs"><a href="#/levels">Levels</a><span>/</span><a href="#/level/${meta.level}">Level ${meta.level}</a><span>/</span>Lesson ${esc(meta.lesson)}</p>
      <h1>${esc(meta.title)}</h1>
      <p class="lede">${esc(meta.summary)}</p>
      <dl class="facts">
        <div><dt>Grade</dt><dd>${esc(meta.grade)}</dd></div>
        <div><dt>Time</dt><dd>${esc(meta.time)}</dd></div>
        <div><dt>Paper</dt><dd>${esc(meta.paper)}</dd></div>
        ${meta.source ? `<div><dt>Source</dt><dd><a href="${meta.source.url}" target="_blank" rel="noopener">${esc(meta.source.label)} ${icon('ext')}</a></dd></div>` : ''}
      </dl>
    </header>
    <div class="tut-grid wrap">
      <section class="stage-col" aria-label="Animated diagram">
        <div class="stage-card">
          <div class="stage" data-stage><div class="stage-loading">Folding…</div></div>
          <div class="stage-caption" aria-live="polite" data-caption></div>
          <div class="controls" data-controls hidden>
            <div class="timeline" data-timeline role="slider" tabindex="0" aria-label="Timeline" aria-valuemin="0" aria-valuemax="100">
              <div class="tl-steps" data-tlsteps></div>
              <div class="tl-fill" data-fill></div>
              <div class="tl-knob" data-knob></div>
              <div class="tl-tip" data-tip hidden></div>
            </div>
            <div class="ctl-row">
              <div class="ctl-group">
                <button class="ctl" data-act="prev" aria-label="Previous step" title="Previous step (←)">${icon('prev')}</button>
                <button class="ctl ctl-play" data-act="play" aria-label="Play" title="Play / pause (space)">${icon('play')}</button>
                <button class="ctl" data-act="next" aria-label="Next step" title="Next step (→)">${icon('next')}</button>
                <button class="ctl" data-act="replay" aria-label="Replay this step" title="Replay step (R)">${icon('replay')}</button>
              </div>
              <div class="ctl-group ctl-opts">
                <label class="switch" title="Stop at the end of every step"><input type="checkbox" data-opt="step"><span></span>Pause each step</label>
                <label class="switch" title="Show where to hold the paper"><input type="checkbox" data-opt="finger" checked><span></span>Finger</label>
                <button class="speed" data-act="speed" aria-label="Playback speed" title="Speed ([ and ])">1×</button>
              </div>
            </div>
          </div>
        </div>
        <p class="kbd-hint"><kbd>Space</kbd> play/pause · <kbd>←</kbd><kbd>→</kbd> steps · <kbd>R</kbd> replay · drag the timeline to scrub</p>
      </section>
      <section class="steps-col" aria-label="Instructions">
        <ol class="steps" data-steps></ol>
        <div data-notes></div>
        <nav class="tut-nav">
          ${prevT ? `<a href="#/fold/${prevT.id}" class="tut-nav-prev"><span>Previous</span>${esc(prevT.title)}</a>` : '<span></span>'}
          ${nextT ? `<a href="#/fold/${nextT.id}" class="tut-nav-next"><span>Next</span>${esc(nextT.title)}</a>` : ''}
        </nav>
        ${
          levelTuts.length > 1
            ? `<div class="also"><h2>Also in Level ${meta.level}</h2><ul>${levelTuts
                .filter((t) => t.id !== id)
                .map((t) => `<li><a href="#/fold/${t.id}">${esc(t.title)}</a> <span>${esc(t.lesson)}</span></li>`)
                .join('')}</ul></div>`
            : ''
        }
      </section>
    </div>
  </article>`;

  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const caption = root.querySelector<HTMLElement>('[data-caption]')!;
  const stepsEl = root.querySelector<HTMLOListElement>('[data-steps]')!;
  const controls = root.querySelector<HTMLElement>('[data-controls]')!;
  const timeline = root.querySelector<HTMLElement>('[data-timeline]')!;
  const tlSteps = root.querySelector<HTMLElement>('[data-tlsteps]')!;
  const fill = root.querySelector<HTMLElement>('[data-fill]')!;
  const knob = root.querySelector<HTMLElement>('[data-knob]')!;
  const tip = root.querySelector<HTMLElement>('[data-tip]')!;
  const notesEl = root.querySelector<HTMLElement>('[data-notes]')!;

  const def = (await entry.load()).default;
  // let the page paint before the (short) compile
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  const compiled = compile(def);
  stage.querySelector('.stage-loading')?.remove();

  stepsEl.innerHTML = def.steps
    .map(
      (s, i) => `<li data-i="${i}"><button class="step" data-goto="${i}" aria-label="Go to step ${i + 1}: ${esc(s.title)}">
        <span class="step-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="step-body"><span class="step-title">${esc(s.title)}</span><span class="step-text">${s.text}</span>${
          s.tip ? `<span class="step-tip"><b>Tip</b> ${s.tip}</span>` : ''
        }</span></button></li>`,
    )
    .join('');
  const notes = notesFor(id);
  if (notes.length)
    notesEl.innerHTML = `<aside class="verify"><h2>Checked against the geometry</h2><ul>${notes.map((n) => `<li>${n}</li>`).join('')}</ul><p><a href="#/notes">All verification notes</a></p></aside>`;

  const reduced = prefersReducedMotion();
  const savedStep = store.get<boolean>('stepMode', reduced);
  const startStep = Math.max(0, Math.min(def.steps.length - 1, (parseInt(query.get('step') ?? '1', 10) || 1) - 1));
  let lastStep = -1;
  let lastPlaying: boolean | null = null;
  const stepItems = Array.from(stepsEl.children) as HTMLElement[];
  const playBtn = root.querySelector<HTMLButtonElement>('[data-act="play"]')!;
  const speedBtn = root.querySelector<HTMLButtonElement>('[data-act="speed"]')!;
  const stepToggle = root.querySelector<HTMLInputElement>('[data-opt="step"]')!;
  const fingerToggle = root.querySelector<HTMLInputElement>('[data-opt="finger"]')!;
  stepToggle.checked = savedStep;
  fingerToggle.checked = store.get<boolean>('finger', true);

  const player: Player = new Player(stage, compiled, {
    stepMode: savedStep,
    showFinger: fingerToggle.checked,
    initialStep: startStep,
    speed: store.get<number>('speed', 1),
    onChange: (p) => sync(p),
  });
  speedBtn.textContent = `${player.speed}×`;

  // timeline segments
  tlSteps.innerHTML = def.steps
    .map((s, i) => `<span style="flex:${player.stepLength(i).toFixed(3)}" title="${esc(s.title)}"></span>`)
    .join('');
  controls.hidden = false;

  function sync(p: Player) {
    const { step } = p.locate();
    if (step !== lastStep) {
      lastStep = step;
      stepItems.forEach((el, i) => {
        el.classList.toggle('is-current', i === step);
        el.classList.toggle('is-done', i < step);
      });
      const s = def.steps[step];
      caption.innerHTML = `<span class="cap-n">Step ${step + 1} of ${def.steps.length}</span><span class="cap-t">${esc(s.title)}</span>`;
      const cur = stepItems[step];
      if (cur && document.activeElement?.closest('.steps') == null) {
        const r = cur.getBoundingClientRect();
        const col = stepsEl.getBoundingClientRect();
        if (window.matchMedia('(min-width: 960px)').matches) {
          if (r.top < 80 || r.bottom > window.innerHeight - 20) cur.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
        }
        void col;
      }
      const u = new URL(location.href);
      const hash = `#/fold/${id}?step=${step + 1}`;
      if (u.hash !== hash) history.replaceState(null, '', hash);
    }
    if (p.playing !== lastPlaying) {
      lastPlaying = p.playing;
      playBtn.innerHTML = icon(p.playing ? 'pause' : 'play');
      playBtn.setAttribute('aria-label', p.playing ? 'Pause' : 'Play');
      root.querySelector('.stage-card')?.classList.toggle('is-playing', p.playing);
    }
    updateTimeline();
  }

  let rafTl = 0;
  function updateTimeline() {
    const pct = (player.time / player.total) * 100;
    fill.style.width = pct + '%';
    knob.style.left = pct + '%';
    timeline.setAttribute('aria-valuenow', pct.toFixed(0));
    timeline.setAttribute('aria-valuetext', `Step ${player.step + 1} of ${def.steps.length}`);
    if (player.playing) {
      cancelAnimationFrame(rafTl);
      rafTl = requestAnimationFrame(updateTimeline);
    }
  }

  // controls
  root.querySelector('[data-controls]')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'play') player.toggle();
    else if (act === 'next') player.next();
    else if (act === 'prev') player.prev();
    else if (act === 'replay') player.replay();
    else if (act === 'speed') cycleSpeed(1);
  });
  function cycleSpeed(dir: number) {
    const i = SPEEDS.indexOf(player.speed);
    const n = SPEEDS[(i + dir + SPEEDS.length) % SPEEDS.length];
    player.setSpeed(n);
    speedBtn.textContent = `${n}×`;
    store.set('speed', n);
  }
  stepToggle.addEventListener('change', () => {
    player.setStepMode(stepToggle.checked);
    store.set('stepMode', stepToggle.checked);
  });
  fingerToggle.addEventListener('change', () => {
    player.showFinger = fingerToggle.checked;
    store.set('finger', fingerToggle.checked);
    player.draw();
  });
  stepsEl.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]');
    if (!b) return;
    player.goto(+b.dataset.goto!, true);
  });

  // scrubbing
  let scrubbing = false;
  let wasPlaying = false;
  const timeAt = (clientX: number) => {
    const r = timeline.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * player.total;
  };
  timeline.addEventListener('pointerdown', (e) => {
    scrubbing = true;
    wasPlaying = player.playing;
    player.pause();
    timeline.setPointerCapture(e.pointerId);
    player.seek(timeAt(e.clientX));
    timeline.classList.add('is-scrubbing');
  });
  timeline.addEventListener('pointermove', (e) => {
    const t = timeAt(e.clientX);
    const { step } = player.locate(Math.max(0, Math.min(player.total - 1e-6, t)));
    tip.hidden = false;
    tip.textContent = `${step + 1}. ${def.steps[step].title}`;
    const r = timeline.getBoundingClientRect();
    tip.style.left = Math.max(0, Math.min(r.width, e.clientX - r.left)) + 'px';
    if (scrubbing) player.seek(t);
  });
  const endScrub = () => {
    if (!scrubbing) return;
    scrubbing = false;
    timeline.classList.remove('is-scrubbing');
    if (wasPlaying) player.play();
  };
  timeline.addEventListener('pointerup', endScrub);
  timeline.addEventListener('pointercancel', endScrub);
  timeline.addEventListener('pointerleave', () => (tip.hidden = true));
  timeline.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') player.seek(player.time + 0.5);
    else if (e.key === 'ArrowLeft') player.seek(player.time - 0.5);
    else return;
    e.preventDefault();
    e.stopPropagation();
  });

  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' || e.key === 'k') {
      if ((e.target as HTMLElement).closest('button') && e.key === ' ') return;
      e.preventDefault();
      player.toggle();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      player.next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      player.prev();
    } else if (e.key === 'r' || e.key === 'R') player.replay();
    else if (e.key === ']') cycleSpeed(1);
    else if (e.key === '[') cycleSpeed(-1);
    else if (e.key === 'Home') player.goto(0);
    else if (e.key === 'End') player.gotoEnd(def.steps.length - 1);
  };
  window.addEventListener('keydown', onKey);

  // pause when the tab is hidden
  const onVis = () => {
    if (document.hidden) player.pause();
  };
  document.addEventListener('visibilitychange', onVis);

  sync(player);
  if (!reduced && query.get('autoplay') !== '0') player.play();

  return () => {
    window.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    cancelAnimationFrame(rafTl);
    player.destroy();
  };
}
