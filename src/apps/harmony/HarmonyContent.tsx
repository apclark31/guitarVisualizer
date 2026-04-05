/**
 * HarmonyContent - Chord progression builder
 *
 * Main component for Harmony mode. Renders inside AppShell via React Router Outlet.
 * Reads key context from shared store, manages progression state in useHarmonyStore.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSharedStore } from '../../shared/store';
import { useHarmonyStore } from './store/useHarmonyStore';
import { ProgressionBuilder } from './components/controls/ProgressionBuilder';
import { ProgressionTimeline } from './components/visuals/ProgressionTimeline';
import { ChordCard } from './components/visuals/ChordCard';
import { TempoControl } from './components/controls/TempoControl';
import { useHarmonyAudioEngine } from './hooks/useHarmonyAudioEngine';
import { Fretboard } from '../../shared/components/Fretboard';
import { LibrarySheet, LibrarySheetProvider } from '../../shared/components/LibrarySheet';
import { useHarmonyLibraryTabs } from './components/library/useHarmonyLibraryTabs';
import { getPresetById } from './config/presets';
import { decodeKeyFromUrl, encodeKeyForUrl } from '../chords/config/constants';
import styles from './HarmonyContent.module.css';

export function HarmonyContent() {
  const [searchParams] = useSearchParams();

  // Shared state
  const { tuning, keyContext, setKeyContext, openLibrary } = useSharedStore();

  // Share copied feedback
  const [copied, setCopied] = useState(false);

  // Harmony state
  const {
    progression,
    selectedChordId,
    activePresetId,
    availableVoicings,
    tempo,
    isPlaying,
    playingChordId,
    guitarStringState,
    displayMode,
    addChord,
    addCustomChord,
    removeChord,
    clearProgression,
    selectChord,
    setVoicingIndex,
    setTempo,
    loadPreset,
    setPlaying,
    setPlayingChordId,
    restoreFromUrl,
  } = useHarmonyStore();

  // Audio engine
  const { isLoaded, startAudio, playProgression, stopProgression, playChord } =
    useHarmonyAudioEngine();

  // Set document title
  useEffect(() => {
    document.title = 'Harmony | Fret Atlas';
  }, []);

  // Restore from URL on mount
  useEffect(() => {
    const keyParam = searchParams.get('k');
    const progressionParam = searchParams.get('p');
    const bpmParam = searchParams.get('bpm');

    if (keyParam) {
      const decoded = decodeKeyFromUrl(keyParam);
      if (decoded) {
        setKeyContext(decoded);
      }
    }

    if (progressionParam) {
      const degrees = progressionParam.split(',').map(Number).filter(d => d >= 1 && d <= 7);
      if (degrees.length > 0) {
        // Small delay to let key context settle
        setTimeout(() => {
          restoreFromUrl({
            degrees,
            tempo: bpmParam ? parseInt(bpmParam, 10) : undefined,
          });
        }, 0);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get selected chord for voicing nav
  const selectedChord = progression.find(c => c.id === selectedChordId);
  const rootNote = selectedChord?.root ?? null;

  // Handle play/stop
  const handlePlayStop = async () => {
    if (!isLoaded) {
      await startAudio();
    }

    if (isPlaying) {
      stopProgression();
      setPlaying(false);
      return;
    }

    if (progression.length === 0) return;

    setPlaying(true);
    playProgression(
      progression,
      tempo,
      (chordId) => setPlayingChordId(chordId),
      () => setPlaying(false),
    );
  };

  // Handle share
  const handleShare = useCallback(() => {
    if (!keyContext || progression.length === 0) return;

    const params = new URLSearchParams();
    params.set('k', encodeKeyForUrl(keyContext.root, keyContext.type));
    params.set('p', progression.map(c => c.degree).join(','));
    if (tempo !== 100) {
      params.set('bpm', String(tempo));
    }

    const url = `${window.location.origin}/harmony/?${params.toString()}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [keyContext, progression, tempo]);

  // Handle voicing navigation
  const handlePrevVoicing = () => {
    if (!selectedChord || availableVoicings.length <= 1) return;
    const newIndex = selectedChord.voicingIndex > 0
      ? selectedChord.voicingIndex - 1
      : availableVoicings.length - 1;
    setVoicingIndex(selectedChord.id, newIndex);
  };

  const handleNextVoicing = () => {
    if (!selectedChord || availableVoicings.length <= 1) return;
    const newIndex = selectedChord.voicingIndex < availableVoicings.length - 1
      ? selectedChord.voicingIndex + 1
      : 0;
    setVoicingIndex(selectedChord.id, newIndex);
  };

  // Handle custom chord insertion (from picker)
  const handleInsertCustom = (root: string, quality: string) => {
    addCustomChord(root, quality);
  };

  // Tuning selection handler (simple - no notes to adapt)
  const handleTuningSelect = useCallback((newTuning: string[], name: string) => {
    useSharedStore.getState().setTuning(newTuning, name);
  }, []);

  // Library tabs
  const harmonyTabs = useHarmonyLibraryTabs({
    onInsertChord: handleInsertCustom,
    onSelectTuning: handleTuningSelect,
    activePresetId,
    onSelectPreset: loadPreset,
  });

  // Handle chord card tap — select + audio preview
  const handleChordTap = async (chordId: string) => {
    if (!isLoaded) {
      await startAudio();
    }
    selectChord(chordId);
    const chord = progression.find(c => c.id === chordId);
    if (chord) {
      playChord(chord);
    }
  };

  const preset = activePresetId ? getPresetById(activePresetId) : null;
  const keyLabel = keyContext
    ? `${keyContext.root} ${keyContext.type === 'major' ? 'Major' : 'Minor'}`
    : 'No Key Selected';
  const presetLabel = preset?.name ?? (keyContext ? 'Custom Progression' : null);

  return (
    <div className={styles.harmonyLayout}>
      <div className={styles.headerZone}>
        <div className={styles.headerLine}>
          <span className={`${styles.headerKey} ${!keyContext ? styles.headerKeyMuted : ''}`}>
            {keyLabel}
          </span>
          {presetLabel && (
            <>
              <span className={styles.headerDot}>&middot;</span>
              <span className={styles.headerPreset}>{presetLabel}</span>
            </>
          )}
        </div>
        <ProgressionTimeline>
          {progression.length > 0 ? (
            progression.map((chord) => (
              <ChordCard
                key={chord.id}
                chord={chord}
                isSelected={chord.id === selectedChordId}
                isPlaying={chord.id === playingChordId}
                onSelect={() => handleChordTap(chord.id)}
                onRemove={() => removeChord(chord.id)}
              />
            ))
          ) : (
            <div className={styles.emptyHint}>
              {keyContext ? 'Add chords below' : 'Choose a key to get started'}
            </div>
          )}
        </ProgressionTimeline>
      </div>

      <div className={styles.fretboardSection}>
        {!keyContext && progression.length === 0 && (
          <div className={styles.fretboardOverlay}>
            <p className={styles.fretboardOverlayText}>Choose a key to get started</p>
            <button
              className={styles.fretboardOverlayBtn}
              onClick={() => openLibrary('key')}
            >
              Select Key
            </button>
          </div>
        )}
        <Fretboard
          guitarStringState={guitarStringState}
          tuning={tuning}
          displayMode={displayMode}
          rootNote={rootNote}
          interactive={false}
        />
      </div>

      <div className={styles.buttonsRow}>
        <button
          className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
          onClick={handlePlayStop}
          disabled={progression.length === 0}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <button
          className={styles.shareButton}
          onClick={handleShare}
          disabled={!keyContext || progression.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      <div className={styles.voicingNav}>
        <button
          className={styles.voicingNavBtn}
          onClick={handlePrevVoicing}
          disabled={!selectedChord || availableVoicings.length <= 1}
          aria-label="Previous voicing"
        >
          &lsaquo;
        </button>
        <span className={`${styles.voicingLabel} ${!selectedChord ? styles.voicingLabelInactive : ''}`}>
          {selectedChord
            ? `${selectedChord.voicingIndex + 1} / ${availableVoicings.length}`
            : 'Position'}
        </span>
        <button
          className={styles.voicingNavBtn}
          onClick={handleNextVoicing}
          disabled={!selectedChord || availableVoicings.length <= 1}
          aria-label="Next voicing"
        >
          &rsaquo;
        </button>
      </div>

      <div className={styles.controls}>
        <ProgressionBuilder
          onAddChord={addChord}
          onCustomChord={() => openLibrary('library')}
        />
        <TempoControl tempo={tempo} onTempoChange={setTempo} />
        <div className={styles.controlRow}>
          {keyContext && (
            <button
              className={styles.presetsBtn}
              onClick={() => openLibrary('presets')}
            >
              Presets
            </button>
          )}
          <button
            className={styles.clearBtn}
            onClick={clearProgression}
            disabled={progression.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <LibrarySheetProvider playNote={async () => {}} isAudioLoaded={isLoaded}>
        <LibrarySheet tabs={harmonyTabs} />
      </LibrarySheetProvider>
    </div>
  );
}
