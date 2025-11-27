// Color theme for the chord visualizer
// Balanced dark theme - not too dark, warm and inviting

export const COLORS = {
  // Interval colors (with glow-friendly values)
  intervals: {
    root: '#ef4444',      // Red
    third: '#3b82f6',     // Blue
    fifth: '#22c55e',     // Green
    seventh: '#eab308',   // Yellow/Gold
    extension: '#a1a1aa', // Zinc-400 (neutral)
  },

  // Fretboard colors (warmer, more visible)
  fretboard: {
    wood: '#3d3533',        // Warmer brown-gray
    fret: '#d4d4d8',        // Zinc-300 (brighter silver frets)
    nut: '#fafaf9',         // Stone-50 (bright bone)
    string: '#d4d4d8',      // Zinc-300 (brighter strings)
    marker: '#292524',      // Stone-800 (subtle inset markers)
    background: '#1c1917',  // Stone-900
  },

  // UI colors (lighter, more balanced)
  ui: {
    background: '#171717',  // Neutral-900 (lighter than pure black)
    surface: '#262626',     // Neutral-800
    border: '#525252',      // Neutral-600
    text: '#fafafa',        // Zinc-50
    textMuted: '#a3a3a3',   // Neutral-400 (brighter muted text)
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
