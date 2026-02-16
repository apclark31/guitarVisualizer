import { useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../shared/store';
import { TuningModal } from './TuningModal';
import { TuningConfirmModal } from './TuningConfirmModal';
import { KeyPicker } from './KeyPicker';
import { encodeTuningForUrl, encodeKeyForUrl, VOICING_FILTER_OPTIONS } from '../../config/constants';
import type { StringIndex, TuningChangeMode, VoicingFilterType, PlaybackMode } from '../../types';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  isAudioLoaded: boolean;
  playChord: (mode?: PlaybackMode) => Promise<void>;
  playNote: (note: string, duration?: number) => Promise<void>;
}

export function ControlPanel({ isAudioLoaded, playChord, playNote }: ControlPanelProps) {
  const {
    targetRoot,
    targetQuality,
    displayMode,
    setDisplayMode,
    currentVoicingIndex,
    availableVoicings,
    setVoicingIndex,
    isCustomShape,
    clearAllStrings,
    guitarStringState,
    setTuning,
    voicingTypeFilter,
    setVoicingTypeFilter,
    keyContext,
  } = useMusicStore();

  const { tuning, tuningName, playbackMode, setPlaybackMode } = useSharedStore();

  // Position navigation
  const isFreeFormMode = !targetRoot || !targetQuality;

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

  // Check if there are any notes to play
  const hasNotes = Object.values(guitarStringState).some(fret => fret !== null);

  // Tuning modal state
  const [showTuningModal, setShowTuningModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTuning, setPendingTuning] = useState<{ tuning: string[]; name: string } | null>(null);

  // Handle tuning selection from TuningModal
  const handleTuningSelect = (newTuning: string[], name: string) => {
    // If no notes on fretboard, apply directly with 'clear' mode (acts same as empty)
    if (!hasNotes) {
      setTuning(newTuning, name, 'clear');
      return;
    }

    // Otherwise, show confirm modal for adapt/keep/clear choice
    setPendingTuning({ tuning: newTuning, name });
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

  const handleVoicingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVoicingTypeFilter(e.target.value as VoicingFilterType);
  };

  // Key picker modal state
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Get display text for key button
  const keyDisplayText = keyContext
    ? `${keyContext.root} ${keyContext.type === 'major' ? 'Major' : 'Minor'}`
    : '--';

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

    // Include chord selection if one is active (not free-form)
    if (targetRoot && targetQuality) {
      params.set('r', targetRoot);
      params.set('q', targetQuality);
      // Include voicing index if not custom
      if (!isCustomShape && currentVoicingIndex >= 0) {
        params.set('v', currentVoicingIndex.toString());
      }
    }

    // Include key context if one is set
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
  };

  return (
    <div className={styles.controlPanel} data-tour="control-panel">
      {/* Row 1: Position Navigation */}
      <div className={styles.positionRow} data-tour="position-nav">
        <button
          onClick={handlePrevVoicing}
          disabled={isFreeFormMode || currentVoicingIndex === 0 || availableVoicings.length === 0}
          className={styles.navButton}
          aria-label="Previous voicing"
        >
          &lt;
        </button>
        <span className={`${styles.positionLabel} ${isFreeFormMode ? styles.positionLabelInactive : ''}`}>
          {isFreeFormMode ? (
            'Position'
          ) : isCustomShape ? (
            'Custom'
          ) : availableVoicings.length > 0 ? (
            `${currentVoicingIndex + 1} of ${availableVoicings.length}`
          ) : (
            'Position'
          )}
        </span>
        <button
          onClick={handleNextVoicing}
          disabled={
            isFreeFormMode ||
            currentVoicingIndex >= availableVoicings.length - 1 ||
            availableVoicings.length === 0
          }
          className={styles.navButton}
          aria-label="Next voicing"
        >
          &gt;
        </button>
      </div>

      {/* Row 2: Key + Voicing Filter + Tuning */}
      <div className={styles.keyVoicingTuningRow}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Key</h3>
          <button
            className={styles.keyButton}
            onClick={() => setShowKeyModal(true)}
            data-tour="key-button"
          >
            {keyDisplayText}
          </button>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Voicing</h3>
          <div className={styles.selectWrapper}>
            <select
              value={voicingTypeFilter}
              onChange={handleVoicingFilterChange}
              className={styles.voicingSelect}
            >
              {VOICING_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tuning</h3>
          <button
            className={styles.tuningButton}
            onClick={() => setShowTuningModal(true)}
            data-tour="tuning-button"
          >
            {tuningName}
          </button>
        </div>
      </div>

      {/* Row 2: Toggles (Display + Playback side by side) */}
      <div className={styles.togglesRow}>
        <div className={styles.section} data-tour="display-toggle">
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
          disabled={!isAudioLoaded || !hasNotes}
          className={styles.playButton}
          data-tour="play-button"
        >
          {!isAudioLoaded ? 'Loading...' : 'Play Chord'}
        </button>
        <div className={styles.secondaryButtons}>
          <button
            onClick={handleShare}
            disabled={!hasNotes}
            className={styles.shareButton}
            data-tour="share-button"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={clearAllStrings}
            disabled={!hasNotes}
            className={styles.clearButton}
            data-tour="clear-button"
          >
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
        isAudioLoaded={isAudioLoaded}
      />

      <TuningConfirmModal
        isOpen={showConfirmModal}
        tuningName={pendingTuning?.name || ''}
        onSelect={handleConfirmSelect}
        onCancel={handleConfirmCancel}
      />

      <KeyPicker
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />
    </div>
  );
}
