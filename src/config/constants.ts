// Chord Compass specific constants
// Re-exports shared constants and adds chord-specific ones

// Import for local use
import { CHROMATIC_NOTES as SHARED_CHROMATIC_NOTES } from '../shared/config/constants';

// Re-export all shared constants
export {
  STANDARD_TUNING,
  TUNING_CATEGORIES,
  TUNING_PRESETS,
  getTuningByName,
  getTuningName,
  getTuningsByCategory,
  encodeTuningForUrl,
  decodeTuningFromUrl,
  FRET_COUNT,
  STRING_COUNT,
  MAX_HAND_SPAN,
  MARKER_FRETS,
  DOUBLE_MARKER_FRETS,
  CHROMATIC_NOTES,
  PLAYBACK_TIMING,
  FRETBOARD_DIMENSIONS,
} from '../shared/config/constants';

export type { TuningPreset, TuningCategory } from '../shared/config/constants';

// Local alias for use within this file
const CHROMATIC_NOTES = SHARED_CHROMATIC_NOTES;

/** Note names without octave for display (derived from tuning) */
export const TUNING_NOTES = ['E', 'A', 'D', 'G', 'B', 'E'] as const;

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

// ============================================
// Key Context Constants
// ============================================

/** Key types */
export const KEY_TYPES = ['major', 'minor'] as const;
export type KeyType = typeof KEY_TYPES[number];

/** Key option for selector */
export interface KeyOption {
  root: string;
  type: KeyType;
  display: string;
}

/** All available key options (24 keys: 12 major + 12 minor) */
export const KEY_OPTIONS: KeyOption[] = [
  // Major keys
  { root: 'C', type: 'major', display: 'C Major' },
  { root: 'C#', type: 'major', display: 'C# Major' },
  { root: 'D', type: 'major', display: 'D Major' },
  { root: 'Eb', type: 'major', display: 'Eb Major' },
  { root: 'E', type: 'major', display: 'E Major' },
  { root: 'F', type: 'major', display: 'F Major' },
  { root: 'F#', type: 'major', display: 'F# Major' },
  { root: 'G', type: 'major', display: 'G Major' },
  { root: 'Ab', type: 'major', display: 'Ab Major' },
  { root: 'A', type: 'major', display: 'A Major' },
  { root: 'Bb', type: 'major', display: 'Bb Major' },
  { root: 'B', type: 'major', display: 'B Major' },
  // Minor keys
  { root: 'C', type: 'minor', display: 'C Minor' },
  { root: 'C#', type: 'minor', display: 'C# Minor' },
  { root: 'D', type: 'minor', display: 'D Minor' },
  { root: 'Eb', type: 'minor', display: 'Eb Minor' },
  { root: 'E', type: 'minor', display: 'E Minor' },
  { root: 'F', type: 'minor', display: 'F Minor' },
  { root: 'F#', type: 'minor', display: 'F# Minor' },
  { root: 'G', type: 'minor', display: 'G Minor' },
  { root: 'G#', type: 'minor', display: 'G# Minor' },
  { root: 'A', type: 'minor', display: 'A Minor' },
  { root: 'Bb', type: 'minor', display: 'Bb Minor' },
  { root: 'B', type: 'minor', display: 'B Minor' },
];

/** Roman numerals for scale degrees */
export const ROMAN_NUMERALS = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  minor: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
} as const;

/** Diatonic chord families by scale degree */
export const DIATONIC_FAMILIES = {
  major: ['Major', 'Minor', 'Minor', 'Major', 'Major', 'Minor', 'Diminished'] as ChordFamily[],
  minor: ['Minor', 'Diminished', 'Major', 'Minor', 'Minor', 'Major', 'Major'] as ChordFamily[],
} as const;

/** Scale intervals in semitones for major and minor */
export const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
} as const;

/** Get diatonic chord info for a key */
export interface DiatonicChord {
  root: string;
  numeral: string;
  family: ChordFamily;
  degree: number;
  hasDominantOption?: boolean; // V chord in major, v chord in minor
}

/** Get all diatonic chords for a given key */
export function getDiatonicChords(keyRoot: string, keyType: KeyType): DiatonicChord[] {
  const intervals = SCALE_INTERVALS[keyType];
  const numerals = ROMAN_NUMERALS[keyType];
  const families = DIATONIC_FAMILIES[keyType];

  // Normalize the key root - convert flats to sharps for lookup
  const isFlat = keyRoot.includes('b');
  let normalizedRoot = keyRoot.replace('b', '').replace('#', '');

  // Find base index in chromatic notes
  let baseIndex = CHROMATIC_NOTES.findIndex(n => n === normalizedRoot || n.charAt(0) === normalizedRoot);
  if (baseIndex === -1) return [];

  // Adjust for accidentals
  if (isFlat) {
    baseIndex = (baseIndex - 1 + 12) % 12;
  } else if (keyRoot.includes('#')) {
    baseIndex = (baseIndex + 1) % 12;
  }

  return intervals.map((interval, degree) => {
    const noteIndex = (baseIndex + interval) % 12;
    const noteName = CHROMATIC_NOTES[noteIndex];

    // Use flats for flat keys, sharps otherwise
    let displayNote = noteName;
    if (isFlat && noteName.includes('#')) {
      // Convert sharp to flat equivalent
      const nextIndex = (noteIndex + 1) % 12;
      displayNote = CHROMATIC_NOTES[nextIndex] + 'b';
    }

    return {
      root: displayNote,
      numeral: numerals[degree],
      family: families[degree],
      degree: degree + 1,
      hasDominantOption: (keyType === 'major' && degree === 4) || (keyType === 'minor' && degree === 4),
    };
  });
}

/** Encode key for URL (e.g., "C major" -> "Cmaj", "A minor" -> "Amin") */
export function encodeKeyForUrl(root: string, type: KeyType): string {
  const typeAbbrev = type === 'major' ? 'maj' : 'min';
  return `${root}${typeAbbrev}`;
}

/** Decode key from URL (e.g., "Cmaj" -> { root: "C", type: "major" }) */
export function decodeKeyFromUrl(value: string): { root: string; type: KeyType } | null {
  if (!value) return null;

  const match = value.match(/^([A-G][#b]?)(maj|min)$/);
  if (!match) return null;

  const [, root, typeAbbrev] = match;
  const type: KeyType = typeAbbrev === 'maj' ? 'major' : 'minor';

  // Validate the key exists in our options
  const keyOption = KEY_OPTIONS.find(k => k.root === root && k.type === type);
  if (!keyOption) return null;

  return { root, type };
}

/** Get Roman numeral for a chord in a key context */
export function getRomanNumeral(
  chordRoot: string,
  keyRoot: string,
  keyType: KeyType
): string | null {
  const diatonicChords = getDiatonicChords(keyRoot, keyType);
  const match = diatonicChords.find(d => d.root === chordRoot);
  return match?.numeral ?? null;
}

// ============================================
// Chord Quality Complexity
// ============================================

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
