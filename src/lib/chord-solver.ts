/**
 * Chord Solver - "Solve, Don't Store"
 *
 * Dynamically calculates valid guitar chord voicings using a sliding window algorithm.
 * No static chord dictionaries - everything is computed from music theory.
 */

import { Chord, Note } from '@tonaljs/tonal';
import {
  STANDARD_TUNING,
  STRING_COUNT,
  FRET_COUNT,
  MAX_HAND_SPAN,
  QUALITY_TO_SYMBOL,
} from '../config/constants';
import type { ChordVoicing, FretNumber } from '../types';

/** Get MIDI note number for a string/fret position */
function getMidiAt(stringIndex: number, fret: number): number {
  const openMidi = Note.midi(STANDARD_TUNING[stringIndex]);
  if (openMidi === null) throw new Error(`Invalid tuning note: ${STANDARD_TUNING[stringIndex]}`);
  return openMidi + fret;
}

/** Get note name (pitch class) at a string/fret position */
function getNoteAt(stringIndex: number, fret: number): string {
  const midi = getMidiAt(stringIndex, fret);
  const note = Note.fromMidi(midi);
  return Note.pitchClass(note) || '';
}

/** Normalize note to pitch class for comparison (handles enharmonics) */
function normalizePitchClass(note: string): number {
  const midi = Note.midi(note + '4'); // Add octave for midi calculation
  if (midi === null) return -1;
  return midi % 12;
}

/** Check if two notes are enharmonically equivalent */
function areEnharmonic(note1: string, note2: string): boolean {
  return normalizePitchClass(note1) === normalizePitchClass(note2);
}

/** Find all frets on a string that produce any of the target notes */
function findChordTonesOnString(
  stringIndex: number,
  targetNotes: string[],
  minFret: number,
  maxFret: number
): number[] {
  const validFrets: number[] = [];

  for (let fret = minFret; fret <= maxFret; fret++) {
    const noteAtFret = getNoteAt(stringIndex, fret);
    if (targetNotes.some(target => areEnharmonic(noteAtFret, target))) {
      validFrets.push(fret);
    }
  }

  return validFrets;
}

/** Generate all combinations of frets across strings (including muted strings) */
function generateCombinations(
  optionsPerString: (number | null)[][]
): (number | null)[][] {
  const results: (number | null)[][] = [];

  function recurse(stringIndex: number, current: (number | null)[]) {
    if (stringIndex === optionsPerString.length) {
      results.push([...current]);
      return;
    }

    for (const option of optionsPerString[stringIndex]) {
      current.push(option);
      recurse(stringIndex + 1, current);
      current.pop();
    }
  }

  recurse(0, []);
  return results;
}

/** Check if a voicing contains all required notes */
function hasRequiredNotes(
  frets: (number | null)[],
  requiredNotes: string[]
): boolean {
  const presentNotes = new Set<number>();

  frets.forEach((fret, stringIndex) => {
    if (fret !== null) {
      const pitchClass = normalizePitchClass(getNoteAt(stringIndex, fret));
      presentNotes.add(pitchClass);
    }
  });

  return requiredNotes.every(note =>
    presentNotes.has(normalizePitchClass(note))
  );
}

/** Calculate the actual hand span of a voicing (ignoring muted strings and open frets) */
function getHandSpan(frets: (number | null)[]): { lowest: number; highest: number; span: number } {
  const frettedPositions = frets.filter((f): f is number => f !== null && f > 0);

  if (frettedPositions.length === 0) {
    return { lowest: 0, highest: 0, span: 0 };
  }

  const lowest = Math.min(...frettedPositions);
  const highest = Math.max(...frettedPositions);

  return {
    lowest,
    highest,
    span: highest - lowest,
  };
}

/** Get the lowest fret used in a voicing (for sorting) */
function getLowestFret(frets: (number | null)[]): number {
  const playedFrets = frets.filter((f): f is number => f !== null);
  if (playedFrets.length === 0) return 0;
  return Math.min(...playedFrets);
}

/** Get the highest fret used in a voicing */
function getHighestFret(frets: (number | null)[]): number {
  const playedFrets = frets.filter((f): f is number => f !== null);
  if (playedFrets.length === 0) return 0;
  return Math.max(...playedFrets);
}

/** Get note names for all played positions in a voicing */
function getVoicingNotes(frets: (number | null)[]): string[] {
  const notes: string[] = [];

  frets.forEach((fret, stringIndex) => {
    if (fret !== null) {
      const fullNote = Note.fromMidi(getMidiAt(stringIndex, fret));
      notes.push(fullNote);
    }
  });

  return notes;
}

/** Check if voicing has consecutive muted strings in the middle (usually unplayable) */
function hasPlayableShape(frets: (number | null)[]): boolean {
  // Find first and last played string
  let firstPlayed = -1;
  let lastPlayed = -1;

  for (let i = 0; i < frets.length; i++) {
    if (frets[i] !== null) {
      if (firstPlayed === -1) firstPlayed = i;
      lastPlayed = i;
    }
  }

  if (firstPlayed === -1) return false; // No notes played

  // Count consecutive muted strings between first and last played
  let consecutiveMuted = 0;
  for (let i = firstPlayed; i <= lastPlayed; i++) {
    if (frets[i] === null) {
      consecutiveMuted++;
      // Allow at most 1 consecutive muted string in the middle
      if (consecutiveMuted > 1) return false;
    } else {
      consecutiveMuted = 0;
    }
  }

  return true;
}

/** Deduplicate voicings that produce the same result */
function deduplicateVoicings(voicings: ChordVoicing[]): ChordVoicing[] {
  const seen = new Set<string>();
  const unique: ChordVoicing[] = [];

  for (const voicing of voicings) {
    const key = voicing.frets.map(f => f ?? 'x').join('-');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(voicing);
    }
  }

  return unique;
}

