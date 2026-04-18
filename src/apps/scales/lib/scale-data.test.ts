import { describe, it, expect } from 'vitest';
import {
  getScale,
  getIntervalLabel,
  getScaleDegreeLabels,
  isNoteInScale,
  getNoteInterval,
  getParentScale,
  SCALE_TYPE_DISPLAY,
  SCALE_CATEGORIES,
  ROOT_NOTES,
} from './scale-data';

describe('scale-data', () => {
  describe('getScale', () => {
    it('returns correct notes for C major', () => {
      const scale = getScale('C', 'major');
      expect(scale).not.toBeNull();
      expect(scale?.notes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
      expect(scale?.noteCount).toBe(7);
    });

    it('returns correct notes for A minor', () => {
      const scale = getScale('A', 'minor');
      expect(scale).not.toBeNull();
      expect(scale?.notes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
      expect(scale?.noteCount).toBe(7);
    });

    it('returns correct notes for A minor pentatonic', () => {
      const scale = getScale('A', 'minor-pentatonic');
      expect(scale).not.toBeNull();
      expect(scale?.notes).toEqual(['A', 'C', 'D', 'E', 'G']);
      expect(scale?.noteCount).toBe(5);
    });

    it('returns correct notes for C major pentatonic', () => {
      const scale = getScale('C', 'major-pentatonic');
      expect(scale).not.toBeNull();
      expect(scale?.notes).toEqual(['C', 'D', 'E', 'G', 'A']);
      expect(scale?.noteCount).toBe(5);
    });

    it('returns correct notes for A blues', () => {
      const scale = getScale('A', 'blues');
      expect(scale).not.toBeNull();
      expect(scale?.notes).toEqual(['A', 'C', 'D', 'Eb', 'E', 'G']);
      expect(scale?.noteCount).toBe(6);
    });

    it('handles sharp roots', () => {
      const scale = getScale('F#', 'major');
      expect(scale).not.toBeNull();
      expect(scale?.root).toBe('F#');
      expect(scale?.noteCount).toBe(7);
    });

    it('handles flat roots', () => {
      const scale = getScale('Bb', 'minor');
      expect(scale).not.toBeNull();
      expect(scale?.root).toBe('Bb');
      expect(scale?.noteCount).toBe(7);
    });

    it('returns intervals for major scale', () => {
      const scale = getScale('C', 'major');
      expect(scale?.intervals).toEqual(['1P', '2M', '3M', '4P', '5P', '6M', '7M']);
    });

    it('returns intervals for minor scale', () => {
      const scale = getScale('A', 'minor');
      expect(scale?.intervals).toEqual(['1P', '2M', '3m', '4P', '5P', '6m', '7m']);
    });
  });

  describe('getIntervalLabel', () => {
    it('formats perfect intervals', () => {
      expect(getIntervalLabel('1P')).toBe('1');
      expect(getIntervalLabel('4P')).toBe('4');
      expect(getIntervalLabel('5P')).toBe('5');
    });

    it('formats major intervals', () => {
      expect(getIntervalLabel('2M')).toBe('2');
      expect(getIntervalLabel('3M')).toBe('3');
      expect(getIntervalLabel('6M')).toBe('6');
      expect(getIntervalLabel('7M')).toBe('7');
    });

    it('formats minor intervals with flat', () => {
      expect(getIntervalLabel('2m')).toBe('b2');
      expect(getIntervalLabel('3m')).toBe('b3');
      expect(getIntervalLabel('6m')).toBe('b6');
      expect(getIntervalLabel('7m')).toBe('b7');
    });

    it('formats augmented intervals with sharp', () => {
      expect(getIntervalLabel('4A')).toBe('#4');
      expect(getIntervalLabel('5A')).toBe('#5');
    });
  });

  describe('getScaleDegreeLabels', () => {
    it('returns degree labels for major scale', () => {
      const labels = getScaleDegreeLabels('major');
      expect(labels).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    });

    it('returns degree labels for minor scale', () => {
      const labels = getScaleDegreeLabels('minor');
      expect(labels).toEqual(['1', '2', 'b3', '4', '5', 'b6', 'b7']);
    });

    it('returns degree labels for minor pentatonic', () => {
      const labels = getScaleDegreeLabels('minor-pentatonic');
      expect(labels).toEqual(['1', 'b3', '4', '5', 'b7']);
    });

    it('returns degree labels for blues', () => {
      const labels = getScaleDegreeLabels('blues');
      // Blues: 1 b3 4 b5 5 b7
      expect(labels).toHaveLength(6);
      expect(labels[0]).toBe('1');
      expect(labels[1]).toBe('b3');
    });
  });

  describe('isNoteInScale', () => {
    it('returns true for notes in C major', () => {
      const scaleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      expect(isNoteInScale('C', scaleNotes)).toBe(true);
      expect(isNoteInScale('E', scaleNotes)).toBe(true);
      expect(isNoteInScale('G', scaleNotes)).toBe(true);
    });

    it('returns false for notes not in C major', () => {
      const scaleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      expect(isNoteInScale('C#', scaleNotes)).toBe(false);
      expect(isNoteInScale('Eb', scaleNotes)).toBe(false);
      expect(isNoteInScale('F#', scaleNotes)).toBe(false);
    });

    it('handles enharmonic equivalents', () => {
      const scaleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      // B# is enharmonic to C
      expect(isNoteInScale('B#', scaleNotes)).toBe(true);
    });
  });

  describe('getNoteInterval', () => {
    it('returns correct interval for scale notes', () => {
      const scale = getScale('C', 'major')!;
      expect(getNoteInterval('C', scale)).toBe('1P');
      expect(getNoteInterval('E', scale)).toBe('3M');
      expect(getNoteInterval('G', scale)).toBe('5P');
      expect(getNoteInterval('B', scale)).toBe('7M');
    });

    it('returns null for non-scale notes', () => {
      const scale = getScale('C', 'major')!;
      expect(getNoteInterval('C#', scale)).toBeNull();
      expect(getNoteInterval('Eb', scale)).toBeNull();
    });

    it('handles minor scale intervals', () => {
      const scale = getScale('A', 'minor')!;
      expect(getNoteInterval('A', scale)).toBe('1P');
      expect(getNoteInterval('C', scale)).toBe('3m');
      expect(getNoteInterval('G', scale)).toBe('7m');
    });
  });

  describe('constants', () => {
    it('has display names for all scale types', () => {
      expect(SCALE_TYPE_DISPLAY['major']).toBe('Major (Ionian)');
      expect(SCALE_TYPE_DISPLAY['minor']).toBe('Natural Minor (Aeolian)');
      expect(SCALE_TYPE_DISPLAY['dorian']).toBe('Dorian');
      expect(SCALE_TYPE_DISPLAY['phrygian']).toBe('Phrygian');
      expect(SCALE_TYPE_DISPLAY['lydian']).toBe('Lydian');
      expect(SCALE_TYPE_DISPLAY['mixolydian']).toBe('Mixolydian');
      expect(SCALE_TYPE_DISPLAY['locrian']).toBe('Locrian');
      expect(SCALE_TYPE_DISPLAY['major-pentatonic']).toBe('Major Pentatonic');
      expect(SCALE_TYPE_DISPLAY['minor-pentatonic']).toBe('Minor Pentatonic');
      expect(SCALE_TYPE_DISPLAY['blues']).toBe('Blues');
    });

    it('has scale categories', () => {
      expect(SCALE_CATEGORIES.diatonic).toContain('major');
      expect(SCALE_CATEGORIES.diatonic).toContain('minor');
      expect(SCALE_CATEGORIES.modes).toContain('dorian');
      expect(SCALE_CATEGORIES.modes).toContain('phrygian');
      expect(SCALE_CATEGORIES.modes).toContain('lydian');
      expect(SCALE_CATEGORIES.modes).toContain('mixolydian');
      expect(SCALE_CATEGORIES.modes).toContain('locrian');
      expect(SCALE_CATEGORIES.pentatonic).toContain('minor-pentatonic');
      expect(SCALE_CATEGORIES.pentatonic).toContain('blues');
    });

    it('has all 12 root notes', () => {
      expect(ROOT_NOTES).toHaveLength(12);
      expect(ROOT_NOTES).toContain('C');
      expect(ROOT_NOTES).toContain('F#');
    });
  });

  describe('modes', () => {
    it('returns correct notes for D Dorian', () => {
      const scale = getScale('D', 'dorian');
      expect(scale).not.toBeNull();
      expect(scale?.notes).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
      expect(scale?.noteCount).toBe(7);
    });

    it('returns correct notes for E Phrygian', () => {
      const scale = getScale('E', 'phrygian');
      expect(scale?.notes).toEqual(['E', 'F', 'G', 'A', 'B', 'C', 'D']);
    });

    it('returns correct notes for F Lydian', () => {
      const scale = getScale('F', 'lydian');
      expect(scale?.notes).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
    });

    it('returns correct notes for G Mixolydian', () => {
      const scale = getScale('G', 'mixolydian');
      expect(scale?.notes).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F']);
    });

    it('returns correct notes for B Locrian', () => {
      const scale = getScale('B', 'locrian');
      expect(scale?.notes).toEqual(['B', 'C', 'D', 'E', 'F', 'G', 'A']);
    });

    it('all modes of C Major share the same notes', () => {
      const cMajor = getScale('C', 'major')!;
      const dDorian = getScale('D', 'dorian')!;
      const ePhrygian = getScale('E', 'phrygian')!;
      const fLydian = getScale('F', 'lydian')!;
      const gMixo = getScale('G', 'mixolydian')!;
      const aMinor = getScale('A', 'minor')!;
      const bLocrian = getScale('B', 'locrian')!;

      const sortedNotes = (notes: string[]) => [...notes].sort();
      const cMajorNotes = sortedNotes(cMajor.notes);

      expect(sortedNotes(dDorian.notes)).toEqual(cMajorNotes);
      expect(sortedNotes(ePhrygian.notes)).toEqual(cMajorNotes);
      expect(sortedNotes(fLydian.notes)).toEqual(cMajorNotes);
      expect(sortedNotes(gMixo.notes)).toEqual(cMajorNotes);
      expect(sortedNotes(aMinor.notes)).toEqual(cMajorNotes);
      expect(sortedNotes(bLocrian.notes)).toEqual(cMajorNotes);
    });
  });

  describe('getParentScale', () => {
    it('returns C Major as parent of D Dorian', () => {
      const parent = getParentScale('D', 'dorian');
      expect(parent).not.toBeNull();
      expect(parent?.parentRoot).toBe('C');
      expect(parent?.parentDisplay).toBe('C Major');
      expect(parent?.modeLabel).toBe('2nd mode');
      expect(parent?.modeDegree).toBe(2);
    });

    it('returns C Major as parent of E Phrygian', () => {
      const parent = getParentScale('E', 'phrygian');
      expect(parent?.parentRoot).toBe('C');
      expect(parent?.modeDegree).toBe(3);
    });

    it('returns C Major as parent of A minor', () => {
      const parent = getParentScale('A', 'minor');
      expect(parent?.parentRoot).toBe('C');
      expect(parent?.modeDegree).toBe(6);
    });

    it('returns null for major (parent is itself)', () => {
      expect(getParentScale('C', 'major')).toBeNull();
    });

    it('returns null for pentatonic scales', () => {
      expect(getParentScale('A', 'minor-pentatonic')).toBeNull();
      expect(getParentScale('C', 'blues')).toBeNull();
    });

    it('handles sharp roots correctly', () => {
      const parent = getParentScale('F#', 'dorian');
      expect(parent?.parentRoot).toBe('E');
      expect(parent?.parentDisplay).toBe('E Major');
    });
  });
});
