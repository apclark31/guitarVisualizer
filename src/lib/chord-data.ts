/**
 * Chord Data Service
 *
 * Primary source: chords-db (curated voicings)
 * Fallback: chord-solver.ts (algorithmic generation)
 */

import { Note } from '@tonaljs/tonal';
import { findChord, type ChordsDbPosition } from '../data/chords-db';
import { getBestVoicings, solveTriadVoicings } from './chord-solver';
import { STANDARD_TUNING } from '../config/constants';
import type { ChordVoicing, FretNumber, VoicingFilterType } from '../types';

/**
 * Map our UI quality names to chords-db suffixes
 *
 * Note: chords-db uses specific suffix naming conventions.
 * If a chord isn't in the database, the solver will be used as fallback.
 */
const QUALITY_TO_SUFFIX: Record<string, string> = {
  // Basic
  'Major': 'major',
  'Minor': 'minor',
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
  'Minor-Major 7': 'mmaj7',
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
  'Minor-Major 9': 'mmaj9',
  'Augmented 9': 'aug9',
  '9♭5': '9b5',
  '9♯11': '9#11',
  // Extended
  'Dominant 11': '11',
  'Major 11': 'maj11',
  'Minor 11': 'm11',
  'Minor-Major 11': 'mmaj11',
  'Dominant 13': '13',
  'Major 13': 'maj13',
  // Altered
  '7♯9': '7#9',
  '7♭9': '7b9',
  '7♭5': '7b5',
  'Altered': 'alt',
};

/**
 * Get MIDI note at a string/fret position
 */
function getMidiAt(stringIndex: number, fret: number, tuning: readonly string[] = STANDARD_TUNING): number {
  const openMidi = Note.midi(tuning[stringIndex]);
  if (openMidi === null) throw new Error(`Invalid tuning: ${tuning[stringIndex]}`);
  return openMidi + fret;
}

/**
 * Get note name (with octave) at a string/fret position
 */
function getNoteAt(stringIndex: number, fret: number, tuning: readonly string[] = STANDARD_TUNING): string {
  return Note.fromMidi(getMidiAt(stringIndex, fret, tuning));
}

/**
 * Get pitch class (note name without octave) at a string/fret position
 */
function getPitchClassAt(stringIndex: number, fret: number, tuning: readonly string[] = STANDARD_TUNING): string {
  return Note.pitchClass(getNoteAt(stringIndex, fret, tuning)) || '';
}

/**
 * Normalize note names for comparison (handles enharmonics)
 */
function normalizePitchClass(note: string): number {
  const midi = Note.midi(note + '4');
  return midi !== null ? midi % 12 : -1;
}

/**
 * Check if two notes are enharmonically equivalent
 */
function areEnharmonic(note1: string, note2: string): boolean {
  return normalizePitchClass(note1) === normalizePitchClass(note2);
}

/**
 * Parse fret string to array of numbers
 * "x32010" → [-1, 3, 2, 0, 1, 0]
 * Handles (10), (11), etc. for high frets
 */
function parseFretString(fretStr: string): number[] {
  const result: number[] = [];
  let i = 0;
  while (i < fretStr.length) {
    if (fretStr[i] === 'x') {
      result.push(-1);
      i++;
    } else if (fretStr[i] === '(') {
      // Handle (10), (11), etc.
      const end = fretStr.indexOf(')', i);
      const num = parseInt(fretStr.slice(i + 1, end), 10);
      result.push(num);
      i = end + 1;
    } else {
      result.push(parseInt(fretStr[i], 10));
      i++;
    }
  }
  return result;
}

/**
 * Convert a chords-db position to our ChordVoicing format
 * Note: chords-db voicings are designed for standard tuning
 */
function convertPosition(
  position: ChordsDbPosition,
  root: string,
  tuning: readonly string[] = STANDARD_TUNING
): ChordVoicing {
  const parsedFrets = parseFretString(position.frets);

  const frets: FretNumber[] = parsedFrets.map((fret) => {
    if (fret === -1) return null; // Muted string
    // chords-db uses baseFret to indicate position on neck
    // fret value is relative to baseFret (1 = baseFret position)
    // BUT fret 0 means open string regardless of baseFret
    if (fret === 0) return 0;
    return position.baseFret + fret - 1;
  });

  // Calculate note names for played strings
  const noteNames: string[] = [];
  frets.forEach((fret, stringIndex) => {
    if (fret !== null) {
      noteNames.push(getNoteAt(stringIndex, fret, tuning));
    }
  });

  // Find lowest and highest frets
  const playedFrets = frets.filter((f): f is number => f !== null);
  const lowestFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;
  const highestFret = playedFrets.length > 0 ? Math.max(...playedFrets) : 0;

  // Find bass note (lowest sounding note)
  let bassNote: string | undefined;
  for (let i = 0; i < frets.length; i++) {
    if (frets[i] !== null) {
      bassNote = getPitchClassAt(i, frets[i]!, tuning);
      break;
    }
  }

  // Check if this is an inversion (bass note != root)
  const isInversion = bassNote ? !areEnharmonic(bassNote, root) : false;

  return {
    frets,
    lowestFret,
    highestFret,
    noteNames,
    bassNote,
    isInversion,
  };
}

