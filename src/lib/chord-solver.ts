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
  TRIAD_PATTERNS,
} from '../config/constants';
import type { ChordVoicing, FretNumber } from '../types';

/**
 * String sets for closed-position triads (bass to treble)
 * Code indices: 0=Low E, 1=A, 2=D, 3=G, 4=B, 5=High E
 *
 * We iterate from bass strings upward, finding triads on each adjacent 3-string group.
 * Within each group, the lowest index string carries the bass note of the voicing.
 */
const TRIAD_STRING_SETS = [
  [0, 1, 2], // Strings 6-5-4 (Low E, A, D) - bass on Low E
  [1, 2, 3], // Strings 5-4-3 (A, D, G) - bass on A
  [2, 3, 4], // Strings 4-3-2 (D, G, B) - bass on D
  [3, 4, 5], // Strings 3-2-1 (G, B, High E) - bass on G
] as const;

/**
 * Inversion patterns: which interval goes on each string (low to high)
 * Each number is an index into the chord notes array [R, 3rd, 5th]
 */
const TRIAD_INVERSIONS = [
  { name: 'root', pattern: [0, 1, 2] },     // R-3-5 (root position)
  { name: '1st', pattern: [1, 2, 0] },      // 3-5-R (1st inversion)
  { name: '2nd', pattern: [2, 0, 1] },      // 5-R-3 (2nd inversion)
] as const;

/** Get MIDI note number for a string/fret position */
function getMidiAt(stringIndex: number, fret: number, tuning: readonly string[]): number {
  const openMidi = Note.midi(tuning[stringIndex]);
  if (openMidi === null) throw new Error(`Invalid tuning note: ${tuning[stringIndex]}`);
  return openMidi + fret;
}

