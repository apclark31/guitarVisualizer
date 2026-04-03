/**
 * ChordsContent - Chord mode content rendered inside AppShell
 *
 * Contains the chord-specific fretboard, header, controls, and audio logic.
 * AppHeader and outer layout are handled by AppShell.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import { Fretboard } from './components/visuals/Fretboard';
import { ControlPanel } from './components/controls/ControlPanel';
import { ChordHeader } from './components/controls/ChordHeader';
import { useMusicStore } from './store/useMusicStore';
import { useSharedStore } from '../../shared/store';
import { useAudioEngine } from './hooks/useAudioEngine';
import { decodeTuningFromUrl, decodeKeyFromUrl, encodeTuningForUrl, encodeKeyForUrl } from './config/constants';
import { unlockIOSAudio } from '../../shared/lib/ios-audio-unlock';
import { getChordIntervalEntries } from '../../shared/lib/interval-map-utils';
import type { StringIndex, GuitarStringState } from './types';
import styles from './ChordsContent.module.css';

export function ChordsContent() {
  const { restoreFromUrl, guitarStringState, targetRoot, targetQuality, currentVoicingIndex, isCustomShape, suggestions } = useMusicStore();
  const { tuning, keyContext, setMatchCount } = useSharedStore();
  const audioWarmedRef = useRef(false);
  const { isLoaded, playChord, playFretNote, playNote, playNotes } = useAudioEngine();
  const [copied, setCopied] = useState(false);

  const hasNotes = Object.values(guitarStringState).some(fret => fret !== null);

  const intervalEntries = useMemo(
    () => getChordIntervalEntries(guitarStringState, tuning, targetRoot || null),
    [guitarStringState, tuning, targetRoot]
  );

  // Sync match count to shared store for Library tab badge
  useEffect(() => {
    setMatchCount(suggestions.length);
  }, [suggestions.length, setMatchCount]);

  const handleShare = useCallback(async () => {
    const parts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const fret = guitarStringState[i as StringIndex];
      if (fret !== null) {
        parts.push(`${i}-${fret}`);
      }
    }

    const params = new URLSearchParams();
    params.set('s', parts.join(','));

    const tuningSlug = encodeTuningForUrl(tuning);
    if (tuningSlug) {
      params.set('t', tuningSlug);
    }

    if (targetRoot && targetQuality) {
      params.set('r', targetRoot);
      params.set('q', targetQuality);
      if (!isCustomShape && currentVoicingIndex >= 0) {
        params.set('v', currentVoicingIndex.toString());
      }
    }

    if (keyContext) {
      params.set('k', encodeKeyForUrl(keyContext.root, keyContext.type));
    }

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [guitarStringState, tuning, targetRoot, targetQuality, isCustomShape, currentVoicingIndex, keyContext]);

  // Set document title
  useEffect(() => {
    document.title = 'Chords | Fret Atlas';
  }, []);

  // Parse URL params on mount to restore shared chord
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('s');
    const tuningParam = params.get('t');
    const rootParam = params.get('r');
    const qualityParam = params.get('q');
    const voicingParam = params.get('v');
    const keyParam = params.get('k');

    if (sharedState) {
      const guitarState: GuitarStringState = {
        0: null, 1: null, 2: null, 3: null, 4: null, 5: null
      };

      const pairs = sharedState.split(',');
      for (const pair of pairs) {
        const [stringStr, fretStr] = pair.split('-');
        const stringIndex = parseInt(stringStr, 10);
        const fret = parseInt(fretStr, 10);

        if (
          !isNaN(stringIndex) &&
          !isNaN(fret) &&
          stringIndex >= 0 &&
          stringIndex <= 5 &&
          fret >= 0 &&
          fret <= 24
        ) {
          guitarState[stringIndex as StringIndex] = fret;
        }
      }

      let tuning: string[] | undefined;
      let tuningName: string | undefined;
      if (tuningParam) {
        const decoded = decodeTuningFromUrl(tuningParam);
        if (decoded) {
          tuning = decoded.tuning;
          tuningName = decoded.name;
        }
      }

      const voicingIndex = voicingParam ? parseInt(voicingParam, 10) : undefined;
      const keyContext = keyParam ? decodeKeyFromUrl(keyParam) : undefined;

      restoreFromUrl({
        guitarState,
        tuning,
        tuningName,
        root: rootParam || undefined,
        quality: qualityParam || undefined,
        voicingIndex: isNaN(voicingIndex as number) ? undefined : voicingIndex,
        keyContext: keyContext || undefined,
      });

      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [restoreFromUrl]);

  // iOS PWA fix: Pre-warm audio context on first touch
  useEffect(() => {
    const warmUpAudio = async () => {
      if (audioWarmedRef.current) return;
      audioWarmedRef.current = true;

      unlockIOSAudio();

      if (Tone.getContext().state !== 'running') {
        try {
          await Tone.start();
        } catch {
          // Audio pre-warm failed silently
        }
      }
    };

    document.addEventListener('touchstart', warmUpAudio, { once: true });
    document.addEventListener('click', warmUpAudio, { once: true });

    return () => {
      document.removeEventListener('touchstart', warmUpAudio);
      document.removeEventListener('click', warmUpAudio);
    };
  }, []);

  return (
    <div className={styles.modeContent}>
      <div className={styles.chordBar}>
        <ChordHeader playNotes={playNotes} intervalEntries={intervalEntries} />
      </div>

      <main className={styles.main}>
        <section className={styles.visualizer}>
          <Fretboard playFretNote={playFretNote} />
        </section>
      </main>

      <div className={styles.buttonsRow}>
        <button
          onClick={() => playChord()}
          disabled={!isLoaded || !hasNotes}
          className={styles.playButton}
          data-tour="play-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {!isLoaded ? 'Loading...' : 'Play'}
        </button>
        <button
          onClick={handleShare}
          disabled={!hasNotes}
          className={styles.shareButton}
          data-tour="share-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      <div className={styles.controlsArea}>
        <ControlPanel
          isAudioLoaded={isLoaded}
          playNote={playNote}
        />
      </div>

    </div>
  );
}
