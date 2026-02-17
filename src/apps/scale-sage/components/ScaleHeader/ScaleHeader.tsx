/**
 * ScaleHeader - Unified scale display card + picker trigger
 *
 * A tappable card that shows contextual state and opens the scale picker modal.
 * Three states:
 * 1. Blank: "Tap notes or select a scale"
 * 2. Free Play: Shows played notes + top suggestion + glow animation
 * 3. Scale Selected: Shows scale name + position info
 *
 * Mirrors ChordHeader pattern from Chord Compass.
 */

import { useState, useMemo } from 'react';
import { useScaleStore, useSharedStore } from '../../store/useScaleStore';
import { ScalePicker } from '../ScalePicker/ScalePicker';
import { SCALE_TYPE_DISPLAY, getScale } from '../../lib/scale-data';
import { getNotesFromMultiNoteState } from '../../../../shared/lib';
import styles from './ScaleHeader.module.css';

export function ScaleHeader() {
  const [showPickerModal, setShowPickerModal] = useState(false);

  const {
    scaleRoot,
    scaleType,
    guitarStringState,
    scaleSuggestions,
  } = useScaleStore();

  const { tuning } = useSharedStore();

  const hasScale = scaleRoot && scaleType;

  // Check if we have notes on the fretboard (free-play mode)
  // Multi-note state: count total frets across all strings
  const noteCount = Object.values(guitarStringState).reduce(
    (sum, frets) => sum + frets.length,
    0
  );
  const isFreePlayMode = !hasScale && noteCount > 0;

  // Get played notes for display
  const playedNotesDisplay = useMemo(() => {
    if (!isFreePlayMode) return '';
    const { notes } = getNotesFromMultiNoteState(guitarStringState, tuning);
    return notes.join(' · ');
  }, [guitarStringState, tuning, isFreePlayMode]);

  // Get top suggestion for display
  const topSuggestion = scaleSuggestions[0];

  // Get scale notes for display in selected mode
  const scaleNotes = useMemo(() => {
    if (!scaleRoot || !scaleType) return null;
    const scaleInfo = getScale(scaleRoot, scaleType);
    return scaleInfo?.notes.join(' ') || null;
  }, [scaleRoot, scaleType]);

  // Determine what to display based on state
  const getDisplayContent = () => {
    // State 3: Scale selected
    if (hasScale && scaleType) {
      const scaleName = `${scaleRoot} ${SCALE_TYPE_DISPLAY[scaleType]}`;

      return {
        state: 'selected' as const,
        primaryText: scaleName,
        secondaryText: scaleNotes,
      };
    }

    // State 2: Free Play - notes on fretboard but no scale selected
    if (isFreePlayMode) {
      const otherCount = scaleSuggestions.length - 1;
      const suggestionText = topSuggestion
        ? otherCount > 0
          ? `${topSuggestion.display} (and ${otherCount} other${otherCount === 1 ? '' : 's'})`
          : topSuggestion.display
        : null;

      return {
        state: 'freeplay' as const,
        primaryText: playedNotesDisplay,
        secondaryText: suggestionText,
      };
    }

    // State 1: Blank - no scale selected, no notes
    return {
      state: 'blank' as const,
      primaryText: 'Tap notes or select a scale',
      secondaryText: null,
    };
  };

  const display = getDisplayContent();

  // Determine default tab for picker
  const defaultPickerTab: 'library' | 'matches' =
    isFreePlayMode && scaleSuggestions.length > 0 ? 'matches' : 'library';

  // Glow when matches available in free-play mode
  const hasMatches = isFreePlayMode && scaleSuggestions.length > 0;

  const handleCardClick = () => {
    setShowPickerModal(true);
  };

  return (
    <div className={styles.scaleHeader}>
      {/* Tappable scale card */}
      <div className={styles.cardRow}>
        <button
          className={`${styles.scaleCard} ${hasMatches ? styles.scaleCardHasMatches : ''}`}
          onClick={handleCardClick}
          aria-label={hasMatches ? "View scale suggestions" : "Open scale picker"}
        >
          <span className={`${styles.primaryText} ${display.state === 'selected' ? styles.primarySelected : ''} ${display.state === 'freeplay' ? styles.primaryFreeplay : ''}`}>
            {display.primaryText}
          </span>
          {display.secondaryText && (
            <span className={`${styles.secondaryText} ${display.state === 'freeplay' ? styles.secondarySuggestion : ''}`}>
              {display.secondaryText}
            </span>
          )}
        </button>
      </div>

      {/* Scale Picker Modal */}
      <ScalePicker
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        defaultTab={defaultPickerTab}
      />
    </div>
  );
}
