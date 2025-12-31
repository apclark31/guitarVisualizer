import { describe, it, expect } from 'vitest';
import { getVoicingsForChord, isInDatabase } from './chord-data';
import { STANDARD_TUNING, TUNING_PRESETS } from '../config/constants';

describe('chord-data', () => {
  describe('getVoicingsForChord - Standard Tuning', () => {
    it('should return chords-db voicings for A Major in standard tuning', () => {
      const voicings = getVoicingsForChord('A', 'Major', 12, 'all', STANDARD_TUNING);

      // chords-db has curated voicings (typically 5-8), not 12
      console.log('A Major standard tuning voicing count:', voicings.length);

      expect(voicings.length).toBeGreaterThan(0);
      expect(voicings.length).toBeLessThan(12); // Should NOT fall back to solver
    });

    it('should include open A Major shape', () => {
      const voicings = getVoicingsForChord('A', 'Major', 12, 'all', STANDARD_TUNING);

      // Classic open A: x02220
      const hasOpenA = voicings.some(v =>
        v.frets[0] === null &&
        v.frets[1] === 0 &&
        v.frets[2] === 2 &&
        v.frets[3] === 2 &&
        v.frets[4] === 2 &&
        v.frets[5] === 0
      );

      expect(hasOpenA).toBe(true);
    });
  });

  describe('getVoicingsForChord - Alternate Tunings', () => {
    const cStandard = TUNING_PRESETS.find(t => t.name === 'C Standard')!.notes;
    const dropD = TUNING_PRESETS.find(t => t.name === 'Drop D')!.notes;

    it('should adapt chords-db voicings for C Standard tuning (NOT fall back to solver)', () => {
      const voicings = getVoicingsForChord('A', 'Major', 12, 'all', cStandard);

      console.log('A Major C Standard tuning voicing count:', voicings.length);
      console.log('First voicing frets:', voicings[0]?.frets);

      // Should NOT be 12 voicings (that would indicate solver fallback)
      // C Standard is 4 semitones down, so frets should shift up by 4
      expect(voicings.length).toBeGreaterThan(0);
      expect(voicings.length).toBeLessThan(12); // Should use adapted chords-db, not solver
    });

    it('should transpose open A Major correctly to C Standard', () => {
      // In standard tuning: x02220
      // C Standard is 4 semitones down from standard
      // To maintain pitch, frets need to go UP by 4
      // Expected: x46664

      const voicings = getVoicingsForChord('A', 'Major', 12, 'all', cStandard);

      const hasTransposedOpenA = voicings.some(v =>
        v.frets[0] === null &&
        v.frets[1] === 4 &&
        v.frets[2] === 6 &&
        v.frets[3] === 6 &&
        v.frets[4] === 6 &&
        v.frets[5] === 4
      );

      console.log('Looking for transposed open A (x46664):', hasTransposedOpenA);
      console.log('Voicings:', voicings.map(v => v.frets));

      expect(hasTransposedOpenA).toBe(true);
    });

    it('should adapt voicings for Drop D tuning', () => {
      const voicings = getVoicingsForChord('D', 'Major', 12, 'all', dropD);

      console.log('D Major Drop D tuning voicing count:', voicings.length);

      expect(voicings.length).toBeGreaterThan(0);
      expect(voicings.length).toBeLessThan(12); // Should use adapted chords-db
    });

    it('should maintain correct pitch when adapting', () => {
      // Get A Major in standard tuning
      const standardVoicings = getVoicingsForChord('A', 'Major', 12, 'all', STANDARD_TUNING);
      const cStandardVoicings = getVoicingsForChord('A', 'Major', 12, 'all', cStandard);

      // The note names should be the same (same pitches)
      if (standardVoicings[0] && cStandardVoicings[0]) {
        console.log('Standard tuning notes:', standardVoicings[0].noteNames);
        console.log('C Standard tuning notes:', cStandardVoicings[0].noteNames);

        // Both should produce A Major chord tones
        const standardNotes = new Set(standardVoicings[0].noteNames.map(n => n.replace(/\d/g, '')));
        const cStandardNotes = new Set(cStandardVoicings[0].noteNames.map(n => n.replace(/\d/g, '')));

        // Should have same pitch classes (A, C#, E for A Major)
        expect(standardNotes).toEqual(cStandardNotes);
      }
    });
  });

  describe('isInDatabase', () => {
    it('should return true for chords in database', () => {
      expect(isInDatabase('A', 'Major')).toBe(true);
      expect(isInDatabase('C', 'Minor 7')).toBe(true);
    });

    it('should return false for unsupported chords', () => {
      expect(isInDatabase('X', 'Invalid')).toBe(false);
    });
  });

  describe('Voicing filter behavior', () => {
    const cStandard = TUNING_PRESETS.find(t => t.name === 'C Standard')!.notes;

    it('should use solver for triads filter (returns 12+ voicings)', () => {
      // The triads filter bypasses chords-db and uses the solver directly
      const voicings = getVoicingsForChord('A', 'Major', 12, 'triads', cStandard);

      console.log('A Major triads filter count:', voicings.length);

      // Triads filter uses solver which generates more voicings
      expect(voicings.length).toBeGreaterThan(0);
    });

    it('should NOT use solver for "all" filter with valid chord', () => {
      const voicings = getVoicingsForChord('C', 'Major', 12, 'all', cStandard);

      console.log('C Major "all" filter in C Standard count:', voicings.length);
      console.log('C Major voicings:', voicings.map(v => v.frets));

      // Should be less than 12 (adapted chords-db voicings)
      expect(voicings.length).toBeLessThan(12);
    });
  });

  describe('Store tuning array format', () => {
    // Test with the array format the store would create
    it('should work with spread array from preset', () => {
      const preset = TUNING_PRESETS.find(t => t.name === 'C Standard')!;
      // This is how the store creates tuning: [...STANDARD_TUNING] or [...preset.notes]
      const storeStyleTuning = [...preset.notes];

      console.log('Preset notes type:', typeof preset.notes, Array.isArray(preset.notes));
      console.log('Store style tuning:', storeStyleTuning);

      const voicings = getVoicingsForChord('A', 'Major', 12, 'all', storeStyleTuning);

      console.log('Store-style A Major C Standard count:', voicings.length);

      expect(voicings.length).toBeGreaterThan(0);
      expect(voicings.length).toBeLessThan(12); // Should NOT fall back to solver
    });

    it('should work with mutable string array', () => {
      // The store uses string[] not readonly string[]
      const mutableTuning: string[] = ['C2', 'F2', 'Bb2', 'Eb3', 'G3', 'C4'];

      const voicings = getVoicingsForChord('A', 'Major', 12, 'all', mutableTuning);

      console.log('Mutable array A Major C Standard count:', voicings.length);

      expect(voicings.length).toBeGreaterThan(0);
      expect(voicings.length).toBeLessThan(12);
    });
  });
});
