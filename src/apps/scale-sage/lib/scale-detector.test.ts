/**
 * Scale Detector Tests
 *
 * Tests for scale detection algorithm
 */

import { describe, it, expect } from 'vitest';
import { detectScales, type ScaleSuggestion } from './scale-detector';

describe('detectScales', () => {
  // Helper to check if a scale type is in the suggestions
  const hasScale = (suggestions: ScaleSuggestion[], root: string, type: string): boolean => {
    return suggestions.some(s => s.root === root && s.type === type);
  };

  // Helper to get a specific suggestion
  const getScale = (suggestions: ScaleSuggestion[], root: string, type: string): ScaleSuggestion | undefined => {
    return suggestions.find(s => s.root === root && s.type === type);
  };

  describe('basic detection', () => {
    it('returns empty array for single note', () => {
      const result = detectScales(['C']);
      expect(result).toHaveLength(0);
    });

    it('returns empty array for empty notes', () => {
      const result = detectScales([]);
      expect(result).toHaveLength(0);
    });

    it('detects C Major from C-E-G', () => {
      const result = detectScales(['C', 'E', 'G']);
      expect(hasScale(result, 'C', 'major')).toBe(true);
    });

    it('detects A minor pentatonic from A-C-E (triad)', () => {
      // A-C-E is an Am triad, which fits multiple scales
      // A minor pentatonic (A-C-D-E-G) should be a strong match
      const result = detectScales(['A', 'C', 'E']);
      expect(hasScale(result, 'A', 'minor-pentatonic')).toBe(true);
    });

    it('detects C Major Pentatonic from C-D-E-G', () => {
      const result = detectScales(['C', 'D', 'E', 'G']);
      expect(hasScale(result, 'C', 'major-pentatonic')).toBe(true);
    });

    it('detects A Minor Pentatonic from A-C-D-E-G', () => {
      const result = detectScales(['A', 'C', 'D', 'E', 'G']);
      expect(hasScale(result, 'A', 'minor-pentatonic')).toBe(true);
    });
  });

  describe('bass note bonus', () => {
    it('ranks scale with bass note = root higher', () => {
      // C-E-G with C as bass should rank C major higher
      const withBass = detectScales(['C', 'E', 'G'], 'C');
      const withoutBass = detectScales(['C', 'E', 'G']);

      const cMajorWithBass = getScale(withBass, 'C', 'major');
      const cMajorWithoutBass = getScale(withoutBass, 'C', 'major');

      expect(cMajorWithBass).toBeDefined();
      expect(cMajorWithoutBass).toBeDefined();
      expect(cMajorWithBass!.score).toBeGreaterThan(cMajorWithoutBass!.score);
    });

    it('boosts A minor when A is the bass note', () => {
      const result = detectScales(['A', 'C', 'E'], 'A');
      const aMinor = getScale(result, 'A', 'minor');

      expect(aMinor).toBeDefined();
      // With bass bonus, A minor should be ranked high
      expect(result.indexOf(aMinor!)).toBeLessThan(4);
    });
  });

  describe('chromatic/passing notes', () => {
    it('allows one chromatic note', () => {
      // C-D-E-F#-G: F# is chromatic to C major, but should still match
      const result = detectScales(['C', 'D', 'E', 'F#', 'G']);
      expect(hasScale(result, 'C', 'major')).toBe(true);

      const cMajor = getScale(result, 'C', 'major');
      expect(cMajor?.extraNotes).toContain('F#');
    });

    it('excludes scales with more than one chromatic note', () => {
      // C-D-F#-G#: Two chromatic notes for C major
      const result = detectScales(['C', 'D', 'F#', 'G#']);

      // C major should not be in results (has 2 chromatic notes: F#, G#)
      const cMajor = getScale(result, 'C', 'major');
      expect(cMajor).toBeUndefined();
    });
  });

  describe('blues scale detection', () => {
    it('detects A Blues from A-C-D-Eb-E-G', () => {
      const result = detectScales(['A', 'C', 'D', 'Eb', 'E', 'G']);
      expect(hasScale(result, 'A', 'blues')).toBe(true);
    });

    it('detects C Blues from C-Eb-F-Gb-G-Bb', () => {
      // Full blues scale
      const result = detectScales(['C', 'Eb', 'F', 'Gb', 'G', 'Bb']);
      expect(hasScale(result, 'C', 'blues')).toBe(true);
    });
  });

  describe('enharmonic equivalents', () => {
    it('handles Db as C#', () => {
      // Db-F-Ab should match C# minor
      const result = detectScales(['Db', 'E', 'Ab']);
      // C# (enharmonic to Db) should be detected
      expect(hasScale(result, 'C#', 'minor')).toBe(true);
    });

    it('handles Bb (enharmonic to A#) in scale notes', () => {
      // Bb-D-F is a Bb major triad
      // It fits F major (F-G-A-Bb-C-D-E) which contains all three notes
      const result = detectScales(['Bb', 'D', 'F']);
      // F major should be detected since it contains Bb (=A#), D, and F
      expect(hasScale(result, 'F', 'major')).toBe(true);
    });
  });

  describe('coverage calculation', () => {
    it('calculates coverage percentage correctly', () => {
      // 5 notes from a 7-note major scale
      const result = detectScales(['C', 'D', 'E', 'G', 'A']);
      const cMajor = getScale(result, 'C', 'major');

      expect(cMajor).toBeDefined();
      // 5/7 = ~71%
      expect(cMajor!.coverage).toBeGreaterThan(70);
      expect(cMajor!.coverage).toBeLessThan(72);
    });

    it('shows 100% coverage for full pentatonic', () => {
      // All 5 notes of C major pentatonic
      const result = detectScales(['C', 'D', 'E', 'G', 'A']);
      const cMajPent = getScale(result, 'C', 'major-pentatonic');

      expect(cMajPent).toBeDefined();
      expect(cMajPent!.coverage).toBe(100);
    });
  });

  describe('result limits', () => {
    it('returns at most 8 suggestions', () => {
      // Many notes that could match multiple scales
      const result = detectScales(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
      expect(result.length).toBeLessThanOrEqual(8);
    });

    it('returns results sorted by score descending', () => {
      const result = detectScales(['C', 'E', 'G'], 'C');

      // Verify descending order
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
    });
  });

  describe('real-world scenarios', () => {
    it('suggests pentatonic for blues lick notes', () => {
      // Common blues box notes in A
      const result = detectScales(['A', 'C', 'D', 'E', 'G'], 'A');

      // Should suggest A minor pentatonic or A blues highly
      expect(hasScale(result, 'A', 'minor-pentatonic')).toBe(true);
    });

    it('suggests natural minor for minor scale run', () => {
      // A natural minor notes
      const result = detectScales(['A', 'B', 'C', 'D', 'E', 'F', 'G']);

      expect(hasScale(result, 'A', 'minor')).toBe(true);
      const aMinor = getScale(result, 'A', 'minor');
      expect(aMinor!.coverage).toBe(100);
    });

    it('handles power chord (root + 5th)', () => {
      // Power chord: C-G
      const result = detectScales(['C', 'G'], 'C');

      // Should match C major and C minor (both have C and G)
      expect(hasScale(result, 'C', 'major')).toBe(true);
      expect(hasScale(result, 'C', 'minor')).toBe(true);
    });
  });
});
