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

/** Chord family groupings for the picker (organized by harmonic function) */
export const CHORD_FAMILIES = [
  'Major',
  'Minor',
  'Dominant',
  'Diminished',
  'Augmented',
  'Suspended',
  'Power',
] as const;

export type ChordFamily = typeof CHORD_FAMILIES[number];

/** Map each family to its chord types */
export const FAMILY_TO_TYPES: Record<ChordFamily, readonly string[]> = {
  'Major': ['Major', 'Major 7', 'Major 9', 'Major 6', '6/9', 'Add 9', 'Add 11', 'Major 11', 'Major 13', 'Major 7♯5', 'Major 7♭5'],
  'Minor': ['Minor', 'Minor 7', 'Minor 9', 'Minor 6', 'Minor 6/9', 'Minor Add 9', 'Minor-Major 7', 'Minor-Major 9', 'Minor 11', 'Minor-Major 11'],
  'Dominant': ['Dominant 7', 'Dominant 9', 'Dominant 11', 'Dominant 13', '7sus4', '7♯9', '7♭9', '7♭5', '9♭5', '9♯11', 'Altered'],
  'Diminished': ['Diminished', 'Diminished 7', 'Minor 7♭5'],
  'Augmented': ['Augmented', 'Augmented 7', 'Augmented 9'],
  'Suspended': ['Sus2', 'Sus4'],
  'Power': ['Power (5)'],
} as const;

/** All available chord qualities (flattened from families) */
export const CHORD_QUALITIES = Object.values(FAMILY_TO_TYPES).flat();

/** Get family for a given chord type */
export function getFamilyForType(type: string): ChordFamily | null {
  for (const [family, types] of Object.entries(FAMILY_TO_TYPES)) {
    if (types.includes(type)) {
      return family as ChordFamily;
    }
  }
  return null;
}

/** Map quality names to Tonal.js chord symbols */
export const QUALITY_TO_SYMBOL: Record<string, string> = {
  // Basic
  'Major': 'M',
  'Minor': 'm',
  'Power (5)': '5',
  'Diminished': 'dim',
  'Augmented': 'aug',
  // Suspended
  'Sus2': 'sus2',
  'Sus4': 'sus4',
  '7sus4': '7sus4',
  // 7th
  'Dominant 7': '7',
  'Major 7': 'maj7',
  'Minor 7': 'm7',
  'Minor 7♭5': 'm7b5',
  'Diminished 7': 'dim7',
  'Minor-Major 7': 'mMaj7',
  'Augmented 7': 'aug7',
  'Major 7♯5': 'maj7#5',
  'Major 7♭5': 'maj7b5',
  // 6th
  'Major 6': '6',
  'Minor 6': 'm6',
  '6/9': '69',
  'Minor 6/9': 'm69',
  // Add
  'Add 9': 'add9',
  'Add 11': 'add11',
  'Minor Add 9': 'madd9',
  // 9th
  'Dominant 9': '9',
  'Major 9': 'maj9',
  'Minor 9': 'm9',
  'Minor-Major 9': 'mMaj9',
  'Augmented 9': 'aug9',
  '9♭5': '9b5',
  '9♯11': '9#11',
  // Extended
  'Dominant 11': '11',
  'Major 11': 'maj11',
  'Minor 11': 'm11',
  'Minor-Major 11': 'mMaj11',
  'Dominant 13': '13',
  'Major 13': 'maj13',
  // Altered
  '7♯9': '7#9',
  '7♭9': '7b9',
  '7♭5': '7b5',
  'Altered': 'alt',
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
  { value: 'all', label: '--' },
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
  // Basic (1-10)
  'Major': 1,
  'Minor': 2,
  'Power (5)': 3,
  'Diminished': 4,
  'Augmented': 5,
  // Suspended (11-15)
  'Sus2': 11,
  'Sus4': 12,
  '7sus4': 13,
  // 7th (20-30)
  'Dominant 7': 20,
  'Major 7': 21,
  'Minor 7': 22,
  'Minor 7♭5': 23,
  'Diminished 7': 24,
  'Minor-Major 7': 25,
  'Augmented 7': 26,
  'Major 7♯5': 27,
  'Major 7♭5': 28,
  // 6th (30-35)
  'Major 6': 30,
  'Minor 6': 31,
  '6/9': 32,
  'Minor 6/9': 33,
  // Add (35-40)
  'Add 9': 35,
  'Add 11': 36,
  'Minor Add 9': 37,
  // 9th (40-50)
  'Dominant 9': 40,
  'Major 9': 41,
  'Minor 9': 42,
  'Minor-Major 9': 43,
  'Augmented 9': 44,
  '9♭5': 45,
  '9♯11': 46,
  // Extended (50-60)
  'Dominant 11': 50,
  'Major 11': 51,
  'Minor 11': 52,
  'Minor-Major 11': 53,
  'Dominant 13': 54,
  'Major 13': 55,
  // Altered (60-70)
  '7♯9': 60,
  '7♭9': 61,
  '7♭5': 62,
  'Altered': 63,
} as const;
