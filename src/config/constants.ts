// Guitar and music constants - NO MAGIC NUMBERS

/** Standard guitar tuning (Low E to High E) */
export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] as const;

/** Tuning category types */
export const TUNING_CATEGORIES = ['Standard', 'Drop', 'Open', 'Modal', 'Special'] as const;
export type TuningCategory = typeof TUNING_CATEGORIES[number];

/** Tuning preset definition */
export interface TuningPreset {
  name: string;
  notes: readonly string[];
  category: TuningCategory;
}

/** All available tuning presets */
export const TUNING_PRESETS: TuningPreset[] = [
  // Standard tunings
  { name: 'Standard', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], category: 'Standard' },
  { name: 'Half-step Down', notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'], category: 'Standard' },
  { name: 'D Standard', notes: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'], category: 'Standard' },
  { name: 'C Standard', notes: ['C2', 'F2', 'Bb2', 'Eb3', 'G3', 'C4'], category: 'Standard' },
  { name: 'B Standard', notes: ['B1', 'E2', 'A2', 'D3', 'Gb3', 'B3'], category: 'Standard' },
  // Drop tunings
  { name: 'Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], category: 'Drop' },
  { name: 'Drop C', notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'], category: 'Drop' },
  { name: 'Drop B', notes: ['B1', 'Gb2', 'B2', 'E3', 'Ab3', 'Db4'], category: 'Drop' },
  { name: 'Drop A', notes: ['A1', 'E2', 'A2', 'D3', 'Gb3', 'B3'], category: 'Drop' },
  { name: 'Double Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'], category: 'Drop' },
  // Open tunings
  { name: 'Open D', notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], category: 'Open' },
  { name: 'Open E', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], category: 'Open' },
  { name: 'Open G', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'], category: 'Open' },
  { name: 'Open A', notes: ['E2', 'A2', 'E3', 'A3', 'C#4', 'E4'], category: 'Open' },
  { name: 'Open C', notes: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'], category: 'Open' },
  // Modal tunings
  { name: 'DADGAD', notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'], category: 'Modal' },
  { name: 'DADGBD', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'], category: 'Modal' },
  { name: 'CGCGCE', notes: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'], category: 'Modal' },
  // Special tunings
  { name: 'Nashville', notes: ['E3', 'A3', 'D4', 'G4', 'B3', 'E4'], category: 'Special' },
  { name: 'All Fourths', notes: ['E2', 'A2', 'D3', 'G3', 'C4', 'F4'], category: 'Special' },
];

/** Get tuning preset by name */
export function getTuningByName(name: string): TuningPreset | undefined {
  return TUNING_PRESETS.find(t => t.name === name);
}

/** Check if a tuning array matches a preset, return preset name or 'Custom' */
export function getTuningName(notes: readonly string[]): string {
  const preset = TUNING_PRESETS.find(t =>
    t.notes.length === notes.length &&
    t.notes.every((note, i) => note === notes[i])
  );
  return preset?.name ?? 'Custom';
}

/** Get tunings by category */
export function getTuningsByCategory(category: TuningCategory): TuningPreset[] {
  return TUNING_PRESETS.filter(t => t.category === category);
}

/** Convert tuning preset name to URL slug (camelCase) */
function toSlug(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/^(.)/, (c) => c.toLowerCase());
}

/** Map preset names to URL slugs */
const TUNING_SLUG_MAP: Record<string, string> = Object.fromEntries(
  TUNING_PRESETS.map(t => [toSlug(t.name), t.name])
);

/** Encode tuning for URL - returns slug for presets, hyphenated notes for custom */
export function encodeTuningForUrl(notes: readonly string[]): string {
  const presetName = getTuningName(notes);
  if (presetName !== 'Custom') {
    const slug = toSlug(presetName);
    // Standard is default, don't include in URL
    if (slug === 'standard') return '';
    return slug;
  }
  // Custom tuning: join notes with hyphens
  return notes.join('-');
}

/** Decode tuning from URL - returns [tuning, name] or null if invalid */
export function decodeTuningFromUrl(value: string): { tuning: string[]; name: string } | null {
  if (!value) return null;

  // Check if it's a preset slug
  const presetName = TUNING_SLUG_MAP[value];
  if (presetName) {
    const preset = getTuningByName(presetName);
    if (preset) {
      return { tuning: [...preset.notes], name: preset.name };
    }
  }

  // Check if it's a custom tuning (hyphenated notes)
  if (value.includes('-')) {
    const notes = value.split('-');
    if (notes.length === 6) {
      // Validate each note has a valid format (e.g., "E2", "Ab3")
      const validNote = /^[A-G][#b]?\d$/;
      if (notes.every(n => validNote.test(n))) {
        const name = getTuningName(notes);
        return { tuning: notes, name };
      }
    }
  }

  return null;
}

/** Note names without octave for display (derived from tuning) */
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
  /** Height of each string spacing (desktop) */
  STRING_SPACING: 30,
  /** Height of each string spacing (mobile - larger tap targets) */
  STRING_SPACING_MOBILE: 36,
  /** Width of each fret spacing */
  FRET_SPACING: 60,
  /** Padding around the fretboard (increased for sharp/flat labels) */
  PADDING: 30,
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
