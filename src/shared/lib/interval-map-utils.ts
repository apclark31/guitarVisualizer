/**
 * Interval Map Utilities — compute IntervalEntry[] from chord/scale state
 *
 * Used by ChordsContent and ScalesContent to feed the IntervalMap component.
 */

import { Note, Interval } from '@tonaljs/tonal';
import type { GuitarStringState } from '../types';
import type { IntervalEntry } from '../components/IntervalMap/IntervalMap';

/** Semitone-to-label mapping for common chord intervals */
const SEMITONE_LABELS: Record<number, string> = {
  0: 'ROOT',
  1: 'b2',
  2: '2ND',
  3: 'b3',
  4: '3RD',
  5: '4TH',
  6: 'b5',
  7: '5TH',
  8: '#5',
  9: '6TH',
  10: 'b7',
  11: '7TH',
};

/**
 * Build note-only chips from chord guitar state (no interval labels).
 * Used before a chord is recognized — shows just the note names.
 */
export function getPlayedNoteChips(
  guitarState: GuitarStringState,
  tuning: readonly string[]
): IntervalEntry[] {
  const seen = new Set<string>();
  const entries: IntervalEntry[] = [];

  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as keyof GuitarStringState];
    if (fret === null) continue;

    const openMidi = Note.midi(tuning[i]);
    if (openMidi === null) continue;

    const noteName = Note.pitchClass(Note.fromMidi(openMidi + fret));
    if (!noteName || seen.has(noteName)) continue;
    seen.add(noteName);

    entries.push({ label: '', note: noteName, semitones: -1 });
  }

  return entries;
}

/**
 * Build note-only chips from multi-note scale guitar state (no interval labels).
 * Used before a scale is recognized — shows just the note names.
 */
export function getPlayedScaleNoteChips(
  guitarStringState: Record<number, number[]>,
  tuning: readonly string[]
): IntervalEntry[] {
  const seen = new Set<string>();
  const entries: IntervalEntry[] = [];

  for (let i = 0; i < 6; i++) {
    const frets = guitarStringState[i] || [];
    for (const fret of frets) {
      const openMidi = Note.midi(tuning[i]);
      if (openMidi === null) continue;

      const noteName = Note.pitchClass(Note.fromMidi(openMidi + fret));
      if (!noteName || seen.has(noteName)) continue;
      seen.add(noteName);

      entries.push({ label: '', note: noteName, semitones: -1 });
    }
  }

  return entries;
}

/**
 * Compute IntervalEntry[] from chord guitar state.
 * Deduplicates by semitone distance from root, sorts root-first then ascending.
 */
export function getChordIntervalEntries(
  guitarState: GuitarStringState,
  tuning: readonly string[],
  rootNote: string | null
): IntervalEntry[] {
  if (!rootNote) return [];

  const rootChroma = Note.chroma(rootNote);
  if (rootChroma === undefined) return [];

  const seen = new Set<number>();
  const entries: IntervalEntry[] = [];

  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as keyof GuitarStringState];
    if (fret === null) continue;

    const openMidi = Note.midi(tuning[i]);
    if (openMidi === null) continue;

    const noteName = Note.pitchClass(Note.fromMidi(openMidi + fret));
    if (!noteName) continue;

    const noteChroma = Note.chroma(noteName);
    if (noteChroma === undefined) continue;

    const semitones = ((noteChroma - rootChroma) % 12 + 12) % 12;

    if (seen.has(semitones)) continue;
    seen.add(semitones);

    entries.push({
      label: SEMITONE_LABELS[semitones] ?? `${semitones}`,
      note: noteName,
      semitones,
    });
  }

  // Sort: root first, then ascending semitones
  entries.sort((a, b) => {
    if (a.semitones === 0) return -1;
    if (b.semitones === 0) return 1;
    return a.semitones - b.semitones;
  });

  return entries;
}

/**
 * Compute IntervalEntry[] from scale notes and intervals.
 * Uses Tonal.js interval strings (e.g., '1P', '3M', '5P').
 */
export function getScaleIntervalEntries(
  scaleNotes: string[],
  scaleIntervals: string[]
): IntervalEntry[] {
  if (scaleNotes.length === 0) return [];

  return scaleNotes.map((note, i) => {
    const intervalStr = scaleIntervals[i];
    const semitones = Interval.semitones(intervalStr) ?? 0;
    const label = SEMITONE_LABELS[((semitones % 12) + 12) % 12] ?? `${semitones}`;

    return {
      label,
      note: Note.pitchClass(note) || note,
      semitones: ((semitones % 12) + 12) % 12,
    };
  });
}
