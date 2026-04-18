/**
 * Scale Data Service
 *
 * Provides scale information using Tonal.js Scale.get()
 * Maps scale types to Tonal.js scale names
 */

import { Scale, Note } from '@tonaljs/tonal';
import type { ScaleType } from '../store/useScaleStore';

/** Scale information returned from Tonal.js */
export interface ScaleInfo {
  /** Scale name (e.g., "C major") */
  name: string;
  /** Root note */
  root: string;
  /** Scale type (our internal type) */
  type: ScaleType;
  /** Tonal.js scale type name */
  tonalType: string;
  /** Notes in the scale (e.g., ['C', 'D', 'E', 'F', 'G', 'A', 'B']) */
  notes: string[];
  /** Intervals from root (e.g., ['1P', '2M', '3M', '4P', '5P', '6M', '7M']) */
  intervals: string[];
  /** Number of notes in scale (5 for pentatonic, 6 for blues, 7 for diatonic) */
  noteCount: number;
}

/** Map our scale types to Tonal.js scale names */
const SCALE_TYPE_TO_TONAL: Record<ScaleType, string> = {
  // Diatonic Modes
  major: 'major',
  dorian: 'dorian',
  phrygian: 'phrygian',
  lydian: 'lydian',
  mixolydian: 'mixolydian',
  minor: 'minor',
  locrian: 'locrian',
  // Melodic Minor Modes
  'melodic-minor': 'melodic minor',
  'dorian-b2': 'dorian b2',
  'lydian-augmented': 'lydian augmented',
  'lydian-dominant': 'lydian dominant',
  'mixolydian-b6': 'mixolydian b6',
  'locrian-nat2': 'locrian #2',
  'altered': 'altered',
  // Harmonic Minor Modes
  'harmonic-minor': 'harmonic minor',
  'locrian-nat6': 'locrian 6',
  'ionian-augmented': 'ionian augmented',
  'dorian-sharp4': 'dorian #4',
  'phrygian-dominant': 'phrygian dominant',
  'lydian-sharp9': 'lydian #9',
  'ultralocrian': 'ultralocrian',
  // Pentatonic
  'major-pentatonic': 'major pentatonic',
  'minor-pentatonic': 'minor pentatonic',
  blues: 'blues',
  'major-blues': 'major blues',
  // Symmetric
  'whole-tone': 'whole tone',
  'diminished-hw': 'half-whole diminished',
  'diminished-wh': 'whole-half diminished',
  augmented: 'augmented',
  // Bebop
  bebop: 'bebop',
  'bebop-major': 'bebop major',
  'bebop-minor': 'bebop minor',
  'bebop-locrian': 'bebop locrian',
  // Exotic
  'double-harmonic-major': 'double harmonic major',
  'hungarian-minor': 'hungarian minor',
  'hungarian-major': 'hungarian major',
  persian: 'persian',
  enigmatic: 'enigmatic',
  flamenco: 'flamenco',
  'harmonic-major': 'harmonic major',
  oriental: 'oriental',
  hirajoshi: 'hirajoshi',
  'in-sen': 'in-sen',
  iwato: 'iwato',
  kumoi: 'kumoi',
  pelog: 'pelog',
  chinese: 'chinese',
  egyptian: 'egyptian',
};

/** Display names for scale types */
export const SCALE_TYPE_DISPLAY: Record<ScaleType, string> = {
  // Diatonic Modes
  major: 'Ionian (Major)',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  minor: 'Aeolian (Natural Minor)',
  locrian: 'Locrian',
  // Melodic Minor Modes
  'melodic-minor': 'Melodic Minor',
  'dorian-b2': 'Dorian b2',
  'lydian-augmented': 'Lydian Augmented',
  'lydian-dominant': 'Lydian Dominant',
  'mixolydian-b6': 'Mixolydian b6',
  'locrian-nat2': 'Locrian #2',
  altered: 'Altered',
  // Harmonic Minor Modes
  'harmonic-minor': 'Harmonic Minor',
  'locrian-nat6': 'Locrian #6',
  'ionian-augmented': 'Ionian #5',
  'dorian-sharp4': 'Dorian #4',
  'phrygian-dominant': 'Phrygian Dominant',
  'lydian-sharp9': 'Lydian #2',
  ultralocrian: 'Ultralocrian',
  // Pentatonic
  'major-pentatonic': 'Major Pentatonic',
  'minor-pentatonic': 'Minor Pentatonic',
  blues: 'Blues',
  'major-blues': 'Major Blues',
  // Symmetric
  'whole-tone': 'Whole Tone',
  'diminished-hw': 'Diminished (H-W)',
  'diminished-wh': 'Diminished (W-H)',
  augmented: 'Augmented',
  // Bebop
  bebop: 'Bebop Dominant',
  'bebop-major': 'Bebop Major',
  'bebop-minor': 'Bebop Minor',
  'bebop-locrian': 'Bebop Locrian',
  // Exotic
  'double-harmonic-major': 'Double Harmonic Major',
  'hungarian-minor': 'Hungarian Minor',
  'hungarian-major': 'Hungarian Major',
  persian: 'Persian',
  enigmatic: 'Enigmatic',
  flamenco: 'Flamenco',
  'harmonic-major': 'Harmonic Major',
  oriental: 'Oriental',
  hirajoshi: 'Hirajoshi',
  'in-sen': 'In-Sen',
  iwato: 'Iwato',
  kumoi: 'Kumoi',
  pelog: 'Pelog',
  chinese: 'Chinese',
  egyptian: 'Egyptian',
};

