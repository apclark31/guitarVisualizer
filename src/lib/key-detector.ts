/**
 * Key Detection - Analyzes fretboard notes and suggests matching keys
 *
 * Ranks keys by:
 * 1. All played notes are diatonic (required)
 * 2. Bass note matches tonic (strong signal)
 * 3. Detected chord root matches tonic
 * 4. Number of matching notes
 */

import { Scale, Note } from '@tonaljs/tonal';
import type { KeyType } from '../config/constants';

/** Key match result */
export interface KeyMatch {
  root: string;
  type: KeyType;
  display: string;
  score: number;
  reason: string;
}

/** All chromatic roots for iteration */
const CHROMATIC_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Normalize a note to its pitch class for comparison
 * Handles enharmonic equivalents (Db -> C#, etc.)
 */
function normalizePitchClass(note: string): string {
  // Get pitch class and convert to sharps for consistent comparison
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
 * Check if a note is in a scale (handles enharmonics)
 */
function noteInScale(note: string, scaleNotes: string[]): boolean {
  const normalizedNote = normalizePitchClass(note);
  return scaleNotes.some(scaleNote => normalizePitchClass(scaleNote) === normalizedNote);
}

/**
 * Detect matching keys for a set of notes
 *
 * @param notes Array of note names (pitch classes) from the fretboard
 * @param bassNote The bass note (lowest sounding note), if known
 * @param chordRoot The detected chord root, if known
 * @returns Ranked array of matching keys
 */
export function detectKeys(
  notes: string[],
  bassNote?: string,
  chordRoot?: string
): KeyMatch[] {
  if (notes.length === 0) return [];

  // Normalize all input notes
  const normalizedNotes = notes.map(normalizePitchClass);
  const normalizedBass = bassNote ? normalizePitchClass(bassNote) : undefined;
  const normalizedChordRoot = chordRoot ? normalizePitchClass(chordRoot) : undefined;

  const matches: KeyMatch[] = [];

  // Check each possible key
  for (const root of CHROMATIC_ROOTS) {
    for (const type of ['major', 'minor'] as const) {
      const scaleName = type === 'major' ? 'major' : 'minor';
      const scale = Scale.get(`${root} ${scaleName}`);

      if (!scale.notes || scale.notes.length === 0) continue;

      // Check if all played notes are in this scale
      const scaleNotes = scale.notes;
      const allDiatonic = normalizedNotes.every(note => noteInScale(note, scaleNotes));

      if (!allDiatonic) continue;

      // Calculate score
      let score = 50; // Base score for all notes being diatonic
      let reason = 'All notes diatonic';

      // Bass note matches tonic = strong signal
      if (normalizedBass && normalizePitchClass(root) === normalizedBass) {
        score += 50;
        reason = `${root} is the bass note`;
      }

      // Chord root matches tonic = good signal
      if (normalizedChordRoot && normalizePitchClass(root) === normalizedChordRoot) {
        score += 30;
        if (!reason.includes('bass')) {
          reason = `${root} is the chord root`;
        }
      }

      // More notes = more confidence
      score += normalizedNotes.length * 2;

      // Format display name
      const typeName = type === 'major' ? 'Major' : 'Minor';
      const display = `${root} ${typeName}`;

      matches.push({
        root,
        type,
        display,
        score,
        reason,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Limit to top results
  return matches.slice(0, 8);
}

/**
 * Get notes from guitar state for key detection
 */
export function getNotesFromGuitarState(
  guitarState: Record<number, number | null>,
  tuning: readonly string[]
): { notes: string[]; bassNote: string | undefined } {
  const notes: string[] = [];
  let bassNote: string | undefined;

  // Iterate from low to high string (0 = low E)
  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i];
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
