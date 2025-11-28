/**
 * chords-db data loader and exports
 * Provides access to guitar chord voicing database
 */

import type { ChordsDbData, ChordsDbChord, ChordsDbPosition } from './types';
import guitarData from './guitar.json';

// Cast the imported JSON to our typed interface
export const chordsDb = guitarData as ChordsDbData;

// Re-export types for convenience
export type { ChordsDbData, ChordsDbChord, ChordsDbPosition };

/**
 * Map from standard note names to chords-db key format
 * chords-db uses "Csharp" instead of "C#", and "Eb" for flats
 */
const keyMap: Record<string, string> = {
  'C': 'C',
  'C#': 'Csharp',
  'Db': 'Csharp',
  'D': 'D',
  'D#': 'Eb',
  'Eb': 'Eb',
  'E': 'E',
  'F': 'F',
  'F#': 'Fsharp',
  'Gb': 'Fsharp',
  'G': 'G',
  'G#': 'Ab',
  'Ab': 'Ab',
  'A': 'A',
  'A#': 'Bb',
  'Bb': 'Bb',
  'B': 'B',
};

/**
 * Get the chords-db key format for a given note name
 */
export function normalizeKey(note: string): string {
  return keyMap[note] || note;
}

/**
 * Look up chords by root note and suffix
 * @param root - Root note (e.g., "C", "F#", "Bb")
 * @param suffix - Chord suffix (e.g., "major", "m7", "dim")
 * @returns Array of chord entries matching the criteria, or empty array
 */
export function findChord(root: string, suffix: string): ChordsDbChord | undefined {
  const key = normalizeKey(root);
  const chords = chordsDb.chords[key];

  if (!chords) {
    return undefined;
  }

  return chords.find(chord => chord.suffix === suffix);
}

/**
 * Get all available suffixes in the database
 */
export function getAvailableSuffixes(): string[] {
  return chordsDb.suffixes;
}

/**
 * Get all available keys in the database
 */
export function getAvailableKeys(): string[] {
  return chordsDb.keys;
}
