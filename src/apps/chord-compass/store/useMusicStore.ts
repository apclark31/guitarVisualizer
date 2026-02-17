import { create } from 'zustand';
import type {
  AppState,
  StringIndex,
  FretNumber,
  DisplayMode,
  GuitarStringState,
  DetectedChordInfo,
  VoicingType,
  VoicingFilterType,
  ChordSuggestion,
  ChordVoicing,
  ChordFamily,
  TuningChangeMode,
  KeyContext,
  KeySuggestion,
} from '../types';
import { getVoicingsForChord } from '../lib/chord-data';
import { detectChord } from '../lib/chord-detector';
import { analyzeVoicing } from '../lib/voicing-analyzer';
import { detectKeys, getNotesFromGuitarState } from '../../../shared/lib';
import { getFamilyForType, FRET_COUNT } from '../config/constants';
import { useSharedStore } from '../../../shared/store';
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

/** Run voicing analysis and key detection on current guitar state */
function analyzeGuitarState(
  guitarState: GuitarStringState,
  tuning: readonly string[]
): { suggestions: ChordSuggestion[]; voicingType: VoicingType | null; keySuggestions: KeySuggestion[] } {
  const analysis = analyzeVoicing(guitarState, tuning);
  const { notes, bassNote } = getNotesFromGuitarState(guitarState, tuning);
  const chordRoot = analysis.suggestions[0]?.root;
  return {
    suggestions: analysis.suggestions,
    voicingType: analysis.voicingType,
    keySuggestions: detectKeys(notes, bassNote, chordRoot),
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

// Helper to get current shared state
const getSharedState = () => useSharedStore.getState();

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
  keySuggestions: [],
  voicingType: null,
  voicingTypeFilter: 'all',

  // Key Context
  keyContext: null,

  // UI State
  displayMode: 'notes',
  isCustomShape: false,

  // Actions
  setTargetChord: (root: string, quality: string) => {
    const { voicingTypeFilter } = get();
    const tuning = getSharedState().tuning;
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
      detectedChord: null,
      suggestions: [],
      keySuggestions: [],
      voicingType: null,
    });
  },

  setChord: (root: string, family: ChordFamily, quality: string) => {
    const { voicingTypeFilter } = get();
    const tuning = getSharedState().tuning;
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
      suggestions: [],
      keySuggestions: [],
      voicingType: null,
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
    const tuning = getSharedState().tuning;
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
    let keySuggestions: KeySuggestion[] = [];
    let voicingType: VoicingType | null = null;
    if (noteCount >= 2) {
      ({ suggestions, voicingType, keySuggestions } = analyzeGuitarState(newGuitarState, tuning));
    }

    set({
      guitarStringState: newGuitarState,
      isCustomShape: true,
      detectedChord,
      suggestions,
      keySuggestions,
      voicingType,
      // Clear target chord when manually editing
      targetRoot: '',
      targetFamily: '',
      targetQuality: '',
      availableVoicings: [],
    });
  },

  clearString: (stringIndex: StringIndex) => {
    const tuning = getSharedState().tuning;
    const newGuitarState = {
      ...get().guitarStringState,
      [stringIndex]: null,
    };

    // Count notes for suggestion analysis
    const noteCount = Object.values(newGuitarState).filter(f => f !== null).length;

    // Run suggestion analysis if 2+ notes
    let suggestions: ChordSuggestion[] = [];
    let keySuggestions: KeySuggestion[] = [];
    let voicingType: VoicingType | null = null;
    if (noteCount >= 2) {
      ({ suggestions, voicingType, keySuggestions } = analyzeGuitarState(newGuitarState, tuning));
    }

    set({
      guitarStringState: newGuitarState,
      isCustomShape: true,
      detectedChord: runChordDetection(newGuitarState, tuning),
      suggestions,
      keySuggestions,
      voicingType,
    });
  },

  clearAllStrings: () => {
    set({
      guitarStringState: { ...initialGuitarState },
      isCustomShape: true,
      detectedChord: null,
      suggestions: [],
      keySuggestions: [],
      voicingType: null,
      voicingTypeFilter: 'all', // Reset filter to default
      targetRoot: '',
      targetFamily: '',
      targetQuality: '',
      availableVoicings: [],
      keyContext: null, // Also clear key context
    });
  },

  setDisplayMode: (mode: DisplayMode) => {
    set({ displayMode: mode });
  },

  applySuggestion: (suggestion: ChordSuggestion, filterOverride?: VoicingFilterType) => {
    const { guitarStringState, voicingTypeFilter } = get();
    const tuning = getSharedState().tuning;

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
      // Recompute key suggestions from the new voicing (chord notes still belong to keys)
      const newGuitarState = voicingToGuitarState(selectedVoicing.frets);
      const { notes, bassNote } = getNotesFromGuitarState(newGuitarState, tuning);
      const newKeySuggestions = detectKeys(notes, bassNote, suggestion.root);

      set({
        targetRoot: suggestion.root,
        targetFamily: family,
        targetQuality: suggestion.quality,
        availableVoicings: voicings,
        currentVoicingIndex: selectedIndex,
        guitarStringState: newGuitarState,
        isCustomShape: false,
        suggestions: [],
        keySuggestions: newKeySuggestions,
        voicingType: null,
        voicingTypeFilter: filter, // Update filter to match selection
        detectedChord: null,
      });
    }
  },

  applyContext: (suggestion: ChordSuggestion) => {
    // Keep user's current frets, just set the chord context for display
    const { voicingTypeFilter } = get();
    const tuning = getSharedState().tuning;
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
      keySuggestions: [],
      voicingType: null,
      detectedChord: null,
    });
  },

  setVoicingTypeFilter: (filter: VoicingFilterType) => {
    const { targetRoot, targetQuality } = get();
    const tuning = getSharedState().tuning;

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
    const oldTuning = getSharedState().tuning;
    const { guitarStringState, targetRoot, targetFamily, targetQuality, voicingTypeFilter } = get();

    // Update shared store first (simple tuning change)
    getSharedState().setTuning(newTuning, name);

    // Check if fretboard has any notes
    const hasNotes = Object.values(guitarStringState).some(f => f !== null);

    // If no notes, just change tuning
    if (!hasNotes || mode === 'clear') {
      set({
        guitarStringState: { ...initialGuitarState },
        detectedChord: null,
        suggestions: [],
        keySuggestions: [],
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
      // Keep same fret positions, pitch changes with new tuning
      // If a chord was selected, detect what it now represents and promote to selected chord

      if (targetRoot && targetQuality) {
        // A chord was selected - detect the new chord and set it as selected
        const noteCount = Object.values(guitarStringState).filter(f => f !== null).length;

        if (noteCount >= 2) {
          const analysis = analyzeVoicing(guitarStringState, newTuning);

          // Use the top suggestion (highest confidence) as the new chord
          if (analysis.suggestions.length > 0) {
            const topSuggestion = analysis.suggestions[0];
            const newFamily = getFamilyForType(topSuggestion.quality) || '';
            const voicings = getVoicingsForChord(topSuggestion.root, topSuggestion.quality, 12, voicingTypeFilter, newTuning);

            // Find matching voicing
            const matchingVoicing = findMatchingVoicing(guitarStringState, voicings);
            const selectedIndex = matchingVoicing ? voicings.indexOf(matchingVoicing) : -1;

            set({
              guitarStringState, // Keep same frets
              targetRoot: topSuggestion.root,
              targetFamily: newFamily,
              targetQuality: topSuggestion.quality,
              availableVoicings: voicings,
              currentVoicingIndex: selectedIndex >= 0 ? selectedIndex : 0,
              isCustomShape: selectedIndex < 0,
              detectedChord: null,
              suggestions: [],
              keySuggestions: [],
              voicingType: null,
            });
            return;
          }
        }

        // Fallback: couldn't detect a chord, enter free-form with detection
        const detectedChord = runChordDetection(guitarStringState, newTuning);
        set({
          isCustomShape: true,
          targetRoot: '',
          targetFamily: '',
          targetQuality: '',
          availableVoicings: [],
          detectedChord,
          suggestions: [],
          keySuggestions: [],
          voicingType: null,
        });
        return;
      }

      // No chord was selected - just update tuning and run detection
      const detectedChord = runChordDetection(guitarStringState, newTuning);
      const noteCount = Object.values(guitarStringState).filter(f => f !== null).length;
      let suggestions: ChordSuggestion[] = [];
      let keySuggestions: KeySuggestion[] = [];
      let voicingType: VoicingType | null = null;
      if (noteCount >= 2) {
        ({ suggestions, voicingType, keySuggestions } = analyzeGuitarState(guitarStringState, newTuning));
      }

      set({
        isCustomShape: true,
        targetRoot: '',
        targetFamily: '',
        targetQuality: '',
        availableVoicings: [],
        detectedChord,
        suggestions,
        keySuggestions,
        voicingType,
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

    // If a chord was selected, preserve chord identity and re-fetch voicings for new tuning
    if (targetRoot && targetQuality) {
      const voicings = getVoicingsForChord(targetRoot, targetQuality, 12, voicingTypeFilter, newTuning);

      // Try to find a voicing that matches the adapted frets
      const matchingVoicing = findMatchingVoicing(newGuitarState, voicings);
      const selectedIndex = matchingVoicing ? voicings.indexOf(matchingVoicing) : -1;

      set({
        guitarStringState: newGuitarState,
        targetRoot,
        targetFamily,
        targetQuality,
        availableVoicings: voicings,
        currentVoicingIndex: selectedIndex >= 0 ? selectedIndex : 0,
        isCustomShape: selectedIndex < 0, // Custom if adapted frets don't match any voicing
        detectedChord: null,
        suggestions: [],
        keySuggestions: [],
        voicingType: null,
      });
    } else {
      // Free-form mode - just adapt frets and run detection
      const detectedChord = runChordDetection(newGuitarState, newTuning);

      // Run suggestion analysis
      const noteCount = Object.values(newGuitarState).filter(f => f !== null).length;
      let suggestions: ChordSuggestion[] = [];
      let keySuggestions: KeySuggestion[] = [];
      let voicingType: VoicingType | null = null;
      if (noteCount >= 2) {
        ({ suggestions, voicingType, keySuggestions } = analyzeGuitarState(newGuitarState, newTuning));
      }

      set({
        guitarStringState: newGuitarState,
        isCustomShape: true,
        targetRoot: '',
        targetFamily: '',
        targetQuality: '',
        availableVoicings: [],
        detectedChord,
        suggestions,
        keySuggestions,
        voicingType,
      });
    }
  },

  setKeyContext: (keyContext: KeyContext | null) => {
    set({ keyContext });
  },

  restoreFromUrl: (params) => {
    const { guitarState, tuning, tuningName, root, quality, voicingIndex, keyContext } = params;
    const sharedState = getSharedState();
    const effectiveTuning = tuning || sharedState.tuning;
    const effectiveTuningName = tuningName || sharedState.tuningName;

    // Update shared store with restored tuning
    sharedState.setTuning([...effectiveTuning], effectiveTuningName);

    // If chord selection is provided, restore as selected chord
    if (root && quality) {
      const family = getFamilyForType(quality) || '';
      const voicings = getVoicingsForChord(root, quality, 12, 'all', effectiveTuning);

      // If a valid voicingIndex was provided, trust it (URL was generated with this index)
      if (voicingIndex !== undefined && voicingIndex >= 0 && voicingIndex < voicings.length) {
        const selectedVoicing = voicings[voicingIndex];

        set({
          keyContext: keyContext ?? null,
          guitarStringState: voicingToGuitarState(selectedVoicing.frets),
          targetRoot: root,
          targetFamily: family,
          targetQuality: quality,
          availableVoicings: voicings,
          currentVoicingIndex: voicingIndex,
          isCustomShape: false, // Trust the provided index
          detectedChord: null,
          suggestions: [],
          keySuggestions: [],
          voicingType: null,
        });
        return;
      }

      // No valid voicingIndex - try to find matching voicing from guitar state
      const matchingVoicing = findMatchingVoicing(guitarState, voicings);
      const selectedIndex = matchingVoicing ? voicings.indexOf(matchingVoicing) : 0;

      // Check if guitar state matches the selected voicing exactly
      const selectedVoicing = voicings[selectedIndex];
      let isCustom = false;
      if (selectedVoicing) {
        for (let i = 0; i < 6; i++) {
          if (guitarState[i as StringIndex] !== selectedVoicing.frets[i]) {
            isCustom = true;
            break;
          }
        }
      }

      set({
        keyContext: keyContext ?? null,
        guitarStringState: guitarState,
        targetRoot: root,
        targetFamily: family,
        targetQuality: quality,
        availableVoicings: voicings,
        currentVoicingIndex: selectedIndex,
        isCustomShape: isCustom,
        detectedChord: null,
        suggestions: [],
        keySuggestions: [],
        voicingType: null,
      });
    } else {
      // Free-form mode - run detection
      const detectedChord = runChordDetection(guitarState, effectiveTuning);

      // Run suggestion analysis
      const noteCount = Object.values(guitarState).filter(f => f !== null).length;
      let suggestions: ChordSuggestion[] = [];
      let keySuggestions: KeySuggestion[] = [];
      let voicingType: VoicingType | null = null;
      if (noteCount >= 2) {
        ({ suggestions, voicingType, keySuggestions } = analyzeGuitarState(guitarState, effectiveTuning));
      }

      set({
        keyContext: keyContext ?? null,
        guitarStringState: guitarState,
        targetRoot: '',
        targetFamily: '',
        targetQuality: '',
        availableVoicings: [],
        currentVoicingIndex: 0,
        isCustomShape: true,
        detectedChord,
        suggestions,
        keySuggestions,
        voicingType,
      });
    }
  },
}));
