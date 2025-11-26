/**
 * Chord Detector
 *
 * Analyzes the notes currently on the fretboard and identifies the chord.
 */

import { Chord, Note } from '@tonaljs/tonal';
import { STANDARD_TUNING } from '../config/constants';
import type { GuitarStringState, StringIndex } from '../types';

/** Get the full note name (with octave) at a string/fret position */
function getNoteAtPosition(stringIndex: number, fret: number): string {
  const openMidi = Note.midi(STANDARD_TUNING[stringIndex]);
  if (openMidi === null) return '';
  return Note.fromMidi(openMidi + fret);
}

/** Get pitch class (note name without octave) */
function getPitchClass(note: string): string {
  return Note.pitchClass(note) || '';
}

export interface DetectedChord {
  /** The chord name (e.g., "C", "Am", "G7") */
  name: string;
  /** Alternative interpretations */
  alternatives: string[];
  /** The bass note (lowest sounding note) */
  bassNote: string;
  /** Is this a slash chord (bass note differs from root)? */
  isSlashChord: boolean;
  /** All unique pitch classes in the voicing */
  pitchClasses: string[];
}

/**
 * Detect the chord from the current fretboard state
 */
export function detectChord(guitarState: GuitarStringState): DetectedChord | null {
  // Collect all played notes
  const playedNotes: { note: string; pitchClass: string; stringIndex: number }[] = [];

  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as StringIndex];
    if (fret !== null) {
      const note = getNoteAtPosition(i, fret);
      playedNotes.push({
        note,
        pitchClass: getPitchClass(note),
        stringIndex: i,
      });
    }
  }

  // Need at least 2 notes to identify a chord
  if (playedNotes.length < 2) {
    return null;
  }

  // Get unique pitch classes
  const pitchClasses = [...new Set(playedNotes.map(n => n.pitchClass))];

  // Bass note is the lowest string that's played
  const bassNote = playedNotes[0].pitchClass;

  // Use Tonal.js to detect the chord
  const detected = Chord.detect(pitchClasses);

  if (detected.length === 0) {
    // Couldn't identify a standard chord
    return {
      name: pitchClasses.join('-'),
      alternatives: [],
      bassNote,
      isSlashChord: false,
      pitchClasses,
    };
  }

  // Primary detection
  const primaryChord = detected[0];

  // Check if it's a slash chord (bass note differs from root)
  const chordInfo = Chord.get(primaryChord);
  const chordRoot = chordInfo.tonic || '';
  const isSlashChord = bassNote !== chordRoot && chordRoot !== '';

  // Format the name
  let name = primaryChord;
  if (isSlashChord) {
    name = `${primaryChord}/${bassNote}`;
  }

  return {
    name,
    alternatives: detected.slice(1, 4), // Up to 3 alternatives
    bassNote,
    isSlashChord,
    pitchClasses,
  };
}
