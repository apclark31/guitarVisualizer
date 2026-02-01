/**
 * Scale Sage App
 *
 * Scale visualization tool for the Fret Atlas suite.
 * Displays scale patterns on the fretboard with position navigation.
 * Supports Free Play mode - tap notes to detect matching scales.
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useScaleStore, useSharedStore, type ScaleType } from './store/useScaleStore';
import { useScaleAudioEngine } from './hooks/useScaleAudioEngine';
import { AppHeader } from '../../components/layout/AppHeader';
import { Fretboard } from '../../shared/components/Fretboard';
import { ScaleHeader } from './components/ScaleHeader';
import { ControlPanel } from './components/ControlPanel';
import type { GuitarStringState, HighlightedNote, StringIndex } from '../../shared/types';
import { getScale } from './lib/scale-data';
import { getPositionNotes, getPlaybackNotes } from './lib/scale-positions';
import { decodeTuningFromUrl } from '../../shared/config/constants';
import { getNoteAtPosition } from '../../shared/lib';
import styles from './App.module.css';

// Empty guitar state for display-only mode
const emptyGuitarState: GuitarStringState = {
  0: null, 1: null, 2: null, 3: null, 4: null, 5: null
};

/** Valid scale types for URL parsing */
const VALID_SCALE_TYPES: ScaleType[] = ['major', 'minor', 'major-pentatonic', 'minor-pentatonic', 'blues'];

function ScaleSageApp() {
  const {
    scaleRoot,
    scaleType,
    currentPosition,
    positionType,
    displayMode,
    playbackDirection,
    guitarStringState,
    setFret,
  } = useScaleStore();
  const { tuning } = useSharedStore();

  // Audio engine
  const { isLoaded, playScale, playNote, startAudio } = useScaleAudioEngine();

  // Determine mode: scale selected or free-play
  const hasScale = scaleRoot && scaleType;
  const isFreePlayMode = !hasScale;

  // Update document title for Scale Sage
  useEffect(() => {
    document.title = 'Scale Sage | Fret Atlas';
    return () => {
      document.title = 'Chord Compass | Fret Atlas';
    };
  }, []);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Parse scale root
    const root = params.get('r');
    if (root) {
      useScaleStore.getState().setScaleRoot(root);
    }

    // Parse scale type
    const type = params.get('s') as ScaleType | null;
    if (type && VALID_SCALE_TYPES.includes(type)) {
      useScaleStore.getState().setScaleType(type);
    }

    // Parse position
    const position = params.get('p');
    if (position) {
      const pos = parseInt(position, 10);
      if (!isNaN(pos) && pos >= 0) {
        useScaleStore.getState().setPosition(pos);
      }
    }

    // Parse tuning
    const tuningParam = params.get('t');
    if (tuningParam) {
      const decoded = decodeTuningFromUrl(tuningParam);
      if (decoded) {
        useSharedStore.getState().setTuning(decoded.tuning, decoded.name);
      }
    }
  }, []);

  // Pre-warm audio context on first touch (iOS PWA requirement)
  useEffect(() => {
    const handleFirstTouch = () => {
      startAudio();
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('mousedown', handleFirstTouch);
    };
    document.addEventListener('touchstart', handleFirstTouch, { passive: true });
    document.addEventListener('mousedown', handleFirstTouch);
    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('mousedown', handleFirstTouch);
    };
  }, [startAudio]);

  // Compute scale info and highlighted notes
  const scaleInfo = useMemo(() => {
    if (!scaleRoot || !scaleType) return null;
    return getScale(scaleRoot, scaleType);
  }, [scaleRoot, scaleType]);

  const highlightedNotes: HighlightedNote[] = useMemo(() => {
    if (!scaleInfo) return [];
    return getPositionNotes(scaleInfo, tuning, currentPosition, positionType);
  }, [scaleInfo, tuning, currentPosition, positionType]);

  // Get playback notes (sorted for audio)
  const playbackNotes = useMemo(() => {
    if (highlightedNotes.length === 0) return [];
    return getPlaybackNotes(highlightedNotes, tuning, playbackDirection);
  }, [highlightedNotes, tuning, playbackDirection]);

  // Play scale handler
  const handlePlayScale = useCallback(async () => {
    if (playbackNotes.length > 0) {
      await playScale(playbackNotes);
    }
  }, [playbackNotes, playScale]);

  // Handle fret click in free-play mode
  const handleFretClick = useCallback((stringIndex: StringIndex, fret: number) => {
    if (!isFreePlayMode) return;

    const currentFret = guitarStringState[stringIndex];
    if (fret === -1 || currentFret === fret) {
      // Clear the string
      setFret(stringIndex, null);
    } else {
      // Set the fret
      setFret(stringIndex, fret);
    }
  }, [isFreePlayMode, guitarStringState, setFret]);

  // Handle fret play (sound) in free-play mode
  const handleFretPlay = useCallback((stringIndex: StringIndex, fret: number) => {
    if (!isLoaded) return;
    const note = getNoteAtPosition(stringIndex, fret, tuning);
    if (note) {
      playNote(note);
    }
  }, [isLoaded, tuning, playNote]);

  return (
    <div className={styles.app}>
      <AppHeader />

      <div className={styles.content}>
        {/* Scale Header - tappable card */}
        <div className={styles.scaleBar}>
          <ScaleHeader />
        </div>

        {/* Fretboard */}
        <main className={styles.main}>
          <section className={styles.visualizer}>
            <Fretboard
              guitarStringState={isFreePlayMode ? guitarStringState : emptyGuitarState}
              tuning={tuning}
              displayMode={displayMode}
              rootNote={scaleRoot}
              interactive={isFreePlayMode}
              onFretClick={handleFretClick}
              onFretPlay={handleFretPlay}
              highlightedNotes={hasScale ? highlightedNotes : []}
            />
          </section>
        </main>

        {/* Control Panel */}
        <div className={styles.controlsBar}>
          <ControlPanel
            isAudioLoaded={isLoaded}
            playScale={handlePlayScale}
            playNote={playNote}
          />
        </div>

        <footer className={styles.footer}>
          <p>Made with coffee and guitars by Alex in PDX</p>
        </footer>
      </div>
    </div>
  );
}

export default ScaleSageApp;
