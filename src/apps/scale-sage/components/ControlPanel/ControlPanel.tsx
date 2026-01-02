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
 * Mirrors ControlPanel pattern from Chord Compass.
 */

import { useState } from 'react';
import { useScaleStore, useSharedStore, type ScaleType } from '../../store/useScaleStore';
import { TuningModal } from '../../../../components/controls/TuningModal';
import { TuningConfirmModal } from '../../../../components/controls/TuningConfirmModal';
import { encodeTuningForUrl } from '../../../../shared/config/constants';
import type { TuningChangeMode } from '../../../../shared/types';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  isAudioLoaded: boolean;
  playScale: () => Promise<void>;
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

export function ControlPanel({ isAudioLoaded, playScale, playNote }: ControlPanelProps) {
  const {
    scaleRoot,
    scaleType,
    currentPosition,
    displayMode,
    playbackDirection,
    setPosition,
    setDisplayMode,
    setPlaybackDirection,
    clearScale,
  } = useScaleStore();

  const { tuning, tuningName, setTuning } = useSharedStore();

  const hasScale = scaleRoot && scaleType;
  const positionCount = getPositionCount(scaleType);

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

  // Share URL
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!hasScale) return;

    const params = new URLSearchParams();
    params.set('r', scaleRoot);
    params.set('s', scaleType);
    if (currentPosition !== 1) {
      params.set('p', currentPosition.toString());
    }

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
      {/* Row 1: Position Navigation */}
      <div className={styles.positionRow}>
        <button
          onClick={handlePrevPosition}
          disabled={!hasScale || currentPosition === 0}
          className={styles.navButton}
          aria-label="Previous position"
        >
          &lt;
        </button>
        <span className={`${styles.positionLabel} ${!hasScale ? styles.positionLabelInactive : ''}`}>
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

      {/* Row 2: Tuning */}
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

      {/* Row 3: Toggles (Display + Playback Direction) */}
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

      {/* Row 4: Action Buttons */}
      <div className={styles.buttonsRow}>
        <button
          onClick={playScale}
          disabled={!isAudioLoaded || !hasScale}
          className={styles.playButton}
        >
          {!isAudioLoaded ? 'Loading...' : 'Play Scale'}
        </button>
        <div className={styles.secondaryButtons}>
          <button
            onClick={handleShare}
            disabled={!hasScale}
            className={styles.shareButton}
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={clearScale}
            disabled={!hasScale}
            className={styles.clearButton}
          >
            Clear
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
    </div>
  );
}
