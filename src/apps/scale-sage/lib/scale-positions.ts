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
 * Find the best starting degree for Position 1 (diatonic scales)
 *
 * For 7-note scales, finds which scale degree creates the most practical
 * Position 1 (around frets 2-5 on low E). Prefers the ROOT when it's in
 * or near the practical range.
 *
 * @param degreeData Array of scale degree chromas
 * @param tuning Current guitar tuning
 * @param idealFretRange Target fret range for Position 1 start [min, max]
 * @returns The degree index (0-based) that should be used for Position 1
 */
function findBestStartingDegree(
  degreeData: Array<{ chroma: number }>,
  tuning: readonly string[],
  idealFretRange: [number, number] = [2, 5]
): number {
  const lowEOpenMidi = Note.midi(tuning[0]);
  if (lowEOpenMidi === null) return 0;

  const [idealMin, idealMax] = idealFretRange;
  const candidates: Array<{ degreeIndex: number; fret: number; score: number }> = [];

  // For each scale degree, find where it falls on the low E string
  for (let degreeIndex = 0; degreeIndex < degreeData.length; degreeIndex++) {
    const chroma = degreeData[degreeIndex].chroma;
    const isRoot = degreeIndex === 0;

    // Find the lowest fret where this degree appears on low E (within frets 0-12)
    for (let fret = 0; fret <= 12; fret++) {
      if ((lowEOpenMidi + fret) % 12 === chroma) {
        let score = 0;

        if (fret >= idealMin && fret <= idealMax) {
          // In ideal range: high score
          // Prefer root strongly when in range, then prefer lower frets
          score = 100 + (isRoot ? 50 : 0) + (idealMax - fret);
        } else if (fret < idealMin) {
          // Below ideal range (e.g., open position): moderate score
          // Still give root bonus if it's close (e.g., fret 1 for root)
          score = 50 + (isRoot ? 20 : 0) - (idealMin - fret) * 2;
        } else if (fret <= idealMax + 3) {
          // Slightly above ideal range (frets 6-8): acceptable for root
          score = 40 + (isRoot ? 30 : 0) - (fret - idealMax) * 3;
        } else {
          // Well above ideal range: low score
          score = 20 - (fret - idealMax);
        }

        candidates.push({ degreeIndex, fret, score });
        break; // Only consider first occurrence on low E
      }
    }
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);

  return candidates.length > 0 ? candidates[0].degreeIndex : 0;
}

/**
 * Find the most practical root location for pentatonic scales
 *
 * For pentatonic/blues scales, Position 1 should always start from the ROOT.
 * This function finds where the root falls in a practical location,
 * checking both low E and A strings.
 *
 * Examples:
 * - A Minor Pent: A at fret 5 on low E (practical)
 * - D Major Pent: D at fret 5 on A string (E string fret 10 is too high)
 * - E Minor Pent: E at fret 0 on low E (open position)
 *
 * @param rootChroma Chroma value of the root note
 * @param tuning Current guitar tuning
 * @returns Object with stringIndex and fret for the root position
 */
