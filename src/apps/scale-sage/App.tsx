/**
 * Scale Sage App
 *
 * Scale visualization tool for the Fret Atlas suite.
 * Displays scale patterns on the fretboard with position navigation.
 * Supports Free Play mode - tap notes to detect matching scales.
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useScaleStore, useSharedStore, type ScaleType } from './store/useScaleStore';
import { useScaleAudioEngine } from './hooks/useScaleAudioEngine';
import { AppHeader } from '../../shared/components/layout/AppHeader';
import { Fretboard } from '../../shared/components/Fretboard';
import { ScaleHeader } from './components/ScaleHeader';
import { ControlPanel } from './components/ControlPanel';
import type { GuitarStringState, HighlightedNote, StringIndex } from '../../shared/types';
import { getScale } from './lib/scale-data';
import { getPositionNotes, getPlaybackNotesWithPositions, type PlaybackNoteWithPosition } from './lib/scale-positions';
import { decodeTuningFromUrl } from '../../shared/config/constants';
import { getNoteAtPosition } from '../../shared/lib';
import { COLORS } from '../../shared/config/theme';
import { Note } from '@tonaljs/tonal';
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
    toggleFret,
  } = useScaleStore();
  const { tuning } = useSharedStore();

  // Audio engine
  const { isLoaded, playScale, playNote, startAudio } = useScaleAudioEngine();

  // Track currently playing note for visual highlighting
  const [activeNotePosition, setActiveNotePosition] = useState<{ stringIndex: number; fret: number } | null>(null);

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

  const scaleHighlightedNotes: HighlightedNote[] = useMemo(() => {
    if (!scaleInfo) return [];
    return getPositionNotes(scaleInfo, tuning, currentPosition, positionType);
  }, [scaleInfo, tuning, currentPosition, positionType]);

  // Convert multi-note free-play state to HighlightedNote[] for display
  const freePlayHighlightedNotes: HighlightedNote[] = useMemo(() => {
    if (!isFreePlayMode) return [];

    const notes: HighlightedNote[] = [];

    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
      const frets = guitarStringState[stringIndex as StringIndex];
      for (const fret of frets) {
        const fullNote = getNoteAtPosition(stringIndex, fret, tuning);
        const noteName = Note.pitchClass(fullNote) || fullNote;

        // Default color (no root context in free-play)
        const color = COLORS.ui.primary;

        notes.push({
          stringIndex: stringIndex as StringIndex,
          fret,
          note: noteName,
          color,
        });
      }
    }

    return notes;
  }, [isFreePlayMode, guitarStringState, tuning]);

  // Use scale notes when scale selected, free-play notes otherwise
  const highlightedNotes = hasScale ? scaleHighlightedNotes : freePlayHighlightedNotes;

  // Get playback notes with positions (sorted for audio + visual sync)
  const playbackNotesWithPositions: PlaybackNoteWithPosition[] = useMemo(() => {
    if (highlightedNotes.length === 0) return [];
    return getPlaybackNotesWithPositions(highlightedNotes, tuning, playbackDirection);
  }, [highlightedNotes, tuning, playbackDirection]);

  // Play scale handler with visual highlighting
  const handlePlayScale = useCallback(async () => {
    if (playbackNotesWithPositions.length === 0) return;

    const noteStrings = playbackNotesWithPositions.map(n => n.note);

    await playScale(
      noteStrings,
      // onNotePlay callback - highlight the currently playing note
      (index) => {
        const pos = playbackNotesWithPositions[index];
        if (pos) {
          setActiveNotePosition({ stringIndex: pos.stringIndex, fret: pos.fret });
        }
      },
      // onComplete callback - clear highlight
      () => {
        setActiveNotePosition(null);
      }
    );
  }, [playbackNotesWithPositions, playScale]);

  // Handle fret click in free-play mode (toggle note on/off)
  const handleFretClick = useCallback((stringIndex: StringIndex, fret: number) => {
    if (!isFreePlayMode) return;
    // -1 is the "clear" signal from Fretboard, but we handle toggle in the store
    if (fret < 0) return;

    toggleFret(stringIndex, fret);
  }, [isFreePlayMode, toggleFret]);

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
              guitarStringState={emptyGuitarState}
              tuning={tuning}
              displayMode={displayMode}
              rootNote={scaleRoot}
              interactive={isFreePlayMode}
              onFretClick={handleFretClick}
              onFretPlay={handleFretPlay}
              highlightedNotes={highlightedNotes}
              activeNotePosition={activeNotePosition}
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
          <p>Made with ☕ and 🎸 by Alex in PDX</p>
        </footer>
      </div>
    </div>
  );
}

export default ScaleSageApp;