/**
 * Main solver function - finds all valid voicings for a chord
 *
 * @param root - Root note (e.g., "C", "F#")
 * @param quality - Chord quality (e.g., "Major", "Minor 7")
 * @returns Array of valid voicings sorted by lowest fret position
 */
export function solveChordShapes(root: string, quality: string): ChordVoicing[] {
  // Get chord symbol (e.g., "Major" -> "M")
  const symbol = QUALITY_TO_SYMBOL[quality] || quality;
  const chordName = root + symbol;

  // Get chord info from Tonal.js
  const chordInfo = Chord.get(chordName);

  if (!chordInfo.notes || chordInfo.notes.length === 0) {
    console.warn(`Could not find chord: ${chordName}`);
    return [];
  }

  const targetNotes = chordInfo.notes; // e.g., ["C", "E", "G"]

  // For triads, require at least root and one other note
  // For 7ths and beyond, require at least 3 unique notes
  const minRequiredNotes = targetNotes.length >= 4 ? 3 : 2;

  const voicings: ChordVoicing[] = [];

  // Sliding window: scan the neck in windows of MAX_HAND_SPAN frets
  // Start from fret 0, end so the window doesn't exceed FRET_COUNT
  for (let windowStart = 0; windowStart <= FRET_COUNT - MAX_HAND_SPAN + 1; windowStart++) {
    const windowEnd = windowStart + MAX_HAND_SPAN;

    // For each string, find valid frets within this window
    const optionsPerString: (number | null)[][] = [];

    for (let stringIndex = 0; stringIndex < STRING_COUNT; stringIndex++) {
      // Always include open string (fret 0) if it's a chord tone
      const validFrets = findChordTonesOnString(
        stringIndex,
        targetNotes,
        windowStart === 0 ? 0 : windowStart,
        windowEnd
      );

      // Add muted option (null) for each string
      const options: (number | null)[] = [null, ...validFrets];
      optionsPerString.push(options);
    }

    // Generate all combinations
    const combinations = generateCombinations(optionsPerString);

    // Filter and validate each combination
    for (const frets of combinations) {
      // Must have at least some notes
      const playedCount = frets.filter(f => f !== null).length;
      if (playedCount < minRequiredNotes) continue;

      // Must contain essential chord tones
      // For now, require at least the root
      if (!hasRequiredNotes(frets, [root])) continue;

      // Check unique notes - need enough variety
      const uniqueNotes = new Set(
        frets
          .map((f, i) => f !== null ? normalizePitchClass(getNoteAt(i, f)) : -1)
          .filter(n => n !== -1)
      );
      if (uniqueNotes.size < minRequiredNotes) continue;

      // Hand span check (redundant due to window but validates open strings)
      const { span } = getHandSpan(frets);
      if (span > MAX_HAND_SPAN) continue;

      // Shape playability check
      if (!hasPlayableShape(frets)) continue;

      voicings.push({
        frets: frets as FretNumber[],
        lowestFret: getLowestFret(frets),
        highestFret: getHighestFret(frets),
        noteNames: getVoicingNotes(frets),
      });
    }
  }

  // Deduplicate and sort by lowest fret
  const uniqueVoicings = deduplicateVoicings(voicings);
  uniqueVoicings.sort((a, b) => a.lowestFret - b.lowestFret);

  return uniqueVoicings;
}

/**
 * Get a limited set of "best" voicings (for UI)
 * Prioritizes practical, human-playable shapes
 */
export function getBestVoicings(root: string, quality: string, limit = 12): ChordVoicing[] {
  const allVoicings = solveChordShapes(root, quality);

  const scored = allVoicings.map(v => {
    let score = 0;
    const playedFrets = v.frets.filter((f): f is number => f !== null);
    const playedStrings = playedFrets.length;

    // 1. HEAVILY favor open position (frets 0-4)
    const isOpenPosition = v.highestFret <= 4;
    if (isOpenPosition) score += 100;

    // 2. Bonus for using open strings (fret 0)
    const openStringCount = v.frets.filter(f => f === 0).length;
    score += openStringCount * 15;

    // 3. Penalize high fret positions (exponential penalty)
    score -= v.lowestFret * 8;

    // 4. Prefer root in bass (lowest played string)
    for (let i = 0; i < v.frets.length; i++) {
      if (v.frets[i] !== null) {
        const bassNote = getNoteAt(i, v.frets[i]!);
        if (areEnharmonic(bassNote, root)) {
          score += 25;
        }
        break; // Only check the bass note
      }
    }

    // 5. Prefer 4-6 strings (not too sparse, not requiring all 6)
    if (playedStrings >= 4 && playedStrings <= 6) {
      score += 20;
    } else if (playedStrings === 3) {
      score += 10;
    }

    // 6. Slight bonus for lower hand span (easier to play)
    const span = v.highestFret - v.lowestFret;
    score -= span * 3;

    // 7. Prefer contiguous strings (no muted strings in the middle)
    let hasGap = false;
    let foundFirst = false;
    let foundLast = false;
    for (let i = 0; i < v.frets.length; i++) {
      if (v.frets[i] !== null) {
        if (foundLast) hasGap = true;
        foundFirst = true;
      } else if (foundFirst && !foundLast) {
        foundLast = true;
      }
    }
    if (!hasGap) score += 10;

    return { voicing: v, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top N, then sort those by position for nice UX
  const topVoicings = scored.slice(0, limit).map(s => s.voicing);
  topVoicings.sort((a, b) => a.lowestFret - b.lowestFret);

  return topVoicings;
}
