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
  major: 'major',
  minor: 'minor',
  'major-pentatonic': 'major pentatonic',
  'minor-pentatonic': 'minor pentatonic',
  blues: 'blues',
};

/** Display names for scale types */
export const SCALE_TYPE_DISPLAY: Record<ScaleType, string> = {
  major: 'Major',
  minor: 'Natural Minor',
  'major-pentatonic': 'Major Pentatonic',
  'minor-pentatonic': 'Minor Pentatonic',
  blues: 'Blues',
};

/** Scale categories for grouping in picker */
export const SCALE_CATEGORIES = {
  diatonic: ['major', 'minor'] as ScaleType[],
  pentatonic: ['major-pentatonic', 'minor-pentatonic', 'blues'] as ScaleType[],
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
