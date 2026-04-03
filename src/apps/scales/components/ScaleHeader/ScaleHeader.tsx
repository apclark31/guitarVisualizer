/**
 * ScaleHeader - Flat typographic scale display + picker trigger
 *
 * Shows contextual state and opens the scale picker via shared Library state.
 * Three states:
 * 1. Blank: "Tap notes or select a scale"
 * 2. Free Play: Played notes as text + top suggestion
 * 3. Scale Selected: Scale name + interval chips with labels
 */

import { useMemo, useEffect } from 'react';
import { useScaleStore, useSharedStore } from '../../store/useScaleStore';
import { useSharedStore as useGlobalSharedStore } from '../../../../shared/store';
import { ScalePicker } from '../ScalePicker/ScalePicker';
import { IntervalMap, type IntervalEntry } from '../../../../shared/components/IntervalMap/IntervalMap';
import { SCALE_TYPE_DISPLAY } from '../../lib/scale-data';
import { getNotesFromMultiNoteState } from '../../../../shared/lib';
import styles from './ScaleHeader.module.css';

interface ScaleHeaderProps {
  intervalEntries?: IntervalEntry[];
}

export function ScaleHeader({ intervalEntries = [] }: ScaleHeaderProps) {
  const {
    scaleRoot,
    scaleType,
    guitarStringState,
    scaleSuggestions,
  } = useScaleStore();

  const { tuning } = useSharedStore();
  const { isLibraryOpen, openLibrary, closeLibrary, setMatchCount } = useGlobalSharedStore();

  // Sync match count to shared store for Library tab badge
  useEffect(() => {
    setMatchCount(scaleSuggestions.length);
  }, [scaleSuggestions.length, setMatchCount]);

  const hasScale = scaleRoot && scaleType;

  // Check if we have notes on the fretboard (free-play mode)
  const noteCount = Object.values(guitarStringState).reduce(
    (sum, frets) => sum + frets.length,
    0
  );
  const isFreePlayMode = !hasScale && noteCount > 0;

  // Get played notes for text display in free-play mode
  const playedNotesDisplay = useMemo(() => {
    if (!isFreePlayMode) return '';
    const { notes } = getNotesFromMultiNoteState(guitarStringState, tuning);
    return notes.join(' · ');
  }, [guitarStringState, tuning, isFreePlayMode]);

  // Get top suggestion for display
  const topSuggestion = scaleSuggestions[0];

  // Determine what to display based on state
  const getDisplayContent = () => {
    // State 3: Scale selected — chips with interval labels
    if (hasScale && scaleType) {
      const scaleName = `${scaleRoot} ${SCALE_TYPE_DISPLAY[scaleType]}`;

      return {
        state: 'selected' as const,
        primaryText: scaleName,
        secondaryText: null as string | null,
        chipEntries: intervalEntries,
      };
    }

    // State 2: Free Play — plain text, no chips
    if (isFreePlayMode) {
      const otherCount = scaleSuggestions.length - 1;
      const suggestionText = topSuggestion
        ? otherCount > 0
          ? `${topSuggestion.display} (and ${otherCount} other${otherCount === 1 ? '' : 's'})`
          : topSuggestion.display
        : null;

      return {
        state: 'freeplay' as const,
        primaryText: playedNotesDisplay as string | null,
        secondaryText: suggestionText,
        chipEntries: [] as IntervalEntry[],
      };
    }

    // State 1: Blank
    return {
      state: 'blank' as const,
      primaryText: 'Tap notes or select a scale' as string | null,
      secondaryText: null as string | null,
      chipEntries: [] as IntervalEntry[],
    };
  };

  const display = getDisplayContent();

  // Determine default tab for picker
  const defaultPickerTab: 'library' | 'matches' =
    isFreePlayMode && scaleSuggestions.length > 0 ? 'matches' : 'library';

  return (
    <div className={styles.scaleHeader}>
      {/* Tappable header area */}
      <button
        className={styles.scaleCard}
        onClick={openLibrary}
        aria-label="Open scale picker"
      >
        {display.primaryText && (
          <span className={`${styles.primaryText} ${
            display.state === 'selected' ? styles.primarySelected :
            display.state === 'freeplay' ? styles.primaryFreeplay : ''
          }`}>
            {display.primaryText}
          </span>
        )}
        <div className={`${styles.chipArea} ${display.chipEntries.length > 0 ? styles.chipAreaVisible : ''}`}>
          {display.chipEntries.length > 0 && (
            <IntervalMap intervals={display.chipEntries} variant="inline" />
          )}
        </div>
        <span className={`${styles.secondaryText} ${display.state === 'freeplay' ? styles.secondarySuggestion : ''} ${!display.secondaryText ? styles.secondaryHidden : ''}`}>
          {display.secondaryText || '\u00A0'}
        </span>
      </button>

      {/* Scale Picker as Bottom Sheet */}
      <ScalePicker
        isOpen={isLibraryOpen}
        onClose={closeLibrary}
        defaultTab={defaultPickerTab}
      />
    </div>
  );
}
