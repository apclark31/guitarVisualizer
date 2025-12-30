import { useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { TuningModal } from './TuningModal';
import { TuningConfirmModal } from './TuningConfirmModal';
import { encodeTuningForUrl } from '../../config/constants';
import type { StringIndex, TuningChangeMode } from '../../types';
import styles from './ControlPanel.module.css';

export function ControlPanel() {
  const {
    targetRoot,
    targetQuality,
    displayMode,
    setDisplayMode,
    playbackMode,
    setPlaybackMode,
    availableVoicings,
    currentVoicingIndex,
    setVoicingIndex,
    isCustomShape,
    clearAllStrings,
    guitarStringState,
    tuning,
    tuningName,
    setTuning,
  } = useMusicStore();

  const { isLoaded, playChord, playNote } = useAudioEngine();

  // Check if there are any notes to play
  const hasNotes = Object.values(guitarStringState).some(fret => fret !== null);

  const isFreeFormMode = !targetRoot || !targetQuality;

  // Tuning modal state
  const [showTuningModal, setShowTuningModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTuning, setPendingTuning] = useState<{ tuning: string[]; name: string } | null>(null);

  // Handle tuning selection from TuningModal
  const handleTuningSelect = (tuning: string[], name: string) => {
    // If no notes on fretboard, apply directly with 'clear' mode (acts same as empty)
    if (!hasNotes) {
      setTuning(tuning, name, 'clear');
      return;
    }

    // Otherwise, show confirm modal for adapt/keep/clear choice
    setPendingTuning({ tuning, name });
    setShowConfirmModal(true);
  };

  // Handle confirm modal selection
  const handleConfirmSelect = (mode: TuningChangeMode) => {
    if (pendingTuning) {
      setTuning(pendingTuning.tuning, pendingTuning.name, mode);
      setPendingTuning(null);
    }
    setShowConfirmModal(false);
  };

  const handleConfirmCancel = () => {
    setPendingTuning(null);
    setShowConfirmModal(false);
  };

  const handlePrevVoicing = () => {
    if (currentVoicingIndex > 0) {
      setVoicingIndex(currentVoicingIndex - 1);
    }
  };

  const handleNextVoicing = () => {
    if (currentVoicingIndex < availableVoicings.length - 1) {
      setVoicingIndex(currentVoicingIndex + 1);
    }
  };

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'notes' ? 'intervals' : 'notes');
  };

  const togglePlaybackMode = () => {
    setPlaybackMode(playbackMode === 'strum' ? 'block' : 'strum');
  };

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Build query string from guitar state
    const parts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const fret = guitarStringState[i as StringIndex];
      if (fret !== null) {
        parts.push(`${i}-${fret}`);
      }
    }

    // Build URL with query params
    const params = new URLSearchParams();
    params.set('s', parts.join(','));

    // Include tuning if not standard
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
  };

  return (
    <div className={styles.controlPanel}>
      {/* Row 1: Voicing Navigation + Tuning */}
      <div className={styles.voicingTuningRow}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Position</h3>
          <div className={styles.voicingNav}>
            <button
              onClick={handlePrevVoicing}
              disabled={currentVoicingIndex === 0 || availableVoicings.length === 0}
              className={styles.navButton}
            >
              &lt;
            </button>
            <span className={styles.voicingLabel}>
              {isFreeFormMode ? (
                'Free Play'
              ) : isCustomShape ? (
                'Custom'
              ) : availableVoicings.length > 0 ? (
                `${currentVoicingIndex + 1} of ${availableVoicings.length}`
              ) : (
                'No voicings'
              )}
            </span>
            <button
              onClick={handleNextVoicing}
              disabled={
                currentVoicingIndex >= availableVoicings.length - 1 ||
                availableVoicings.length === 0
              }
              className={styles.navButton}
            >
              &gt;
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tuning</h3>
          <button
            className={styles.tuningButton}
            onClick={() => setShowTuningModal(true)}
          >
            {tuningName}
            <span className={styles.tuningIcon}>▾</span>
          </button>
        </div>
      </div>

      {/* Row 2: Toggles (Display + Playback side by side) */}
      <div className={styles.togglesRow}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Display</h3>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Intervals</span>
            <div
              className={`${styles.toggleSwitch} ${displayMode === 'intervals' ? styles.active : ''}`}
              onClick={toggleDisplayMode}
              role="switch"
              aria-checked={displayMode === 'intervals'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleDisplayMode()}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Playback</h3>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Block</span>
            <div
              className={`${styles.toggleSwitch} ${playbackMode === 'block' ? styles.active : ''}`}
              onClick={togglePlaybackMode}
              role="switch"
              aria-checked={playbackMode === 'block'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && togglePlaybackMode()}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Action Buttons */}
      <div className={styles.buttonsRow}>
        <button
          onClick={() => playChord()}
          disabled={!isLoaded || !hasNotes}
          className={styles.playButton}
        >
          {!isLoaded ? 'Loading...' : 'Play Chord'}
        </button>
        <div className={styles.secondaryButtons}>
          <button
            onClick={handleShare}
            disabled={!hasNotes}
            className={styles.shareButton}
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button onClick={clearAllStrings} className={styles.clearButton}>
            Clear All
          </button>
        </div>
      </div>

      {/* Tuning Modals */}
      <TuningModal
        isOpen={showTuningModal}
        onClose={() => setShowTuningModal(false)}
        onSelectTuning={handleTuningSelect}
        playNote={playNote}
        isAudioLoaded={isLoaded}
      />

      <TuningConfirmModal
        isOpen={showConfirmModal}
        tuningName={pendingTuning?.name || ''}
        onSelect={handleConfirmSelect}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
}
