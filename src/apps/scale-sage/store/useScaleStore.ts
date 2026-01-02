import { create } from 'zustand';
import type { DisplayMode } from '../../../shared/types';
import { useSharedStore } from '../../../shared/store';

/** Scale types supported in Phase S1 */
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

  // Actions
  setScaleRoot: (root: string | null) => void;
  setScaleType: (type: ScaleType | null) => void;
  setPosition: (position: number) => void;
  setPositionType: (type: PositionType) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setPlaybackDirection: (direction: PlaybackDirection) => void;
  clearScale: () => void;
}

/**
 * Scale Sage store for scale-specific state.
 * Tuning and audio settings come from the shared store.
 */
export const useScaleStore = create<ScaleState>((set) => ({
  // Scale selection - empty by default
  scaleRoot: null,
  scaleType: null,

  // Position navigation
  currentPosition: 1, // Start at position 1
  positionType: 'boxes', // Default to box patterns

  // UI state
  displayMode: 'notes',
  playbackDirection: 'ascending',

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
  }),
}));

// Re-export shared store for convenience
export { useSharedStore };
