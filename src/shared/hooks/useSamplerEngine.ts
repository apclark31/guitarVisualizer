/**
 * useSamplerEngine - Shared Tone.js sampler lifecycle
 *
 * Manages the audio chain (Sampler -> Reverb -> Limiter -> Destination),
 * volume syncing, iOS audio unlock, and basic note playback.
 *
 * Used as a base by both Chord Compass (useAudioEngine) and
 * Scale Sage (useScaleAudioEngine).
 */

import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useSharedStore } from '../store';
import { GUITAR_SAMPLER_CONFIG } from '../config/instruments';
import { unlockIOSAudio } from '../lib/ios-audio-unlock';

export function useSamplerEngine() {
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
        console.log('Guitar samples loaded');
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

  // Stop all currently playing notes
  const stopAll = useCallback(() => {
    if (samplerRef.current) {
      samplerRef.current.releaseAll();
    }
  }, []);

  return {
    samplerRef,
    isLoaded: isAudioLoaded,
    playNote,
    stopAll,
    startAudio,
  };
}
