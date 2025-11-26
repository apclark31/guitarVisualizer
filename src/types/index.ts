// Core music types for the chord visualizer

/** String index: 0 = Low E, 5 = High E */
export type StringIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** Fret number: 0 = open, 1-22 = fretted, null = muted */
export type FretNumber = number | null;

/** Physical state of each guitar string */
export type GuitarStringState = Record<StringIndex, FretNumber>;

/** A calculated chord voicing from the solver */
export interface ChordVoicing {
  /** Fret positions for each string [LowE, A, D, G, B, HighE] */
  frets: FretNumber[];
  /** The lowest fret number used (for sorting) */
  lowestFret: number;
  /** The highest fret number used (for hand span validation) */
  highestFret: number;
  /** Note names in this voicing */
  noteNames: string[];
}

/** Playback modes for audio */
export type PlaybackMode = 'block' | 'strum' | 'arpeggio';

/** Current instrument selection */
export type Instrument = 'guitar' | 'piano';

/** Note display mode */
export type DisplayMode = 'notes' | 'intervals';

/** Interval type for color coding */
export type IntervalType = 'root' | 'third' | 'fifth' | 'seventh' | 'extension';

/** Detected chord information */
export interface DetectedChordInfo {
  name: string;
  alternatives: string[];
  bassNote: string;
  isSlashChord: boolean;
}

/** App state for the Zustand store */
export interface AppState {
  // User Selection (Target)
  targetRoot: string;
  targetQuality: string;

  // Solver Output
  availableVoicings: ChordVoicing[];
  currentVoicingIndex: number;

  // Physical State (Actual)
  guitarStringState: GuitarStringState;

  // Detected chord (from manual placement)
  detectedChord: DetectedChordInfo | null;

  // UI State
  displayMode: DisplayMode;
  isCustomShape: boolean;

  // Audio State
  isAudioLoaded: boolean;
  volume: number;
  playbackMode: PlaybackMode;
  currentInstrument: Instrument;

  // Actions
  setTargetChord: (root: string, quality: string) => void;
  setVoicingIndex: (index: number) => void;
  setFret: (stringIndex: StringIndex, fret: FretNumber) => void;
  clearString: (stringIndex: StringIndex) => void;
  clearAllStrings: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setVolume: (volume: number) => void;
  setAudioLoaded: (loaded: boolean) => void;
}
