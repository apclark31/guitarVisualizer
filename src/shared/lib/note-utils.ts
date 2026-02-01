/**
 * Note Utilities - Shared functions for working with guitar notes
 *
 * Used by both Chord Compass and Scale Sage for extracting
 * notes from fretboard state and handling enharmonic conversions.
 */

import { Note } from '@tonaljs/tonal';
import type { GuitarStringState } from '../types';

/**
 * Get notes from guitar state for detection algorithms
 *
 * @param guitarState Current fret positions for each string
 * @param tuning Current tuning (array of note names with octaves)
 * @returns Object with unique notes array and bass note (lowest sounding)
 */
export function getNotesFromGuitarState(
  guitarState: GuitarStringState,
  tuning: readonly string[]
): { notes: string[]; bassNote: string | undefined } {
  const notes: string[] = [];
  let bassNote: string | undefined;

  // Iterate from low to high string (0 = low E)
  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as keyof GuitarStringState];
    if (fret !== null) {
      const openMidi = Note.midi(tuning[i]);
      if (openMidi) {
        const noteName = Note.pitchClass(Note.fromMidi(openMidi + fret));
        if (noteName) {
          // First note found is the bass note
          if (!bassNote) {
            bassNote = noteName;
          }
          // Add unique notes only
          if (!notes.includes(noteName)) {
            notes.push(noteName);
          }
        }
      }
    }
  }

  return { notes, bassNote };
}

/**
 * Normalize a note to its pitch class using sharps for comparison
 * Handles enharmonic equivalents (Db -> C#, etc.)
 */
export function normalizePitchClass(note: string): string {
  const pc = Note.pitchClass(note);
  if (!pc) return note;

  // Map flats to sharps for comparison
  const flatToSharp: Record<string, string> = {
    'Db': 'C#',
    'Eb': 'D#',
    'Fb': 'E',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
    'Cb': 'B',
  };

  return flatToSharp[pc] || pc;
}

/**
 * Get the full note name at a specific string and fret position
 */
export function getNoteAtPosition(
  stringIndex: number,
  fret: number,
  tuning: readonly string[]
): string {
  const openNote = tuning[stringIndex];
  const midi = Note.midi(openNote);
  if (midi === null) return '';
  return Note.fromMidi(midi + fret);
}

/**
 * Get just the pitch class (note name without octave) at a position
 */
export function getPitchClassAtPosition(
  stringIndex: number,
  fret: number,
  tuning: readonly string[]
): string {
  const fullNote = getNoteAtPosition(stringIndex, fret, tuning);
  return Note.pitchClass(fullNote) || fullNote;
}