/** Scale categories for grouping in picker */
export const SCALE_CATEGORIES = {
  'diatonic-modes': ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor', 'locrian'] as ScaleType[],
  'melodic-minor': ['melodic-minor', 'dorian-b2', 'lydian-augmented', 'lydian-dominant', 'mixolydian-b6', 'locrian-nat2', 'altered'] as ScaleType[],
  'harmonic-minor': ['harmonic-minor', 'locrian-nat6', 'ionian-augmented', 'dorian-sharp4', 'phrygian-dominant', 'lydian-sharp9', 'ultralocrian'] as ScaleType[],
  pentatonic: ['major-pentatonic', 'minor-pentatonic', 'blues', 'major-blues'] as ScaleType[],
  symmetric: ['whole-tone', 'diminished-hw', 'diminished-wh', 'augmented'] as ScaleType[],
  bebop: ['bebop', 'bebop-major', 'bebop-minor', 'bebop-locrian'] as ScaleType[],
  exotic: ['double-harmonic-major', 'hungarian-minor', 'hungarian-major', 'persian', 'enigmatic', 'flamenco', 'harmonic-major', 'oriental', 'hirajoshi', 'in-sen', 'iwato', 'kumoi', 'pelog', 'chinese', 'egyptian'] as ScaleType[],
};

/** All available root notes */
export const ROOT_NOTES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/** Root notes with enharmonic display labels */
export const ROOT_OPTIONS = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C# / Db' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D# / Eb' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F# / Gb' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G# / Ab' },
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A# / Bb' },
  { value: 'B', label: 'B' },
];

/**
 * Get scale information for a given root and type
 * @param root Root note (e.g., 'C', 'A', 'F#')
 * @param scaleType Scale type
 * @returns ScaleInfo or null if invalid
 */
export function getScale(root: string, scaleType: ScaleType): ScaleInfo | null {
  const tonalName = SCALE_TYPE_TO_TONAL[scaleType];
  if (!tonalName) return null;

  const scaleName = `${root} ${tonalName}`;
  const scaleData = Scale.get(scaleName);

  // Tonal.js returns empty array for invalid scales
  if (!scaleData.notes || scaleData.notes.length === 0) {
    return null;
  }

  return {
    name: scaleName,
    root: root,
    type: scaleType,
    tonalType: tonalName,
    notes: scaleData.notes,
    intervals: scaleData.intervals,
    noteCount: scaleData.notes.length,
  };
}

/**
 * Get the interval label for display (e.g., '1', 'b3', '5', 'b7')
 * @param interval Tonal.js interval string (e.g., '1P', '3m', '5P')
 * @returns Display label
 */
export function getIntervalLabel(interval: string): string {
  // Parse interval: number + quality (e.g., '3M' = major 3rd, '3m' = minor 3rd)
  const match = interval.match(/^(\d+)(.*)/);
  if (!match) return interval;

  const degree = match[1];
  const quality = match[2];

  // Map quality to accidental
  switch (quality) {
    case 'P': // Perfect
    case 'M': // Major
      return degree;
    case 'm': // Minor (flat)
      return `b${degree}`;
    case 'A': // Augmented (sharp)
      return `#${degree}`;
    case 'd': // Diminished (double flat)
      return `bb${degree}`;
    default:
      return degree;
  }
}

/**
 * Get scale degree labels for display
 * @param scaleType Scale type
 * @returns Array of degree labels
 */
export function getScaleDegreeLabels(scaleType: ScaleType): string[] {
  const scale = getScale('C', scaleType);
  if (!scale) return [];

  return scale.intervals.map(getIntervalLabel);
}

/**
 * Check if a note is in a given scale (handles enharmonic equivalents)
 * @param note Note to check (e.g., 'C', 'Db', 'F#')
 * @param scaleNotes Array of scale notes
 * @returns true if note is in scale
 */
export function isNoteInScale(note: string, scaleNotes: string[]): boolean {
  const notePitchClass = Note.pitchClass(note);
  const noteChroma = Note.chroma(notePitchClass);

  return scaleNotes.some((scaleNote) => {
    const scaleChroma = Note.chroma(Note.pitchClass(scaleNote));
    return noteChroma === scaleChroma;
  });
}

