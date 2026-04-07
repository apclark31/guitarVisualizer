import { create } from 'zustand';
import type { HarmonyState, ProgressionChord } from '../types';
import type { GuitarStringState, StringIndex } from '../../../shared/types';
import type { ChordVoicing } from '../../chords/types';
import { useSharedStore } from '../../../shared/store';
import { getDiatonicChords } from '../../chords/config/constants';
import { getVoicingsForChord } from '../../chords/lib/chord-data';
import { getPresetById } from '../config/presets';

/** Session-scoped unique ID from session start, degree, and position in progression */
const SESSION_ID = Date.now();
function generateChordId(degree: number, position: number): string {
  return `${SESSION_ID}-${degree}-${position}`;
}

/** Default empty guitar state */
const EMPTY_GUITAR_STATE: GuitarStringState = {
  0: null, 1: null, 2: null, 3: null, 4: null, 5: null,
};

/** Map chord family to quality string for voicing lookup */
function familyToQuality(family: string): string {
  switch (family) {
    case 'Major': return 'Major';
    case 'Minor': return 'Minor';
    case 'Diminished': return 'Diminished';
    case 'Augmented': return 'Augmented';
    default: return 'Major';
  }
}

/** Build a ProgressionChord from a scale degree in the current key */
function buildChordFromDegree(degree: number, position: number): ProgressionChord | null {
  const { keyContext } = useSharedStore.getState();
  if (!keyContext) return null;

  const diatonic = getDiatonicChords(keyContext.root, keyContext.type);
  const chord = diatonic[degree - 1];
  if (!chord) return null;

  return {
    id: generateChordId(degree, position),
    root: chord.root,
    quality: familyToQuality(chord.family),
    numeral: chord.numeral,
    degree,
    voicingIndex: 0,
  };
}

/** Fetch voicings and update guitarStringState for a chord */
function fetchVoicingsForChord(
  chord: ProgressionChord
): { voicings: ChordVoicing[]; guitarState: GuitarStringState } {
  const { tuning } = useSharedStore.getState();
  const voicings = getVoicingsForChord(chord.root, chord.quality, 12, 'all', tuning);

  const voicing = voicings[chord.voicingIndex] ?? voicings[0];
  const guitarState = voicing
    ? voicing.frets.reduce((acc, fret, i) => {
        acc[i as StringIndex] = fret;
        return acc;
      }, { ...EMPTY_GUITAR_STATE })
    : { ...EMPTY_GUITAR_STATE };

  return { voicings, guitarState };
}

