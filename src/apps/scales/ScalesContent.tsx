/**
 * ScalesContent - Scale mode content rendered inside AppShell
 *
 * Contains scale-specific fretboard, header, controls, and audio logic.
 * AppHeader and outer layout are handled by AppShell.
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useScaleStore, useSharedStore, type ScaleType } from './store/useScaleStore';
import { useScaleAudioEngine } from './hooks/useScaleAudioEngine';
import { Fretboard } from '../../shared/components/Fretboard';
import { ScaleHeader } from './components/ScaleHeader';
import { ControlPanel } from './components/ControlPanel';
import { PositionNav } from '../../shared/components/PositionNav/PositionNav';
import { TuningConfirmModal } from '../chords/components/controls/TuningConfirmModal';
import { LibrarySheet, LibrarySheetProvider } from '../../shared/components/LibrarySheet';
import { useScaleLibraryTabs } from './components/library/useScaleLibraryTabs';
import { getScaleIntervalEntries } from '../../shared/lib/interval-map-utils';
import type { GuitarStringState, HighlightedNote, StringIndex } from '../../shared/types';
import { getScale, SCALE_TYPE_DISPLAY } from './lib/scale-data';
import { getPositionNotes, getPlaybackNotesWithPositions, type PlaybackNoteWithPosition } from './lib/scale-positions';
import { decodeTuningFromUrl, encodeTuningForUrl } from '../../shared/config/constants';
import { getNoteAtPosition } from '../../shared/lib';
import { COLORS } from '../../shared/config/theme';
import { Note } from '@tonaljs/tonal';
import styles from './ScalesContent.module.css';

// Empty guitar state for display-only mode
const emptyGuitarState: GuitarStringState = {
  0: null, 1: null, 2: null, 3: null, 4: null, 5: null
};

const VALID_SCALE_TYPES = Object.keys(SCALE_TYPE_DISPLAY) as ScaleType[];

export function ScalesContent() {
  const {
    scaleRoot,
    scaleType,
    currentPosition,
    positionType,
    displayMode,
    playbackDirection,
    guitarStringState,
    toggleFret,
    setPosition,
  } = useScaleStore();
  const { tuning } = useSharedStore();

  // Audio engine
  const { isLoaded, playScale, playNote, startAudio } = useScaleAudioEngine();

  // Track currently playing note for visual highlighting
  const [activeNotePosition, setActiveNotePosition] = useState<{ stringIndex: number; fret: number } | null>(null);

  // Tuning confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTuning, setPendingTuning] = useState<{ tuning: string[]; name: string } | null>(null);

  // Determine mode: scale selected or free-play
  const hasScale = scaleRoot && scaleType;
  const isFreePlayMode = !hasScale;

  // Position navigation: count depends on note count in the scale
  const positionCount = useMemo(() => {
    if (!scaleRoot || !scaleType) return 0;
    const info = getScale(scaleRoot, scaleType);
    if (!info) return 0;
    if (info.noteCount === 5) return 5;
    if (info.type === 'blues') return 5;
    return Math.min(7, info.noteCount);
  }, [scaleRoot, scaleType]);

  const noteCount = useMemo(
    () => Object.values(guitarStringState).reduce((sum, frets) => sum + frets.length, 0),
    [guitarStringState]
  );
  const isFreePlayActive = !hasScale && noteCount > 0;

  const handlePrevPosition = useCallback(() => {
    if (currentPosition > 0) setPosition(currentPosition - 1);
  }, [currentPosition, setPosition]);

  const handleNextPosition = useCallback(() => {
    if (currentPosition < positionCount) setPosition(currentPosition + 1);
  }, [currentPosition, positionCount, setPosition]);

  const getPositionLabel = () => {
    if (isFreePlayActive) return 'Free Play';
    if (!hasScale) return 'Position';
    if (currentPosition === 0) return 'Full';
    return `${currentPosition} of ${positionCount}`;
  };

  // Set document title
  useEffect(() => {
    document.title = 'Scales | Fret Atlas';
  }, []);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const root = params.get('r');
    if (root) {
      useScaleStore.getState().setScaleRoot(root);
    }

    const type = params.get('s') as ScaleType | null;
    if (type && VALID_SCALE_TYPES.includes(type)) {
      useScaleStore.getState().setScaleType(type);
    }

    const position = params.get('p');
    if (position) {
      const pos = parseInt(position, 10);
      if (!isNaN(pos) && pos >= 0) {
        useScaleStore.getState().setPosition(pos);
      }
    }

    const tuningParam = params.get('t');
    if (tuningParam) {
      const decoded = decodeTuningFromUrl(tuningParam);
      if (decoded) {
        useSharedStore.getState().setTuning(decoded.tuning, decoded.name);
      }
    }
  }, []);

  // Tuning selection handler
  const handleTuningSelect = useCallback((newTuning: string[], name: string) => {
    if (hasScale) {
      setPendingTuning({ tuning: newTuning, name });
      setShowConfirmModal(true);
    } else {
      useSharedStore.getState().setTuning(newTuning, name);
    }
  }, [hasScale]);

  const handleConfirmSelect = useCallback((_mode: string) => {
    if (pendingTuning) {
      useSharedStore.getState().setTuning(pendingTuning.tuning, pendingTuning.name);
      setPendingTuning(null);
    }
    setShowConfirmModal(false);
  }, [pendingTuning]);

  const handleConfirmCancel = useCallback(() => {
    setPendingTuning(null);
    setShowConfirmModal(false);
  }, []);

  // Library tabs
  const scaleTabs = useScaleLibraryTabs({ onSelectTuning: handleTuningSelect });

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

  const scaleIntervalEntries = useMemo(() => {
    if (!scaleInfo) return [];
    return getScaleIntervalEntries(scaleInfo.notes, scaleInfo.intervals);
  }, [scaleInfo]);

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
      (index) => {
        const pos = playbackNotesWithPositions[index];
        if (pos) {
          setActiveNotePosition({ stringIndex: pos.stringIndex, fret: pos.fret });
        }
      },
      () => {
        setActiveNotePosition(null);
      }
    );
  }, [playbackNotesWithPositions, playScale]);

  // Handle fret click in free-play mode (toggle note on/off)
  const handleFretClick = useCallback((stringIndex: StringIndex, fret: number) => {
    if (!isFreePlayMode) return;
    if (fret < 0) return;
    toggleFret(stringIndex, fret);
  }, [isFreePlayMode, toggleFret]);

  // Share URL
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (!scaleRoot || !scaleType) return;

    const params = new URLSearchParams();
    params.set('r', scaleRoot);
    params.set('s', scaleType);
    if (currentPosition !== 1) {
      params.set('p', currentPosition.toString());
    }

    const tuningSlug = encodeTuningForUrl(tuning);
    if (tuningSlug) {
      params.set('t', tuningSlug);
    }

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [scaleRoot, scaleType, currentPosition, tuning]);

  // Handle fret play (sound) in free-play mode
  const handleFretPlay = useCallback((stringIndex: StringIndex, fret: number) => {
    if (!isLoaded) return;
    const note = getNoteAtPosition(stringIndex, fret, tuning);
    if (note) {
      playNote(note);
    }
  }, [isLoaded, tuning, playNote]);

  return (
    <div className={styles.modeContent}>
      {/* Scale Header - tappable card */}
      <div className={styles.scaleBar}>
        <ScaleHeader intervalEntries={scaleIntervalEntries} />
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

      {/* Play / Share buttons */}
      <div className={styles.buttonsRow}>
        <button
          onClick={handlePlayScale}
          disabled={!isLoaded || !hasScale}
          className={styles.playButton}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {!isLoaded ? 'Loading...' : 'Play'}
        </button>
        <button
          onClick={handleShare}
          disabled={!hasScale}
          className={styles.shareButton}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      <div className={styles.positionNavArea}>
        <PositionNav
          label={getPositionLabel()}
          onPrev={handlePrevPosition}
          onNext={handleNextPosition}
          prevDisabled={!hasScale || currentPosition === 0}
          nextDisabled={!hasScale || currentPosition >= positionCount}
          inactive={!hasScale && !isFreePlayActive}
          highlight={isFreePlayActive}
        />
      </div>

      <div className={styles.controlsArea}>
        <ControlPanel />
      </div>

      <LibrarySheetProvider playNote={playNote} isAudioLoaded={isLoaded}>
        <LibrarySheet tabs={scaleTabs} />
      </LibrarySheetProvider>

      <TuningConfirmModal
        isOpen={showConfirmModal}
        tuningName={pendingTuning?.name || ''}
        onSelect={handleConfirmSelect}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
}