interface ModeEntry {
  degree: number;
  semitones: number;
  parentFamily: 'Major' | 'Melodic Minor' | 'Harmonic Minor';
  isRoot: boolean;
}

const MODE_INFO: Partial<Record<ScaleType, ModeEntry>> = {
  // Diatonic modes (parent: Major)
  major:          { degree: 1, semitones: 0,  parentFamily: 'Major', isRoot: true },
  dorian:         { degree: 2, semitones: 2,  parentFamily: 'Major', isRoot: false },
  phrygian:       { degree: 3, semitones: 4,  parentFamily: 'Major', isRoot: false },
  lydian:         { degree: 4, semitones: 5,  parentFamily: 'Major', isRoot: false },
  mixolydian:     { degree: 5, semitones: 7,  parentFamily: 'Major', isRoot: false },
  minor:          { degree: 6, semitones: 9,  parentFamily: 'Major', isRoot: false },
  locrian:        { degree: 7, semitones: 11, parentFamily: 'Major', isRoot: false },
  // Melodic minor modes
  'melodic-minor':    { degree: 1, semitones: 0,  parentFamily: 'Melodic Minor', isRoot: true },
  'dorian-b2':        { degree: 2, semitones: 2,  parentFamily: 'Melodic Minor', isRoot: false },
  'lydian-augmented': { degree: 3, semitones: 3,  parentFamily: 'Melodic Minor', isRoot: false },
  'lydian-dominant':  { degree: 4, semitones: 5,  parentFamily: 'Melodic Minor', isRoot: false },
  'mixolydian-b6':    { degree: 5, semitones: 7,  parentFamily: 'Melodic Minor', isRoot: false },
  'locrian-nat2':     { degree: 6, semitones: 9,  parentFamily: 'Melodic Minor', isRoot: false },
  altered:            { degree: 7, semitones: 11, parentFamily: 'Melodic Minor', isRoot: false },
  // Harmonic minor modes
  'harmonic-minor':    { degree: 1, semitones: 0,  parentFamily: 'Harmonic Minor', isRoot: true },
  'locrian-nat6':      { degree: 2, semitones: 2,  parentFamily: 'Harmonic Minor', isRoot: false },
  'ionian-augmented':  { degree: 3, semitones: 3,  parentFamily: 'Harmonic Minor', isRoot: false },
  'dorian-sharp4':     { degree: 4, semitones: 5,  parentFamily: 'Harmonic Minor', isRoot: false },
  'phrygian-dominant': { degree: 5, semitones: 7,  parentFamily: 'Harmonic Minor', isRoot: false },
  'lydian-sharp9':     { degree: 6, semitones: 8,  parentFamily: 'Harmonic Minor', isRoot: false },
  ultralocrian:        { degree: 7, semitones: 11, parentFamily: 'Harmonic Minor', isRoot: false },
};

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];

export interface ParentScaleInfo {
  parentRoot: string;
  parentDisplay: string;
  modeLabel: string;
  modeDegree: number;
}

/**
 * Get the parent scale for a mode.
 * E.g., D Dorian -> { parentRoot: 'C', parentDisplay: 'C Major', modeLabel: '2nd mode', modeDegree: 2 }
 * Works for diatonic, melodic minor, and harmonic minor mode families.
 * Returns null for root modes (Major, Melodic Minor, Harmonic Minor) and non-modal types.
 */
export function getParentScale(root: string, scaleType: ScaleType): ParentScaleInfo | null {
  const info = MODE_INFO[scaleType];
  if (!info || info.isRoot) return null;

  const rootChroma = Note.chroma(root);
  if (rootChroma === undefined) return null;

  const parentChroma = (rootChroma - info.semitones + 12) % 12;
  const parentRoot = Note.pitchClass(Note.fromMidi(parentChroma + 60));

  return {
    parentRoot,
    parentDisplay: `${parentRoot} ${info.parentFamily}`,
    modeLabel: `${ORDINAL[info.degree - 1]} mode`,
    modeDegree: info.degree,
  };
}

/**
 * Get the interval of a note relative to scale root
 * @param note Note to check
 * @param scaleInfo Scale information
 * @returns Interval string or null if not in scale
 */
export function getNoteInterval(
  note: string,
  scaleInfo: ScaleInfo
): string | null {
  const notePitchClass = Note.pitchClass(note);
  const noteChroma = Note.chroma(notePitchClass);

  for (let i = 0; i < scaleInfo.notes.length; i++) {
    const scaleChroma = Note.chroma(Note.pitchClass(scaleInfo.notes[i]));
    if (noteChroma === scaleChroma) {
      return scaleInfo.intervals[i];
    }
  }

  return null;
}
