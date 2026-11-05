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
  private boxes: Box[] = [];
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
    // framing: each step's box covers its whole motion
    for (const p of model.plans) {
      let b = frameBox(p.frame(0), model.size);
      for (const u of [0.25, 0.5, 0.75, 1]) b = unionBox(b, frameBox(p.frame(u), model.size));
      this.boxes.push(square(b));
    }
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

  /** Frame at an arbitrary time (used by the renderer and for previews). */
  frameAt(time: number): { frame: Frame; box: Box } {
    const { step, motion } = this.locate(time);
    const plan = this.model.plans[step];
    const frame = plan.frame(motion);
    const prev = this.boxes[Math.max(0, step - 1)];
    const cur = this.boxes[step];
    const k = step === 0 ? 1 : smooth(clamp(motion / 0.35));
    return { frame, box: lerpBox(prev, cur, k) };
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