/**
 * Check if tuning is standard tuning
 */
function isStandardTuning(tuning: readonly string[]): boolean {
  return tuning.length === STANDARD_TUNING.length &&
    tuning.every((note, i) => note === STANDARD_TUNING[i]);
}

/**
 * Adapt a chords-db voicing to a different tuning
 * by adjusting fret positions to maintain the same pitches.
 *
 * For each string, calculates the semitone difference between
 * standard tuning and the target tuning, then shifts the fret accordingly.
 */
function adaptVoicingToTuning(
  voicing: ChordVoicing,
  tuning: readonly string[]
): ChordVoicing | null {
  const adaptedFrets: FretNumber[] = [];

  for (let i = 0; i < voicing.frets.length; i++) {
    const fret = voicing.frets[i];

    if (fret === null) {
      adaptedFrets.push(null);
      continue;
    }

    // Get MIDI values for both tunings at this string
    const standardMidi = Note.midi(STANDARD_TUNING[i]);
    const targetMidi = Note.midi(tuning[i]);

    if (standardMidi === null || targetMidi === null) {
      return null; // Invalid tuning
    }

    // Calculate the fret adjustment needed
    // If target tuning is lower (e.g., Drop D), we need higher frets
    const adjustment = standardMidi - targetMidi;
    const newFret = fret + adjustment;

    // Check if fret is playable (0-24)
    if (newFret < 0 || newFret > 24) {
      // This voicing doesn't work in this tuning - skip it
      return null;
    }

    adaptedFrets.push(newFret as FretNumber);
  }

  // Recalculate voicing metadata with adapted frets
  const noteNames: string[] = [];
  adaptedFrets.forEach((fret, stringIndex) => {
    if (fret !== null) {
      noteNames.push(getNoteAt(stringIndex, fret, tuning));
    }
  });

  const playedFrets = adaptedFrets.filter((f): f is number => f !== null);
  const lowestFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;
  const highestFret = playedFrets.length > 0 ? Math.max(...playedFrets) : 0;

  // Find bass note
  let bassNote: string | undefined;
  for (let i = 0; i < adaptedFrets.length; i++) {
    if (adaptedFrets[i] !== null) {
      bassNote = getPitchClassAt(i, adaptedFrets[i]!, tuning);
      break;
    }
  }

  return {
    frets: adaptedFrets,
    lowestFret,
    highestFret,
    noteNames,
    bassNote,
    isInversion: voicing.isInversion,
  };
}

/**
 * Get all voicings for a chord, using chords-db as primary source
 * and falling back to the algorithmic solver for unsupported chords.
 *
 * @param root - Root note (e.g., "C", "F#", "Bb")
 * @param quality - Chord quality from UI (e.g., "Major", "Minor 7")
 * @param limit - Maximum number of voicings to return
 * @param filter - Voicing type filter (all, triads, shells, full)
 * @param tuning - Optional tuning array (defaults to standard tuning)
 * @returns Array of chord voicings sorted by fret position
 */
export function getVoicingsForChord(
  root: string,
  quality: string,
  limit = 12,
  filter: VoicingFilterType = 'all',
  tuning: readonly string[] = STANDARD_TUNING
): ChordVoicing[] {
  // If triads filter is active, use the triad solver directly
  if (filter === 'triads') {
    return solveTriadVoicings(root, quality, tuning).slice(0, limit);
  }

  // TODO: When shells solver is implemented, handle 'shells' filter here

  const suffix = QUALITY_TO_SUFFIX[quality];

  if (!suffix) {
    // Unknown quality - fall back to solver
    console.warn(`Unknown quality "${quality}", falling back to solver`);
    return getBestVoicings(root, quality, limit, tuning);
  }

  const chord = findChord(root, suffix);

  if (!chord || chord.positions.length === 0) {
    // Chord not in database - fall back to solver
    return getBestVoicings(root, quality, limit, tuning);
  }

  // Convert all positions to our format (using standard tuning first)
  const standardVoicings = chord.positions.map(pos => convertPosition(pos, root, STANDARD_TUNING));

  let voicings: ChordVoicing[];

  if (isStandardTuning(tuning)) {
    // Standard tuning - use voicings as-is
    voicings = standardVoicings;
  } else {
    // Non-standard tuning - adapt voicings by shifting fret positions
    voicings = standardVoicings
      .map(v => adaptVoicingToTuning(v, tuning))
      .filter((v): v is ChordVoicing => v !== null);

    // If no chords-db voicings work in this tuning, fall back to solver
    if (voicings.length === 0) {
      return getBestVoicings(root, quality, limit, tuning);
    }
  }

  // Sort by fret position (open chords first)
  voicings.sort((a, b) => a.lowestFret - b.lowestFret);

  // Return limited set
  return voicings.slice(0, limit);
}

/**
 * Check if a chord exists in the chords-db database
 */
export function isInDatabase(root: string, quality: string): boolean {
  const suffix = QUALITY_TO_SUFFIX[quality];
  if (!suffix) return false;

  const chord = findChord(root, suffix);
  return chord !== undefined && chord.positions.length > 0;
}
