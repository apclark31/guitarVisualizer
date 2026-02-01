import { create } from 'zustand';
import type { DisplayMode, GuitarStringState, StringIndex } from '../../../shared/types';
import { useSharedStore } from '../../../shared/store';
import { detectScales, type ScaleSuggestion } from '../lib/scale-detector';
import { detectKeys, getNotesFromGuitarState, type KeyMatch } from '../../../shared/lib';

/** Scale types supported */
export type ScaleType =
  | 'major'
  | 'minor'
  | 'major-pentatonic'
  | 'minor-pentatonic'
  | 'blues';

/** Position display type */
export type PositionType = '3nps' | 'boxes' | 'full';

/** Scale playback direction */
export type PlaybackDirection = 'ascending' | 'descending';

/** Initial guitar state - all strings muted */
const initialGuitarState: GuitarStringState = {
  0: null,
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
};

/** Scale Sage app state */
export interface ScaleState {
  // Scale selection
  scaleRoot: string | null;
  scaleType: ScaleType | null;

  // Position navigation
  currentPosition: number; // 0 = full fretboard, 1-7 = positions
  positionType: PositionType;

  // UI state
  displayMode: DisplayMode;
  playbackDirection: PlaybackDirection;

  // Free Play state
  guitarStringState: GuitarStringState;
  scaleSuggestions: ScaleSuggestion[];
  keySuggestions: KeyMatch[];

  // Actions
  setScaleRoot: (root: string | null) => void;
  setScaleType: (type: ScaleType | null) => void;
  setPosition: (position: number) => void;
  setPositionType: (type: PositionType) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setPlaybackDirection: (direction: PlaybackDirection) => void;
  clearScale: () => void;

  // Free Play actions
  setFret: (stringIndex: StringIndex, fret: number | null) => void;
  clearFrets: () => void;
  applyScaleSuggestion: (suggestion: ScaleSuggestion) => void;
}

/**
 * Scale Sage store for scale-specific state.
 * Tuning and audio settings come from the shared store.
 */
export const useScaleStore = create<ScaleState>((set, get) => ({
  // Scale selection - empty by default (free-play mode)
  scaleRoot: null,
  scaleType: null,

  // Position navigation
  currentPosition: 1, // Start at position 1
  positionType: 'boxes', // Default to box patterns

  // UI state
  displayMode: 'notes',
  playbackDirection: 'ascending',

  // Free Play state - empty fretboard by default
  guitarStringState: { ...initialGuitarState },
  scaleSuggestions: [],
  keySuggestions: [],

  // Actions
  setScaleRoot: (root) => set({ scaleRoot: root }),

  setScaleType: (type) => set({ scaleType: type }),

  setPosition: (position) => set({ currentPosition: position }),

  setPositionType: (type) => set({ positionType: type }),

  setDisplayMode: (mode) => set({ displayMode: mode }),

  setPlaybackDirection: (direction) => set({ playbackDirection: direction }),

  clearScale: () => set({
    scaleRoot: null,
    scaleType: null,
    currentPosition: 1,
    // Keep frets if any - user might want to continue exploring
  }),

  // Free Play actions
  setFret: (stringIndex: StringIndex, fret: number | null) => {
    const { guitarStringState } = get();
    const tuning = useSharedStore.getState().tuning;

    const newGuitarState = {
      ...guitarStringState,
      [stringIndex]: fret,
    };

    // Count notes for detection
    const noteCount = Object.values(newGuitarState).filter(f => f !== null).length;

    // Run detection if 2+ notes
    let scaleSuggestions: ScaleSuggestion[] = [];
    let keySuggestions: KeyMatch[] = [];

    if (noteCount >= 2) {
      const { notes, bassNote } = getNotesFromGuitarState(newGuitarState, tuning);
      scaleSuggestions = detectScales(notes, bassNote);
      keySuggestions = detectKeys(notes, bassNote);
    }

    set({
      guitarStringState: newGuitarState,
      scaleSuggestions,
      keySuggestions,
      // Clear scale selection when manually editing
      scaleRoot: null,
      scaleType: null,
    });
  },

  clearFrets: () => set({
    guitarStringState: { ...initialGuitarState },
    scaleSuggestions: [],
    keySuggestions: [],
    scaleRoot: null,
    scaleType: null,
  }),

  applyScaleSuggestion: (suggestion: ScaleSuggestion) => {
    set({
      scaleRoot: suggestion.root,
      scaleType: suggestion.type,
      currentPosition: 1,
      // Clear free-play state
      guitarStringState: { ...initialGuitarState },
      scaleSuggestions: [],
      keySuggestions: [],
    });
  },
}));

// Re-export shared store for convenience
export { useSharedStore };

// Re-export types for convenience
export type { ScaleSuggestion } from '../lib/scale-detector';
export type { KeyMatch } from '../../../shared/lib';
