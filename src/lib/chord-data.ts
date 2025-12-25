/**
 * Chord Data Service
 *
 * Primary source: chords-db (curated voicings)
 * Fallback: chord-solver.ts (algorithmic generation)
 */

import { Note } from '@tonaljs/tonal';
import { findChord, type ChordsDbPosition } from '../data/chords-db';
import { getBestVoicings } from './chord-solver';
import { STANDARD_TUNING } from '../config/constants';
import type { ChordVoicing, FretNumber } from '../types';

/**
 * Map our UI quality names to chords-db suffixes
 */
const QUALITY_TO_SUFFIX: Record<string, string> = {
  'Major': 'major',
  'Minor': 'minor',
  'Dominant 7': '7',
  'Major 7': 'maj7',
  'Minor 7': 'm7',
  'Diminished': 'dim',
  'Augmented': 'aug',
  'Sus2': 'sus2',
  'Sus4': 'sus4',
  'Power (5)': '5',
  // Extended chords (may fall back to solver)
  'Diminished 7': 'dim7',
  'Add9': 'add9',
  'Minor Add9': 'madd9',
  '9': '9',
  'Major 9': 'maj9',
  'Minor 9': 'm9',
  '11': '11',
  '13': '13',
  '6': '6',
  '69': '69',
};

/**
 * Get MIDI note at a string/fret position
 */
function getMidiAt(stringIndex: number, fret: number): number {
  const openMidi = Note.midi(STANDARD_TUNING[stringIndex]);
  if (openMidi === null) throw new Error(`Invalid tuning: ${STANDARD_TUNING[stringIndex]}`);
  return openMidi + fret;
}

/**
 * Get note name (with octave) at a string/fret position
 */
function getNoteAt(stringIndex: number, fret: number): string {
  return Note.fromMidi(getMidiAt(stringIndex, fret));
}

/**
 * Get pitch class (note name without octave) at a string/fret position
 */
function getPitchClassAt(stringIndex: number, fret: number): string {
  return Note.pitchClass(getNoteAt(stringIndex, fret)) || '';
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
 */
function convertPosition(position: ChordsDbPosition, root: string): ChordVoicing {
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
      noteNames.push(getNoteAt(stringIndex, fret));
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
      bassNote = getPitchClassAt(i, frets[i]!);
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
 * Get all voicings for a chord, using chords-db as primary source
 * and falling back to the algorithmic solver for unsupported chords.
 *
 * @param root - Root note (e.g., "C", "F#", "Bb")
 * @param quality - Chord quality from UI (e.g., "Major", "Minor 7")
 * @param limit - Maximum number of voicings to return
 * @returns Array of chord voicings sorted by fret position
 */
export function getVoicingsForChord(
  root: string,
  quality: string,
  limit = 12
): ChordVoicing[] {
  const suffix = QUALITY_TO_SUFFIX[quality];

  if (!suffix) {
    // Unknown quality - fall back to solver
    console.warn(`Unknown quality "${quality}", falling back to solver`);
    return getBestVoicings(root, quality, limit);
  }

  const chord = findChord(root, suffix);

  if (!chord || chord.positions.length === 0) {
    // Chord not in database - fall back to solver
    return getBestVoicings(root, quality, limit);
  }

  // Convert all positions to our format
  const voicings = chord.positions.map(pos => convertPosition(pos, root));

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
