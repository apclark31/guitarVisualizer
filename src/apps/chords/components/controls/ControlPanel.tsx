import { useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../../../shared/store';
import { TuningModal } from './TuningModal';
import { TuningConfirmModal } from './TuningConfirmModal';
import { KeyPicker } from './KeyPicker';
import { Card } from '../../../../shared/components/Card';
import { VOICING_FILTER_OPTIONS } from '../../config/constants';
import type { TuningChangeMode, VoicingFilterType } from '../../types';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  isAudioLoaded: boolean;
  playNote: (note: string, duration?: number) => Promise<void>;
}

export function ControlPanel({ isAudioLoaded, playNote }: ControlPanelProps) {
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
  } = useMusicStore();

  const { tuningName, playbackMode, setPlaybackMode, keyContext } = useSharedStore();

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

  return (
    <div className={styles.controlPanel} data-tour="control-panel">
      {/* Setup Card: Position nav + Key/Voicing/Tuning + Clear */}
      <Card title="Setup" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>}>
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

      </Card>

      {/* Display Card: Toggles */}
      <Card title="Display" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}>
        <div className={styles.togglesRow}>
          <div className={styles.section} data-tour="display-toggle">
            <h3 className={styles.sectionTitle}>Intervals</h3>
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Show</span>
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
      </Card>

      {/* Clear button — below all cards */}
      <button
        onClick={clearAllStrings}
        disabled={!hasNotes}
        className={styles.clearButton}
        data-tour="clear-button"
      >
        Clear All
      </button>

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
