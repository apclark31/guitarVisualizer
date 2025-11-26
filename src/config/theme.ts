// Color theme for the chord visualizer
// Interval-based color coding per architecture spec

export const COLORS = {
  // Interval colors
  intervals: {
    root: '#ef4444',      // Red
    third: '#3b82f6',     // Blue
    fifth: '#22c55e',     // Green
    seventh: '#eab308',   // Yellow
    extension: '#9ca3af', // Gray (9th, 11th, 13th)
  },

  // Fretboard colors
  fretboard: {
    wood: '#8B4513',        // Saddle brown
    fret: '#D4AF37',        // Metallic gold
    nut: '#F5F5DC',         // Beige (bone color)
    string: '#C0C0C0',      // Silver
    marker: '#4a4a4a',      // Dark gray
    background: '#1a1a1a',  // Near black
  },

  // UI colors
  ui: {
    background: '#0f0f0f',
    surface: '#1e1e1e',
    border: '#333333',
    text: '#ffffff',
    textMuted: '#888888',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    disabled: '#4a4a4a',
  },
} as const;

/** Get color for a given interval from root */
export function getIntervalColor(semitones: number): string {
  // Normalize to 0-11 range
  const normalized = ((semitones % 12) + 12) % 12;

  switch (normalized) {
    case 0:  // Unison / Root
      return COLORS.intervals.root;
    case 3:  // Minor 3rd
    case 4:  // Major 3rd
      return COLORS.intervals.third;
    case 7:  // Perfect 5th
      return COLORS.intervals.fifth;
    case 10: // Minor 7th
    case 11: // Major 7th
      return COLORS.intervals.seventh;
    default: // Extensions and other intervals
      return COLORS.intervals.extension;
  }
}
