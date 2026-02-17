import { describe, it, expect } from 'vitest';
import { solveChordShapes, getBestVoicings, solveTriadVoicings } from './chord-solver';
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

  describe('solveTriadVoicings', () => {
    it('should find C Major triads', () => {
      const voicings = solveTriadVoicings('C', 'Major');

      expect(voicings.length).toBeGreaterThan(0);

      // Each voicing should have exactly 3 notes played
      voicings.forEach(v => {
        const playedCount = v.frets.filter(f => f !== null).length;
        expect(playedCount).toBe(3);
      });
    });

    it('should only use adjacent 3-string sets from bass to treble', () => {
      const voicings = solveTriadVoicings('G', 'Major');

      voicings.forEach(v => {
        const playedStrings = v.frets
          .map((f, i) => f !== null ? i : -1)
          .filter(i => i !== -1);

        expect(playedStrings.length).toBe(3);

        // Check it's one of the 4 valid string sets (bass to treble):
        // [0,1,2] = Low E, A, D
        // [1,2,3] = A, D, G
        // [2,3,4] = D, G, B
        // [3,4,5] = G, B, High E
        const isSet654 = playedStrings.includes(0) && playedStrings.includes(1) && playedStrings.includes(2);
        const isSet543 = playedStrings.includes(1) && playedStrings.includes(2) && playedStrings.includes(3);
        const isSet432 = playedStrings.includes(2) && playedStrings.includes(3) && playedStrings.includes(4);
        const isSet321 = playedStrings.includes(3) && playedStrings.includes(4) && playedStrings.includes(5);

        expect(isSet654 || isSet543 || isSet432 || isSet321).toBe(true);
      });
    });

    it('should include all three inversions', () => {
      const voicings = solveTriadVoicings('C', 'Major');

      // C Major triad: C, E, G
      // We should find voicings with different bass notes
      const bassNotes = new Set(voicings.map(v => v.bassNote));

      // Should have C (root), E (1st inv), G (2nd inv) as bass notes
      expect(bassNotes.has('C')).toBe(true);
      expect(bassNotes.has('E')).toBe(true);
      expect(bassNotes.has('G')).toBe(true);
    });

    it('should mark inversions correctly', () => {
      const voicings = solveTriadVoicings('C', 'Major');

      voicings.forEach(v => {
        if (v.bassNote === 'C') {
          expect(v.isInversion).toBe(false);
        } else {
          expect(v.isInversion).toBe(true);
        }
      });
    });

    it('should respect hand span constraint', () => {
      const voicings = solveTriadVoicings('D', 'Minor');

      voicings.forEach(v => {
        const frettedPositions = v.frets.filter((f): f is number => f !== null && f > 0);

        if (frettedPositions.length > 1) {
          const span = Math.max(...frettedPositions) - Math.min(...frettedPositions);
          expect(span).toBeLessThanOrEqual(MAX_HAND_SPAN);
        }
      });
    });

    it('should handle minor triads', () => {
      const voicings = solveTriadVoicings('A', 'Minor');

      expect(voicings.length).toBeGreaterThan(0);

      // A Minor triad: A, C, E
      const bassNotes = new Set(voicings.map(v => v.bassNote));
      expect(bassNotes.has('A')).toBe(true);
      expect(bassNotes.has('C')).toBe(true);
      expect(bassNotes.has('E')).toBe(true);
    });

    it('should handle diminished triads', () => {
      const voicings = solveTriadVoicings('B', 'Diminished');

      expect(voicings.length).toBeGreaterThan(0);

      // B Dim triad: B, D, F
      const bassNotes = new Set(voicings.map(v => v.bassNote));
      expect(bassNotes.has('B')).toBe(true);
      expect(bassNotes.has('D')).toBe(true);
      expect(bassNotes.has('F')).toBe(true);
    });

    it('should handle augmented triads', () => {
      const voicings = solveTriadVoicings('C', 'Augmented');

      expect(voicings.length).toBeGreaterThan(0);

      // C Aug triad: C, E, G#
      // Note: G# might be stored as Ab depending on Tonal.js
      voicings.forEach(v => {
        expect(v.frets.filter(f => f !== null).length).toBe(3);
      });
    });

    it('should extract triads from 7th chord qualities', () => {
      // Dominant 7 should give major triad shapes
      const dom7Triads = solveTriadVoicings('G', 'Dominant 7');
      expect(dom7Triads.length).toBeGreaterThan(0);

      // Minor 7 should give minor triad shapes
      const m7Triads = solveTriadVoicings('E', 'Minor 7');
      expect(m7Triads.length).toBeGreaterThan(0);
    });

    it('should return empty for invalid quality', () => {
      const voicings = solveTriadVoicings('C', 'InvalidQuality');
      expect(voicings).toEqual([]);
    });

    it('should sort by string set first, then by fret position', () => {
      const voicings = solveTriadVoicings('E', 'Major');

      // Find the lowest string index for each voicing
      const getLowestString = (v: { frets: (number | null)[] }) =>
        v.frets.findIndex(f => f !== null);

      for (let i = 1; i < voicings.length; i++) {
        const prevString = getLowestString(voicings[i - 1]);
        const currString = getLowestString(voicings[i]);

        if (currString === prevString) {
          // Same string set - should be sorted by fret
          expect(voicings[i].lowestFret).toBeGreaterThanOrEqual(voicings[i - 1].lowestFret);
        } else {
          // Different string set - higher string index should come after
          expect(currString).toBeGreaterThan(prevString);
        }
      }
    });
  });
});
