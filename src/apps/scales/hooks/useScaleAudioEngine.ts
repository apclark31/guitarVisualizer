/**
 * useScaleAudioEngine - Audio hook for Scale Sage
 *
 * Wraps the shared useSamplerEngine with scale-specific playback:
 * - playScale: plays notes in sequence with timing + visual callbacks
 *
 * Provides scale playback functionality using the same Tone.js infrastructure.
 * Plays scale notes in ascending or descending order with proper timing.
 */

import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useSamplerEngine } from '../../../shared/hooks/useSamplerEngine';

/** Timing constants for scale playback */
const SCALE_TIMING = {
  NOTE_DURATION: 0.5,   // Each note rings for 500ms
  NOTE_DELAY: 0.3,      // 300ms between notes (deliberate pace for learning)
};

export function useScaleAudioEngine() {
  const { samplerRef, isLoaded, playNote, stopAll: baseStopAll, startAudio } = useSamplerEngine();
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear all pending animation/completion timers
  const clearAllTimers = useCallback(() => {
    timerIdsRef.current.forEach(id => clearTimeout(id));
    timerIdsRef.current = [];
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach(id => clearTimeout(id));
    };
  }, []);

  // Play scale notes in sequence with optional callback for visual sync
  const playScale = useCallback(async (
    notes: string[],
    onNotePlay?: (index: number) => void,
    onComplete?: () => void
  ) => {
    await startAudio();

    if (!samplerRef.current || !isLoaded || notes.length === 0) return;

    const now = Tone.now();

    // Stop any currently playing notes and cancel pending timers
    clearAllTimers();
    samplerRef.current.releaseAll();

    // Play notes in sequence with timing
    notes.forEach((note, index) => {
      const noteTime = now + index * SCALE_TIMING.NOTE_DELAY;

      samplerRef.current?.triggerAttackRelease(
        note,
        SCALE_TIMING.NOTE_DURATION,
        noteTime
      );

      // Schedule visual callback using setTimeout (synced to audio timing)
      if (onNotePlay) {
        const id = setTimeout(() => {
          onNotePlay(index);
        }, index * SCALE_TIMING.NOTE_DELAY * 1000);
        timerIdsRef.current.push(id);
      }
    });

    // Schedule completion callback
    if (onComplete) {
      const totalDuration = notes.length * SCALE_TIMING.NOTE_DELAY * 1000;
      const id = setTimeout(onComplete, totalDuration);
      timerIdsRef.current.push(id);
    }
  }, [isLoaded, startAudio, clearAllTimers, samplerRef]);

  // Stop all currently playing notes and cancel pending timers
  const stopAll = useCallback(() => {
    clearAllTimers();
    baseStopAll();
  }, [clearAllTimers, baseStopAll]);

  return {
    isLoaded,
    playNote,
    playScale,
    stopAll,
    startAudio,
  };
}
