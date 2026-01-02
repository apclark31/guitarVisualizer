/**
 * ScaleHeader - Unified scale display card + picker trigger
 *
 * A tappable card that shows contextual state and opens the scale picker modal.
 * Two states:
 * 1. Blank: "Select a scale to begin"
 * 2. Scale Selected: Shows scale name + position info
 *
 * Mirrors ChordHeader pattern from Chord Compass.
 */

import { useState, useMemo } from 'react';
import { useScaleStore } from '../../store/useScaleStore';
import { ScalePicker } from '../ScalePicker/ScalePicker';
import { SCALE_TYPE_DISPLAY, getScale } from '../../lib/scale-data';
import styles from './ScaleHeader.module.css';

export function ScaleHeader() {
  const [showPickerModal, setShowPickerModal] = useState(false);

  const {
    scaleRoot,
    scaleType,
  } = useScaleStore();

  const hasScale = scaleRoot && scaleType;

  // Get scale notes for display
  const scaleNotes = useMemo(() => {
    if (!scaleRoot || !scaleType) return null;
    const scaleInfo = getScale(scaleRoot, scaleType);
    return scaleInfo?.notes.join(' ') || null;
  }, [scaleRoot, scaleType]);

  // Determine what to display based on state
  const getDisplayContent = () => {
    // State 2: Scale selected
    if (hasScale && scaleType) {
      const scaleName = `${scaleRoot} ${SCALE_TYPE_DISPLAY[scaleType]}`;

      return {
        state: 'selected' as const,
        primaryText: scaleName,
        secondaryText: scaleNotes,
      };
    }

    // State 1: Blank - no scale selected
    return {
      state: 'blank' as const,
      primaryText: 'Select a scale to begin',
      secondaryText: null,
    };
  };

  const display = getDisplayContent();

  return (
    <div className={styles.scaleHeader}>
      {/* Tappable scale card */}
      <div className={styles.cardRow}>
        <button
          className={styles.scaleCard}
          onClick={() => setShowPickerModal(true)}
          aria-label="Open scale picker"
        >
          <span className={`${styles.primaryText} ${display.state === 'selected' ? styles.primarySelected : ''}`}>
            {display.primaryText}
          </span>
          {display.secondaryText && (
            <span className={styles.secondaryText}>{display.secondaryText}</span>
          )}
        </button>
      </div>

      {/* Scale Picker Modal */}
      <ScalePicker
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
      />
    </div>
  );
}
