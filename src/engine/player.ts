import { clamp, smooth } from './geom';
import { type Compiled } from './model';
import type { Frame } from './plan';
import { type Box, SvgRenderer, frameBox, lerpBox, unionBox } from './render';

export interface PlayerOptions {
  /** start playing immediately */
  autoplay?: boolean;
  /** stop at the end of every step (step-by-step mode) */
  stepMode?: boolean;
  loop?: boolean;
  showFinger?: boolean;
  /** called whenever the current step or play state changes */
  onChange?: (p: Player) => void;
  /** seconds held at the end of each step while playing */
  hold?: number;
  speed?: number;
  initialStep?: number;
}

/**
 * Timeline over a compiled model. Global time runs through every step; each step is
 * [motion (plan.duration)] followed by [hold]. Rendering happens only when time changes.
 */
export class Player {
  readonly model: Compiled;
  readonly renderer: SvgRenderer;
  private host: HTMLElement;
  private starts: number[] = [];
  private lengths: number[] = [];
  readonly total: number;
  /** per step: boxes covering consecutive time segments, so the view follows the paper */
  private boxes: Box[][] = [];
  time = 0;
  playing = false;
  speed = 1;
  stepMode: boolean;
  loop: boolean;
  showFinger: boolean;
  private hold: number;
  private raf = 0;
  private last = 0;
  private px = 0.01;
  private ro?: ResizeObserver;
  private stopAt: number | null = null;
  private opts: PlayerOptions;

