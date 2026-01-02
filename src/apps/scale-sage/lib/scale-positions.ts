/**
 * Scale Position Generator
 *
 * Generates fret positions for scales on the guitar fretboard.
 * Supports full fretboard display and position-based patterns.
 */

import { Note } from '@tonaljs/tonal';
import type { StringIndex, HighlightedNote } from '../../../shared/types';
import type { ScaleInfo } from './scale-data';
import { FRET_COUNT } from '../../../shared/config/constants';
import { COLORS } from '../../../shared/config/theme';

/**
 * Find a practical starting fret for scale positions
 *
 * Looks for root notes on the low E and A strings within the first 7 frets,
 * preferring lower positions that keep all scale positions within the fretboard.
 *
 * Examples:
 * - G major: E string fret 3 (practical, stays in bounds)
 * - C major: A string fret 3 (instead of E string fret 8)
 * - D major: A string fret 5 (instead of E string fret 10)
 *
 * @param rootChroma Chroma value of the root note (0-11)
 * @param tuning Current guitar tuning
 * @returns Object with stringIndex and fret for the practical starting position
 */
function findPracticalStartingFret(
  rootChroma: number,
  tuning: readonly string[]
): { stringIndex: number; fret: number } {
  const candidates: Array<{ stringIndex: number; fret: number; score: number }> = [];

  // Search on low E (string 0) and A (string 1) within first 7 frets
  for (let stringIndex = 0; stringIndex <= 1; stringIndex++) {
    const openMidi = Note.midi(tuning[stringIndex]);
    if (openMidi === null) continue;

    for (let fret = 0; fret <= 7; fret++) {
      const fretChroma = (openMidi + fret) % 12;
      if (fretChroma === rootChroma) {
        // Calculate how well this starting point fits all positions
        // Estimate last position end fret (rough: start + 12 semitones for full octave)
        const estimatedLastFret = fret + 12;
        const fitsInFretboard = estimatedLastFret <= FRET_COUNT;

        // Score: prefer lower frets, prefer E string, prefer fits in fretboard
        const score =
          (fitsInFretboard ? 100 : 0) + // Big bonus for fitting
          (10 - fret) + // Prefer lower frets
          (stringIndex === 0 ? 2 : 0); // Slight preference for E string

        candidates.push({ stringIndex, fret, score });
      }
    }
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);

  // Return best candidate, or fall back to searching further up the E string
  if (candidates.length > 0) {
    return { stringIndex: candidates[0].stringIndex, fret: candidates[0].fret };
  }

  // Fallback: find first root on E string anywhere
  const lowEOpenMidi = Note.midi(tuning[0]) ?? 40;
  for (let fret = 0; fret <= 12; fret++) {
    if ((lowEOpenMidi + fret) % 12 === rootChroma) {
      return { stringIndex: 0, fret };
    }
  }

  return { stringIndex: 0, fret: 0 };
}

/** Position pattern for box/3NPS display */
export interface ScalePosition {
  /** Position number (1-based) */
  number: number;
  /** Starting fret for this position */
  startFret: number;
  /** Ending fret for this position */
  endFret: number;
  /** Notes to highlight for this position */
  notes: HighlightedNote[];
}

/**
 * Get color for a scale degree based on interval
 * Uses the same color scheme as chord intervals for consistency
 */
function getIntervalColor(interval: string): string {
  // Root (1P)
  if (interval === '1P') return COLORS.intervals.root;

  // Third (3M = major, 3m = minor)
  if (interval.startsWith('3')) return COLORS.intervals.third;

  // Fifth (5P, 5A = augmented, 5d = diminished)
  if (interval.startsWith('5')) return COLORS.intervals.fifth;

  // Seventh (7M = major, 7m = minor)
  if (interval.startsWith('7')) return COLORS.intervals.seventh;

  // Extensions (2, 4, 6, and any alterations)
  return COLORS.intervals.extension;
}

/**
 * Get interval label for display (e.g., 'R', 'b3', '5')
 */
function getIntervalLabel(interval: string): string {
  const match = interval.match(/^(\d+)(.*)/);
  if (!match) return interval;

  const degree = match[1];
  const quality = match[2];

  // Root is always 'R'
  if (degree === '1') return 'R';

  // Map quality to accidental
  switch (quality) {
    case 'P': // Perfect
    case 'M': // Major
      return degree;
    case 'm': // Minor (flat)
      return `b${degree}`;
    case 'A': // Augmented (sharp)
      return `#${degree}`;
    case 'd': // Diminished (double flat for b5)
      return degree === '5' ? 'b5' : `bb${degree}`;
    default:
      return degree;
  }
}

