/**
 * useHarmonyAudioEngine - Sequential chord progression playback
 *
 * Wraps useSamplerEngine with progression-specific playback:
 * - playProgression: plays chords sequentially with tempo control
 * - playChord: plays a single chord (for preview)
 * - stopProgression: stops playback and clears timers
 */

import { useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { useSamplerEngine } from '../../../shared/hooks/useSamplerEngine';
import { useSharedStore } from '../../../shared/store';
import { getVoicingsForChord } from '../../chords/lib/chord-data';
import { PLAYBACK_TIMING } from '../../../shared/config/constants';
import { Note } from '@tonaljs/tonal';
import type { ProgressionChord } from '../types';

/** Get note name at a string/fret position */
function getNoteAtPosition(stringIndex: number, fret: number, tuning: readonly string[]): string {
  const openMidi = Note.midi(tuning[stringIndex]);
  if (openMidi === null) return '';
  return Note.fromMidi(openMidi + fret);
}

/** Get playable notes from a chord's voicing */
function getNotesForChord(chord: ProgressionChord): string[] {
  const { tuning } = useSharedStore.getState();
  const voicings = getVoicingsForChord(chord.root, chord.quality, 12, 'all', tuning);
  const voicing = voicings[chord.voicingIndex] ?? voicings[0];
  if (!voicing) return [];

  const notes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const fret = voicing.frets[i];
    if (fret !== null) {
      const note = getNoteAtPosition(i, fret, tuning);
      if (note) notes.push(note);
    }
  }
  return notes;
}

export function useHarmonyAudioEngine() {
  const { samplerRef, isLoaded, stopAll, startAudio } = useSamplerEngine();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /** Play a single chord as a strum */
  const playChord = useCallback(async (chord: ProgressionChord) => {
    await startAudio();
    if (!samplerRef.current || !isLoaded) return;

    const notes = getNotesForChord(chord);
    if (notes.length === 0) return;

    const now = Tone.now();
    samplerRef.current.releaseAll();

    // Strum: low to high
    notes.forEach((note, index) => {
      samplerRef.current?.triggerAttackRelease(
        note,
        PLAYBACK_TIMING.NOTE_DURATION,
        now + index * PLAYBACK_TIMING.STRUM_DELAY
      );
    });
  }, [isLoaded, startAudio, samplerRef]);

  /** Stop all playback and clear timers */
  const stopProgression = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    stopAll();
  }, [stopAll]);

  /** Play full progression sequentially */
  const playProgression = useCallback(async (
    chords: ProgressionChord[],
    tempo: number,
    onChordStart: (chordId: string) => void,
    onComplete: () => void,
  ) => {
    await startAudio();
    if (!samplerRef.current || !isLoaded || chords.length === 0) {
      onComplete();
      return;
    }

    // Clear any existing timers
    stopProgression();

    // 4 beats per chord at the given BPM
    const msPerChord = (60 / tempo) * 4 * 1000;

    chords.forEach((chord, i) => {
      const timer = setTimeout(() => {
        onChordStart(chord.id);

        const notes = getNotesForChord(chord);
        if (notes.length === 0 || !samplerRef.current) return;

        const now = Tone.now();
        samplerRef.current.releaseAll();

        // Strum each chord
        notes.forEach((note, noteIdx) => {
          samplerRef.current?.triggerAttackRelease(
            note,
            PLAYBACK_TIMING.NOTE_DURATION,
            now + noteIdx * PLAYBACK_TIMING.STRUM_DELAY
          );
        });
      }, i * msPerChord);

      timersRef.current.push(timer);
    });

    // Complete callback after last chord finishes
    const totalMs = chords.length * msPerChord;
    const completeTimer = setTimeout(onComplete, totalMs);
    timersRef.current.push(completeTimer);
  }, [isLoaded, startAudio, samplerRef, stopProgression]);

  return {
    isLoaded,
    startAudio,
    playChord,
    playProgression,
    stopProgression,
  };
}
