// Guitar and music constants - NO MAGIC NUMBERS

/** Standard guitar tuning (Low E to High E) */
export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] as const;

/** Note names without octave for display */
export const TUNING_NOTES = ['E', 'A', 'D', 'G', 'B', 'E'] as const;

/** Number of frets to display */
export const FRET_COUNT = 12;

/** Number of strings on a guitar */
export const STRING_COUNT = 6;

/** Maximum fret span for a playable chord (hand span constraint) */
export const MAX_HAND_SPAN = 4;

/** Frets with position markers (dots) */
export const MARKER_FRETS = [3, 5, 7, 9, 12] as const;

/** Double dot fret positions */
export const DOUBLE_MARKER_FRETS = [12] as const;

/** All chromatic notes (sharp notation) */
export const CHROMATIC_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

/** Available chord qualities */
export const CHORD_QUALITIES = [
  'Major',
  'Minor',
  'Dominant 7',
  'Major 7',
  'Minor 7',
  'Diminished',
  'Augmented',
  'Sus2',
  'Sus4',
  'Power (5)',
] as const;

/** Map quality names to Tonal.js chord symbols */
export const QUALITY_TO_SYMBOL: Record<string, string> = {
  'Major': 'M',
  'Minor': 'm',
  'Dominant 7': '7',
  'Major 7': 'maj7',
  'Minor 7': 'm7',
  'Diminished': 'dim',
  'Augmented': 'aug',
  'Sus2': 'sus2',
  'Sus4': 'sus4',
  'Power (5)': '5',
};

/** Playback timing constants (in seconds) */
export const PLAYBACK_TIMING = {
  /** Delay between notes in strum mode */
  STRUM_DELAY: 0.05,
  /** Delay between notes in arpeggio mode */
  ARPEGGIO_DELAY: 0.25,
  /** Default note duration */
  NOTE_DURATION: 2,
} as const;

/** Fretboard SVG dimensions */
export const FRETBOARD_DIMENSIONS = {
  /** Width of the nut (fret 0) */
  NUT_WIDTH: 6,
  /** Width of regular frets */
  FRET_WIDTH: 2,
  /** Height of each string spacing */
  STRING_SPACING: 30,
  /** Width of each fret spacing */
  FRET_SPACING: 60,
  /** Padding around the fretboard */
  PADDING: 20,
  /** Radius of note dots */
  DOT_RADIUS: 12,
  /** Radius of fret position markers */
  MARKER_RADIUS: 6,
} as const;
