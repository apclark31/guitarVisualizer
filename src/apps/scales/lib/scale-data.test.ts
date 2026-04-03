import { describe, it, expect } from 'vitest';
import {
  getScale,
  getIntervalLabel,
  getScaleDegreeLabels,
  isNoteInScale,
  getNoteInterval,
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
      expect(SCALE_TYPE_DISPLAY['major']).toBe('Major');
      expect(SCALE_TYPE_DISPLAY['minor']).toBe('Natural Minor');
      expect(SCALE_TYPE_DISPLAY['major-pentatonic']).toBe('Major Pentatonic');
      expect(SCALE_TYPE_DISPLAY['minor-pentatonic']).toBe('Minor Pentatonic');
      expect(SCALE_TYPE_DISPLAY['blues']).toBe('Blues');
    });

    it('has scale categories', () => {
      expect(SCALE_CATEGORIES.diatonic).toContain('major');
      expect(SCALE_CATEGORIES.diatonic).toContain('minor');
      expect(SCALE_CATEGORIES.pentatonic).toContain('minor-pentatonic');
      expect(SCALE_CATEGORIES.pentatonic).toContain('blues');
    });

    it('has all 12 root notes', () => {
      expect(ROOT_NOTES).toHaveLength(12);
      expect(ROOT_NOTES).toContain('C');
      expect(ROOT_NOTES).toContain('F#');
    });
  });
});
