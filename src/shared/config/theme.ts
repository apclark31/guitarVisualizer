// Color theme for the chord visualizer
// Sources values from design-tokens.ts — single source of truth
// Fretboard SVG rendering needs JS-side values, so this re-exports them.

import { tokens } from './design-tokens';

export const COLORS = {
  // Interval colors (with glow-friendly values)
  intervals: {
    root: tokens.color.interval.root,
    third: tokens.color.interval.third,
    fifth: tokens.color.interval.fifth,
    seventh: tokens.color.interval.seventh,
    extension: tokens.color.interval.extension,
  },

  // Fretboard colors (warmer, more visible)
  fretboard: {
    wood: tokens.color.fretboard.wood,
    fret: tokens.color.fretboard.fret,
    nut: tokens.color.fretboard.nut,
    string: tokens.color.fretboard.string,
    marker: tokens.color.fretboard.marker,
    background: tokens.color.fretboard.background,
  },

  // UI colors (lighter, more balanced)
  ui: {
    background: tokens.color.surface.default,
    surface: tokens.color.surface.containerHigh,
    border: tokens.color.outline.hover,
    text: tokens.color.on.primary,
    textMuted: tokens.color.on.surfaceMuted,
    primary: tokens.color.primary.default,
    primaryHover: tokens.color.primary.hover,
    success: tokens.color.success,
    danger: tokens.color.danger,
  },
} as const;

/** Get color for a given interval from root */
export function getIntervalColor(semitones: number): string {
  const normalized = ((semitones % 12) + 12) % 12;

  switch (normalized) {
    case 0:
      return COLORS.intervals.root;
    case 3:
    case 4:
      return COLORS.intervals.third;
    case 7:
      return COLORS.intervals.fifth;
    case 10:
    case 11:
      return COLORS.intervals.seventh;
    default:
      return COLORS.intervals.extension;
  }
}

/** Get CSS class for interval glow effect */
export function getIntervalGlowClass(semitones: number): string {
  const normalized = ((semitones % 12) + 12) % 12;

  switch (normalized) {
    case 0:
      return 'noteDotRoot';
    case 3:
    case 4:
      return 'noteDotThird';
    case 7:
      return 'noteDotFifth';
    case 10:
    case 11:
      return 'noteDotSeventh';
    default:
      return 'noteDotDefault';
  }
}
