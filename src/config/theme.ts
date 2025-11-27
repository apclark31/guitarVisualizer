// Color theme for the chord visualizer
// Modern dark mode with interval-based color coding

export const COLORS = {
  // Interval colors (with glow-friendly values)
  intervals: {
    root: '#ef4444',      // Red
    third: '#3b82f6',     // Blue
    fifth: '#22c55e',     // Green
    seventh: '#eab308',   // Yellow/Gold
    extension: '#a1a1aa', // Zinc-400 (neutral)
  },

  // Fretboard colors (darker, more sophisticated)
  fretboard: {
    wood: '#292524',        // Stone-800 (dark charcoal with warmth)
    fret: '#a1a1aa',        // Zinc-400 (silver frets)
    nut: '#e7e5e4',         // Stone-200 (bone color)
    string: '#a1a1aa',      // Zinc-400 (steel strings)
    marker: '#1c1917',      // Stone-900 (inset markers)
    background: '#0c0a09',  // Stone-950
  },

  // UI colors (Zinc palette)
  ui: {
    background: '#09090b',  // Zinc-950
    surface: '#18181b',     // Zinc-900
    border: '#3f3f46',      // Zinc-700
    text: '#fafafa',        // Zinc-50
    textMuted: '#71717a',   // Zinc-500
    primary: '#3b82f6',     // Blue-500
    primaryHover: '#2563eb',// Blue-600
    success: '#22c55e',     // Green-500
    danger: '#ef4444',      // Red-500
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
