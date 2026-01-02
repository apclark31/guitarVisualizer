// Shared types used across Fret Atlas apps (Chord Compass, Scale Sage)

/** String index: 0 = Low E, 5 = High E */
export type StringIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** Fret number: 0 = open, 1-22 = fretted, null = muted */
export type FretNumber = number | null;

/** Physical state of each guitar string */
export type GuitarStringState = Record<StringIndex, FretNumber>;

/** Playback modes for audio */
export type PlaybackMode = 'block' | 'strum' | 'arpeggio';

/** Instrument selection for audio playback */
export type Instrument = 'guitar' | 'piano';

/** Note display mode */
export type DisplayMode = 'notes' | 'intervals';

/** Interval type for color coding */
export type IntervalType = 'root' | 'third' | 'fifth' | 'seventh' | 'extension';

/** Highlighted note on fretboard (for scale/chord display) */
export interface HighlightedNote {
  stringIndex: StringIndex;
  fret: number;
  note: string;
  interval?: string;
  isRoot?: boolean;
  color?: string;
}

/** Mode for changing tuning with notes on fretboard */
export type TuningChangeMode = 'adapt' | 'keep' | 'clear';

/** Fretboard display configuration */
export interface FretboardConfig {
  /** Notes to highlight on the fretboard */
  highlightedNotes?: HighlightedNote[];
  /** Root note for interval coloring */
  rootNote?: string | null;
  /** Display mode (notes or intervals) */
  displayMode: DisplayMode;
  /** Current tuning */
  tuning: readonly string[];
  /** Whether frets are clickable */
  interactive?: boolean;
}
