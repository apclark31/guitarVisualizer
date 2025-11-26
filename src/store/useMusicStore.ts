import { create } from 'zustand';
import type { AppState, StringIndex, FretNumber, DisplayMode, PlaybackMode, GuitarStringState, DetectedChordInfo } from '../types';
import { getBestVoicings } from '../lib/chord-solver';
import { detectChord } from '../lib/chord-detector';

/** Initial guitar state - all strings muted */
const initialGuitarState: GuitarStringState = {
  0: null,
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
};

/** Convert voicing frets array to guitar string state */
function voicingToGuitarState(frets: (number | null)[]): GuitarStringState {
  return {
    0: frets[0] ?? null,
    1: frets[1] ?? null,
    2: frets[2] ?? null,
    3: frets[3] ?? null,
    4: frets[4] ?? null,
    5: frets[5] ?? null,
  };
}

/** Run chord detection and convert to store format */
function runChordDetection(guitarState: GuitarStringState): DetectedChordInfo | null {
  const detected = detectChord(guitarState);
  if (!detected) return null;
  return {
    name: detected.name,
    alternatives: detected.alternatives,
    bassNote: detected.bassNote,
    isSlashChord: detected.isSlashChord,
  };
}

export const useMusicStore = create<AppState>((set, get) => ({
  // User Selection (Target) - empty by default (free-form mode)
  targetRoot: '',
  targetQuality: '',

  // Solver Output
  availableVoicings: [],
  currentVoicingIndex: 0,

  // Physical State (Actual) - blank fretboard by default
  guitarStringState: { ...initialGuitarState },

  // Detected chord (from manual placement)
  detectedChord: null,

  // UI State
  displayMode: 'notes',
  isCustomShape: false,

  // Audio State
  isAudioLoaded: false,
  volume: -12, // dB
  playbackMode: 'strum',
  currentInstrument: 'guitar',

  // Actions
  setTargetChord: (root: string, quality: string) => {
    // Run the solver to get available voicings
    const voicings = getBestVoicings(root, quality);

    // Auto-select the first voicing if available
    const firstVoicing = voicings[0];
    const guitarState = firstVoicing
      ? voicingToGuitarState(firstVoicing.frets)
      : { ...initialGuitarState };

    set({
      targetRoot: root,
      targetQuality: quality,
      availableVoicings: voicings,
      currentVoicingIndex: 0,
      isCustomShape: false,
      guitarStringState: guitarState,
      detectedChord: null, // Clear detection when using solver
    });
  },

  setVoicingIndex: (index: number) => {
    const { availableVoicings } = get();
    if (index >= 0 && index < availableVoicings.length) {
      const voicing = availableVoicings[index];
      set({
        currentVoicingIndex: index,
        isCustomShape: false,
        guitarStringState: {
          0: voicing.frets[0],
          1: voicing.frets[1],
          2: voicing.frets[2],
          3: voicing.frets[3],
          4: voicing.frets[4],
          5: voicing.frets[5],
        },
      });
    }
  },

  setFret: (stringIndex: StringIndex, fret: FretNumber) => {
    const newGuitarState = {
      ...get().guitarStringState,
      [stringIndex]: fret,
    };
    set({
      guitarStringState: newGuitarState,
      isCustomShape: true,
      detectedChord: runChordDetection(newGuitarState),
      // Clear target chord when manually editing
      targetRoot: '',
      targetQuality: '',
      availableVoicings: [],
    });
  },

  clearString: (stringIndex: StringIndex) => {
    const newGuitarState = {
      ...get().guitarStringState,
      [stringIndex]: null,
    };
    set({
      guitarStringState: newGuitarState,
      isCustomShape: true,
      detectedChord: runChordDetection(newGuitarState),
    });
  },

  clearAllStrings: () => {
    set({
      guitarStringState: { ...initialGuitarState },
      isCustomShape: true,
      detectedChord: null,
      targetRoot: '',
      targetQuality: '',
      availableVoicings: [],
    });
  },

  setDisplayMode: (mode: DisplayMode) => {
    set({ displayMode: mode });
  },

  setPlaybackMode: (mode: PlaybackMode) => {
    set({ playbackMode: mode });
  },

  setVolume: (volume: number) => {
    set({ volume: Math.max(-60, Math.min(0, volume)) });
  },

  setAudioLoaded: (loaded: boolean) => {
    set({ isAudioLoaded: loaded });
  },
}));
