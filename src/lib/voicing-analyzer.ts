/**
 * Voicing Analyzer
 *
 * Analyzes guitar fretboard state to detect voicing types (shells, triads)
 * and generate ranked chord suggestions.
 */

import { Chord, Note } from '@tonaljs/tonal';
import { STANDARD_TUNING, SHELL_PATTERNS, TRIAD_PATTERNS, QUALITY_COMPLEXITY, CHORD_QUALITIES, QUALITY_TO_SYMBOL } from '../config/constants';
import type { GuitarStringState, StringIndex, VoicingType, ChordSuggestion } from '../types';

/** Interval labels for display */
const INTERVAL_LABELS: Record<number, string> = {
  0: 'R',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: '#5',
  9: '6',
  10: 'b7',
  11: '7',
};

/** Analysis result from voicing-analyzer */
export interface VoicingAnalysis {
  pitchClasses: string[];
  bassNote: string | null;
  voicingType: VoicingType | null;
  suggestions: ChordSuggestion[];
}

/** Get the full note name (with octave) at a string/fret position */
function getNoteAtPosition(stringIndex: number, fret: number, tuning: readonly string[]): string {
  const openMidi = Note.midi(tuning[stringIndex]);
  if (openMidi === null) return '';
  return Note.fromMidi(openMidi + fret);
}

/** Get pitch class (note name without octave) */
function getPitchClass(note: string): string {
  return Note.pitchClass(note) || '';
}

/** Normalize intervals to sorted unique values 0-11 */
function normalizeIntervals(intervals: number[]): number[] {
  const normalized = intervals.map(i => ((i % 12) + 12) % 12);
  return [...new Set(normalized)].sort((a, b) => a - b);
}

/** Check if a pattern matches the given intervals (order independent) */
function matchesPattern(intervals: number[], pattern: readonly number[]): boolean {
  const normalizedIntervals = normalizeIntervals(intervals);
  const normalizedPattern = [...pattern].sort((a, b) => a - b);

  if (normalizedIntervals.length !== normalizedPattern.length) return false;

  return normalizedIntervals.every((interval, i) => interval === normalizedPattern[i]);
}

/** Detect voicing type from intervals relative to a root */
export function detectVoicingType(intervals: number[]): VoicingType {
  const normalized = normalizeIntervals(intervals);
  const noteCount = normalized.length;

  if (noteCount < 2) return 'unknown';

  // Check for shell patterns (3 notes)
  if (noteCount === 3) {
    for (const [shellType, pattern] of Object.entries(SHELL_PATTERNS)) {
      if (matchesPattern(intervals, pattern)) {
        return shellType as VoicingType;
      }
    }

    // Check for triad patterns
    for (const [, pattern] of Object.entries(TRIAD_PATTERNS)) {
      if (matchesPattern(intervals, pattern)) {
        return 'triad';
      }
    }
  }

  // 4+ notes is considered a full voicing
  if (noteCount >= 4) {
    return 'full';
  }

  // 2-3 notes that don't match known patterns
  return 'partial';
}

/** Get interval label from semitone distance */
function getIntervalLabel(semitones: number): string {
  const normalized = ((semitones % 12) + 12) % 12;
  return INTERVAL_LABELS[normalized] || `${normalized}`;
}

/** Calculate semitone distance between two pitch classes */
function getSemitoneDistance(fromNote: string, toNote: string): number {
  const fromMidi = Note.midi(fromNote + '4') || 0;
  const toMidi = Note.midi(toNote + '4') || 0;
  return ((toMidi - fromMidi) % 12 + 12) % 12;
}

/** Match result for a chord quality */
interface ChordMatch {
  quality: string;
  missing: string[];
  present: string[];
  isExactMatch: boolean;
}

