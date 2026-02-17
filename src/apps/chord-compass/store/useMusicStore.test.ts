import { describe, it, expect, beforeEach } from 'vitest';
import { useMusicStore } from './useMusicStore';
import { useSharedStore } from '../../../shared/store';
import { STANDARD_TUNING, TUNING_PRESETS } from '../config/constants';
import type { GuitarStringState, ChordSuggestion, StringIndex } from '../types';

/** Initial blank fretboard */
const blankFrets: GuitarStringState = {
  0: null, 1: null, 2: null, 3: null, 4: null, 5: null,
};

const DROP_D = TUNING_PRESETS.find(t => t.name === 'Drop D')!.notes;

beforeEach(() => {
  useMusicStore.setState({
    targetRoot: '', targetFamily: '', targetQuality: '',
    availableVoicings: [], currentVoicingIndex: 0,
    guitarStringState: { ...blankFrets },
    detectedChord: null, suggestions: [], keySuggestions: [], voicingType: null,
    voicingTypeFilter: 'all', keyContext: null, displayMode: 'notes', isCustomShape: false,
  });
  useSharedStore.getState().setTuning([...STANDARD_TUNING], 'Standard');
});

// ─── Helpers ────────────────────────────────────────────────────────

/** Shorthand to get current store state */
const state = () => useMusicStore.getState();

