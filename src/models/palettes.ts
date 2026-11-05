import type { Palette } from '../engine/render';

/** Kami colours: a coloured side and a warm white side. */
export const P = {
  vermilion: { front: '#c8452e', back: '#f6f0e4' },
  indigo: { front: '#2f4a7a', back: '#f5f0e6' },
  mustard: { front: '#d9a12b', back: '#f7f1e3' },
  teal: { front: '#2c7a72', back: '#f4efe4' },
  plum: { front: '#7d3f5c', back: '#f6efe6' },
  moss: { front: '#5d7a3a', back: '#f5f0e3' },
  rose: { front: '#d4687a', back: '#f8f0ea' },
  kraft: { front: '#c9a77c', back: '#e9dcc6' },
  white: { front: '#f3ede1', back: '#fbf8f1' },
  sky: { front: '#4f86b8', back: '#f5f1e8' },
} satisfies Record<string, Palette>;
