import { create } from 'zustand';
import type {
  AppState,
  StringIndex,
  FretNumber,
  DisplayMode,
  PlaybackMode,
  GuitarStringState,
  DetectedChordInfo,
  VoicingType,
  VoicingFilterType,
  ChordSuggestion,
  ChordVoicing,
  ChordFamily,
  TuningChangeMode,
} from '../types';
import { getVoicingsForChord } from '../lib/chord-data';
import { detectChord } from '../lib/chord-detector';
import { analyzeVoicing } from '../lib/voicing-analyzer';
import { getFamilyForType, STANDARD_TUNING, FRET_COUNT } from '../config/constants';
import { Note } from '@tonaljs/tonal';

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
function runChordDetection(
  guitarState: GuitarStringState,
  tuning: readonly string[]
): DetectedChordInfo | null {
  const detected = detectChord(guitarState, tuning);
  if (!detected) return null;
  return {
    name: detected.name,
    alternatives: detected.alternatives,
    bassNote: detected.bassNote,
    isSlashChord: detected.isSlashChord,
  };
}

/** Find voicing that best matches user's current fret positions */
function findMatchingVoicing(
  currentState: GuitarStringState,
  voicings: ChordVoicing[]
): ChordVoicing | null {
  let bestMatch: ChordVoicing | null = null;
  let bestScore = 0;

  for (const voicing of voicings) {
    let score = 0;
    for (let i = 0; i < 6; i++) {
      const userFret = currentState[i as StringIndex];
      const voicingFret = voicing.frets[i];
      if (userFret !== null && userFret === voicingFret) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = voicing;
    }
  }

  return bestMatch;
}

