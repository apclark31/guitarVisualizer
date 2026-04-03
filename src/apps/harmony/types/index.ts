// Harmony mode types

import type { ChordVoicing } from '../../chords/types';
import type { GuitarStringState, DisplayMode } from '../../../shared/types';

/** A single chord in the progression */
export interface ProgressionChord {
  /** Unique ID */
  id: string;
  /** Chord root note (e.g., "C", "D") */
  root: string;
  /** Chord quality (e.g., "Major", "Minor 7") */
  quality: string;
  /** Roman numeral label (e.g., "I", "ii", "V7") */
  numeral: string;
  /** Scale degree (1-7) */
  degree: number;
  /** Selected voicing index for this chord */
  voicingIndex: number;
}

/** Preset progression definition */
export interface Preset {
  id: string;
  name: string;
  /** Scale degrees (1-7) */
  degrees: number[];
  /** Optional description */
  description?: string;
}

/** Harmony store state */
export interface HarmonyState {
  // Progression
  progression: ProgressionChord[];
  selectedChordId: string | null;
  activePresetId: string | null;

  // Voicings for selected chord (lazy-fetched)
  availableVoicings: ChordVoicing[];

  // Playback
  tempo: number;
  isPlaying: boolean;
  playingChordId: string | null;

  // Display
  guitarStringState: GuitarStringState;
  displayMode: DisplayMode;

  // Actions
  addChord: (degree: number) => void;
  addCustomChord: (root: string, quality: string) => void;
  removeChord: (id: string) => void;
  clearProgression: () => void;
  selectChord: (id: string | null) => void;
  setVoicingIndex: (chordId: string, index: number) => void;
  setTempo: (bpm: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  loadPreset: (presetId: string) => void;
  setPlaying: (playing: boolean) => void;
  setPlayingChordId: (id: string | null) => void;
  restoreFromUrl: (params: {
    degrees: number[];
    tempo?: number;
  }) => void;
}
