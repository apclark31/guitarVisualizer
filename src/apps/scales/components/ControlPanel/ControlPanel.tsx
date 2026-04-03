/**
 * ControlPanel - Scale Sage controls
 *
 * Includes:
 * - Position navigation (< 1 of 5 > for pentatonic, 1 of 7 for diatonic)
 * - Tuning button
 * - Display toggle (Notes/Intervals)
 * - Playback direction toggle (Ascending/Descending)
 * - Play Scale button
 * - Share/Clear buttons
 *
 * Mode-aware: Different behavior for Scale Selected vs Free Play mode.
 * Mirrors ControlPanel pattern from Chord Compass.
 */

import { useState } from 'react';
import { useScaleStore, useSharedStore, type ScaleType } from '../../store/useScaleStore';
import { TuningModal } from '../../../chords/components/controls/TuningModal';
import { TuningConfirmModal } from '../../../chords/components/controls/TuningConfirmModal';
import { Card } from '../../../../shared/components/Card';
import type { TuningChangeMode } from '../../../../shared/types';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  isAudioLoaded: boolean;
  playNote: (note: string, duration?: number) => Promise<void>;
}

/** Get position count based on scale type */
function getPositionCount(scaleType: ScaleType | null): number {
  if (!scaleType) return 0;
  // Pentatonic and blues have 5 positions, diatonic scales have 7
  if (scaleType === 'major-pentatonic' || scaleType === 'minor-pentatonic' || scaleType === 'blues') {
    return 5;
  }
  return 7;
}

export function ControlPanel({ isAudioLoaded, playNote }: ControlPanelProps) {
  const {
    scaleRoot,
    scaleType,
    currentPosition,
    displayMode,
    playbackDirection,
    guitarStringState,
    setPosition,
    setDisplayMode,
    setPlaybackDirection,
    clearScale,
    clearFrets,
  } = useScaleStore();

  const { tuningName, setTuning } = useSharedStore();

  const hasScale = scaleRoot && scaleType;
  const positionCount = getPositionCount(scaleType);

  // Check if we have notes on the fretboard (free-play mode)
  // Multi-note state: count total frets across all strings
  const noteCount = Object.values(guitarStringState).reduce(
    (sum, frets) => sum + frets.length,
    0
  );
  const isFreePlayMode = !hasScale && noteCount > 0;

  // Position navigation
  const handlePrevPosition = () => {
    if (currentPosition > 0) {
      setPosition(currentPosition - 1);
    }
  };

  const handleNextPosition = () => {
    if (currentPosition < positionCount) {
      setPosition(currentPosition + 1);
    }
  };

  // Format position label
  const getPositionLabel = () => {
    if (isFreePlayMode) return 'Free Play';
    if (!hasScale) return 'Position';
    if (currentPosition === 0) return 'Full';
    return `${currentPosition} of ${positionCount}`;
  };

  // Tuning modal state
  const [showTuningModal, setShowTuningModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTuning, setPendingTuning] = useState<{ tuning: string[]; name: string } | null>(null);

  // Handle tuning selection
  const handleTuningSelect = (newTuning: string[], name: string) => {
    // For scales, we don't need to adapt - just apply the tuning
    // If there's a scale selected, show confirm modal
    if (hasScale) {
      setPendingTuning({ tuning: newTuning, name });
      setShowConfirmModal(true);
    } else {
      setTuning(newTuning, name);
    }
  };

  const handleConfirmSelect = (_mode: TuningChangeMode) => {
    if (pendingTuning) {
      setTuning(pendingTuning.tuning, pendingTuning.name);
      setPendingTuning(null);
    }
    setShowConfirmModal(false);
  };

  const handleConfirmCancel = () => {
    setPendingTuning(null);
    setShowConfirmModal(false);
  };

  // Toggle functions
  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'notes' ? 'intervals' : 'notes');
  };

  const togglePlaybackDirection = () => {
    setPlaybackDirection(playbackDirection === 'ascending' ? 'descending' : 'ascending');
  };

  // Clear handler - works for both modes
  const handleClear = () => {
    if (hasScale) {
      clearScale();
    } else if (isFreePlayMode) {
      clearFrets();
    }
  };

  // Determine if clear button should be enabled
  const canClear = hasScale || isFreePlayMode;

  return (
    <div className={styles.controlPanel}>
      {/* Setup Card: Position nav + Tuning + Clear */}
      <Card title="Setup" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>}>
        <div className={styles.positionRow}>
          <button
            onClick={handlePrevPosition}
            disabled={!hasScale || currentPosition === 0}
            className={styles.navButton}
            aria-label="Previous position"
          >
            &lt;
          </button>
          <span className={`${styles.positionLabel} ${!hasScale ? styles.positionLabelInactive : ''} ${isFreePlayMode ? styles.positionLabelFreePlay : ''}`}>
            {getPositionLabel()}
          </span>
          <button
            onClick={handleNextPosition}
            disabled={!hasScale || currentPosition >= positionCount}
            className={styles.navButton}
            aria-label="Next position"
          >
            &gt;
          </button>
        </div>

        <div className={styles.tuningRow}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tuning</h3>
            <button
              className={styles.tuningButton}
              onClick={() => setShowTuningModal(true)}
            >
              {tuningName}
            </button>
          </div>
        </div>

      </Card>

      {/* Display Card: Toggles */}
      <Card title="Display" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}>
        <div className={styles.togglesRow}>
          <div className={styles.section}>
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
            <h3 className={styles.sectionTitle}>Direction</h3>
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Descending</span>
              <div
                className={`${styles.toggleSwitch} ${playbackDirection === 'descending' ? styles.active : ''}`}
                onClick={togglePlaybackDirection}
                role="switch"
                aria-checked={playbackDirection === 'descending'}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && togglePlaybackDirection()}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Clear button — below all cards */}
      <button
        onClick={handleClear}
        disabled={!canClear}
        className={styles.clearButton}
      >
        Clear
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
    </div>
  );
}