export const useMusicStore = create<AppState>((set, get) => ({
  // User Selection (Target) - empty by default (free-form mode)
  targetRoot: '',
  targetFamily: '',
  targetQuality: '',

  // Solver Output
  availableVoicings: [],
  currentVoicingIndex: 0,

  // Physical State (Actual) - blank fretboard by default
  guitarStringState: { ...initialGuitarState },

  // Detected chord (from manual placement)
  detectedChord: null,

  // Suggestions (from voicing analyzer)
  suggestions: [],
  voicingType: null,
  voicingTypeFilter: 'all',

  // Tuning State
  tuning: [...STANDARD_TUNING],
  tuningName: 'Standard',

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
    const { voicingTypeFilter, tuning } = get();
    // Get voicings from chords-db (falls back to solver), respecting filter
    const voicings = getVoicingsForChord(root, quality, 12, voicingTypeFilter, tuning);

    // Derive family from quality
    const family = getFamilyForType(quality) || '';

    // Auto-select the first voicing if available
    const firstVoicing = voicings[0];
    const guitarState = firstVoicing
      ? voicingToGuitarState(firstVoicing.frets)
      : { ...initialGuitarState };

    set({
      targetRoot: root,
      targetFamily: family,
      targetQuality: quality,
      availableVoicings: voicings,
      currentVoicingIndex: 0,
      isCustomShape: false,
      guitarStringState: guitarState,
      detectedChord: null, // Clear detection when using solver
    });
  },

  setChord: (root: string, family: ChordFamily, quality: string) => {
    const { voicingTypeFilter, tuning } = get();
    // Get voicings from chords-db (falls back to solver), respecting filter
    const voicings = getVoicingsForChord(root, quality, 12, voicingTypeFilter, tuning);

    // Auto-select the first voicing if available
    const firstVoicing = voicings[0];
    const guitarState = firstVoicing
      ? voicingToGuitarState(firstVoicing.frets)
      : { ...initialGuitarState };

    set({
      targetRoot: root,
      targetFamily: family,
      targetQuality: quality,
      availableVoicings: voicings,
      currentVoicingIndex: 0,
      isCustomShape: false,
      guitarStringState: guitarState,
      detectedChord: null,
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
    const { tuning } = get();
    const newGuitarState = {
      ...get().guitarStringState,
      [stringIndex]: fret,
    };

    // Count notes for suggestion analysis
    const noteCount = Object.values(newGuitarState).filter(f => f !== null).length;

    // Run detection with current tuning
    const detectedChord = runChordDetection(newGuitarState, tuning);

    // Run suggestion analysis if 2+ notes
    let suggestions: ChordSuggestion[] = [];
    let voicingType: VoicingType | null = null;
    if (noteCount >= 2) {
      const analysis = analyzeVoicing(newGuitarState, tuning);
      suggestions = analysis.suggestions;
      voicingType = analysis.voicingType;
    }

    set({
      guitarStringState: newGuitarState,
      isCustomShape: true,
      detectedChord,
      suggestions,
      voicingType,
      // Clear target chord when manually editing
      targetRoot: '',
      targetFamily: '',
      targetQuality: '',
      availableVoicings: [],
    });
  },

  clearString: (stringIndex: StringIndex) => {
    const { tuning } = get();
    const newGuitarState = {
      ...get().guitarStringState,
      [stringIndex]: null,
    };

    // Count notes for suggestion analysis
    const noteCount = Object.values(newGuitarState).filter(f => f !== null).length;

    // Run suggestion analysis if 2+ notes
    let suggestions: ChordSuggestion[] = [];
    let voicingType: VoicingType | null = null;
    if (noteCount >= 2) {
      const analysis = analyzeVoicing(newGuitarState, tuning);
      suggestions = analysis.suggestions;
      voicingType = analysis.voicingType;
    }

    set({
      guitarStringState: newGuitarState,
      isCustomShape: true,
      detectedChord: runChordDetection(newGuitarState, tuning),
      suggestions,
      voicingType,
    });
  },

  clearAllStrings: () => {
    set({
      guitarStringState: { ...initialGuitarState },
      isCustomShape: true,
      detectedChord: null,
      suggestions: [],
      voicingType: null,
      voicingTypeFilter: 'all', // Reset filter to default
      targetRoot: '',
      targetFamily: '',
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

  applySuggestion: (suggestion: ChordSuggestion, filterOverride?: VoicingFilterType) => {
    const { guitarStringState, voicingTypeFilter, tuning } = get();

    // Determine filter: use override if provided, otherwise current filter
    const filter = filterOverride ?? voicingTypeFilter;
    const voicings = getVoicingsForChord(suggestion.root, suggestion.quality, 12, filter, tuning);

    // Derive family from quality
    const family = getFamilyForType(suggestion.quality) || '';

    // Try to find a voicing that preserves user's current fret positions
    const matchingVoicing = findMatchingVoicing(guitarStringState, voicings);
    const selectedIndex = matchingVoicing
      ? voicings.indexOf(matchingVoicing)
      : 0;
    const selectedVoicing = voicings[selectedIndex] || voicings[0];

    if (selectedVoicing) {
      set({
        targetRoot: suggestion.root,
        targetFamily: family,
        targetQuality: suggestion.quality,
        availableVoicings: voicings,
        currentVoicingIndex: selectedIndex,
        guitarStringState: voicingToGuitarState(selectedVoicing.frets),
        isCustomShape: false,
        suggestions: [],
        voicingType: null,
        voicingTypeFilter: filter, // Update filter to match selection
        detectedChord: null,
      });
    }
  },

  applyContext: (suggestion: ChordSuggestion) => {
    // Keep user's current frets, just set the chord context for display
    const { voicingTypeFilter, tuning } = get();
    const voicings = getVoicingsForChord(suggestion.root, suggestion.quality, 12, voicingTypeFilter, tuning);

    // Derive family from quality
    const family = getFamilyForType(suggestion.quality) || '';

    set({
      targetRoot: suggestion.root,
      targetFamily: family,
      targetQuality: suggestion.quality,
      availableVoicings: voicings,
      currentVoicingIndex: -1, // -1 indicates custom/user shape
      isCustomShape: true,
      suggestions: [],
      voicingType: null,
      detectedChord: null,
    });
  },

  setVoicingTypeFilter: (filter: VoicingFilterType) => {
    const { targetRoot, targetQuality, tuning } = get();

    // If a chord is already selected, re-fetch voicings with new filter
    if (targetRoot && targetQuality) {
      const voicings = getVoicingsForChord(targetRoot, targetQuality, 12, filter, tuning);
      const firstVoicing = voicings[0];
      const guitarState = firstVoicing
        ? voicingToGuitarState(firstVoicing.frets)
        : { ...initialGuitarState };

      set({
        voicingTypeFilter: filter,
        availableVoicings: voicings,
        currentVoicingIndex: 0,
        guitarStringState: guitarState,
        isCustomShape: false,
      });
    } else {
      set({ voicingTypeFilter: filter });
    }
  },

  setTuning: (newTuning: string[], name: string, mode: TuningChangeMode) => {
    const { tuning: oldTuning, guitarStringState } = get();

    // Check if fretboard has any notes
    const hasNotes = Object.values(guitarStringState).some(f => f !== null);

    // If no notes, just change tuning
    if (!hasNotes || mode === 'clear') {
      set({
        tuning: newTuning,
        tuningName: name,
        guitarStringState: { ...initialGuitarState },
        detectedChord: null,
        suggestions: [],
        voicingType: null,
        targetRoot: '',
        targetFamily: '',
        targetQuality: '',
        availableVoicings: [],
        isCustomShape: false,
      });
      return;
    }

    if (mode === 'keep') {
      // Keep same fret positions, just update tuning
      // Re-run detection with new tuning context
      set({
        tuning: newTuning,
        tuningName: name,
        isCustomShape: true,
        targetRoot: '',
        targetFamily: '',
        targetQuality: '',
        availableVoicings: [],
      });
      return;
    }

    // mode === 'adapt': Transpose frets to maintain pitch
    const newGuitarState: GuitarStringState = { ...initialGuitarState };

    for (let i = 0; i < 6; i++) {
      const stringIndex = i as StringIndex;
      const oldFret = guitarStringState[stringIndex];

      if (oldFret === null) {
        newGuitarState[stringIndex] = null;
        continue;
      }

      const oldOpenMidi = Note.midi(oldTuning[i]);
      const newOpenMidi = Note.midi(newTuning[i]);

      if (oldOpenMidi === null || newOpenMidi === null) {
        newGuitarState[stringIndex] = null;
        continue;
      }

      // Calculate new fret to maintain the same pitch
      const delta = oldOpenMidi - newOpenMidi;
      const newFret = oldFret + delta;

      // Check bounds
      if (newFret < 0 || newFret > FRET_COUNT) {
        // Out of bounds - mute this string
        newGuitarState[stringIndex] = null;
      } else {
        newGuitarState[stringIndex] = newFret;
      }
    }

    set({
      tuning: newTuning,
      tuningName: name,
      guitarStringState: newGuitarState,
      isCustomShape: true,
      targetRoot: '',
      targetFamily: '',
      targetQuality: '',
      availableVoicings: [],
      detectedChord: null,
      suggestions: [],
      voicingType: null,
    });
  },
}));
