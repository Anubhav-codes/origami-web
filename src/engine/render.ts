import { type M3, type V2, type V3, ap3, dir3, mul3, rotAxis, translate3 } from './geom';
import type { Frame } from './plan';
import { curPoly } from './state';

export interface Palette {
  /** coloured side */
  front: string;
  /** white side */
  back: string;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ------------------------------------------------------------ colours */

const hexCache = new Map<string, [number, number, number]>();
function rgb(hex: string): [number, number, number] {
  let c = hexCache.get(hex);
  if (!c) {
    const h = hex.replace('#', '');
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    hexCache.set(hex, c);
  }
  return c;
}
const shadeHex = (hex: string, k: number, toward?: [number, number, number], mix = 0) => {
  const [r, g, b] = rgb(hex);
  const m = (v: number, i: number) => {
    let x = v * k;
    if (toward) x = x * (1 - mix) + toward[i] * mix;
    return Math.max(0, Math.min(255, Math.round(x)));
  };
  return `rgb(${m(r, 0)},${m(g, 1)},${m(b, 2)})`;
};

// light from the upper left, slightly in front
const L: V3 = (() => {
  const v: V3 = [-0.42, 0.55, 1];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
const FLAT = L[2];

/* ---------------------------------------------------------- the scene */

export interface Drawable {
  id: number;
  d: string;
  fill: string;
  stroke: string;
  /** path of hard edges when the facet has soft (hidden) edges */
  edges?: string;
  alpha: number;
  lifted: boolean;
}

export interface Scene {
  list: Drawable[];
  shadow: string;
  tableShadow: string;
  lead: V2 | null;
}

const f2 = (n: number) => (Math.round(n * 1000) / 1000).toString();

export interface ViewOpts {
  centre: V2;
  /** model size used for perspective distance */
  size: number;
  palette: Palette;
}

/** Project a frame to 2D drawing commands (screen y points down, units = model units). */
export function scene(frame: Frame, opts: ViewOpts): Scene {
  const { centre, size, palette } = opts;
  const D = size * 5.5;
  const cam: M3 | undefined = frame.camera
    ? mul3(translate3([centre[0], centre[1], 0]), mul3(frame.camera, translate3([-centre[0], -centre[1], 0])))
    : undefined;
  const proj = (p: V3): [number, number, number] => {
    const q = cam ? ap3(cam, p) : p;
    const k = D / (D - q[2]);
    return [centre[0] + (q[0] - centre[0]) * k, -(centre[1] + (q[1] - centre[1]) * k), q[2]];
  };

  type Rec = Drawable & { z: number; pts3: V3[] };
  const recs: Rec[] = [];
  for (const it of frame.items) {
    const flat = curPoly(it.f);
    const pts3: V3[] = it.pts ?? flat.map((p) => ap3(it.T, [p[0], p[1], 0]));
    const pr = pts3.map(proj);
    let n = dir3(it.T, [0, 0, 1]);
    if (cam) n = dir3(cam, n);
    const facing = n[2] >= 0;
    const coloured = facing === it.cUp;
    const nv: V3 = facing ? n : [-n[0], -n[1], -n[2]];
    const lam = nv[0] * L[0] + nv[1] * L[1] + nv[2] * L[2];
    const k = Math.max(0.74, 1 + 0.34 * (lam - FLAT));
    const base = coloured ? palette.front : palette.back;
    const fill = shadeHex(base, Math.min(1.08, k));
    const stroke = coloured ? shadeHex(base, 0.62 * Math.min(1.05, k)) : shadeHex(base, 0.7 * Math.min(1.05, k), [120, 104, 84], 0.35);
    let d = '';
    for (let i = 0; i < pr.length; i++) d += (i ? 'L' : 'M') + f2(pr[i][0]) + ' ' + f2(pr[i][1]);
    d += 'Z';
    let edges: string | undefined;
    if (it.f.soft) {
      edges = '';
      for (let i = 0; i < pr.length; i++) {
        if (it.f.soft[i]) continue;
        const a = pr[i];
        const b = pr[(i + 1) % pr.length];
        edges += 'M' + f2(a[0]) + ' ' + f2(a[1]) + 'L' + f2(b[0]) + ' ' + f2(b[1]);
      }
    }
    let zmax = -Infinity;
    let zsum = 0;
    for (const p of pts3) {
      if (p[2] > zmax) zmax = p[2];
    }
    for (const p of pr) zsum += p[2];
    recs.push({
      id: it.f.id,
      d,
      fill,
      stroke,
      edges,
      alpha: it.alpha ?? 1,
      lifted: zmax > size * 0.004,
      z: zsum / pr.length,
      pts3,
    });
  }
  if (frame.sort === 'depth') recs.sort((a, b) => a.z - b.z);

  // soft shadow cast by lifted paper onto the table / paper below
  let shadow = '';
  if (!cam) {
    for (const r of recs) {
      if (!r.lifted || r.alpha < 0.5) continue;
      const pts = r.pts3;
      shadow += 'M';
      pts.forEach((p, i) => {
        const h = Math.max(0, p[2]);
        const x = p[0] + h * 0.32;
        const y = p[1] - h * 0.42;
        shadow += (i ? 'L' : '') + f2(x) + ' ' + f2(-y);
      });
      shadow += 'Z';
    }
  }
  let tableShadow = '';
  const off = size * 0.012;
  for (const r of recs) {
    if (r.alpha < 0.3) continue;
    tableShadow += 'M';
    r.pts3.forEach((p, i) => {
      const q = proj([p[0], p[1], Math.min(p[2], 0)]);
      tableShadow += (i ? 'L' : '') + f2(q[0] + off * 0.6) + ' ' + f2(q[1] + off);
    });
    tableShadow += 'Z';
  }
  const lead = frame.lead ? (proj(frame.lead).slice(0, 2) as V2) : null;
  return { list: recs, shadow, tableShadow, lead };
}

/* -------------------------------------------------------- annotations */

const SVGNS = 'http://www.w3.org/2000/svg';
const INK = '#23201c';
const ACCENT = '#c2402a';

function qPoint(a: V2, c: V2, b: V2, t: number): V2 {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

function arrowHead(tip: V2, from: V2, size: number, style: 'solid' | 'hollow' | 'half'): string {
  const dx = tip[0] - from[0];
  const dy = tip[1] - from[1];
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  const bx = tip[0] - ux * size;
  const by = tip[1] - uy * size;
  const px = -uy * size * 0.5;
  const py = ux * size * 0.5;
  if (style === 'half')
    return `M${f2(tip[0])} ${f2(tip[1])}L${f2(bx + px)} ${f2(by + py)}L${f2(bx + ux * size * 0.25)} ${f2(by + uy * size * 0.25)}Z`;
  return `M${f2(tip[0])} ${f2(tip[1])}L${f2(bx + px)} ${f2(by + py)}L${f2(bx - px)} ${f2(by - py)}Z`;
}

/** Diagram symbols as an SVG fragment string (screen coords: y down). */
export function annotsSvg(annots: Frame['annots'], box: Box, px: number): string {
  let out = '';
  const S = (p: V2): V2 => [p[0], -p[1]];
  const w = px * 1.6;
  for (const { a, alpha, draw } of annots) {
    if (alpha <= 0.01) continue;
    const op = `opacity="${f2(alpha)}"`;
    if (a.type === 'line') {
      const A = S(a.a);
      const B = S(a.b);
      const P = [A[0] + (B[0] - A[0]) * draw, A[1] + (B[1] - A[1]) * draw];
      const dash =
        a.kind === 'valley'
          ? `${f2(px * 9)} ${f2(px * 6)}`
          : a.kind === 'mountain'
            ? `${f2(px * 10)} ${f2(px * 4)} ${f2(px * 1.6)} ${f2(px * 4)} ${f2(px * 1.6)} ${f2(px * 4)}`
            : a.kind === 'cut'
              ? `${f2(px * 5)} ${f2(px * 4)}`
              : 'none';
      const col = a.kind === 'cut' ? INK : a.kind === 'crease' ? '#6d655a' : ACCENT;
      // halo keeps the symbol readable over any paper colour
      out += `<g ${op}><path d="M${f2(A[0])} ${f2(A[1])}L${f2(P[0])} ${f2(P[1])}" stroke="#fffaf0" stroke-width="${f2(w * 3)}" stroke-linecap="round" opacity=".55" fill="none"/>`;
      out += `<path d="M${f2(A[0])} ${f2(A[1])}L${f2(P[0])} ${f2(P[1])}" stroke="${col}" stroke-width="${f2(w * 1.15)}" stroke-dasharray="${dash}" fill="none"/>`;
      if (a.kind === 'cut' && draw > 0.05) {
        // scissors glyph at the start
        const s = px * 9;
        const ang = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
        out += `<g transform="translate(${f2(A[0])} ${f2(A[1])}) rotate(${f2(ang + 180)})" stroke="${INK}" fill="none" stroke-width="${f2(w)}"><circle cx="${f2(s * 0.9)}" cy="${f2(-s * 0.45)}" r="${f2(s * 0.32)}"/><circle cx="${f2(s * 0.9)}" cy="${f2(s * 0.45)}" r="${f2(s * 0.32)}"/><path d="M${f2(s * 0.62)} ${f2(-s * 0.3)}L${f2(-s * 0.7)} ${f2(s * 0.25)}M${f2(s * 0.62)} ${f2(s * 0.3)}L${f2(-s * 0.7)} ${f2(-s * 0.25)}"/></g>`;
      }
      out += '</g>';
    } else if (a.type === 'arrow') {
      const A = S(a.from);
      const B = S(a.to);
      const mx = (A[0] + B[0]) / 2;
      const my = (A[1] + B[1]) / 2;
      const dx = B[0] - A[0];
      const dy = B[1] - A[1];
      const chord = Math.hypot(dx, dy);
      // screen y is flipped, so negate the bend to keep "left of travel" in model space
      const C: V2 = [mx + dy * a.bend, my - dx * a.bend];
      const n = 24;
      const upto = Math.max(1, Math.round(n * draw));
      let d = '';
      for (let i = 0; i <= upto; i++) {
        const p = qPoint(A, C, B, i / n);
        d += (i ? 'L' : 'M') + f2(p[0]) + ' ' + f2(p[1]);
      }
      const head = Math.min(px * 13, chord * 0.35);
      out += `<g ${op}><path d="${d}" stroke="#fffaf0" stroke-width="${f2(w * 3.2)}" opacity=".6" fill="none" stroke-linecap="round"/>`;
      out += `<path d="${d}" stroke="${INK}" stroke-width="${f2(w * 1.1)}" fill="none" stroke-linecap="round"/>`;
      if (draw > 0.98) {
        const pre = qPoint(A, C, B, 0.86);
        const style = a.kind === 'mountain' ? 'half' : 'solid';
        out += `<path d="${arrowHead(B, pre, head, style)}" fill="${a.kind === 'mountain' ? '#fffaf0' : INK}" stroke="${INK}" stroke-width="${f2(w)}" stroke-linejoin="round"/>`;
        if (a.kind === 'foldunfold' || a.kind === 'unfold') {
          const pre0 = qPoint(A, C, B, 0.14);
          out += `<path d="${arrowHead(A, pre0, head * 0.9, 'solid')}" fill="#fffaf0" stroke="${INK}" stroke-width="${f2(w)}" stroke-linejoin="round"/>`;
        }
      }
      out += '</g>';
    } else if (a.type === 'push') {
      const P = S(a.at);
      const dir = [a.dir[0], -a.dir[1]];
      const l = Math.hypot(dir[0], dir[1]) || 1;
      const ux = dir[0] / l;
      const uy = dir[1] / l;
      const s = px * 34 * (0.4 + 0.6 * draw);
      const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
      // hollow "push" arrow pointing at P
      out += `<g ${op} transform="translate(${f2(P[0] - ux * px * 4)} ${f2(P[1] - uy * px * 4)}) rotate(${f2(ang)})"><path d="M0 0L${f2(-s * 0.42)} ${f2(-s * 0.32)}L${f2(-s * 0.42)} ${f2(-s * 0.13)}L${f2(-s)} ${f2(-s * 0.13)}L${f2(-s)} ${f2(s * 0.13)}L${f2(-s * 0.42)} ${f2(s * 0.13)}L${f2(-s * 0.42)} ${f2(s * 0.32)}Z" fill="#fffaf0" stroke="${INK}" stroke-width="${f2(w * 1.1)}" stroke-linejoin="round"/></g>`;
    } else if (a.type === 'turn' || a.type === 'rotate') {
      const cx = box.x + box.w - px * 40;
      const cy = box.y + box.h - px * 40;
      const r = px * 20;
      const sweep = a.type === 'turn' ? 300 * draw : Math.min(300, Math.abs(a.angle) + 40) * draw;
      const steps = 30;
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const t = ((-60 + (sweep * i) / steps) * Math.PI) / 180;
        const x = cx + Math.cos(t) * r * (a.type === 'turn' ? 1 : 1);
        const y = cy + Math.sin(t) * r * (a.type === 'turn' ? 0.45 : 1);
        d += (i ? 'L' : 'M') + f2(x) + ' ' + f2(y);
      }
      const tEnd = ((-60 + sweep) * Math.PI) / 180;
      const tPre = ((-60 + sweep - 18) * Math.PI) / 180;
      const sy = a.type === 'turn' ? 0.45 : 1;
      const tip: V2 = [cx + Math.cos(tEnd) * r, cy + Math.sin(tEnd) * r * sy];
      const pre: V2 = [cx + Math.cos(tPre) * r, cy + Math.sin(tPre) * r * sy];
      out += `<g ${op}><path d="${d}" stroke="${INK}" stroke-width="${f2(w * 1.2)}" fill="none" stroke-linecap="round"/>`;
      if (draw > 0.9) out += `<path d="${arrowHead(tip, pre, px * 11, 'solid')}" fill="${INK}"/>`;
      const label = a.type === 'turn' ? 'turn over' : `${Math.abs(a.angle)}°`;
      out += `<text x="${f2(cx)}" y="${f2(cy + r + px * 18)}" font-size="${f2(px * 12.5)}" text-anchor="middle" fill="${INK}" font-family="ui-sans-serif,system-ui,sans-serif" letter-spacing=".04em">${label}</text></g>`;
    } else if (a.type === 'repeat') {
      const P = S(a.at);
      out += `<g ${op} transform="translate(${f2(P[0])} ${f2(P[1])})"><path d="M${f2(-px * 16)} 0L${f2(px * 14)} 0" stroke="${INK}" stroke-width="${f2(w)}"/><path d="M${f2(-px * 4)} ${f2(-px * 6)}L${f2(-px * 8)} ${f2(px * 6)}M${f2(px * 2)} ${f2(-px * 6)}L${f2(-px * 2)} ${f2(px * 6)}" stroke="${INK}" stroke-width="${f2(w)}"/><path d="${arrowHead([px * 18, 0], [0, 0], px * 9, 'solid')}" fill="${INK}"/></g>`;
    } else if (a.type === 'inflate') {
      const P = S(a.at);
      const s = px * 16;
      out += `<g ${op} transform="translate(${f2(P[0])} ${f2(P[1])})" fill="none" stroke="${INK}" stroke-width="${f2(w)}" stroke-linecap="round">`;
      for (let i = 0; i < 3; i++) out += `<path d="M${f2(-s * 0.6 + i * s * 0.6)} ${f2(s * 2.4)}q${f2(s * 0.3)} ${f2(-s * 0.6)} 0 ${f2(-s * 1.2)}t0 ${f2(-s * 1.0)}" opacity="${f2(draw)}"/>`;
      out += '</g>';
    } else if (a.type === 'pinch') {
      const A = S(a.a);
      const B = S(a.b);
      const s = px * 22;
      for (const [P, Q] of [
        [A, B],
        [B, A],
      ] as [V2, V2][]) {
        const ang = (Math.atan2(Q[1] - P[1], Q[0] - P[0]) * 180) / Math.PI;
        out += `<g ${op} transform="translate(${f2(P[0])} ${f2(P[1])}) rotate(${f2(ang)})"><path d="M${f2(-s)} 0L${f2(-s * 0.2)} 0" stroke="${INK}" stroke-width="${f2(w * 1.2)}"/><path d="${arrowHead([0, 0], [-s, 0], px * 10, 'solid')}" fill="${INK}"/></g>`;
      }
    }
  }
  return out;
}

/* --------------------------------------------------------- DOM render */

export interface RenderInput {
  frame: Frame;
  box: Box;
  /** user units per CSS pixel */
  px: number;
  palette: Palette;
  size: number;
  showFinger: boolean;
}

/** Retained-mode SVG renderer: one <path> per facet, updated in place each frame. */
export class SvgRenderer {
  readonly svg: SVGSVGElement;
  private gTable: SVGPathElement;
  private gFacets: SVGGElement;
  private gAnn: SVGGElement;
  private shadowEl: SVGPathElement;
  private finger: SVGGElement;
  private els = new Map<number, { g: SVGElement; fill: SVGPathElement; edge?: SVGPathElement }>();
  private lastOrder = '';
  private lastAnn = '';

  constructor(host: HTMLElement, label: string) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'fold-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg = svg;
    this.gTable = document.createElementNS(SVGNS, 'path');
    this.gTable.setAttribute('class', 'table-shadow');
    this.gFacets = document.createElementNS(SVGNS, 'g');
    this.gFacets.setAttribute('stroke-linejoin', 'round');
    this.shadowEl = document.createElementNS(SVGNS, 'path');
    this.shadowEl.setAttribute('class', 'flap-shadow');
    this.gAnn = document.createElementNS(SVGNS, 'g');
    this.gAnn.setAttribute('class', 'annots');
    this.finger = document.createElementNS(SVGNS, 'g');
    this.finger.setAttribute('class', 'finger');
    this.finger.innerHTML = '<circle class="finger-halo"/><circle class="finger-ring"/>';
    svg.append(this.gTable, this.gFacets, this.gAnn, this.finger);
    host.appendChild(svg);
  }

  render(inp: RenderInput) {
    const { frame, box, px, palette, size } = inp;
    this.svg.setAttribute('viewBox', `${f2(box.x)} ${f2(box.y)} ${f2(box.w)} ${f2(box.h)}`);
    const centre: V2 = [box.x + box.w / 2, -(box.y + box.h / 2)];
    const sc = scene(frame, { centre, size, palette });
    this.gTable.setAttribute('d', sc.tableShadow);

    const seen = new Set<number>();
    const order: string[] = [];
    let shadowPlaced = false;
    const children: Element[] = [];
    for (const r of sc.list) {
      seen.add(r.id);
      let e = this.els.get(r.id);
      if (!e) {
        const fill = document.createElementNS(SVGNS, 'path');
        if (r.edges !== undefined) {
          const g = document.createElementNS(SVGNS, 'g');
          const edge = document.createElementNS(SVGNS, 'path');
          edge.setAttribute('fill', 'none');
          g.append(fill, edge);
          e = { g, fill, edge };
        } else e = { g: fill, fill };
        this.els.set(r.id, e);
      }
      if (sc.shadow && !shadowPlaced && r.lifted) {
        children.push(this.shadowEl);
        order.push('s');
        shadowPlaced = true;
      }
      e.fill.setAttribute('d', r.d);
      e.fill.setAttribute('fill', r.fill);
      if (e.edge) {
        e.fill.setAttribute('stroke', 'none');
        e.edge.setAttribute('d', r.edges ?? '');
        e.edge.setAttribute('stroke', r.stroke);
        e.edge.setAttribute('stroke-width', f2(px * 1.15));
      } else {
        e.fill.setAttribute('stroke', r.stroke);
        e.fill.setAttribute('stroke-width', f2(px * 1.15));
      }
      if (r.alpha < 1) e.g.setAttribute('opacity', f2(r.alpha));
      else e.g.removeAttribute('opacity');
      children.push(e.g);
      order.push(String(r.id));
    }
    this.shadowEl.setAttribute('d', sc.shadow);
    for (const [id, e] of this.els)
      if (!seen.has(id)) {
        e.g.remove();
        this.els.delete(id);
      }
    const key = order.join(',');
    if (key !== this.lastOrder) {
      this.lastOrder = key;
      this.gFacets.replaceChildren(...children);
    }

    const ann = annotsSvg(frame.annots, box, px);
    if (ann !== this.lastAnn) {
      this.lastAnn = ann;
      this.gAnn.innerHTML = ann;
    }

    if (inp.showFinger && sc.lead) {
      const [halo, ring] = Array.from(this.finger.children) as SVGCircleElement[];
      for (const c of [halo, ring]) {
        c.setAttribute('cx', f2(sc.lead[0]));
        c.setAttribute('cy', f2(sc.lead[1]));
      }
      halo.setAttribute('r', f2(px * 15));
      ring.setAttribute('r', f2(px * 9));
      ring.setAttribute('stroke-width', f2(px * 1.6));
      this.finger.style.opacity = '1';
    } else this.finger.style.opacity = '0';
  }
}

/** Static SVG markup for a frame (thumbnails, server-side previews). */
export function frameToSvg(frame: Frame, box: Box, palette: Palette, size: number, px = box.w / 320, withAnnots = false): string {
  const centre: V2 = [box.x + box.w / 2, -(box.y + box.h / 2)];
  const sc = scene(frame, { centre, size, palette });
  let body = `<path d="${sc.tableShadow}" fill="rgba(70,50,30,.10)"/>`;
  for (const r of sc.list) {
    const op = r.alpha < 1 ? ` opacity="${f2(r.alpha)}"` : '';
    if (r.edges !== undefined)
      body += `<path d="${r.d}" fill="${r.fill}"${op}/><path d="${r.edges}" fill="none" stroke="${r.stroke}" stroke-width="${f2(px * 1.1)}"${op}/>`;
    else body += `<path d="${r.d}" fill="${r.fill}" stroke="${r.stroke}" stroke-width="${f2(px * 1.1)}"${op}/>`;
  }
  if (withAnnots) body += annotsSvg(frame.annots, box, px);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(box.x)} ${f2(box.y)} ${f2(box.w)} ${f2(box.h)}" stroke-linejoin="round">${body}</svg>`;
}

/** Bounding box (screen coords) of a frame after projection, padded. */
export function frameBox(frame: Frame, size: number, pad = 0.14, centreHint?: V2): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let cx = 0;
  let cy = 0;
  if (centreHint) [cx, cy] = centreHint;
  else {
    // rough centre from flat positions
    let n = 0;
    for (const it of frame.items)
      for (const p of curPoly(it.f)) {
        cx += p[0];
        cy += p[1];
        n++;
      }
    cx /= n || 1;
    cy /= n || 1;
  }
  const sc = scene(frame, { centre: [cx, cy], size, palette: { front: '#888888', back: '#888888' } });
  for (const r of sc.list) {
    if (r.alpha < 0.2) continue;
    const nums = r.d.match(/-?\d+(\.\d+)?(e-?\d+)?/g);
    if (!nums) continue;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = +nums[i];
      const y = +nums[i + 1];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const w = x1 - x0;
  const h = y1 - y0;
  const m = Math.max(w, h) * pad + size * 0.04;
  return { x: x0 - m, y: y0 - m, w: w + 2 * m, h: h + 2 * m };
}

export const lerpBox = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

export const unionBox = (a: Box, b: Box): Box => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/** Orbit camera helper: tilt (about x) then turn (about y), in radians. */
export const orbit = (tilt: number, turn: number): M3 => mul3(rotAxis([0, 0, 0], [1, 0, 0], -tilt), rotAxis([0, 0, 0], [0, 1, 0], turn));
