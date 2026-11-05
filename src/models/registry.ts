import type { ModelDef } from '../engine/model';

export interface ModelEntry {
  id: string;
  load: () => Promise<{ default: ModelDef }>;
}

export const models: ModelEntry[] = [
  { id: 'square-from-rect', load: () => import('./square-from-rect') },
  { id: 'warmup', load: () => import('./warmup') },
  { id: 'cup', load: () => import('./cup') },
  { id: 'fortune-teller', load: () => import('./fortune-teller') },
  { id: 'kite-base', load: () => import('./kite-base') },
  { id: 'preliminary-base', load: () => import('./preliminary-base') },
  { id: 'waterbomb-base', load: () => import('./waterbomb-base') },
  { id: 'squash-fold', load: () => import('./squash-fold') },
  { id: 'rabbit-ear', load: () => import('./rabbit-ear') },
  { id: 'heart', load: () => import('./heart') },
  { id: 'bird-base', load: () => import('./bird-base') },
  { id: 'crane', load: () => import('./crane') },
];
