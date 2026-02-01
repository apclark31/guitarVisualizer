// Core music types for the chord visualizer

// Import shared types for local use
import type {
  StringIndex as SharedStringIndex,
  FretNumber as SharedFretNumber,
  GuitarStringState as SharedGuitarStringState,
  PlaybackMode as SharedPlaybackMode,
  DisplayMode as SharedDisplayMode,
  Instrument as SharedInstrument,
} from '../shared/types';

// Re-export shared types
export type {
  StringIndex,
  FretNumber,
  GuitarStringState,
  PlaybackMode,
  DisplayMode,
  IntervalType,
  HighlightedNote,
  FretboardConfig,
  Instrument,
} from '../shared/types';

// Import constants types for local use
import type { ChordFamily as SharedChordFamily, KeyType as SharedKeyType } from '../config/constants';

// Re-export constants types
export type { ChordFamily, TuningCategory, KeyType } from '../config/constants';

// Local type aliases for use within this file
type StringIndex = SharedStringIndex;
type FretNumber = SharedFretNumber;
type GuitarStringState = SharedGuitarStringState;
type PlaybackMode = SharedPlaybackMode;
type DisplayMode = SharedDisplayMode;
type Instrument = SharedInstrument;
type ChordFamily = SharedChordFamily;
type KeyType = SharedKeyType;

/** Key context state */
export interface KeyContext {
  root: string;
  type: KeyType;
}

/** Tuning change mode - how to handle existing voicing when tuning changes */
export type TuningChangeMode = 'adapt' | 'keep' | 'clear';

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

// Re-export KeyMatch as KeySuggestion for backward compatibility
import type { KeyMatch } from '../shared/lib';
export type KeySuggestion = KeyMatch;

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
  keySuggestions: KeySuggestion[];
  voicingType: VoicingType | null;
  voicingTypeFilter: VoicingFilterType;

  // Tuning State
  tuning: string[];
  tuningName: string;

  // Key Context
  keyContext: KeyContext | null;

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

  // Key Context Actions
  setKeyContext: (keyContext: KeyContext | null) => void;

  // URL Restoration
  restoreFromUrl: (params: {
    guitarState: GuitarStringState;
    tuning?: string[];
    tuningName?: string;
    root?: string;
    quality?: string;
    voicingIndex?: number;
    keyContext?: KeyContext | null;
  }) => void;
}
