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

/** Voicing type filter options for dropdown */
export const VOICING_FILTER_OPTIONS = [
  { value: 'all', label: 'All Voicings' },
  { value: 'triads', label: 'Triads' },
  { value: 'shells', label: 'Shells' },
  { value: 'full', label: 'Full' },
] as const;

/** Shell voicing interval patterns (semitones from root) */
export const SHELL_PATTERNS: Record<string, readonly number[]> = {
  'shell-major': [0, 4, 11],     // R-3-7
  'shell-minor': [0, 3, 10],     // R-b3-b7
  'shell-dominant': [0, 4, 10],  // R-3-b7
} as const;

/** Triad interval patterns (semitones from root) */
export const TRIAD_PATTERNS: Record<string, readonly number[]> = {
  'major': [0, 4, 7],   // R-3-5
  'minor': [0, 3, 7],   // R-b3-5
  'dim': [0, 3, 6],     // R-b3-b5
  'aug': [0, 4, 8],     // R-3-#5
} as const;

/** Chord quality complexity for ranking (lower = simpler) */
export const QUALITY_COMPLEXITY: Record<string, number> = {
  'Major': 1,
  'Minor': 2,
  'Dominant 7': 3,
  'Major 7': 4,
  'Minor 7': 5,
  'Diminished': 6,
  'Augmented': 7,
  'Sus2': 8,
  'Sus4': 9,
  'Power (5)': 10,
} as const;