/** Try to match pitch classes to known chord qualities - returns ALL matches */
function matchChordQualities(root: string, pitchClasses: string[]): ChordMatch[] {
  const matches: ChordMatch[] = [];

  // Calculate intervals from the potential root
  const intervals = pitchClasses.map(pc => getSemitoneDistance(root, pc));
  const normalizedIntervals = normalizeIntervals(intervals);

  // Try each chord quality
  for (const quality of CHORD_QUALITIES) {
    const chordData = Chord.get(root + getChordSymbol(quality));

    if (!chordData.intervals || chordData.intervals.length === 0) continue;

    // Get the expected intervals for this chord
    const expectedIntervals = chordData.intervals.map(interval => {
      // Use Tonal to calculate interval semitones
      const intervalNote = Note.transpose(root + '4', interval);
      return getSemitoneDistance(root, Note.pitchClass(intervalNote) || '');
    });

    const expectedNormalized = normalizeIntervals(expectedIntervals);

    // Check if all placed notes are part of this chord
    const allNotesMatch = normalizedIntervals.every(interval =>
      expectedNormalized.includes(interval)
    );

    if (allNotesMatch) {
      // Calculate which intervals are present and missing
      const present = normalizedIntervals.map(i => getIntervalLabel(i));
      const missing = expectedNormalized
        .filter(i => !normalizedIntervals.includes(i))
        .map(i => getIntervalLabel(i));

      const isExactMatch = missing.length === 0;

      matches.push({ quality, missing, present, isExactMatch });
    }
  }

  return matches;
}

/** Get Tonal.js chord symbol from quality name */
function getChordSymbol(quality: string): string {
  // Use the full mapping from constants, with special case for Major
  const symbol = QUALITY_TO_SYMBOL[quality];
  if (symbol === 'M') return ''; // Tonal uses empty string for major
  return symbol || '';
}

/** Generate chord suggestions from placed notes */
function generateSuggestions(pitchClasses: string[], bassNote: string): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];

  // Try each pitch class as a potential root
  for (const potentialRoot of pitchClasses) {
    // Calculate intervals from this root
    const intervals = pitchClasses.map(pc => getSemitoneDistance(potentialRoot, pc));
    const detectedVoicingType = detectVoicingType(intervals);

    // Get ALL matching chord qualities
    const matches = matchChordQualities(potentialRoot, pitchClasses);

    for (const match of matches) {
      const displayName = potentialRoot + getChordSymbol(match.quality);
      const baseConfidence = calculateConfidence(potentialRoot, bassNote, match.quality, match.present.length);

      // Determine the voicing type for this specific match
      // - Exact match (no missing notes): use detected type (triad, shell, etc.)
      // - Partial match (missing notes): label as 'partial' for extended chords
      const voicingType = match.isExactMatch ? detectedVoicingType : 'partial';

      // Add the detected voicing type entry
      suggestions.push({
        root: potentialRoot,
        quality: match.quality,
        displayName: displayName || `${potentialRoot} ${match.quality}`,
        confidence: match.isExactMatch ? baseConfidence : baseConfidence - 10,
        voicingType,
        missingIntervals: match.missing,
        presentIntervals: match.present,
      });

      // For exact triad matches, also offer a "full" voicing option from chords-db
      if (match.isExactMatch && detectedVoicingType === 'triad') {
        suggestions.push({
          root: potentialRoot,
          quality: match.quality,
          displayName: displayName || `${potentialRoot} ${match.quality}`,
          confidence: baseConfidence - 5,
          voicingType: 'full',
          missingIntervals: match.missing,
          presentIntervals: match.present,
        });
      }

      // For exact shell matches, also offer a "full" voicing option
      if (match.isExactMatch && detectedVoicingType.startsWith('shell-')) {
        suggestions.push({
          root: potentialRoot,
          quality: match.quality,
          displayName: displayName || `${potentialRoot} ${match.quality}`,
          confidence: baseConfidence - 5,
          voicingType: 'full',
          missingIntervals: match.missing,
          presentIntervals: match.present,
        });
      }
    }
  }

  // Also try roots that aren't in the played notes but could work
  // (e.g., G-B could be part of Em where E isn't played)
  const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (const potentialRoot of allNotes) {
    if (pitchClasses.includes(potentialRoot)) continue; // Already checked

    const matches = matchChordQualities(potentialRoot, pitchClasses);
    for (const match of matches) {
      if (match.present.length >= 2) {
        const displayName = potentialRoot + getChordSymbol(match.quality);

        suggestions.push({
          root: potentialRoot,
          quality: match.quality,
          displayName: displayName || `${potentialRoot} ${match.quality}`,
          confidence: calculateConfidence(potentialRoot, bassNote, match.quality, match.present.length) - 20, // Penalty for missing root
          voicingType: 'partial', // Always partial when root is missing
          missingIntervals: ['R', ...match.missing],
          presentIntervals: match.present,
        });
      }
    }
  }

  return rankSuggestions(suggestions, bassNote);
}

