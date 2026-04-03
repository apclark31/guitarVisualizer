/**
 * HarmonyContent - Chord progression builder
 *
 * Main component for Harmony mode. Renders inside AppShell via React Router Outlet.
 * Reads key context from shared store, manages progression state in useHarmonyStore.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSharedStore } from '../../shared/store';
import { useHarmonyStore } from './store/useHarmonyStore';
import { HarmonyHeader } from './components/controls/HarmonyHeader';
import { ProgressionBuilder } from './components/controls/ProgressionBuilder';
import { ProgressionTimeline } from './components/visuals/ProgressionTimeline';
import { ChordCard } from './components/visuals/ChordCard';
import { PresetPicker } from './components/controls/PresetPicker';
import { TempoControl } from './components/controls/TempoControl';
import { HarmonyChordPicker } from './components/controls/HarmonyChordPicker';
import { useHarmonyAudioEngine } from './hooks/useHarmonyAudioEngine';
import { Fretboard } from '../../shared/components/Fretboard';
import { KeyPicker } from './components/controls/KeyPicker';
import { BottomSheet } from '../../shared/components/BottomSheet';
import { decodeKeyFromUrl, encodeKeyForUrl } from '../chords/config/constants';
import styles from './HarmonyContent.module.css';

export function HarmonyContent() {
  const [searchParams] = useSearchParams();

  // Shared state
  const { tuning, keyContext, setKeyContext, isLibraryOpen, closeLibrary } = useSharedStore();

  // Library tab state
  type LibraryTab = 'key' | 'chords';
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('key');

  // Standalone chord picker state (opened from "+" button)
  const [isChordPickerOpen, setIsChordPickerOpen] = useState(false);

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
  const handleShare = () => {
    if (!keyContext || progression.length === 0) return;

    const params = new URLSearchParams();
    params.set('k', encodeKeyForUrl(keyContext.root, keyContext.type));
    params.set('p', progression.map(c => c.degree).join(','));
    if (tempo !== 100) {
      params.set('bpm', String(tempo));
    }

    const url = `${window.location.origin}/harmony/?${params.toString()}`;
    navigator.clipboard.writeText(url);
  };

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
    closeLibrary();
    setIsChordPickerOpen(false);
  };

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

  return (
    <div className={styles.harmonyLayout}>
      <HarmonyHeader activePresetId={activePresetId} />

      {keyContext ? (
        <>
          <ProgressionTimeline>
            {progression.map((chord) => (
              <ChordCard
                key={chord.id}
                chord={chord}
                isSelected={chord.id === selectedChordId}
                isPlaying={chord.id === playingChordId}
                onSelect={() => handleChordTap(chord.id)}
                onRemove={() => removeChord(chord.id)}
              />
            ))}
          </ProgressionTimeline>

          {selectedChord && (
            <div className={styles.fretboardSection}>
              <div className={styles.voicingNav}>
                <button
                  className={styles.voicingNavBtn}
                  onClick={handlePrevVoicing}
                  disabled={availableVoicings.length <= 1}
                  aria-label="Previous voicing"
                >
                  &lsaquo;
                </button>
                <span className={styles.voicingLabel}>
                  {selectedChord.voicingIndex + 1} / {availableVoicings.length}
                </span>
                <button
                  className={styles.voicingNavBtn}
                  onClick={handleNextVoicing}
                  disabled={availableVoicings.length <= 1}
                  aria-label="Next voicing"
                >
                  &rsaquo;
                </button>
              </div>
              <Fretboard
                guitarStringState={guitarStringState}
                tuning={tuning}
                displayMode={displayMode}
                rootNote={rootNote}
                interactive={false}
              />
            </div>
          )}

          <div className={styles.buttonsRow}>
            <button
              className={`${styles.actionBtn} ${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
              onClick={handlePlayStop}
              disabled={progression.length === 0}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleShare}
              disabled={!keyContext || progression.length === 0}
            >
              Share
            </button>
          </div>

          <div className={styles.controls}>
            <ProgressionBuilder
              onAddChord={addChord}
              onCustomChord={() => setIsChordPickerOpen(true)}
            />
            <TempoControl tempo={tempo} onTempoChange={setTempo} />
            <div className={styles.controlRow}>
              <PresetPicker
                activePresetId={activePresetId}
                onSelectPreset={loadPreset}
              />
              <button
                className={styles.clearBtn}
                onClick={clearProgression}
                disabled={progression.length === 0}
              >
                Clear
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Select a key to start building progressions</p>
          <KeyPicker />
        </div>
      )}

      {/* Library BottomSheet — tabbed: Key + Add Chord */}
      <BottomSheet isOpen={isLibraryOpen} onClose={closeLibrary}>
        <div className={styles.libraryPanel}>
          <div className={styles.libraryTabs}>
            <button
              className={`${styles.libraryTab} ${libraryTab === 'key' ? styles.libraryTabActive : ''}`}
              onClick={() => setLibraryTab('key')}
            >
              Key
            </button>
            <button
              className={`${styles.libraryTab} ${libraryTab === 'chords' ? styles.libraryTabActive : ''}`}
              onClick={() => setLibraryTab('chords')}
            >
              Add Chord
            </button>
          </div>
          {libraryTab === 'key' ? (
            <KeyPicker variant="sheet" />
          ) : (
            <HarmonyChordPicker onInsert={handleInsertCustom} />
          )}
        </div>
      </BottomSheet>

      {/* Standalone chord picker (from "+" button) */}
      <BottomSheet isOpen={isChordPickerOpen} onClose={() => setIsChordPickerOpen(false)}>
        <HarmonyChordPicker onInsert={handleInsertCustom} />
      </BottomSheet>
    </div>
  );
}