  constructor(host: HTMLElement, model: Compiled, opts: PlayerOptions = {}) {
    this.host = host;
    this.model = model;
    this.opts = opts;
    this.stepMode = opts.stepMode ?? false;
    this.loop = opts.loop ?? false;
    this.showFinger = opts.showFinger ?? true;
    this.hold = opts.hold ?? model.def.hold ?? 0.9;
    this.speed = opts.speed ?? 1;
    this.renderer = new SvgRenderer(host, model.def.title);
    let t = 0;
    for (const p of model.plans) {
      this.starts.push(t);
      const len = p.duration + this.hold;
      this.lengths.push(len);
      t += len;
    }
    this.total = t;
    // framing is computed lazily per step (see boxAt)
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => {
        this.draw();
      });
      this.ro.observe(host);
    }
    if (opts.initialStep) this.time = this.starts[Math.min(opts.initialStep, this.starts.length - 1)];
    this.draw();
    if (opts.autoplay) this.play();
  }

  get stepCount() {
    return this.model.plans.length;
  }

  /** Current step index and local progress. */
  locate(time = this.time): { step: number; local: number; motion: number } {
    let i = this.starts.length - 1;
    while (i > 0 && this.starts[i] > time + 1e-9) i--;
    const local = time - this.starts[i];
    const dur = this.model.plans[i].duration;
    return { step: i, local, motion: clamp(local / dur) };
  }

  get step() {
    return this.locate().step;
  }

  stepStart(i: number) {
    return this.starts[i];
  }
  stepLength(i: number) {
    return this.lengths[i];
  }

  play() {
    if (this.playing) return;
    if (this.time >= this.total - 1e-6) this.time = 0;
    this.playing = true;
    if (this.stepMode) {
      const { step } = this.locate();
      const end = this.starts[step] + this.lengths[step] - this.hold * 0.25;
      this.stopAt = this.time >= end - 1e-3 && step < this.stepCount - 1 ? this.starts[step + 1] + this.lengths[step + 1] - this.hold * 0.25 : end;
    } else this.stopAt = null;
    this.last = performance.now();
    this.tick();
    this.emit();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.emit();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  /** Jump to the start of step i (shows the step's diagram symbols). */
  goto(i: number, play = false) {
    i = Math.max(0, Math.min(this.stepCount - 1, i));
    if (this.playing) this.pause();
    this.time = this.starts[i];
    this.draw();
    if (play) {
      this.pause();
      this.play();
    } else this.emit();
  }

  /** Show the finished state of step i. */
  gotoEnd(i: number) {
    i = Math.max(0, Math.min(this.stepCount - 1, i));
    if (this.playing) this.pause();
    this.time = this.starts[i] + this.model.plans[i].duration;
    this.draw();
    this.emit();
  }

  /** Perform exactly one step: finish the current one, or fold the next. */
  next() {
    const { step, local } = this.locate();
    const done = local >= this.model.plans[step].duration - 1e-3;
    const target = done ? step + 1 : step;
    if (target >= this.stepCount) return;
    this.pause();
    if (done) this.time = this.starts[target];
    this.playing = true;
    this.stopAt = this.starts[target] + this.model.plans[target].duration + this.hold * 0.15;
    this.last = performance.now();
    this.tick();
    this.emit();
  }

  /** Back to the start of this step, or of the previous one if already there. */
  prev() {
    const { step, local } = this.locate();
    this.pause();
    if (local > 0.3) this.goto(step);
    else this.goto(step - 1);
  }

  replay() {
    this.goto(this.step, true);
  }

  seek(time: number) {
    this.time = clamp(time, 0, this.total);
    if (this.playing) {
      // keep playing from the new position; in step mode stop at the end of that step
      const { step } = this.locate();
      this.stopAt = this.stepMode ? this.starts[step] + this.lengths[step] - this.hold * 0.25 : null;
    }
    this.draw();
    this.emit();
  }

  setSpeed(s: number) {
    this.speed = s;
    this.emit();
  }

  setStepMode(on: boolean) {
    this.stepMode = on;
    if (this.playing) {
      this.pause();
      this.play();
    }
    this.emit();
  }

  destroy() {
    this.pause();
    this.ro?.disconnect();
    this.renderer.svg.remove();
  }

  private emit() {
    this.opts.onChange?.(this);
  }

  private tick = () => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const before = this.locate().step;
    this.time += dt * this.speed;
    if (this.stopAt !== null && this.time >= this.stopAt) {
      this.time = this.stopAt;
      this.draw();
      this.playing = false;
      this.emit();
      return;
    }
    if (this.time >= this.total) {
      if (this.loop) this.time = 0;
      else {
        this.time = this.total;
        this.draw();
        this.playing = false;
        this.emit();
        return;
      }
    }
    this.draw();
    if (this.locate().step !== before) this.emit();
    this.raf = requestAnimationFrame(this.tick);
  };

  private static SEG = 8;

  private stepBoxes(i: number): Box[] {
    let b = this.boxes[i];
    if (!b) {
      const plan = this.model.plans[i];
      const n = Player.SEG;
      const raw = Array.from({ length: n + 1 }, (_, j) => frameBox(plan.frame(j / n), this.model.size));
      // segment j covers samples j and j+1 (and its neighbours, for safety)
      b = raw.slice(0, n).map((_, j) => square(unionBox(unionBox(raw[j], raw[j + 1]), raw[Math.min(n, j + 2)])));
      this.boxes[i] = b;
    }
    return b;
  }

  private boxAt(step: number, motion: number): Box {
    const segs = this.stepBoxes(step);
    const x = motion * segs.length;
    const j = Math.min(segs.length - 1, Math.floor(x));
    const f = smooth(clamp(x - j));
    const a = segs[j];
    const b = segs[Math.min(segs.length - 1, j + 1)];
    let box = lerpBox(a, b, f);
    // blend in from the previous step's final framing at the start of a step
    if (step > 0 && motion < 0.2) {
      const prev = this.stepBoxes(step - 1);
      box = lerpBox(prev[prev.length - 1], box, smooth(motion / 0.2));
    }
    return box;
  }

  /** Frame at an arbitrary time (used by the renderer and for previews). */
  frameAt(time: number): { frame: Frame; box: Box } {
    const { step, motion } = this.locate(time);
    const frame = this.model.plans[step].frame(motion);
    return { frame, box: this.boxAt(step, motion) };
  }

  draw() {
    const w = this.host.clientWidth || 600;
    const h = this.host.clientHeight || 600;
    const { frame, box } = this.frameAt(this.time);
    const fitted = fit(box, w / h);
    this.px = fitted.w / w;
    this.renderer.render({
      frame,
      box: fitted,
      px: this.px,
      palette: this.model.def.palette,
      size: this.model.size,
      showFinger: this.showFinger,
    });
  }
}

function square(b: Box): Box {
  const s = Math.max(b.w, b.h);
  return { x: b.x - (s - b.w) / 2, y: b.y - (s - b.h) / 2, w: s, h: s };
}

/** Expand a box to the host aspect ratio (so px is exact). */
function fit(b: Box, aspect: number): Box {
  if (b.w / b.h > aspect) {
    const h = b.w / aspect;
    return { x: b.x, y: b.y - (h - b.h) / 2, w: b.w, h };
  }
  const w = b.h * aspect;
  return { x: b.x - (w - b.w) / 2, y: b.y, w, h: b.h };
}
