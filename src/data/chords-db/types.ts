/**
 * TypeScript types for chords-db guitar chord data
 * Source: https://github.com/tombatossals/chords-db
 */

/** A single chord voicing/position on the fretboard */
export interface ChordsDbPosition {
  /** Fret numbers for each string (low E to high E). -1 = muted string */
  frets: number[];
  /** Finger numbers for each string. 0 = open/not fingered */
  fingers: number[];
  /** The fret number where position 1 starts (for positions up the neck) */
  baseFret: number;
  /** Fret numbers that are barred */
  barres: number[];
  /** Whether this voicing requires a capo/barre */
  capo?: boolean;
  /** MIDI note values for each sounding note */
  midi: number[];
}

/** A chord with all its voicing positions */
export interface ChordsDbChord {
  /** Root note key (e.g., "C", "F#", "Bb") */
  key: string;
  /** Chord quality suffix (e.g., "major", "minor", "7", "m7") */
  suffix: string;
  /** Array of voicing positions for this chord */
  positions: ChordsDbPosition[];
}

/** Guitar instrument metadata */
export interface ChordsDbMain {
  strings: number;
  fretsOnChord: number;
  name: string;
}

/** Tuning configurations */
export interface ChordsDbTunings {
  standard: string[];
}

/** Root structure of the guitar.json file */
export interface ChordsDbData {
  main: ChordsDbMain;
  tunings: ChordsDbTunings;
  keys: string[];
  suffixes: string[];
  /** Chords indexed by root note (C, Csharp, D, Eb, etc.) */
  chords: Record<string, ChordsDbChord[]>;
}