/**
 * Generate all scale notes across the entire fretboard
 *
 * @param scaleInfo Scale information from getScale()
 * @param tuning Current guitar tuning
 * @param maxFret Maximum fret to include (default: FRET_COUNT)
 * @returns Array of HighlightedNote for all scale notes on fretboard
 */
export function getScaleNotes(
  scaleInfo: ScaleInfo,
  tuning: readonly string[],
  maxFret: number = FRET_COUNT
): HighlightedNote[] {
  const notes: HighlightedNote[] = [];

  // Build a map of pitch class (chroma) to interval for quick lookup
  const chromaToInterval = new Map<number, string>();
  scaleInfo.notes.forEach((note, index) => {
    const chroma = Note.chroma(Note.pitchClass(note));
    if (chroma !== undefined) {
      chromaToInterval.set(chroma, scaleInfo.intervals[index]);
    }
  });

  // Get root chroma for isRoot check
  const rootChroma = Note.chroma(Note.pitchClass(scaleInfo.root));

  // Iterate through each string and fret
  for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
    const openNote = tuning[stringIndex];
    const openMidi = Note.midi(openNote);
    if (openMidi === null) continue;

    for (let fret = 0; fret <= maxFret; fret++) {
      const noteMidi = openMidi + fret;
      const noteName = Note.fromMidi(noteMidi);
      const pitchClass = Note.pitchClass(noteName);
      const chroma = Note.chroma(pitchClass);

      if (chroma === undefined) continue;

      const interval = chromaToInterval.get(chroma);
      if (interval) {
        const isRoot = chroma === rootChroma;
        notes.push({
          stringIndex: stringIndex as StringIndex,
          fret,
          note: pitchClass,
          interval: getIntervalLabel(interval),
          isRoot,
          color: getIntervalColor(interval),
        });
      }
    }
  }

  return notes;
}

/**
 * Find box positions for pentatonic scales
 *
 * Pentatonic boxes are the classic 5 positions covering the fretboard.
 * Each position spans 3-4 frets with 2 notes per string.
 *
 * @param scaleInfo Scale information
 * @param tuning Current tuning
 * @returns Array of 5 ScalePosition objects
 */
export function getPentatonicPositions(
  scaleInfo: ScaleInfo,
  tuning: readonly string[]
): ScalePosition[] {
  const allNotes = getScaleNotes(scaleInfo, tuning);
  const positions: ScalePosition[] = [];

  // For pentatonic/blues scales, we create 5 positions
  // Each position is a 4-fret window that slides up the neck
  const numPositions = 5;

  const rootChroma = Note.chroma(Note.pitchClass(scaleInfo.root));
  if (rootChroma === undefined) return positions;

  // Find practical starting position (may be on A string for some scales)
  const startingPoint = findPracticalStartingFret(rootChroma, tuning);
  const firstRootFret = startingPoint.fret;

  // Calculate semitone offsets for each scale degree
  const degreeOffsets: number[] = [];
  for (let i = 0; i < scaleInfo.notes.length; i++) {
    const noteChroma = Note.chroma(Note.pitchClass(scaleInfo.notes[i]));
    if (noteChroma !== undefined && rootChroma !== undefined) {
      degreeOffsets.push((noteChroma - rootChroma + 12) % 12);
    }
  }

  for (let pos = 0; pos < numPositions; pos++) {
    // Each position starts from a different scale degree
    const degreeIndex = pos % degreeOffsets.length;
    const offsetFromRoot = degreeOffsets[degreeIndex];

    // Calculate position's starting fret
    const positionStart = firstRootFret + offsetFromRoot;
    const startFret = Math.max(0, positionStart);
    const endFret = Math.min(startFret + 4, FRET_COUNT);

    // Get notes within this position's fret range
    const positionNotes = allNotes.filter(
      (n) => n.fret >= startFret && n.fret <= endFret
    );

    positions.push({
      number: pos + 1,
      startFret,
      endFret,
      notes: positionNotes,
    });
  }

  return positions;
}

/**
 * Find 3-notes-per-string (3NPS) positions for 7-note scales
 *
 * 3NPS patterns have exactly 3 notes on each string, making them
 * excellent for fast legato runs and consistent fingering patterns.
 *
 * @param scaleInfo Scale information
 * @param tuning Current tuning
 * @returns Array of 7 ScalePosition objects
 */
