import { describe, it, expect } from 'vitest';
import { analyzeVoicing, detectVoicingType } from './voicing-analyzer';
import type { GuitarStringState } from '../types';

describe('voicing-analyzer', () => {
  describe('detectVoicingType', () => {
    it('should detect major shell (R-3-7)', () => {
      // Intervals: 0, 4, 11 = R, 3, 7
      const intervals = [0, 4, 11];
      expect(detectVoicingType(intervals)).toBe('shell-major');
    });

    it('should detect minor shell (R-b3-b7)', () => {
      // Intervals: 0, 3, 10 = R, b3, b7
      const intervals = [0, 3, 10];
      expect(detectVoicingType(intervals)).toBe('shell-minor');
    });

    it('should detect dominant shell (R-3-b7)', () => {
      // Intervals: 0, 4, 10 = R, 3, b7
      const intervals = [0, 4, 10];
      expect(detectVoicingType(intervals)).toBe('shell-dominant');
    });

    it('should detect major triad (R-3-5)', () => {
      const intervals = [0, 4, 7];
      expect(detectVoicingType(intervals)).toBe('triad');
    });

    it('should detect minor triad (R-b3-5)', () => {
      const intervals = [0, 3, 7];
      expect(detectVoicingType(intervals)).toBe('triad');
    });

    it('should detect diminished triad (R-b3-b5)', () => {
      const intervals = [0, 3, 6];
      expect(detectVoicingType(intervals)).toBe('triad');
    });

    it('should detect augmented triad (R-3-#5)', () => {
      const intervals = [0, 4, 8];
      expect(detectVoicingType(intervals)).toBe('triad');
    });

    it('should return full for 4+ notes', () => {
      // Cmaj7 full voicing: R, 3, 5, 7
      const intervals = [0, 4, 7, 11];
      expect(detectVoicingType(intervals)).toBe('full');
    });

    it('should return partial for unrecognized 3-note pattern', () => {
      // Random intervals that don't form a known pattern
      const intervals = [0, 2, 5];
      expect(detectVoicingType(intervals)).toBe('partial');
    });

    it('should return partial for 2 notes', () => {
      const intervals = [0, 4];
      expect(detectVoicingType(intervals)).toBe('partial');
    });

    it('should return unknown for single note', () => {
      const intervals = [0];
      expect(detectVoicingType(intervals)).toBe('unknown');
    });

    it('should NOT detect power chord (R-5) as shell', () => {
      // Power chord: just root and fifth
      const intervals = [0, 7];
      const result = detectVoicingType(intervals);
      expect(result).not.toContain('shell');
      expect(result).toBe('partial');
    });
  });

  describe('analyzeVoicing', () => {
    it('should return empty suggestions for single note', () => {
      const state: GuitarStringState = {
        0: 3, // G
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
      };

      const analysis = analyzeVoicing(state);

      expect(analysis.suggestions).toHaveLength(0);
      expect(analysis.voicingType).toBeNull();
    });

    it('should generate suggestions for G-B (two notes)', () => {
      // G on low E string (fret 3) and B on B string (open)
      const state: GuitarStringState = {
        0: 3, // G
        1: null,
        2: null,
        3: null,
        4: 0, // B
        5: null,
      };

      const analysis = analyzeVoicing(state);

      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.bassNote).toBe('G');
      expect(analysis.pitchClasses).toContain('G');
      expect(analysis.pitchClasses).toContain('B');
    });

    it('should prioritize G Major when G is bass note with G-B', () => {
      const state: GuitarStringState = {
        0: 3, // G (bass)
        1: null,
        2: null,
        3: null,
        4: 0, // B
        5: null,
      };

      const analysis = analyzeVoicing(state);
      const gMajorSuggestion = analysis.suggestions.find(
        s => s.root === 'G' && s.quality === 'Major'
      );

      expect(gMajorSuggestion).toBeDefined();

      // G Major should be ranked higher than Em when G is in bass
      const gIndex = analysis.suggestions.findIndex(s => s.root === 'G');
      const eIndex = analysis.suggestions.findIndex(s => s.root === 'E');

      if (gIndex !== -1 && eIndex !== -1) {
        expect(gIndex).toBeLessThan(eIndex);
      }
    });

    it('should detect major triad from C-E-G', () => {
      // Open C Major triad on strings 2-4
      const state: GuitarStringState = {
        0: null,
        1: 3, // C
        2: 2, // E
        3: 0, // G
        4: null,
        5: null,
      };

      const analysis = analyzeVoicing(state);

      expect(analysis.pitchClasses).toContain('C');
      expect(analysis.pitchClasses).toContain('E');
      expect(analysis.pitchClasses).toContain('G');

      // Should suggest C Major
      const cMajorSuggestion = analysis.suggestions.find(
        s => s.root === 'C' && s.quality === 'Major'
      );
      expect(cMajorSuggestion).toBeDefined();
    });

    it('should handle open E minor chord', () => {
      // Standard Em: [0, 2, 2, 0, 0, 0]
      const state: GuitarStringState = {
        0: 0, // E
        1: 2, // B
        2: 2, // E
        3: 0, // G
        4: 0, // B
        5: 0, // E
      };

      const analysis = analyzeVoicing(state);

      // Should contain E, B, G
      expect(analysis.pitchClasses).toContain('E');
      expect(analysis.pitchClasses).toContain('B');
      expect(analysis.pitchClasses).toContain('G');

      // Should suggest E Minor
      const emSuggestion = analysis.suggestions.find(
        s => s.root === 'E' && s.quality === 'Minor'
      );
      expect(emSuggestion).toBeDefined();
    });

    it('should include missing intervals in suggestions', () => {
      // Just G and B - missing 5th (D) for full G Major triad
      const state: GuitarStringState = {
        0: 3, // G
        1: null,
        2: null,
        3: null,
        4: 0, // B
        5: null,
      };

      const analysis = analyzeVoicing(state);
      const gMajorSuggestion = analysis.suggestions.find(
        s => s.root === 'G' && s.quality === 'Major'
      );

      expect(gMajorSuggestion).toBeDefined();
      if (gMajorSuggestion) {
        expect(gMajorSuggestion.missingIntervals).toContain('5');
        expect(gMajorSuggestion.presentIntervals).toContain('R');
        expect(gMajorSuggestion.presentIntervals).toContain('3');
      }
    });

    it('should limit suggestions to 8', () => {
      // Place multiple notes that could match many chords
      const state: GuitarStringState = {
        0: 0, // E
        1: 0, // A
        2: 2, // E
        3: 2, // A
        4: null,
        5: null,
      };

      const analysis = analyzeVoicing(state);

      expect(analysis.suggestions.length).toBeLessThanOrEqual(8);
    });
  });

  describe('suggestion ranking', () => {
    it('should rank chords with bass note as root higher', () => {
      // A in bass with C and E - could be Am or C/A
      const state: GuitarStringState = {
        0: null,
        1: 0, // A (bass)
        2: 2, // E
        3: null,
        4: 1, // C
        5: null,
      };

      const analysis = analyzeVoicing(state);

      // A-based chords should come before C-based chords
      const aIndex = analysis.suggestions.findIndex(s => s.root === 'A');
      const cIndex = analysis.suggestions.findIndex(s => s.root === 'C');

      if (aIndex !== -1 && cIndex !== -1) {
        expect(aIndex).toBeLessThan(cIndex);
      }
    });

    it('should rank simpler chords before complex ones for same root', () => {
      // G-B-D - full G Major triad
      const state: GuitarStringState = {
        0: 3, // G
        1: null,
        2: 0, // D
        3: 0, // G
        4: 0, // B
        5: null,
      };

      const analysis = analyzeVoicing(state);
      const gSuggestions = analysis.suggestions.filter(s => s.root === 'G');

      if (gSuggestions.length >= 2) {
        // Major should come before Major 7
        const majorIndex = gSuggestions.findIndex(s => s.quality === 'Major');
        const maj7Index = gSuggestions.findIndex(s => s.quality === 'Major 7');

        if (majorIndex !== -1 && maj7Index !== -1) {
          expect(majorIndex).toBeLessThan(maj7Index);
        }
      }
    });
  });
});