/** Calculate confidence score for a suggestion */
function calculateConfidence(root: string, bassNote: string, quality: string, presentCount: number): number {
  let score = 50; // Base score

  // +30 if root matches bass note
  if (root === bassNote) {
    score += 30;
  }

  // +10 for each present interval
  score += presentCount * 10;

  // Penalty for complexity
  const complexity = QUALITY_COMPLEXITY[quality] || 10;
  score -= complexity * 2;

  return Math.max(0, Math.min(100, score));
}

/** Rank suggestions by priority */
function rankSuggestions(suggestions: ChordSuggestion[], bassNote: string): ChordSuggestion[] {
  return suggestions.sort((a, b) => {
    // 1. Root matches bass note first
    const aRootFirst = a.root === bassNote ? 1 : 0;
    const bRootFirst = b.root === bassNote ? 1 : 0;
    if (aRootFirst !== bRootFirst) return bRootFirst - aRootFirst;

    // 2. Alphabetical by root
    if (a.root !== b.root) return a.root.localeCompare(b.root);

    // 3. Simpler chord types first
    const aComplexity = QUALITY_COMPLEXITY[a.quality] || 99;
    const bComplexity = QUALITY_COMPLEXITY[b.quality] || 99;
    return aComplexity - bComplexity;
  });
}

/**
 * Main analysis function
 * Analyzes the current guitar state and returns voicing type + suggestions
 * @param guitarState - The current fret positions
 * @param tuning - Optional tuning array (defaults to standard tuning)
 */
export function analyzeVoicing(
  guitarState: GuitarStringState,
  tuning: readonly string[] = STANDARD_TUNING
): VoicingAnalysis {
  // Collect played notes
  const playedNotes: { note: string; pitchClass: string; stringIndex: number }[] = [];

  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as StringIndex];
    if (fret !== null) {
      const note = getNoteAtPosition(i, fret, tuning);
      playedNotes.push({
        note,
        pitchClass: getPitchClass(note),
        stringIndex: i,
      });
    }
  }

  // Need at least 2 notes for analysis
  if (playedNotes.length < 2) {
    return {
      pitchClasses: playedNotes.map(n => n.pitchClass),
      bassNote: playedNotes[0]?.pitchClass || null,
      voicingType: null,
      suggestions: [],
    };
  }

  // Get unique pitch classes and bass note
  const pitchClasses = [...new Set(playedNotes.map(n => n.pitchClass))];
  const bassNote = playedNotes[0].pitchClass; // Lowest string

  // Generate suggestions
  const suggestions = generateSuggestions(pitchClasses, bassNote);

  // Determine overall voicing type from bass note perspective
  let voicingType: VoicingType | null = null;
  if (suggestions.length > 0) {
    // Use the voicing type from the top suggestion
    voicingType = suggestions[0].voicingType;
  } else {
    // Fallback: detect from bass note as root
    const intervals = pitchClasses.map(pc => getSemitoneDistance(bassNote, pc));
    voicingType = detectVoicingType(intervals);
  }

  return {
    pitchClasses,
    bassNote,
    voicingType,
    suggestions, // Return all matches for scrollable list
  };
}
