/**
 * useAudioEngine - Chord Compass audio hook
 *
 * Wraps the shared useSamplerEngine with CC-specific playback:
 * - playFretNote: play note at a string/fret position
 * - playChord: play all active notes from guitarStringState
 * - playNotes: play arbitrary array of notes (for preview)
 *
 * Reads guitarStringState reactively from useMusicStore.
 * Reads tuning/playbackMode at call time via getState() to avoid
 * dependency array issues with iOS audio unlock.
 */

import { useCallback } from 'react';
import * as Tone from 'tone';
import { useSamplerEngine } from '../../../shared/hooks/useSamplerEngine';
import { useMusicStore } from '../store/useMusicStore';
import { useSharedStore } from '../../../shared/store';
import { PLAYBACK_TIMING } from '../../../shared/config/constants';
import { Note } from '@tonaljs/tonal';
import type { StringIndex, PlaybackMode } from '../types';

/** Get the full note name at a string/fret position */
function getNoteAtPosition(stringIndex: number, fret: number, tuning: readonly string[]): string {
  const openMidi = Note.midi(tuning[stringIndex]);
  if (openMidi === null) return '';
  return Note.fromMidi(openMidi + fret);
}

export function useAudioEngine() {
  const { samplerRef, isLoaded, playNote, stopAll, startAudio } = useSamplerEngine();
  const { guitarStringState } = useMusicStore();

  // Play note at a specific string/fret position
  const playFretNote = useCallback(async (stringIndex: StringIndex, fret: number) => {
    // Get tuning at call time to avoid dependency array issues with iOS audio unlock
    const currentTuning = useSharedStore.getState().tuning;
    const note = getNoteAtPosition(stringIndex, fret, currentTuning);
    if (note) {
      await playNote(note);
    }
  }, [playNote]);

  // Play all active notes based on playback mode
  const playChord = useCallback(async (mode?: PlaybackMode) => {
    await startAudio();

    if (!samplerRef.current || !isLoaded) return;

    // Get tuning at call time to avoid dependency array issues with iOS audio unlock
    const currentTuning = useSharedStore.getState().tuning;

    // Collect all active notes (low to high for strum direction)
    const notes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const fret = guitarStringState[i as StringIndex];
      if (fret !== null) {
        const note = getNoteAtPosition(i, fret, currentTuning);
        if (note) notes.push(note);
      }
    }

    if (notes.length === 0) return;

    const now = Tone.now();
    const currentMode = mode || useSharedStore.getState().playbackMode;

    // Stop any currently playing notes
    samplerRef.current.releaseAll();

    switch (currentMode) {
      case 'block':
        // All notes at once (piano style)
        samplerRef.current.triggerAttackRelease(
          notes,
          PLAYBACK_TIMING.NOTE_DURATION,
          now
        );
        break;

      case 'strum':
        // Fast sweep (guitar style) - low to high
        notes.forEach((note, index) => {
          samplerRef.current?.triggerAttackRelease(
            note,
            PLAYBACK_TIMING.NOTE_DURATION,
            now + index * PLAYBACK_TIMING.STRUM_DELAY
          );
        });
        break;

      case 'arpeggio':
        // Slow melodic sequence
        notes.forEach((note, index) => {
          samplerRef.current?.triggerAttackRelease(
            note,
            PLAYBACK_TIMING.NOTE_DURATION * 0.5,
            now + index * PLAYBACK_TIMING.ARPEGGIO_DELAY
          );
        });
        break;
    }
  }, [guitarStringState, isLoaded, startAudio, samplerRef]);

  // Play arbitrary array of notes (for preview functionality)
  const playNotes = useCallback(async (notes: string[], mode?: PlaybackMode) => {
    await startAudio();

    if (!samplerRef.current || !isLoaded || notes.length === 0) return;

    const now = Tone.now();
    const currentMode = mode || useSharedStore.getState().playbackMode;

    // Stop any currently playing notes
    samplerRef.current.releaseAll();

    switch (currentMode) {
      case 'block':
        samplerRef.current.triggerAttackRelease(
          notes,
          PLAYBACK_TIMING.NOTE_DURATION,
          now
        );
        break;

      case 'strum':
        notes.forEach((note, index) => {
          samplerRef.current?.triggerAttackRelease(
            note,
            PLAYBACK_TIMING.NOTE_DURATION,
            now + index * PLAYBACK_TIMING.STRUM_DELAY
          );
        });
        break;

      case 'arpeggio':
        notes.forEach((note, index) => {
          samplerRef.current?.triggerAttackRelease(
            note,
            PLAYBACK_TIMING.NOTE_DURATION * 0.5,
            now + index * PLAYBACK_TIMING.ARPEGGIO_DELAY
          );
        });
        break;
    }
  }, [isLoaded, startAudio, samplerRef]);

  return {
    isLoaded,
    playNote,
    playFretNote,
    playChord,
    playNotes,
    stopAll,
    startAudio,
  };
}