export function get3NPSPositions(
  scaleInfo: ScaleInfo,
  tuning: readonly string[]
): ScalePosition[] {
  const allNotes = getScaleNotes(scaleInfo, tuning);
  const positions: ScalePosition[] = [];

  // For 7-note scales, we have 7 positions, each starting from a different degree
  const numPositions = Math.min(7, scaleInfo.noteCount);

  // Get root chroma and calculate semitone offsets for each scale degree
  const rootChroma = Note.chroma(Note.pitchClass(scaleInfo.root));
  if (rootChroma === undefined) return positions;

  const degreeOffsets: number[] = [];
  for (const note of scaleInfo.notes) {
    const noteChroma = Note.chroma(Note.pitchClass(note));
    if (noteChroma !== undefined) {
      degreeOffsets.push((noteChroma - rootChroma + 12) % 12);
    }
  }

  // Find practical starting position (may be on A string for some scales)
  const startingPoint = findPracticalStartingFret(rootChroma, tuning);
  const firstRootFret = startingPoint.fret;

  // Generate positions - each starts from a different scale degree
  for (let pos = 0; pos < numPositions; pos++) {
    const degreeOffset = degreeOffsets[pos % degreeOffsets.length];
    const positionStart = firstRootFret + degreeOffset;

    // 3NPS positions span about 5 frets
    const startFret = Math.max(0, positionStart);
    const endFret = Math.min(startFret + 5, FRET_COUNT);

    // For 3NPS, we want up to 3 notes per string within the position range
    const positionNotes: HighlightedNote[] = [];

    for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
      const stringNotes = allNotes
        .filter(
          (n) =>
            n.stringIndex === stringIndex &&
            n.fret >= startFret &&
            n.fret <= endFret
        )
        .sort((a, b) => a.fret - b.fret)
        .slice(0, 3); // Take first 3 notes per string

      positionNotes.push(...stringNotes);
    }

    positions.push({
      number: pos + 1,
      startFret,
      endFret,
      notes: positionNotes,
    });
  }

  return positions;
}

/**
 * Get positions based on scale type and position type preference
 *
 * @param scaleInfo Scale information
 * @param tuning Current tuning
 * @param positionType Type of position pattern
 * @returns Array of ScalePosition objects
 */
export function getScalePositions(
  scaleInfo: ScaleInfo,
  tuning: readonly string[],
  positionType: 'boxes' | '3nps' | 'full'
): ScalePosition[] {
  if (positionType === 'full') {
    // Full fretboard is a single "position" with all notes
    const allNotes = getScaleNotes(scaleInfo, tuning);
    return [
      {
        number: 0,
        startFret: 0,
        endFret: FRET_COUNT,
        notes: allNotes,
      },
    ];
  }

  // Choose position type based on scale
  if (
    scaleInfo.noteCount === 5 ||
    scaleInfo.type === 'blues' ||
    positionType === 'boxes'
  ) {
    return getPentatonicPositions(scaleInfo, tuning);
  }

  return get3NPSPositions(scaleInfo, tuning);
}

/**
 * Get notes for a specific position
 *
 * @param scaleInfo Scale information
 * @param tuning Current tuning
 * @param positionNumber Position number (0 = full, 1-7 = specific position)
 * @param positionType Position pattern type
 * @returns Array of HighlightedNote for the position
 */
export function getPositionNotes(
  scaleInfo: ScaleInfo,
  tuning: readonly string[],
  positionNumber: number,
  positionType: 'boxes' | '3nps' | 'full'
): HighlightedNote[] {
  if (positionNumber === 0 || positionType === 'full') {
    return getScaleNotes(scaleInfo, tuning);
  }

  const positions = getScalePositions(scaleInfo, tuning, positionType);
  const position = positions.find((p) => p.number === positionNumber);

  return position?.notes ?? [];
}

/**
 * Get notes for audio playback (sorted low to high or high to low)
 *
 * @param notes Array of highlighted notes
 * @param tuning Current tuning
 * @param direction Playback direction
 * @returns Array of note strings with octaves for audio playback
 */
export function getPlaybackNotes(
  notes: HighlightedNote[],
  tuning: readonly string[],
  direction: 'ascending' | 'descending' = 'ascending'
): string[] {
  // Calculate actual pitch for each note
  const notesWithPitch = notes.map((n) => {
    const openMidi = Note.midi(tuning[n.stringIndex]) ?? 40;
    const noteMidi = openMidi + n.fret;
    const fullNote = Note.fromMidi(noteMidi);
    return {
      ...n,
      midi: noteMidi,
      fullNote,
    };
  });

  // Sort by pitch
  notesWithPitch.sort((a, b) =>
    direction === 'ascending' ? a.midi - b.midi : b.midi - a.midi
  );

  // Remove duplicate pitches (same note from different strings)
  const seen = new Set<number>();
  const uniqueNotes = notesWithPitch.filter((n) => {
    if (seen.has(n.midi)) return false;
    seen.add(n.midi);
    return true;
  });

  return uniqueNotes.map((n) => n.fullNote);
}
