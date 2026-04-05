import { create } from 'zustand';
import type { PlaybackMode, Instrument, KeyContext } from '../types';
import { STANDARD_TUNING } from '../config/constants';

/** Shared state used across Fret Atlas apps */
export interface SharedState {
  // Tuning State
  tuning: string[];
  tuningName: string;

  // Audio State
  isAudioLoaded: boolean;
  volume: number;
  playbackMode: PlaybackMode;
  currentInstrument: Instrument;

  // Key Context (shared across modes)
  keyContext: KeyContext | null;

  // Tuning Actions
  setTuning: (tuning: string[], name: string) => void;

  // Audio Actions
  setAudioLoaded: (loaded: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setInstrument: (instrument: Instrument) => void;

  // Key Context Actions
  setKeyContext: (keyContext: KeyContext | null) => void;

  // Library Panel
  isLibraryOpen: boolean;
  activeLibraryTab: string;
  matchCount: number;
  openLibrary: (tabId?: string) => void;
  closeLibrary: () => void;
  setActiveLibraryTab: (tabId: string) => void;
  setMatchCount: (count: number) => void;
}

/**
 * Shared store for state that's common across Fret Atlas apps.
 * Both Chord Compass and Scale Sage use this for tuning and audio settings.
 */
export const useSharedStore = create<SharedState>((set) => ({
  // Tuning State - defaults to Standard tuning
  tuning: [...STANDARD_TUNING],
  tuningName: 'Standard',

  // Audio State
  isAudioLoaded: false,
  volume: -12, // dB
  playbackMode: 'strum',
  currentInstrument: 'guitar',

  // Key Context
  keyContext: null,

  // Tuning Actions
  setTuning: (tuning: string[], name: string) => {
    set({ tuning, tuningName: name });
  },

  // Audio Actions
  setAudioLoaded: (loaded: boolean) => {
    set({ isAudioLoaded: loaded });
  },

  setVolume: (volume: number) => {
    set({ volume: Math.max(-60, Math.min(0, volume)) });
  },

  setPlaybackMode: (mode: PlaybackMode) => {
    set({ playbackMode: mode });
  },

  setInstrument: (instrument: Instrument) => {
    set({ currentInstrument: instrument });
  },

  // Key Context Actions
  setKeyContext: (keyContext: KeyContext | null) => {
    set({ keyContext });
  },

  // Library Panel
  isLibraryOpen: false,
  activeLibraryTab: 'library',
  matchCount: 0,
  openLibrary: (tabId?: string) => set((state) => ({
    isLibraryOpen: true,
    activeLibraryTab: tabId ?? state.activeLibraryTab,
  })),
  closeLibrary: () => set({ isLibraryOpen: false }),
  setActiveLibraryTab: (tabId: string) => set({ activeLibraryTab: tabId }),
  setMatchCount: (count: number) => set({ matchCount: count }),
}));
