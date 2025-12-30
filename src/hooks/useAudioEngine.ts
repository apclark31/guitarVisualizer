/**
 * useAudioEngine - Headless audio hook
 *
 * Manages Tone.js Sampler lifecycle and provides playback functions.
 * This hook does NOT render any UI - audio logic stays separate from visuals.
 */

import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useMusicStore } from '../store/useMusicStore';
import { GUITAR_SAMPLER_CONFIG } from '../config/instruments';
import { PLAYBACK_TIMING } from '../config/constants';
import { Note } from '@tonaljs/tonal';
import { unlockIOSAudio } from '../lib/ios-audio-unlock';
import type { StringIndex, PlaybackMode } from '../types';

/** Get the full note name at a string/fret position */
function getNoteAtPosition(stringIndex: number, fret: number, tuning: readonly string[]): string {
  const openMidi = Note.midi(tuning[stringIndex]);
  if (openMidi === null) return '';
  return Note.fromMidi(openMidi + fret);
}

export function useAudioEngine() {
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const limiterRef = useRef<Tone.Limiter | null>(null);

  const {
    guitarStringState,
    playbackMode,
    volume,
    setAudioLoaded,
    isAudioLoaded,
  } = useMusicStore();

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

    // iOS PWA fix: Resume audio context when app comes back to foreground
    // This handles the case where iOS suspends audio when PWA is backgrounded
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const ctx = Tone.getContext().rawContext;
          if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
            await ctx.resume();
            console.log('Audio context resumed on visibility change');
          }
        } catch (e) {
          console.warn('Failed to resume audio on visibility change:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

    // Always try to start/resume Tone.js audio context
    // iOS PWA can have context in various states (suspended, interrupted)
    try {
      await Tone.start();

      // Get the raw audio context
      const ctx = Tone.getContext().rawContext;

      // iOS PWA fix: Handle interrupted state and retry resume
      // The 'interrupted' state is specific to iOS when the system takes over audio
      if (ctx.state !== 'running') {
        await ctx.resume();

        // If still not running after first resume, try again with a small delay
        // This helps with iOS PWA first-launch edge case
        // Cast to string to avoid TypeScript narrowing issues with state
        if ((ctx.state as string) !== 'running') {
          await new Promise(resolve => setTimeout(resolve, 100));
          await ctx.resume();
        }
      }
    } catch (e) {
      console.warn('Audio context start/resume failed:', e);
    }
  }, []);

  // Play a single note
  const playNote = useCallback(async (note: string, duration: number = 1) => {
    await startAudio();

    if (!samplerRef.current || !isAudioLoaded) return;

    const now = Tone.now();
    samplerRef.current.triggerAttackRelease(note, duration, now);
  }, [isAudioLoaded, startAudio]);

  // Play note at a specific string/fret position
  const playFretNote = useCallback(async (stringIndex: StringIndex, fret: number) => {
    // Get tuning at call time to avoid dependency array issues with iOS audio unlock
    const currentTuning = useMusicStore.getState().tuning;
    const note = getNoteAtPosition(stringIndex, fret, currentTuning);
    if (note) {
      await playNote(note);
    }
  }, [playNote]);

  // Play all active notes based on playback mode
  const playChord = useCallback(async (mode?: PlaybackMode) => {
    await startAudio();

    if (!samplerRef.current || !isAudioLoaded) return;

    // Get tuning at call time to avoid dependency array issues with iOS audio unlock
    const currentTuning = useMusicStore.getState().tuning;

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
    const currentMode = mode || playbackMode;

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
  }, [guitarStringState, playbackMode, isAudioLoaded, startAudio]);

  // Stop all currently playing notes
  const stopAll = useCallback(() => {
    if (samplerRef.current) {
      samplerRef.current.releaseAll();
    }
  }, []);

  return {
    isLoaded: isAudioLoaded,
    playNote,
    playFretNote,
    playChord,
    stopAll,
    startAudio,
  };
}
