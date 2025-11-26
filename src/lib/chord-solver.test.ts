import { describe, it, expect } from 'vitest';
import { solveChordShapes, getBestVoicings } from './chord-solver';
import { MAX_HAND_SPAN } from '../config/constants';

describe('chord-solver', () => {
  describe('solveChordShapes', () => {
    it('should find voicings for C Major', () => {
      const voicings = solveChordShapes('C', 'Major');

      expect(voicings.length).toBeGreaterThan(0);

      // Each voicing should have 6 fret positions (one per string)
      voicings.forEach(v => {
        expect(v.frets).toHaveLength(6);
      });
    });

    it('should find voicings for G Major', () => {
      const voicings = solveChordShapes('G', 'Major');

      expect(voicings.length).toBeGreaterThan(0);

      // Should include the classic open G shape: [3, 2, 0, 0, 0, 3]
      // or similar open position voicing
      const hasOpenPosition = voicings.some(v => v.lowestFret === 0);
      expect(hasOpenPosition).toBe(true);
    });

    it('should find voicings for E Minor', () => {
      const voicings = solveChordShapes('E', 'Minor');

      expect(voicings.length).toBeGreaterThan(0);

      // Classic open Em: [0, 2, 2, 0, 0, 0]
      const hasOpenEm = voicings.some(v =>
        v.frets[0] === 0 &&
        v.frets[1] === 2 &&
        v.frets[2] === 2
      );
      expect(hasOpenEm).toBe(true);
    });

    it('should find voicings for A Minor', () => {
      const voicings = solveChordShapes('A', 'Minor');

      expect(voicings.length).toBeGreaterThan(0);
    });

    it('should respect hand span constraint', () => {
      const voicings = solveChordShapes('C', 'Major');

      voicings.forEach(v => {
        const frettedPositions = v.frets.filter((f): f is number => f !== null && f > 0);

        if (frettedPositions.length > 1) {
          const span = Math.max(...frettedPositions) - Math.min(...frettedPositions);
          expect(span).toBeLessThanOrEqual(MAX_HAND_SPAN);
        }
      });
    });

    it('should sort voicings by lowest fret', () => {
      const voicings = solveChordShapes('C', 'Major');

      for (let i = 1; i < voicings.length; i++) {
        expect(voicings[i].lowestFret).toBeGreaterThanOrEqual(voicings[i - 1].lowestFret);
      }
    });

    it('should include note names in voicings', () => {
      const voicings = solveChordShapes('C', 'Major');

      voicings.forEach(v => {
        const playedCount = v.frets.filter(f => f !== null).length;
        expect(v.noteNames.length).toBe(playedCount);
      });
    });

    it('should handle 7th chords', () => {
      const voicings = solveChordShapes('G', 'Dominant 7');

      expect(voicings.length).toBeGreaterThan(0);

      // G7 should have G, B, D, F
      // Check that at least some voicings exist
      voicings.forEach(v => {
        expect(v.frets).toHaveLength(6);
      });
    });

    it('should handle sharp roots', () => {
      const voicings = solveChordShapes('F#', 'Minor');

      expect(voicings.length).toBeGreaterThan(0);
    });

    it('should handle flat roots', () => {
      const voicings = solveChordShapes('Bb', 'Major');

      expect(voicings.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid chord', () => {
      const voicings = solveChordShapes('X', 'InvalidQuality');

      expect(voicings).toEqual([]);
    });
  });

  describe('getBestVoicings', () => {
    it('should return limited number of voicings', () => {
      const voicings = getBestVoicings('C', 'Major', 5);

      expect(voicings.length).toBeLessThanOrEqual(5);
    });

    it('should prioritize fuller voicings', () => {
      const voicings = getBestVoicings('G', 'Major', 10);

      // First few voicings should generally have more strings played
      if (voicings.length >= 2) {
        const firstPlayedCount = voicings[0].frets.filter(f => f !== null).length;
        expect(firstPlayedCount).toBeGreaterThanOrEqual(3);
      }
    });

    it('should work for various chord types', () => {
      const chords = [
        ['C', 'Major'],
        ['A', 'Minor'],
        ['E', 'Dominant 7'],
        ['D', 'Major 7'],
        ['B', 'Minor 7'],
      ];

      chords.forEach(([root, quality]) => {
        const voicings = getBestVoicings(root, quality);
        expect(voicings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('known chord shapes', () => {
    it('should find open C Major shape', () => {
      const voicings = solveChordShapes('C', 'Major');

      // Classic C: [null, 3, 2, 0, 1, 0]
      const hasClassicC = voicings.some(v =>
        v.frets[0] === null &&
        v.frets[1] === 3 &&
        v.frets[2] === 2 &&
        v.frets[3] === 0 &&
        v.frets[4] === 1 &&
        v.frets[5] === 0
      );

      expect(hasClassicC).toBe(true);
    });

    it('should find open D Major shape', () => {
      const voicings = solveChordShapes('D', 'Major');

      // Classic D: [null, null, 0, 2, 3, 2]
      const hasClassicD = voicings.some(v =>
        v.frets[2] === 0 &&
        v.frets[3] === 2 &&
        v.frets[4] === 3 &&
        v.frets[5] === 2
      );

      expect(hasClassicD).toBe(true);
    });

    it('should find open A Major shape', () => {
      const voicings = solveChordShapes('A', 'Major');

      // Classic A: [null, 0, 2, 2, 2, 0]
      const hasClassicA = voicings.some(v =>
        v.frets[1] === 0 &&
        v.frets[2] === 2 &&
        v.frets[3] === 2 &&
        v.frets[4] === 2 &&
        v.frets[5] === 0
      );

      expect(hasClassicA).toBe(true);
    });
  });
});