function findPracticalRootLocation(
  rootChroma: number,
  tuning: readonly string[]
): { stringIndex: number; fret: number } {
  const candidates: Array<{ stringIndex: number; fret: number; score: number }> = [];

  // Check low E (string 0) and A (string 1) for root locations
  for (let stringIndex = 0; stringIndex <= 1; stringIndex++) {
    const openMidi = Note.midi(tuning[stringIndex]);
    if (openMidi === null) continue;

    for (let fret = 0; fret <= 12; fret++) {
      if ((openMidi + fret) % 12 === rootChroma) {
        let score = 0;

        // Ideal range: frets 3-7 (common pentatonic positions)
        if (fret >= 3 && fret <= 7) {
          score = 100 + (7 - fret); // Prefer lower frets in range
        } else if (fret >= 0 && fret <= 2) {
          // Open/low position: good but slightly less preferred
          score = 80 + fret;
        } else if (fret <= 10) {
          // Higher but acceptable
          score = 50 - (fret - 7);
        } else {
          // Too high
          score = 20 - (fret - 10);
        }

        // Slight preference for low E string when scores are close
        if (stringIndex === 0) score += 5;

        candidates.push({ stringIndex, fret, score });
        break; // Only first occurrence per string
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates.length > 0
    ? { stringIndex: candidates[0].stringIndex, fret: candidates[0].fret }
    : { stringIndex: 0, fret: 0 };
}

/**
 * Find a practical starting fret for a given scale degree
 *
 * @param targetChroma Chroma value of the target note
 * @param tuning Current guitar tuning
 * @returns Fret number on low E string, or fallback
 */
function findStartingFretForDegree(
  targetChroma: number,
  tuning: readonly string[]
): number {
  const lowEOpenMidi = Note.midi(tuning[0]) ?? 40;

  for (let fret = 0; fret <= 12; fret++) {
    if ((lowEOpenMidi + fret) % 12 === targetChroma) {
      return fret;
    }
  }

  return 0;
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
 * Current behavior: Position 1 is the LOWEST PRACTICAL position on the fretboard.
 * This may not start from the root note (e.g., D Major Pent Position 1 starts from F#).
 *
 * Future enhancement: Add toggle for "Theory mode" where Position 1 always starts
 * from the root, even if it's at a higher fret position.
 *
 * @param scaleInfo Scale information
 * @param tuning Current tuning
 * @returns Array of 5 ScalePosition objects
 */
export function getPentatonicPositions(
  scaleInfo: ScaleInfo,
  tuning: readonly string[]
): ScalePosition[] {
  const positions: ScalePosition[] = [];
  const numDegrees = scaleInfo.noteCount;
  const numPositions = Math.min(numDegrees, 6); // 5 for pentatonic, 6 for blues

  const rootChroma = Note.chroma(Note.pitchClass(scaleInfo.root));
  if (rootChroma === undefined) return positions;

  // Build array of scale degree chromas and intervals
  const degreeData: Array<{ chroma: number; interval: string; note: string }> = [];
  for (let i = 0; i < scaleInfo.notes.length; i++) {
    const noteChroma = Note.chroma(Note.pitchClass(scaleInfo.notes[i]));
    if (noteChroma !== undefined) {
      degreeData.push({
        chroma: noteChroma,
        interval: scaleInfo.intervals[i],
        note: Note.pitchClass(scaleInfo.notes[i]),
      });
    }
  }

  // Find which scale degree creates the best Position 1 (lowest practical position)
  const startingDegreeOffset = findBestStartingDegree(degreeData, tuning);

  // Generate each position
  for (let pos = 0; pos < numPositions; pos++) {
    const positionNotes: HighlightedNote[] = [];

    // This position starts from scale degree (startingDegreeOffset + pos) % numDegrees
    const startDegree = (startingDegreeOffset + pos) % numDegrees;
    let currentDegreeIndex = startDegree;

    // Find where this starting degree falls on the low E string
    const firstDegreeChroma = degreeData[currentDegreeIndex].chroma;
    const referenceFret = findStartingFretForDegree(firstDegreeChroma, tuning);

    // Process each string from low E (0) to high E (5)
    for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
      let searchMinFret: number;

      if (stringIndex === 0) {
        searchMinFret = Math.max(0, referenceFret);
      } else {
        const prevStringLastNote = positionNotes
          .filter(n => n.stringIndex === stringIndex - 1)
          .sort((a, b) => b.fret - a.fret)[0];

        if (prevStringLastNote) {
          const prevDegreeIndex = (currentDegreeIndex - 1 + numDegrees) % numDegrees;
          const prevChroma = degreeData[prevDegreeIndex].chroma;
          const nextChroma = degreeData[currentDegreeIndex % numDegrees].chroma;
          const semitonesUp = (nextChroma - prevChroma + 12) % 12;
          const stringGap = stringIndex === 4 ? 4 : 5;

          searchMinFret = Math.max(0, prevStringLastNote.fret + semitonesUp - stringGap);
        } else {
          searchMinFret = Math.max(0, referenceFret - 2);
        }
      }

      // Find the 2 consecutive scale degrees on this string (pentatonic = 2 per string)
      for (let noteNum = 0; noteNum < 2; noteNum++) {
        const degreeIndex = currentDegreeIndex % numDegrees;
        const degree = degreeData[degreeIndex];

        const fret = findNoteOnString(degree.chroma, stringIndex, tuning, searchMinFret);

        if (fret !== null && fret <= FRET_COUNT) {
          const isRoot = degree.chroma === rootChroma;

          positionNotes.push({
            stringIndex: stringIndex as StringIndex,
            fret,
            note: degree.note,
            interval: getIntervalLabel(degree.interval),
            isRoot,
            color: getIntervalColor(degree.interval),
          });

          searchMinFret = fret + 1;
        }

        currentDegreeIndex++;
      }
    }

    const frets = positionNotes.map(n => n.fret);
    const minFret = frets.length > 0 ? Math.min(...frets) : 0;
    const maxFret = frets.length > 0 ? Math.max(...frets) : FRET_COUNT;

    positions.push({
      number: pos + 1,
      startFret: minFret,
      endFret: maxFret,
      notes: positionNotes,
    });
  }

  return positions;
}

/**
 * Find the lowest fret where a specific pitch class occurs on a string,
 * starting from a minimum fret
 */
function findNoteOnString(
  targetChroma: number,
  stringIndex: number,
  tuning: readonly string[],
  minFret: number
): number | null {
  const openMidi = Note.midi(tuning[stringIndex]);
  if (openMidi === null) return null;

  // Search up to fret 15 to find the note
  for (let fret = minFret; fret <= Math.max(FRET_COUNT, 15); fret++) {
    if ((openMidi + fret) % 12 === targetChroma) {
      return fret;
    }
  }
  return null;
}

/**
 * Find 3-notes-per-string (3NPS) positions for 7-note scales
 *
 * 3NPS patterns have exactly 3 notes on each string, making them
 * excellent for fast legato runs and consistent fingering patterns.
 *
 * Position 1 starts from the lowest practical position on the fretboard
 * (around frets 2-5), regardless of which scale degree that is.
 * Subsequent positions cycle through all 7 degrees.
 *
 * Example for C Major:
 * - Position 1 starts from G (degree 5) at fret 3
 * - Position 2 starts from A (degree 6) at fret 5
 * - etc.
 *
 * @param scaleInfo Scale information
 * @param tuning Current tuning
 * @returns Array of 7 ScalePosition objects
 */
export function get3NPSPositions(
  scaleInfo: ScaleInfo,
  tuning: readonly string[]
): ScalePosition[] {
  const positions: ScalePosition[] = [];
  const numDegrees = scaleInfo.noteCount;
  const numPositions = Math.min(7, numDegrees);

  const rootChroma = Note.chroma(Note.pitchClass(scaleInfo.root));
  if (rootChroma === undefined) return positions;

  // Build array of scale degree chromas and intervals
  const degreeData: Array<{ chroma: number; interval: string; note: string }> = [];
  for (let i = 0; i < scaleInfo.notes.length; i++) {
    const noteChroma = Note.chroma(Note.pitchClass(scaleInfo.notes[i]));
    if (noteChroma !== undefined) {
      degreeData.push({
        chroma: noteChroma,
        interval: scaleInfo.intervals[i],
        note: Note.pitchClass(scaleInfo.notes[i]),
      });
    }
  }

  // Find which scale degree creates the best Position 1 (lowest practical position)
  const startingDegreeOffset = findBestStartingDegree(degreeData, tuning);

  // Generate each position
  for (let pos = 0; pos < numPositions; pos++) {
    const positionNotes: HighlightedNote[] = [];

    // This position starts from scale degree (startingDegreeOffset + pos) % numDegrees
    // Position 1 (pos=0) uses startingDegreeOffset
    // Position 2 (pos=1) uses startingDegreeOffset + 1, etc.
    const startDegree = (startingDegreeOffset + pos) % numDegrees;
    let currentDegreeIndex = startDegree;

    // Find where this starting degree falls on the low E string
    const firstDegreeChroma = degreeData[currentDegreeIndex].chroma;
    const referenceFret = findStartingFretForDegree(firstDegreeChroma, tuning);

    // Process each string from low E (0) to high E (5)
    for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
      // Determine minimum fret to search from for this string
      // For first string, use reference fret
      // For subsequent strings, account for the pitch difference between strings
      let searchMinFret: number;

      if (stringIndex === 0) {
        searchMinFret = Math.max(0, referenceFret);
      } else {
        // When moving to a higher-pitched string, we typically go BACK on frets
        // Standard tuning intervals: E-A(5), A-D(5), D-G(5), G-B(4), B-E(5)
        const prevStringLastNote = positionNotes
          .filter(n => n.stringIndex === stringIndex - 1)
          .sort((a, b) => b.fret - a.fret)[0];

        if (prevStringLastNote) {
          // Go back ~4-5 frets to account for string pitch difference
          // But also account for the semitone gap between last note and next note
          const prevDegreeIndex = (currentDegreeIndex - 1 + numDegrees) % numDegrees;
          const prevChroma = degreeData[prevDegreeIndex].chroma;
          const nextChroma = degreeData[currentDegreeIndex % numDegrees].chroma;
          const semitonesUp = (nextChroma - prevChroma + 12) % 12;

          // String pitch difference is typically 5 semitones (4 for G-B)
          const stringGap = stringIndex === 4 ? 4 : 5; // G(3) to B(4) is only 4 semitones

          searchMinFret = Math.max(0, prevStringLastNote.fret + semitonesUp - stringGap);
        } else {
          searchMinFret = Math.max(0, referenceFret - 2);
        }
      }

      // Find the 3 consecutive scale degrees on this string
      for (let noteNum = 0; noteNum < 3; noteNum++) {
        const degreeIndex = currentDegreeIndex % numDegrees;
        const degree = degreeData[degreeIndex];

        const fret = findNoteOnString(degree.chroma, stringIndex, tuning, searchMinFret);

        if (fret !== null && fret <= FRET_COUNT) {
          const isRoot = degree.chroma === rootChroma;

          positionNotes.push({
            stringIndex: stringIndex as StringIndex,
            fret,
            note: degree.note,
            interval: getIntervalLabel(degree.interval),
            isRoot,
            color: getIntervalColor(degree.interval),
          });

          // Next note on this string must be at a higher fret
          searchMinFret = fret + 1;
        }

        currentDegreeIndex++;
      }
    }

    // Calculate fret range
    const frets = positionNotes.map(n => n.fret);
    const minFret = frets.length > 0 ? Math.min(...frets) : 0;
    const maxFret = frets.length > 0 ? Math.max(...frets) : FRET_COUNT;

    positions.push({
      number: pos + 1,
      startFret: minFret,
      endFret: maxFret,
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

  // Choose position type based on scale note count
  // 5-note scales (pentatonic) and blues use box patterns (2 notes per string)
  // 7-note scales (diatonic) use 3NPS patterns (3 notes per string)
  if (scaleInfo.noteCount === 5 || scaleInfo.type === 'blues') {
    return getPentatonicPositions(scaleInfo, tuning);
  }

  // 7-note scales always use 3NPS for proper fingering patterns
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