/** Get note name (pitch class) at a string/fret position */
function getNoteAt(stringIndex: number, fret: number, tuning: readonly string[]): string {
  const midi = getMidiAt(stringIndex, fret, tuning);
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
  maxFret: number,
  tuning: readonly string[]
): number[] {
  const validFrets: number[] = [];

  for (let fret = minFret; fret <= maxFret; fret++) {
    const noteAtFret = getNoteAt(stringIndex, fret, tuning);
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
  requiredNotes: string[],
  tuning: readonly string[]
): boolean {
  const presentNotes = new Set<number>();

  frets.forEach((fret, stringIndex) => {
    if (fret !== null) {
      const pitchClass = normalizePitchClass(getNoteAt(stringIndex, fret, tuning));
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
function getVoicingNotes(frets: (number | null)[], tuning: readonly string[]): string[] {
  const notes: string[] = [];

  frets.forEach((fret, stringIndex) => {
    if (fret !== null) {
      const fullNote = Note.fromMidi(getMidiAt(stringIndex, fret, tuning));
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
 * @param tuning - Optional tuning array (defaults to standard tuning)
 * @returns Array of valid voicings sorted by lowest fret position
 */
export function solveChordShapes(
  root: string,
  quality: string,
  tuning: readonly string[] = STANDARD_TUNING
): ChordVoicing[] {
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
        windowEnd,
        tuning
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
      if (!hasRequiredNotes(frets, [root], tuning)) continue;

      // Check unique notes - need enough variety
      const uniqueNotes = new Set(
        frets
          .map((f, i) => f !== null ? normalizePitchClass(getNoteAt(i, f, tuning)) : -1)
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
        noteNames: getVoicingNotes(frets, tuning),
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
export function getBestVoicings(
  root: string,
  quality: string,
  limit = 12,
  tuning: readonly string[] = STANDARD_TUNING
): ChordVoicing[] {
  const allVoicings = solveChordShapes(root, quality, tuning);

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
        const bassNote = getNoteAt(i, v.frets[i]!, tuning);
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

/**
 * Get the triad quality from a chord quality name
 * Maps 7th chord qualities to their underlying triad
 */
function getTriadQuality(quality: string): 'major' | 'minor' | 'dim' | 'aug' | null {
  const qualityMap: Record<string, 'major' | 'minor' | 'dim' | 'aug'> = {
    'Major': 'major',
    'Minor': 'minor',
    'Dominant 7': 'major',    // Dom7 has major triad (R-3-5)
    'Major 7': 'major',
    'Minor 7': 'minor',
    'Diminished': 'dim',
    'Augmented': 'aug',
    'Sus2': 'major',          // Treat as major shape for now
    'Sus4': 'major',          // Treat as major shape for now
    'Power (5)': 'major',     // Power chord - no 3rd
  };
  return qualityMap[quality] || null;
}

/**
 * Find the fret on a string that produces a specific pitch class
 * Returns all matching frets within the fret range
 */
function findFretsForNote(
  stringIndex: number,
  targetNote: string,
  minFret: number,
  maxFret: number,
  tuning: readonly string[]
): number[] {
  const frets: number[] = [];
  const targetPc = normalizePitchClass(targetNote);

  for (let fret = minFret; fret <= maxFret; fret++) {
    const noteAtFret = getNoteAt(stringIndex, fret, tuning);
    if (normalizePitchClass(noteAtFret) === targetPc) {
      frets.push(fret);
    }
  }

  return frets;
}

/**
 * Solve for closed-position triad voicings
 *
 * Generates triads on adjacent string sets with all inversions:
 * - Strings 1-2-3 (High E, B, G) - indices 5, 4, 3
 * - Strings 2-3-4 (B, G, D) - indices 4, 3, 2
 *
 * @param root - Root note (e.g., "C", "F#")
 * @param quality - Chord quality (e.g., "Major", "Minor")
 * @param tuning - Optional tuning array (defaults to standard tuning)
 * @returns Array of triad voicings sorted by position
 */
export function solveTriadVoicings(
  root: string,
  quality: string,
  tuning: readonly string[] = STANDARD_TUNING
): ChordVoicing[] {
  // Get the triad quality
  const triadQuality = getTriadQuality(quality);
  if (!triadQuality) {
    console.warn(`Cannot determine triad quality for: ${quality}`);
    return [];
  }

  // Get the interval pattern (semitones from root)
  const pattern = TRIAD_PATTERNS[triadQuality];
  if (!pattern) {
    return [];
  }

  // Calculate the three notes of the triad
  const rootMidi = Note.midi(root + '4');
  if (rootMidi === null) {
    console.warn(`Invalid root note: ${root}`);
    return [];
  }

  const triadNotes = pattern.map(semitones => {
    const midi = rootMidi + semitones;
    return Note.pitchClass(Note.fromMidi(midi)) || '';
  });

  const voicings: ChordVoicing[] = [];

  // For each string set
  for (const stringSet of TRIAD_STRING_SETS) {
    // For each inversion
    for (const inversion of TRIAD_INVERSIONS) {
      // Get the notes in order for this inversion (low string to high string)
      // stringSet is [low, mid, high] in terms of string index (0=Low E = lowest pitch)
      // notesForStrings[0] = bass note, [1] = middle, [2] = highest
      const notesForStrings = inversion.pattern.map(idx => triadNotes[idx]);

      // Find all positions up the neck
      for (let baseFret = 0; baseFret <= FRET_COUNT; baseFret++) {
        const maxFret = Math.min(baseFret + MAX_HAND_SPAN, FRET_COUNT);

        // Find frets for each string in the set
        // stringSet[0] = lowest pitch string (bass), stringSet[2] = highest pitch
        const lowStringIdx = stringSet[0];  // Bass string (e.g., Low E=0)
        const midStringIdx = stringSet[1];  // Middle string (e.g., A=1)
        const highStringIdx = stringSet[2]; // Highest pitch string (e.g., D=2)

        const lowFrets = findFretsForNote(lowStringIdx, notesForStrings[0], baseFret, maxFret, tuning);
        const midFrets = findFretsForNote(midStringIdx, notesForStrings[1], baseFret, maxFret, tuning);
        const highFrets = findFretsForNote(highStringIdx, notesForStrings[2], baseFret, maxFret, tuning);

        // Try all combinations
        for (const lowFret of lowFrets) {
          for (const midFret of midFrets) {
            for (const highFret of highFrets) {
              // Check hand span
              const frettedPositions = [lowFret, midFret, highFret].filter(f => f > 0);
              if (frettedPositions.length > 1) {
                const span = Math.max(...frettedPositions) - Math.min(...frettedPositions);
                if (span > MAX_HAND_SPAN) continue;
              }

              // Build the full 6-string fret array (muted strings = null)
              const frets: FretNumber[] = [null, null, null, null, null, null];
              frets[lowStringIdx] = lowFret;
              frets[midStringIdx] = midFret;
              frets[highStringIdx] = highFret;

              // Get note names for played strings
              const noteNames = [
                Note.fromMidi(getMidiAt(lowStringIdx, lowFret, tuning)),
                Note.fromMidi(getMidiAt(midStringIdx, midFret, tuning)),
                Note.fromMidi(getMidiAt(highStringIdx, highFret, tuning)),
              ];

              const playedFrets = [lowFret, midFret, highFret];
              const lowestFret = Math.min(...playedFrets);
              const highestFret = Math.max(...playedFrets);

              // Determine bass note and if it's an inversion
              const bassNote = Note.pitchClass(Note.fromMidi(getMidiAt(lowStringIdx, lowFret, tuning))) || '';
              const isInversion = !areEnharmonic(bassNote, root);

              voicings.push({
                frets,
                lowestFret,
                highestFret,
                noteNames,
                bassNote,
                isInversion,
              });
            }
          }
        }
      }
    }
  }

  // Deduplicate
  const unique = deduplicateVoicings(voicings);

  // Sort by string set (bass strings first), then by fret position
  unique.sort((a, b) => {
    // Find the lowest string index used in each voicing
    const aLowestString = a.frets.findIndex(f => f !== null);
    const bLowestString = b.frets.findIndex(f => f !== null);

    // Sort by string set first (lower string index = bass = first)
    if (aLowestString !== bLowestString) {
      return aLowestString - bLowestString;
    }

    // Within same string set, sort by fret position
    return a.lowestFret - b.lowestFret;
  });

  return unique;
}
