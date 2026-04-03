import { describe, it, expect } from 'vitest';
import {
  getScaleNotes,
  getScalePositions,
  getPositionNotes,
  getPlaybackNotes,
  getPentatonicPositions,
  get3NPSPositions,
} from './scale-positions';
import { getScale } from './scale-data';
import { STANDARD_TUNING } from '../../../shared/config/constants';

describe('scale-positions', () => {
  describe('getScaleNotes', () => {
    it('returns all C major scale notes on fretboard', () => {
      const scale = getScale('C', 'major')!;
      const notes = getScaleNotes(scale, STANDARD_TUNING);

      // Should have notes on all 6 strings
      const stringCounts = new Map<number, number>();
      notes.forEach((n) => {
        stringCounts.set(n.stringIndex, (stringCounts.get(n.stringIndex) || 0) + 1);
      });
      expect(stringCounts.size).toBe(6);

      // Each string should have multiple scale notes
      stringCounts.forEach((count) => {
        expect(count).toBeGreaterThan(3);
      });
    });

    it('correctly identifies root notes', () => {
      const scale = getScale('C', 'major')!;
      const notes = getScaleNotes(scale, STANDARD_TUNING);

      const rootNotes = notes.filter((n) => n.isRoot);
      expect(rootNotes.length).toBeGreaterThan(0);
      rootNotes.forEach((n) => {
        expect(n.note).toBe('C');
      });
    });

    it('assigns correct intervals', () => {
      const scale = getScale('C', 'major')!;
      const notes = getScaleNotes(scale, STANDARD_TUNING);

      // Root should have interval 'R'
      const roots = notes.filter((n) => n.isRoot);
      roots.forEach((n) => {
        expect(n.interval).toBe('R');
      });

      // Find some E notes (major 3rd)
      const thirds = notes.filter((n) => n.note === 'E');
      thirds.forEach((n) => {
        expect(n.interval).toBe('3');
      });
    });

    it('assigns colors based on interval', () => {
      const scale = getScale('C', 'major')!;
      const notes = getScaleNotes(scale, STANDARD_TUNING);

      // Root notes should have root color
      const roots = notes.filter((n) => n.isRoot);
      expect(roots[0].color).toBeDefined();

      // All notes should have a color
      notes.forEach((n) => {
        expect(n.color).toBeDefined();
      });
    });

    it('handles A minor pentatonic', () => {
      const scale = getScale('A', 'minor-pentatonic')!;
      const notes = getScaleNotes(scale, STANDARD_TUNING);

      // Pentatonic has 5 unique pitch classes
      const uniqueNotes = new Set(notes.map((n) => n.note));
      expect(uniqueNotes.size).toBe(5);

      // Should contain A, C, D, E, G
      expect(uniqueNotes.has('A')).toBe(true);
      expect(uniqueNotes.has('C')).toBe(true);
      expect(uniqueNotes.has('D')).toBe(true);
      expect(uniqueNotes.has('E')).toBe(true);
      expect(uniqueNotes.has('G')).toBe(true);
    });

    it('respects maxFret parameter', () => {
      const scale = getScale('C', 'major')!;
      const notes = getScaleNotes(scale, STANDARD_TUNING, 5);

      notes.forEach((n) => {
        expect(n.fret).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('getScalePositions', () => {
    it('returns single position for full mode', () => {
      const scale = getScale('C', 'major')!;
      const positions = getScalePositions(scale, STANDARD_TUNING, 'full');

      expect(positions).toHaveLength(1);
      expect(positions[0].number).toBe(0);
      expect(positions[0].notes.length).toBeGreaterThan(30); // Full fretboard has many notes
    });

    it('returns 5 positions for pentatonic boxes', () => {
      const scale = getScale('A', 'minor-pentatonic')!;
      const positions = getScalePositions(scale, STANDARD_TUNING, 'boxes');

      expect(positions).toHaveLength(5);
      // At least the first few positions should have notes
      // (later positions may exceed fretboard length on 12-fret board)
      const positionsWithNotes = positions.filter((p) => p.notes.length > 0);
      expect(positionsWithNotes.length).toBeGreaterThanOrEqual(3);
    });

    it('returns 7 positions for 3NPS major scale', () => {
      const scale = getScale('C', 'major')!;
      const positions = getScalePositions(scale, STANDARD_TUNING, '3nps');

      expect(positions).toHaveLength(7);
      positions.forEach((pos, idx) => {
        expect(pos.number).toBe(idx + 1);
      });
    });
  });

  describe('getPositionNotes', () => {
    it('returns all notes for position 0', () => {
      const scale = getScale('C', 'major')!;
      const allNotes = getScaleNotes(scale, STANDARD_TUNING);
      const position0Notes = getPositionNotes(scale, STANDARD_TUNING, 0, 'full');

      expect(position0Notes.length).toBe(allNotes.length);
    });

    it('returns subset for specific position', () => {
      const scale = getScale('A', 'minor-pentatonic')!;
      const allNotes = getScaleNotes(scale, STANDARD_TUNING);
      const position1Notes = getPositionNotes(scale, STANDARD_TUNING, 1, 'boxes');

      expect(position1Notes.length).toBeLessThan(allNotes.length);
      expect(position1Notes.length).toBeGreaterThan(0);
    });

    it('position notes are within fret range', () => {
      const scale = getScale('A', 'minor-pentatonic')!;
      const positions = getPentatonicPositions(scale, STANDARD_TUNING);

      positions.forEach((pos) => {
        pos.notes.forEach((note) => {
          expect(note.fret).toBeGreaterThanOrEqual(pos.startFret);
          expect(note.fret).toBeLessThanOrEqual(pos.endFret);
        });
      });
    });
  });

  describe('getPlaybackNotes', () => {
    it('returns notes sorted ascending', () => {
      const scale = getScale('C', 'major')!;
      const notes = getPositionNotes(scale, STANDARD_TUNING, 0, 'full');
      const playbackNotes = getPlaybackNotes(notes, STANDARD_TUNING, 'ascending');

      // Should be sorted low to high
      for (let i = 1; i < playbackNotes.length; i++) {
        // Note names increase (octaves go up)
        const prevOctave = parseInt(playbackNotes[i - 1].slice(-1));
        const currOctave = parseInt(playbackNotes[i].slice(-1));
        expect(currOctave).toBeGreaterThanOrEqual(prevOctave);
      }
    });

    it('returns notes sorted descending', () => {
      const scale = getScale('C', 'major')!;
      const notes = getPositionNotes(scale, STANDARD_TUNING, 0, 'full');
      const playbackNotes = getPlaybackNotes(notes, STANDARD_TUNING, 'descending');

      // Should be sorted high to low
      for (let i = 1; i < playbackNotes.length; i++) {
        const prevOctave = parseInt(playbackNotes[i - 1].slice(-1));
        const currOctave = parseInt(playbackNotes[i].slice(-1));
        expect(currOctave).toBeLessThanOrEqual(prevOctave);
      }
    });

    it('removes duplicate pitches', () => {
      const scale = getScale('C', 'major')!;
      const notes = getPositionNotes(scale, STANDARD_TUNING, 0, 'full');
      const playbackNotes = getPlaybackNotes(notes, STANDARD_TUNING, 'ascending');

      // Should have no duplicate notes
      const uniqueNotes = new Set(playbackNotes);
      expect(uniqueNotes.size).toBe(playbackNotes.length);
    });
  });

  describe('getPentatonicPositions', () => {
    it('generates 5 positions', () => {
      const scale = getScale('A', 'minor-pentatonic')!;
      const positions = getPentatonicPositions(scale, STANDARD_TUNING);

      expect(positions).toHaveLength(5);
    });

    it('positions cover different fret areas', () => {
      const scale = getScale('A', 'minor-pentatonic')!;
      const positions = getPentatonicPositions(scale, STANDARD_TUNING);

      // Each position should start at a different fret
      const startFrets = positions.map((p) => p.startFret);
      const uniqueStarts = new Set(startFrets);
      expect(uniqueStarts.size).toBeGreaterThan(1);
    });
  });

  describe('get3NPSPositions', () => {
    it('generates 7 positions for diatonic scales', () => {
      const scale = getScale('C', 'major')!;
      const positions = get3NPSPositions(scale, STANDARD_TUNING);

      expect(positions).toHaveLength(7);
    });

    it('each populated position has notes on multiple strings', () => {
      const scale = getScale('C', 'major')!;
      const positions = get3NPSPositions(scale, STANDARD_TUNING);

      // Filter to positions that have notes (some may be beyond fretboard)
      const populatedPositions = positions.filter((p) => p.notes.length > 0);
      expect(populatedPositions.length).toBeGreaterThanOrEqual(4);

      // Positions with enough notes should span multiple strings
      // (Later positions may be truncated due to FRET_COUNT limit)
      const fullPositions = populatedPositions.filter((p) => p.notes.length >= 12);
      fullPositions.forEach((pos) => {
        const strings = new Set(pos.notes.map((n) => n.stringIndex));
        expect(strings.size).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('alternate tunings', () => {
    it('handles Drop D tuning', () => {
      const dropD = ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'];
      const scale = getScale('D', 'major')!;
      const notes = getScaleNotes(scale, dropD);

      // Should have D notes on the low string (now tuned to D)
      const lowStringNotes = notes.filter((n) => n.stringIndex === 0);
      const hasOpenD = lowStringNotes.some((n) => n.fret === 0 && n.note === 'D');
      expect(hasOpenD).toBe(true);
    });

    it('open tuning positions roots correctly', () => {
      const openG = ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'];
      const scale = getScale('G', 'major')!;
      const notes = getScaleNotes(scale, openG);

      // Should have many open string roots in Open G
      const openRoots = notes.filter((n) => n.fret === 0 && n.isRoot);
      expect(openRoots.length).toBeGreaterThanOrEqual(2); // At least G2 and G3 strings
    });
  });
});
