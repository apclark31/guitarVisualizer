/**
 * useScaleAudioEngine - Audio hook for Scale Sage
 *
 * Provides scale playback functionality using the same Tone.js infrastructure.
 * Plays scale notes in ascending or descending order with proper timing.
 */

import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useSharedStore } from '../../../shared/store';
import { GUITAR_SAMPLER_CONFIG } from '../../../shared/config/instruments';
import { unlockIOSAudio } from '../../../shared/lib/ios-audio-unlock';

/** Timing constants for scale playback */
const SCALE_TIMING = {
  NOTE_DURATION: 0.5,   // Each note rings for 500ms
  NOTE_DELAY: 0.3,      // 300ms between notes (deliberate pace for learning)
};

export function useScaleAudioEngine() {
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const limiterRef = useRef<Tone.Limiter | null>(null);

  const { isAudioLoaded, setAudioLoaded, volume } = useSharedStore();

  // Initialize audio chain on mount
  useEffect(() => {
    // Create effects chain: Sampler -> Reverb -> Limiter -> Destination
    const limiter = new Tone.Limiter(-1).toDestination();
    const reverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.2,
    }).connect(limiter);

    const sampler = new Tone.Sampler({
      ...GUITAR_SAMPLER_CONFIG,
      onload: () => {
        console.log('Scale Sage: Guitar samples loaded');
        setAudioLoaded(true);
      },
      onerror: (error) => {
        console.error('Failed to load samples:', error);
      },
    }).connect(reverb);

    samplerRef.current = sampler;
    reverbRef.current = reverb;
    limiterRef.current = limiter;

    // Cleanup on unmount
    return () => {
      sampler.dispose();
      reverb.dispose();
      limiter.dispose();
    };
  }, [setAudioLoaded]);

  // Update volume when it changes
  useEffect(() => {
    if (samplerRef.current) {
      samplerRef.current.volume.value = volume;
    }
  }, [volume]);

  // Start audio context (must be called from user interaction)
  const startAudio = useCallback(async () => {
    // Unlock iOS audio SYNCHRONOUSLY first (must stay in gesture call stack)
    unlockIOSAudio();

    // Then start Tone.js audio context
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
      console.log('Audio context started');
    }
  }, []);

  // Play a single note
  const playNote = useCallback(async (note: string, duration: number = 1) => {
    await startAudio();

    if (!samplerRef.current || !isAudioLoaded) return;

    const now = Tone.now();
    samplerRef.current.triggerAttackRelease(note, duration, now);
  }, [isAudioLoaded, startAudio]);

  // Play scale notes in sequence
  const playScale = useCallback(async (notes: string[]) => {
    await startAudio();

    if (!samplerRef.current || !isAudioLoaded || notes.length === 0) return;

    const now = Tone.now();

    // Stop any currently playing notes
    samplerRef.current.releaseAll();

    // Play notes in sequence with timing
    notes.forEach((note, index) => {
      samplerRef.current?.triggerAttackRelease(
        note,
        SCALE_TIMING.NOTE_DURATION,
        now + index * SCALE_TIMING.NOTE_DELAY
      );
    });
  }, [isAudioLoaded, startAudio]);

  // Stop all currently playing notes
  const stopAll = useCallback(() => {
    if (samplerRef.current) {
      samplerRef.current.releaseAll();
    }
  }, []);

  return {
    isLoaded: isAudioLoaded,
    playNote,
    playScale,
    stopAll,
    startAudio,
  };
}
