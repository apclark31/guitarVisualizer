/**
 * Scale Detection - Analyzes played notes and suggests matching scales
 *
 * Algorithm:
 * 1. For each of 12 roots × 5 scale types = 60 combinations:
 *    - Get scale notes via getScale(root, type)
 *    - Check which played notes are in scale
 *    - Check which played notes are NOT in scale (chromatic/passing)
 * 2. Score based on:
 *    - All notes diatonic: +50 base
 *    - Bass note = root: +30 bonus
 *    - Coverage (% of scale present): +10 per unique scale degree
 *    - Penalty for extra notes: -10 per chromatic note
 * 3. Filter to matches where most notes fit (allow 1 chromatic note)
 * 4. Rank by score, limit to top 8
 */

import { getScale, SCALE_TYPE_DISPLAY, ROOT_NOTES } from './scale-data';
import type { ScaleType } from '../store/useScaleStore';
import { normalizePitchClass } from '../../../shared/lib';

/** Scale suggestion result */
export interface ScaleSuggestion {
  /** Root note (e.g., 'C', 'A', 'F#') */
  root: string;
  /** Scale type (e.g., 'major', 'minor-pentatonic') */
  type: ScaleType;
  /** Display name (e.g., 'C Major Pentatonic') */
  display: string;
  /** Ranking score (0-100+) */
  score: number;
  /** Notes that match the scale */
  matchedNotes: string[];
  /** Notes not in scale (chromatic/passing tones) */
  extraNotes: string[];
  /** Percentage of scale notes present (0-100) */
  coverage: number;
}

/** All supported scale types for detection */
const SCALE_TYPES: ScaleType[] = [
  'major',
  'minor',
  'major-pentatonic',
  'minor-pentatonic',
  'blues',
];

/**
 * Check if a note is in a scale (handles enharmonics)
 */
function noteInScale(note: string, scaleNotes: string[]): boolean {
  const normalizedNote = normalizePitchClass(note);
  return scaleNotes.some(scaleNote =>
    normalizePitchClass(scaleNote) === normalizedNote
  );
}

/**
 * Detect matching scales for a set of played notes
 *
 * @param notes Array of note names (pitch classes) from the fretboard
 * @param bassNote The bass note (lowest sounding note), if known
 * @returns Ranked array of matching scales
 */
export function detectScales(
  notes: string[],
  bassNote?: string
): ScaleSuggestion[] {
  if (notes.length < 2) return [];

  // Normalize all input notes for consistent comparison
  const normalizedNotes = notes.map(normalizePitchClass);
  const normalizedBass = bassNote ? normalizePitchClass(bassNote) : undefined;

  const matches: ScaleSuggestion[] = [];

  // Check each possible scale (12 roots × 5 types = 60 combinations)
  for (const root of ROOT_NOTES) {
    for (const scaleType of SCALE_TYPES) {
      const scaleInfo = getScale(root, scaleType);
      if (!scaleInfo) continue;

      const scaleNotes = scaleInfo.notes;

      // Categorize played notes
      const matchedNotes: string[] = [];
      const extraNotes: string[] = [];

      for (const note of normalizedNotes) {
        if (noteInScale(note, scaleNotes)) {
          matchedNotes.push(note);
        } else {
          extraNotes.push(note);
        }
      }

      // Filter: require at least 2 notes to match and allow max 1 chromatic note
      if (matchedNotes.length < 2 || extraNotes.length > 1) {
        continue;
      }

      // Calculate score
      let score = 0;

      // Base score for matched notes (higher is better)
      // All notes diatonic = +50 base
      if (extraNotes.length === 0) {
        score += 50;
      } else {
        // Some chromatic notes = reduced base (still viable with 1 passing tone)
        score += 30;
      }

      // Penalty for extra notes (-10 per chromatic note)
      score -= extraNotes.length * 10;

      // Coverage bonus: +10 per unique scale degree present
      // Calculate how many scale degrees are covered
      const coverage = (matchedNotes.length / scaleInfo.noteCount) * 100;
      score += matchedNotes.length * 10;

      // Bass note = root is a strong signal (+30)
      if (normalizedBass && normalizePitchClass(root) === normalizedBass) {
        score += 30;
      }

      // Pentatonic scales often sound good with fewer notes
      // Give a small boost to pentatonic/blues when coverage is decent
      if ((scaleType === 'major-pentatonic' || scaleType === 'minor-pentatonic' || scaleType === 'blues')
          && coverage >= 40) {
        score += 5;
      }

      // Format display name
      const display = `${root} ${SCALE_TYPE_DISPLAY[scaleType]}`;

      matches.push({
        root,
        type: scaleType,
        display,
        score,
        matchedNotes,
        extraNotes,
        coverage: Math.round(coverage),
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Limit to top 8 results
  return matches.slice(0, 8);
}

/**
 * Get the display text for matched notes
 */
export function formatMatchedNotes(suggestion: ScaleSuggestion): string {
  if (suggestion.matchedNotes.length === 0) return '';
  return suggestion.matchedNotes.join(', ');
}

/**
 * Get the display text for extra/chromatic notes
 */
export function formatExtraNotes(suggestion: ScaleSuggestion): string {
  if (suggestion.extraNotes.length === 0) return '';
  return `Passing: ${suggestion.extraNotes.join(', ')}`;
}
