// Core music types for the chord visualizer

import type { ChordFamily } from '../config/constants';

/** Re-export types for convenience */
export type { ChordFamily, TuningCategory } from '../config/constants';

/** Tuning change mode - how to handle existing voicing when tuning changes */
export type TuningChangeMode = 'adapt' | 'keep' | 'clear';

/** String index: 0 = Low E, 5 = High E */
export type StringIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** Voicing type classification */
export type VoicingType =
  | 'shell-major'    // R-3-7 or R-7-3 for maj7
  | 'shell-minor'    // R-b3-b7
  | 'shell-dominant' // R-3-b7
  | 'triad'          // R-3-5 or R-b3-5
  | 'partial'        // Some chord tones but not a recognized pattern
  | 'full'           // 4+ unique notes
  | 'unknown';

/** Filter options for voicing type dropdown */
export type VoicingFilterType = 'all' | 'triads' | 'shells' | 'full';

/** A chord suggestion with ranking metadata */
export interface ChordSuggestion {
  root: string;
  quality: string;
  displayName: string;
  confidence: number;
  voicingType: VoicingType;
  missingIntervals: string[];
  presentIntervals: string[];
}

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
  /** Lowest sounding note name (for slash chord detection) */
  bassNote?: string;
  /** True if bass note differs from root (slash chord) */
  isInversion?: boolean;
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
  targetFamily: ChordFamily | '';
  targetQuality: string;

  // Solver Output
  availableVoicings: ChordVoicing[];
  currentVoicingIndex: number;

  // Physical State (Actual)
  guitarStringState: GuitarStringState;

  // Detected chord (from manual placement)
  detectedChord: DetectedChordInfo | null;

  // Suggestions (from voicing analyzer)
  suggestions: ChordSuggestion[];
  voicingType: VoicingType | null;
  voicingTypeFilter: VoicingFilterType;

  // Tuning State
  tuning: string[];
  tuningName: string;

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
  setChord: (root: string, family: ChordFamily, quality: string) => void;
  setVoicingIndex: (index: number) => void;
  setFret: (stringIndex: StringIndex, fret: FretNumber) => void;
  clearString: (stringIndex: StringIndex) => void;
  clearAllStrings: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setVolume: (volume: number) => void;
  setAudioLoaded: (loaded: boolean) => void;
  applySuggestion: (suggestion: ChordSuggestion, filterOverride?: VoicingFilterType) => void;
  applyContext: (suggestion: ChordSuggestion) => void;
  setVoicingTypeFilter: (filter: VoicingFilterType) => void;

  // Tuning Actions
  setTuning: (tuning: string[], name: string, mode: TuningChangeMode) => void;
}
