/**
 * Note Utilities - Shared functions for working with guitar notes
 *
 * Used by both Chord Compass and Scale Sage for extracting
 * notes from fretboard state and handling enharmonic conversions.
 */

import { Note } from '@tonaljs/tonal';
import type { GuitarStringState, MultiNoteGuitarState } from '../types';

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
 * Get notes from multi-note guitar state for detection algorithms
 * Supports multiple frets per string (for scale exploration)
 *
 * @param guitarState Current fret positions for each string (array of frets per string)
 * @param tuning Current tuning (array of note names with octaves)
 * @returns Object with unique notes array and bass note (lowest sounding)
 */
export function getNotesFromMultiNoteState(
  guitarState: MultiNoteGuitarState,
  tuning: readonly string[]
): { notes: string[]; bassNote: string | undefined } {
  const notes: string[] = [];
  let bassNote: string | undefined;
  let lowestMidi = Infinity;

  // Iterate from low to high string (0 = low E)
  for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
    const frets = guitarState[stringIndex as keyof MultiNoteGuitarState];
    if (!frets || frets.length === 0) continue;

    const openMidi = Note.midi(tuning[stringIndex]);
    if (!openMidi) continue;

    for (const fret of frets) {
      const midi = openMidi + fret;
      const noteName = Note.pitchClass(Note.fromMidi(midi));

      if (noteName) {
        // Track bass note (lowest MIDI pitch)
        if (midi < lowestMidi) {
          lowestMidi = midi;
          bassNote = noteName;
        }
        // Add unique notes only
        if (!notes.includes(noteName)) {
          notes.push(noteName);
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
 * Convert a note name to its numeric pitch class (0-11)
 * Handles enharmonic equivalents via MIDI. Returns -1 on error.
 */
export function noteToPitchClass(note: string): number {
  const midi = Note.midi(note + '4');
  return midi !== null ? midi % 12 : -1;
}

/**
 * Check if two notes are enharmonically equivalent
 */
export function areEnharmonic(note1: string, note2: string): boolean {
  const pc1 = noteToPitchClass(note1);
  return pc1 !== -1 && pc1 === noteToPitchClass(note2);
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