/** Assert all stale suggestion fields are cleared */
function expectStaleCleared() {
  const s = state();
  expect(s.suggestions).toEqual([]);
  expect(s.keySuggestions).toEqual([]);
  expect(s.voicingType).toBeNull();
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('useMusicStore', () => {

  // ── setTargetChord ────────────────────────────────────────────────

  describe('setTargetChord', () => {
    it('sets targetRoot, targetQuality, targetFamily', () => {
      state().setTargetChord('C', 'Major');
      expect(state().targetRoot).toBe('C');
      expect(state().targetQuality).toBe('Major');
      expect(state().targetFamily).toBe('Major');
    });

    it('populates availableVoicings and applies first voicing to guitarStringState', () => {
      state().setTargetChord('A', 'Minor');
      expect(state().availableVoicings.length).toBeGreaterThan(0);
      expect(state().currentVoicingIndex).toBe(0);
      // At least one string should be non-null
      const frets = Object.values(state().guitarStringState);
      expect(frets.some(f => f !== null)).toBe(true);
    });

    it('clears suggestions, keySuggestions, voicingType', () => {
      // Seed stale data
      useMusicStore.setState({
        suggestions: [{ root: 'X', quality: 'X' } as ChordSuggestion],
        keySuggestions: [{ key: 'C', type: 'major' }] as never[],
        voicingType: 'triad',
      });
      state().setTargetChord('G', 'Major');
      expectStaleCleared();
    });

    it('clears detectedChord', () => {
      useMusicStore.setState({ detectedChord: { name: 'X', alternatives: [], bassNote: 'X', isSlashChord: false } });
      state().setTargetChord('E', 'Minor');
      expect(state().detectedChord).toBeNull();
    });
  });

  // ── setChord ──────────────────────────────────────────────────────

  describe('setChord', () => {
    it('sets targetRoot, targetFamily, targetQuality with explicit family', () => {
      state().setChord('D', 'Minor', 'Minor 7');
      expect(state().targetRoot).toBe('D');
      expect(state().targetFamily).toBe('Minor');
      expect(state().targetQuality).toBe('Minor 7');
    });

    it('populates voicings and applies to fretboard', () => {
      state().setChord('A', 'Major', 'Major');
      expect(state().availableVoicings.length).toBeGreaterThan(0);
      const frets = Object.values(state().guitarStringState);
      expect(frets.some(f => f !== null)).toBe(true);
    });

    it('clears stale state', () => {
      useMusicStore.setState({
        suggestions: [{ root: 'X' } as ChordSuggestion],
        keySuggestions: [{ key: 'G' }] as never[],
        voicingType: 'full',
      });
      state().setChord('C', 'Major', 'Major');
      expectStaleCleared();
    });
  });

  // ── setFret ───────────────────────────────────────────────────────

  describe('setFret', () => {
    it('single note: no suggestions generated', () => {
      state().setFret(0 as StringIndex, 3);
      expect(state().guitarStringState[0]).toBe(3);
      expect(state().suggestions).toEqual([]);
      expect(state().keySuggestions).toEqual([]);
    });

    it('two+ notes: populates suggestions, keySuggestions, voicingType', () => {
      // Place two notes to trigger analysis
      state().setFret(4 as StringIndex, 0); // B string open
      state().setFret(3 as StringIndex, 0); // G string open
      const s = state();
      expect(s.suggestions.length).toBeGreaterThan(0);
      expect(s.keySuggestions.length).toBeGreaterThan(0);
      expect(s.voicingType).not.toBeNull();
    });

    it('clears target chord and enters free-form', () => {
      // First set a chord, then manually edit
      state().setTargetChord('C', 'Major');
      expect(state().targetRoot).toBe('C');

      state().setFret(2 as StringIndex, 5);
      expect(state().targetRoot).toBe('');
      expect(state().targetQuality).toBe('');
      expect(state().availableVoicings).toEqual([]);
    });

    it('sets isCustomShape = true', () => {
      state().setFret(0 as StringIndex, 0);
      expect(state().isCustomShape).toBe(true);
    });
  });

  // ── clearAllStrings ───────────────────────────────────────────────

  describe('clearAllStrings', () => {
    it('resets all fretboard and detection state', () => {
      // Set up state
      state().setTargetChord('G', 'Major');
      useMusicStore.setState({ keyContext: { root: 'C', type: 'major' } });

      state().clearAllStrings();
      const s = state();
      expect(s.guitarStringState).toEqual(blankFrets);
      expect(s.targetRoot).toBe('');
      expect(s.targetQuality).toBe('');
      expect(s.availableVoicings).toEqual([]);
      expect(s.detectedChord).toBeNull();
      expect(s.keyContext).toBeNull();
      expect(s.voicingTypeFilter).toBe('all');
      expectStaleCleared();
    });
  });

  // ── applySuggestion ───────────────────────────────────────────────

  describe('applySuggestion', () => {
    it('sets target chord from suggestion, clears chord suggestions', () => {
      const suggestion: ChordSuggestion = {
        root: 'E', quality: 'Minor', displayName: 'Em',
        confidence: 0.9, voicingType: 'triad',
        missingIntervals: [], presentIntervals: ['R', 'b3', '5'],
      };

      state().applySuggestion(suggestion);
      expect(state().targetRoot).toBe('E');
      expect(state().targetQuality).toBe('Minor');
      expect(state().isCustomShape).toBe(false);
      expect(state().suggestions).toEqual([]);
      expect(state().voicingType).toBeNull();
    });

    it('applies filterOverride when provided', () => {
      const suggestion: ChordSuggestion = {
        root: 'A', quality: 'Major', displayName: 'A',
        confidence: 0.9, voicingType: 'full',
        missingIntervals: [], presentIntervals: ['R', '3', '5'],
      };

      state().applySuggestion(suggestion, 'triads');
      expect(state().voicingTypeFilter).toBe('triads');
    });

    it('recomputes keySuggestions from chord voicing (not stale free-play keys)', () => {
      // Seed stale keySuggestions from a previous free-play session
      useMusicStore.setState({
        keySuggestions: [{ key: 'C major', confidence: 1 }] as never[],
      });

      const suggestion: ChordSuggestion = {
        root: 'C', quality: 'Major', displayName: 'C',
        confidence: 0.95, voicingType: 'full',
        missingIntervals: [], presentIntervals: ['R', '3', '5'],
      };

      state().applySuggestion(suggestion);
      // keySuggestions should be freshly computed from the chord voicing, not stale
      const keys = state().keySuggestions;
      // C Major chord notes belong to keys — should have results
      expect(keys.length).toBeGreaterThan(0);
      // Verify they are real KeySuggestion objects, not the stale seed data
      expect(keys[0]).toHaveProperty('root');
      expect(keys[0]).toHaveProperty('type');
      expect(keys[0]).toHaveProperty('display');
    });
  });

  // ── applyContext ──────────────────────────────────────────────────

  describe('applyContext', () => {
    it('keeps guitarStringState unchanged', () => {
      // Place some notes manually
      state().setFret(0 as StringIndex, 0);
      state().setFret(1 as StringIndex, 2);
      const fretsBefore = { ...state().guitarStringState };

      const suggestion: ChordSuggestion = {
        root: 'E', quality: 'Minor', displayName: 'Em',
        confidence: 0.8, voicingType: 'partial',
        missingIntervals: ['5'], presentIntervals: ['R', 'b3'],
      };

      state().applyContext(suggestion);
      expect(state().guitarStringState).toEqual(fretsBefore);
    });

    it('sets currentVoicingIndex = -1 and isCustomShape = true', () => {
      const suggestion: ChordSuggestion = {
        root: 'A', quality: 'Minor', displayName: 'Am',
        confidence: 0.8, voicingType: 'triad',
        missingIntervals: [], presentIntervals: ['R', 'b3', '5'],
      };

      state().applyContext(suggestion);
      expect(state().currentVoicingIndex).toBe(-1);
      expect(state().isCustomShape).toBe(true);
    });

    it('clears stale state including keySuggestions (regression test)', () => {
      useMusicStore.setState({
        suggestions: [{ root: 'X' } as ChordSuggestion],
        keySuggestions: [{ key: 'G major' }] as never[],
        voicingType: 'shell-major',
      });

      const suggestion: ChordSuggestion = {
        root: 'C', quality: 'Major', displayName: 'C',
        confidence: 0.7, voicingType: 'partial',
        missingIntervals: ['5'], presentIntervals: ['R', '3'],
      };

      state().applyContext(suggestion);
      expectStaleCleared();
    });
  });

  // ── setTuning: clear ─────────────────────────────────────────────

  describe('setTuning', () => {
    describe('mode: clear', () => {
      it('clears fretboard and all suggestion/detection state', () => {
        state().setTargetChord('G', 'Major');
        state().setTuning([...DROP_D], 'Drop D', 'clear');

        const s = state();
        expect(s.guitarStringState).toEqual(blankFrets);
        expect(s.targetRoot).toBe('');
        expect(s.targetQuality).toBe('');
        expect(s.availableVoicings).toEqual([]);
        expectStaleCleared();
      });

      it('updates shared store tuning', () => {
        state().setTuning([...DROP_D], 'Drop D', 'clear');
        const shared = useSharedStore.getState();
        expect(shared.tuningName).toBe('Drop D');
        expect(shared.tuning).toEqual([...DROP_D]);
      });
    });

    // ── setTuning: keep ───────────────────────────────────────────

    describe('mode: keep', () => {
      it('with chord selected: re-detects chord identity, clears stale state', () => {
        // Select A Major in standard tuning
        state().setTargetChord('A', 'Major');
        const fretsBefore = { ...state().guitarStringState };

        // Switch to Drop D with keep — same frets, different pitch on string 0
        state().setTuning([...DROP_D], 'Drop D', 'keep');

        const s = state();
        // Frets should be preserved
        expect(s.guitarStringState).toEqual(fretsBefore);
        // Chord identity may change (string 0 is now D2 instead of E2)
        // The store should have re-detected and set a valid chord
        expect(s.targetRoot).not.toBe('');
        expectStaleCleared();
      });

      it('with no chord: runs detection + analysis on unchanged frets', () => {
        // Place manual notes (E and A open strings)
        state().setFret(0 as StringIndex, 0);
        state().setFret(1 as StringIndex, 0);

        // Clear target but keep frets
        useMusicStore.setState({ targetRoot: '', targetQuality: '' });

        state().setTuning([...DROP_D], 'Drop D', 'keep');
        const s = state();
        // Should have run analysis since 2+ notes
        expect(s.suggestions.length).toBeGreaterThan(0);
        expect(s.keySuggestions.length).toBeGreaterThan(0);
      });

      it('always updates shared store tuning', () => {
        state().setFret(0 as StringIndex, 0);
        state().setTuning([...DROP_D], 'Drop D', 'keep');
        expect(useSharedStore.getState().tuningName).toBe('Drop D');
      });
    });

    // ── setTuning: adapt ──────────────────────────────────────────

    describe('mode: adapt', () => {
      it('with chord selected: transposes frets and preserves chord identity', () => {
        // Set a chord in standard tuning
        state().setTargetChord('A', 'Major');
        const fretsBefore = { ...state().guitarStringState };

        // Adapt to Drop D — string 0 drops 2 semitones, so fret should increase by 2
        state().setTuning([...DROP_D], 'Drop D', 'adapt');

        const s = state();
        // String 0 should have been transposed (if it had a note)
        if (fretsBefore[0] !== null) {
          expect(s.guitarStringState[0]).toBe(fretsBefore[0]! + 2);
        }
        // Chord identity should be preserved
        expect(s.targetRoot).toBe('A');
        expect(s.targetQuality).toBe('Major');
        expectStaleCleared();
      });

      it('mutes strings that go out of bounds after transposition', () => {
        // Place a note at fret 0 on string 0 (E2 in standard)
        state().setFret(0 as StringIndex, 0);

        // Adapt to Open E (string 0 stays E2, so fret stays 0)
        // But let's use a tuning that raises string 0 to make fret go negative:
        // Actually for Drop D, string 0 lowers, so fret increases — test the reverse.
        // Standard -> Half-step down: each string drops 1 semitone, frets go up by 1.
        // To test out-of-bounds, place a high fret then raise the tuning.

        // Place fret 20 on string 5 in Drop D tuning
        useSharedStore.getState().setTuning([...DROP_D], 'Drop D');
        useMusicStore.setState({
          guitarStringState: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: 20 },
          targetRoot: '', targetQuality: '',
        });

        // Adapt to standard: string 5 stays E4 in both, but other strings differ
        // String 0: D2→E2 means string goes up 2 semitones, so fret goes down 2
        // For string 5 (E4 in both), no change expected
        // Let's test with a scenario where fret would exceed FRET_COUNT
        useMusicStore.setState({
          guitarStringState: { 0: 20, 1: null, 2: null, 3: null, 4: null, 5: null },
        });

        // Adapt from Drop D back to standard: string 0 goes from D2 to E2 (+2),
        // so fret goes from 20 to 20-2=18. Not out of bounds.
        // Use a more extreme case: Half-step down → Standard on fret 0
        useSharedStore.getState().setTuning(
          ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'], 'Half-step Down',
        );
        useMusicStore.setState({
          guitarStringState: { 0: 0, 1: null, 2: null, 3: null, 4: null, 5: null },
          targetRoot: '', targetQuality: '',
        });

        // Adapt to Standard: Eb2→E2 (+1 semitone), so fret 0 → 0-1 = -1 → muted
        state().setTuning([...STANDARD_TUNING], 'Standard', 'adapt');
        expect(state().guitarStringState[0]).toBeNull();
      });

      it('with no chord: transposes frets and runs detection', () => {
        // Place manual notes
        state().setFret(0 as StringIndex, 0); // E2
        state().setFret(1 as StringIndex, 2); // B2

        // Clear target
        useMusicStore.setState({ targetRoot: '', targetQuality: '' });

        state().setTuning([...DROP_D], 'Drop D', 'adapt');
        const s = state();
        // String 0 went from E2→D2 (down 2), so fret goes up by 2
        expect(s.guitarStringState[0]).toBe(2);
        // String 1 stays A2, so fret stays 2
        expect(s.guitarStringState[1]).toBe(2);
        // Should have run analysis
        expect(s.suggestions.length).toBeGreaterThan(0);
      });
    });
  });

  // ── restoreFromUrl ────────────────────────────────────────────────

  describe('restoreFromUrl', () => {
    it('with root+quality+voicingIndex: restores as selected chord, clears keySuggestions', () => {
      // Seed stale data
      useMusicStore.setState({
        keySuggestions: [{ key: 'stale' }] as never[],
      });

      state().restoreFromUrl({
        guitarState: { ...blankFrets },
        root: 'C',
        quality: 'Major',
        voicingIndex: 0,
      });

      const s = state();
      expect(s.targetRoot).toBe('C');
      expect(s.targetQuality).toBe('Major');
      expect(s.isCustomShape).toBe(false);
      expectStaleCleared();
    });

    it('with root+quality (no voicingIndex): finds matching voicing', () => {
      // Get the actual first voicing for A minor to use as guitar state
      state().setTargetChord('A', 'Minor');
      const firstVoicingFrets = { ...state().guitarStringState };

      // Reset and restore
      useMusicStore.setState({ targetRoot: '', targetQuality: '' });

      state().restoreFromUrl({
        guitarState: firstVoicingFrets,
        root: 'A',
        quality: 'Minor',
      });

      const s = state();
      expect(s.targetRoot).toBe('A');
      expect(s.targetQuality).toBe('Minor');
      expectStaleCleared();
    });

    it('free-form (no root/quality): runs detection + populates suggestions', () => {
      // Two notes for analysis
      const guitarState: GuitarStringState = {
        0: 0, 1: 2, 2: 2, 3: 1, 4: 0, 5: null,
      };

      state().restoreFromUrl({ guitarState });

      const s = state();
      expect(s.targetRoot).toBe('');
      expect(s.targetQuality).toBe('');
      expect(s.isCustomShape).toBe(true);
      expect(s.suggestions.length).toBeGreaterThan(0);
      expect(s.keySuggestions.length).toBeGreaterThan(0);
    });

    it('restores keyContext when provided', () => {
      state().restoreFromUrl({
        guitarState: { ...blankFrets },
        root: 'G',
        quality: 'Major',
        voicingIndex: 0,
        keyContext: { root: 'C', type: 'major' },
      });

      expect(state().keyContext).toEqual({ root: 'C', type: 'major' });
    });

    it('restores tuning to shared store', () => {
      state().restoreFromUrl({
        guitarState: { ...blankFrets },
        tuning: [...DROP_D],
        tuningName: 'Drop D',
        root: 'E',
        quality: 'Minor',
        voicingIndex: 0,
      });

      const shared = useSharedStore.getState();
      expect(shared.tuning).toEqual([...DROP_D]);
      expect(shared.tuningName).toBe('Drop D');
    });
  });

  // ── setVoicingIndex ───────────────────────────────────────────────

  describe('setVoicingIndex', () => {
    it('updates guitarStringState to match selected voicing', () => {
      state().setTargetChord('C', 'Major');
      const voicings = state().availableVoicings;
      if (voicings.length > 1) {
        state().setVoicingIndex(1);
        expect(state().currentVoicingIndex).toBe(1);
        // Frets should match voicing 1
        const expected = voicings[1].frets;
        for (let i = 0; i < 6; i++) {
          expect(state().guitarStringState[i as StringIndex]).toBe(expected[i]);
        }
      }
    });

    it('ignores out-of-range index', () => {
      state().setTargetChord('C', 'Major');
      state().setVoicingIndex(999);
      expect(state().currentVoicingIndex).toBe(0); // unchanged
    });
  });

  // ── clearString ───────────────────────────────────────────────────

  describe('clearString', () => {
    it('mutes the specified string and re-runs analysis', () => {
      // Place 3 notes
      state().setFret(0 as StringIndex, 0);
      state().setFret(1 as StringIndex, 2);
      state().setFret(2 as StringIndex, 2);
      expect(state().suggestions.length).toBeGreaterThan(0);

      // Clear one, dropping to 2 notes — should still have suggestions
      state().clearString(0 as StringIndex);
      expect(state().guitarStringState[0]).toBeNull();
      expect(state().suggestions.length).toBeGreaterThan(0);
    });

    it('clears suggestions when fewer than 2 notes remain', () => {
      state().setFret(0 as StringIndex, 0);
      state().setFret(1 as StringIndex, 2);
      // Now clear one
      state().clearString(0 as StringIndex);
      // Still 1 note, clear another
      state().clearString(1 as StringIndex);
      expect(state().suggestions).toEqual([]);
      expect(state().keySuggestions).toEqual([]);
    });
  });

  // ── setKeyContext ─────────────────────────────────────────────────

  describe('setKeyContext', () => {
    it('sets key context', () => {
      state().setKeyContext({ root: 'G', type: 'major' });
      expect(state().keyContext).toEqual({ root: 'G', type: 'major' });
    });

    it('clears key context with null', () => {
      state().setKeyContext({ root: 'A', type: 'minor' });
      state().setKeyContext(null);
      expect(state().keyContext).toBeNull();
    });
  });

  // ── setVoicingTypeFilter ──────────────────────────────────────────

  describe('setVoicingTypeFilter', () => {
    it('re-fetches voicings with new filter when chord is selected', () => {
      state().setTargetChord('C', 'Major');
      const allCount = state().availableVoicings.length;

      state().setVoicingTypeFilter('triads');
      expect(state().voicingTypeFilter).toBe('triads');
      // Triads filter uses solver (more voicings) vs "all" which uses chords-db (curated)
      const triadsCount = state().availableVoicings.length;
      expect(triadsCount).toBeGreaterThan(0);
      expect(triadsCount).not.toBe(allCount);
    });

    it('just updates filter when no chord selected', () => {
      state().setVoicingTypeFilter('shells');
      expect(state().voicingTypeFilter).toBe('shells');
      expect(state().availableVoicings).toEqual([]);
    });
  });
});