export const useHarmonyStore = create<HarmonyState>((set, get) => ({
  // Progression
  progression: [],
  selectedChordId: null,
  activePresetId: null,

  // Voicings
  availableVoicings: [],

  // Playback
  tempo: 100,
  isPlaying: false,
  playingChordId: null,

  // Display
  guitarStringState: { ...EMPTY_GUITAR_STATE },
  displayMode: 'notes',

  // Actions
  addChord: (degree: number) => {
    const position = get().progression.length;
    const chord = buildChordFromDegree(degree, position);
    if (!chord) return;

    const progression = [...get().progression, chord];
    set({ progression, activePresetId: null });

    // Auto-select the new chord if none selected
    if (!get().selectedChordId) {
      get().selectChord(chord.id);
    }
  },

  addCustomChord: (root: string, quality: string) => {
    // Try to detect if this chord is diatonic in the current key
    const { keyContext } = useSharedStore.getState();
    let numeral = '';
    let degree = 0;

    if (keyContext) {
      const diatonic = getDiatonicChords(keyContext.root, keyContext.type);
      const match = diatonic.find(d => d.root === root && familyToQuality(d.family) === quality);
      if (match) {
        numeral = match.numeral;
        degree = match.degree;
      }
    }

    const position = get().progression.length;
    const chord: ProgressionChord = {
      id: generateChordId(degree, position),
      root,
      quality,
      numeral,
      degree,
      voicingIndex: 0,
    };

    const progression = [...get().progression, chord];
    set({ progression, activePresetId: null });

    if (!get().selectedChordId) {
      get().selectChord(chord.id);
    }
  },

  removeChord: (id: string) => {
    const { progression, selectedChordId } = get();
    const newProgression = progression.filter(c => c.id !== id);
    const updates: Partial<HarmonyState> = {
      progression: newProgression,
      activePresetId: null,
    };

    // If we removed the selected chord, select the first remaining or clear
    if (selectedChordId === id) {
      if (newProgression.length > 0) {
        set(updates);
        get().selectChord(newProgression[0].id);
        return;
      } else {
        updates.selectedChordId = null;
        updates.availableVoicings = [];
        updates.guitarStringState = { ...EMPTY_GUITAR_STATE };
      }
    }

    set(updates);
  },

  clearProgression: () => {
    set({
      progression: [],
      selectedChordId: null,
      activePresetId: null,
      availableVoicings: [],
      guitarStringState: { ...EMPTY_GUITAR_STATE },
      isPlaying: false,
      playingChordId: null,
    });
  },

  selectChord: (id: string | null) => {
    if (!id) {
      set({
        selectedChordId: null,
        availableVoicings: [],
        guitarStringState: { ...EMPTY_GUITAR_STATE },
      });
      return;
    }

    const chord = get().progression.find(c => c.id === id);
    if (!chord) return;

    const { voicings, guitarState } = fetchVoicingsForChord(chord);
    set({
      selectedChordId: id,
      availableVoicings: voicings,
      guitarStringState: guitarState,
    });
  },

  setVoicingIndex: (chordId: string, index: number) => {
    const { progression, selectedChordId } = get();
    const newProgression = progression.map(c =>
      c.id === chordId ? { ...c, voicingIndex: index } : c
    );
    set({ progression: newProgression });

    // If this is the selected chord, update fretboard
    if (selectedChordId === chordId) {
      const chord = newProgression.find(c => c.id === chordId);
      if (chord) {
        const { voicings, guitarState } = fetchVoicingsForChord(chord);
        set({ availableVoicings: voicings, guitarStringState: guitarState });
      }
    }
  },

  setTempo: (bpm: number) => {
    set({ tempo: Math.max(40, Math.min(240, bpm)) });
  },

  setDisplayMode: (mode) => {
    set({ displayMode: mode });
  },

  loadPreset: (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    const { keyContext } = useSharedStore.getState();
    if (!keyContext) return;

    const chords = preset.degrees
      .map((d, i) => buildChordFromDegree(d, i))
      .filter((c): c is ProgressionChord => c !== null);

    set({
      progression: chords,
      activePresetId: presetId,
      selectedChordId: null,
      availableVoicings: [],
      guitarStringState: { ...EMPTY_GUITAR_STATE },
      isPlaying: false,
      playingChordId: null,
    });

    // Auto-select first chord
    if (chords.length > 0) {
      get().selectChord(chords[0].id);
    }
  },

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
    if (!playing) {
      set({ playingChordId: null });
    }
  },

  setPlayingChordId: (id: string | null) => {
    set({ playingChordId: id });

    // Update fretboard to show the playing chord
    if (id) {
      const chord = get().progression.find(c => c.id === id);
      if (chord) {
        const { voicings, guitarState } = fetchVoicingsForChord(chord);
        set({
          selectedChordId: id,
          availableVoicings: voicings,
          guitarStringState: guitarState,
        });
      }
    }
  },

  restoreFromUrl: ({ degrees, tempo }) => {
    const { keyContext } = useSharedStore.getState();
    if (!keyContext || degrees.length === 0) return;

    const chords = degrees
      .map((d, i) => buildChordFromDegree(d, i))
      .filter((c): c is ProgressionChord => c !== null);

    set({
      progression: chords,
      activePresetId: null,
      tempo: tempo ?? 100,
      selectedChordId: null,
      availableVoicings: [],
      guitarStringState: { ...EMPTY_GUITAR_STATE },
    });

    if (chords.length > 0) {
      get().selectChord(chords[0].id);
    }
  },
}));
