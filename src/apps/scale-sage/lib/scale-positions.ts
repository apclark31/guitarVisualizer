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
 * Uses the "2 closest to anchor" approach:
 * 1. For each position, find where a scale degree falls on the anchor string (anchor fret)
 * 2. For each string, find ALL scale notes on the fretboard
 * 3. Select the 2 notes at or above the anchor fret
 *
 * This creates traditional box patterns that match how guitarists learn pentatonic scales.
 *
 * For blues scales, use getBluesPositions() which builds on pentatonic + adds the blue note.
 *
 * @param scaleInfo Scale information (should be 5-note pentatonic)
 * @param tuning Current tuning
 * @param anchorString Which string to use as anchor (0 = low E, 1 = A string). Default: 0
 * @returns Array of ScalePosition objects
 */
export function getPentatonicPositions(
  scaleInfo: ScaleInfo,
  tuning: readonly string[],
  anchorString: number = 0
): ScalePosition[] {
  const positions: ScalePosition[] = [];
  const numDegrees = scaleInfo.noteCount;
  const numPositions = numDegrees; // One position per scale degree

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
  const startingDegreeOffset = findBestStartingDegree(degreeData, tuning, [2, 5]);

  // Get anchor string open note MIDI
  const anchorOpenMidi = Note.midi(tuning[anchorString]) ?? 40;

  // Pre-compute all scale notes on each string (frets 0-15 to have headroom)
  const scaleNotesPerString: Array<Array<{ fret: number; degreeIndex: number }>> = [];
  for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
    const openMidi = Note.midi(tuning[stringIndex]);
    if (openMidi === null) {
      scaleNotesPerString.push([]);
      continue;
    }

    const stringNotes: Array<{ fret: number; degreeIndex: number }> = [];
    for (let fret = 0; fret <= Math.max(FRET_COUNT, 15); fret++) {
      const noteChroma = (openMidi + fret) % 12;
      const degreeIndex = degreeData.findIndex(d => d.chroma === noteChroma);
      if (degreeIndex !== -1) {
        stringNotes.push({ fret, degreeIndex });
      }
    }
    scaleNotesPerString.push(stringNotes);
  }

  // Generate each position
  for (let pos = 0; pos < numPositions; pos++) {
    const positionNotes: HighlightedNote[] = [];

    // This position starts from scale degree (startingDegreeOffset + pos) % numDegrees
    const startDegree = (startingDegreeOffset + pos) % numDegrees;

    // Find where this starting degree falls on the anchor string (anchor fret)
    const startChroma = degreeData[startDegree].chroma;
    let anchorFret = 0;
    for (let fret = 0; fret <= 12; fret++) {
      if ((anchorOpenMidi + fret) % 12 === startChroma) {
        anchorFret = fret;
        break;
      }
    }

    // For each string, select 2 notes starting from anchor fret going UP
    // Traditional boxes span upward from the anchor position
    for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
      const stringNotes = scaleNotesPerString[stringIndex];
      if (stringNotes.length === 0) continue;

      // Find the first scale note at or above (anchor - 1) to allow slight flexibility
      // Then take that note and the next one
      const minFret = Math.max(0, anchorFret - 1);
      const notesAtOrAbove = stringNotes.filter(n => n.fret >= minFret);

      // Always take 2 notes per string for pentatonic/blues box patterns
      // Blues is pentatonic-based: the b5 (blue note) appears naturally as one of the 2 notes
      const selected = notesAtOrAbove.slice(0, 2);

      // Only include notes within reasonable range (FRET_COUNT)
      for (const note of selected) {
        if (note.fret <= FRET_COUNT) {
          const degree = degreeData[note.degreeIndex];
          const isRoot = degree.chroma === rootChroma;

          positionNotes.push({
            stringIndex: stringIndex as StringIndex,
            fret: note.fret,
            note: degree.note,
            interval: getIntervalLabel(degree.interval),
            isRoot,
            color: getIntervalColor(degree.interval),
          });
        }
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
 * Find box positions for blues scale
 *
 * Blues = Minor Pentatonic + b5 (the "blue note")
 *
 * Algorithm:
 * 1. Generate minor pentatonic positions for the same root
 * 2. For each position, find where the b5 falls within the fret range
 * 3. Add the b5 to the position on strings where it fits
 *
 * @param scaleInfo Blues scale information
 * @param tuning Current tuning
 * @returns Array of ScalePosition objects
 */
export function getBluesPositions(
  scaleInfo: ScaleInfo,
  tuning: readonly string[]
): ScalePosition[] {
  // Create a "fake" minor pentatonic scale info to generate base positions
  const minorPentInfo: ScaleInfo = {
    ...scaleInfo,
    type: 'minor-pentatonic' as ScaleInfo['type'],
    // Minor pentatonic: 1, b3, 4, 5, b7 (remove the b5 from blues)
    notes: scaleInfo.notes.filter((_, i) => scaleInfo.intervals[i] !== '5d'),
    intervals: scaleInfo.intervals.filter(i => i !== '5d'),
    noteCount: 5,
  };

  // Generate pentatonic positions
  const positions = getPentatonicPositions(minorPentInfo, tuning);

  // Find the blue note (b5) chroma
  const blueNoteIndex = scaleInfo.intervals.findIndex(i => i === '5d');
  if (blueNoteIndex === -1) return positions; // No blue note found

  const blueNote = scaleInfo.notes[blueNoteIndex];
  const blueNoteChroma = Note.chroma(Note.pitchClass(blueNote));
  if (blueNoteChroma === undefined) return positions;

  const rootChroma = Note.chroma(Note.pitchClass(scaleInfo.root));

  // Add blue note to each position where it fits WITHIN the pentatonic box
  // The blue note should not extend the box boundaries - it's a passing tone
  // Track which MIDI pitches of the blue note we've added to avoid unisons across strings
  for (const position of positions) {
    const positionMinFret = position.startFret;
    const positionMaxFret = position.endFret;

    // Track blue note pitches (MIDI values) already added to this position
    const addedBlueNoteMidis = new Set<number>();

    // For each string, check if blue note falls WITHIN the pentatonic box range
    for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
      const openMidi = Note.midi(tuning[stringIndex]);
      if (openMidi === null) continue;

      // Find where blue note is on this string - only search WITHIN the box
      for (let fret = positionMinFret; fret <= positionMaxFret; fret++) {
        if ((openMidi + fret) % 12 === blueNoteChroma && fret <= FRET_COUNT) {
          const noteMidi = openMidi + fret;

          // Don't add if this exact string/fret position exists
          const exactExists = position.notes.some(
            n => n.stringIndex === stringIndex && n.fret === fret
          );

          // Don't add if this PITCH (MIDI) was already added on another string
          // This prevents unison notes like Gb@9 on A and Gb@4 on D
          const pitchExists = addedBlueNoteMidis.has(noteMidi);

          if (!exactExists && !pitchExists) {
            position.notes.push({
              stringIndex: stringIndex as StringIndex,
              fret,
              note: blueNote,
              interval: 'b5',
              isRoot: blueNoteChroma === rootChroma,
              color: getIntervalColor('5d'),
            });
            addedBlueNoteMidis.add(noteMidi);
          }
          break; // Only check one instance per string
        }
      }
    }

    // Re-sort notes (fret range stays the same since blue note is within bounds)
    position.notes.sort((a, b) => a.stringIndex - b.stringIndex || a.fret - b.fret);
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

  // Blues scale: pentatonic + blue note
  if (scaleInfo.type === 'blues') {
    return getBluesPositions(scaleInfo, tuning);
  }

  // 5-note scales (pentatonic) use box patterns (2 notes per string)
  if (scaleInfo.noteCount === 5) {
    return getPentatonicPositions(scaleInfo, tuning);
  }

  // 7-note scales use 3NPS patterns (3 notes per string)
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

/** Playback note with position info for visual sync */
export interface PlaybackNoteWithPosition {
  note: string;           // Full note name with octave (e.g., "E2")
  stringIndex: number;    // String position on fretboard
  fret: number;           // Fret position on fretboard
}

/**
 * Get playback notes with position info for visual highlighting
 * Same as getPlaybackNotes but includes fretboard position for each note
 */
export function getPlaybackNotesWithPositions(
  notes: HighlightedNote[],
  tuning: readonly string[],
  direction: 'ascending' | 'descending' = 'ascending'
): PlaybackNoteWithPosition[] {
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

  return uniqueNotes.map((n) => ({
    note: n.fullNote,
    stringIndex: n.stringIndex,
    fret: n.fret,
  }));
}
