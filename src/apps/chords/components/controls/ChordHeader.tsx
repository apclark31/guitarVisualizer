/**
 * ChordHeader - Unified chord display card + picker trigger
 *
 * A tappable card that shows contextual state and opens the chord picker modal.
 * Four states:
 * 1. Blank: "Select a chord or tap fretboard"
 * 2. Notes (no matches): Note chips (no labels) + "Add more notes"
 * 3. Notes (with matches): Chord name + interval chips + voicing info
 * 4. Chord Selected: Chord name + interval chips + key context
 *
 * Note display uses IntervalMap chips throughout — plain chips before
 * recognition, labeled chips after. Eliminates text→chip DOM shift.
 */

import { useEffect } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../../../shared/store';
import { IntervalMap, type IntervalEntry } from '../../../../shared/components/IntervalMap/IntervalMap';
import { Note } from '@tonaljs/tonal';
import type { StringIndex, PlaybackMode } from '../../types';
import { ChordPicker } from './ChordPicker';
import { getRomanNumeral } from '../../config/constants';
import styles from './ChordHeader.module.css';

interface ChordHeaderProps {
  playNotes: (notes: string[], mode?: PlaybackMode) => Promise<void>;
  intervalEntries: IntervalEntry[];
}

/** Get played notes as a formatted string */
function getPlayedNotesDisplay(
  guitarState: Record<StringIndex, number | null>,
  tuning: readonly string[]
): string {
  const notes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as StringIndex];
    if (fret !== null) {
      const openMidi = Note.midi(tuning[i]);
      if (openMidi) {
        const noteName = Note.pitchClass(Note.fromMidi(openMidi + fret));
        if (noteName && !notes.includes(noteName)) {
          notes.push(noteName);
        }
      }
    }
  }
  return notes.length > 0 ? notes.join(' \u00B7 ') : '';
}

/** Format voicing type for display */
function formatVoicingType(type: string | null): string | null {
  if (!type) return null;
  const labels: Record<string, string> = {
    'shell-major': 'Shell',
    'shell-minor': 'Shell',
    'shell-dominant': 'Shell',
    'triad': 'Triad',
    'partial': 'Partial',
    'full': 'Full',
  };
  return labels[type] || null;
}

/** Format missing intervals for display (e.g., ["5", "R"] -> "no 5, R") */
function formatMissingIntervals(missing: string[]): string | null {
  if (!missing || missing.length === 0) return null;
  return `no ${missing.join(', ')}`;
}

export function ChordHeader({ playNotes, intervalEntries }: ChordHeaderProps) {
  const {
    targetRoot,
    targetQuality,
    guitarStringState,
    suggestions,
    availableVoicings,
    currentVoicingIndex,
  } = useMusicStore();

  const { tuning, keyContext, isLibraryOpen, openLibrary, closeLibrary } = useSharedStore();

  // Listen for tour event to force-close the picker
  useEffect(() => {
    const handleTourClosePicker = () => closeLibrary();
    window.addEventListener('tour-close-picker', handleTourClosePicker);
    return () => window.removeEventListener('tour-close-picker', handleTourClosePicker);
  }, [closeLibrary]);

  const hasSuggestions = suggestions.length > 0;
  const playedNotes = getPlayedNotesDisplay(guitarStringState, tuning);
  const hasNotes = playedNotes.length > 0;
  const noteCount = playedNotes.split(' \u00B7 ').filter(Boolean).length;

  // Get current voicing for inversion detection
  const currentVoicing = availableVoicings[currentVoicingIndex];

  // Get top suggestion for voicing type
  const topSuggestion = suggestions[0] || null;

  // Determine what to display based on state
  const getDisplayContent = () => {
    // State 4: Chord selected
    if (targetRoot && targetQuality) {
      const isInversion = currentVoicing?.isInversion && currentVoicing?.bassNote;
      const chordName = isInversion
        ? `${targetRoot} ${targetQuality}/${currentVoicing.bassNote}`
        : `${targetRoot} ${targetQuality}`;

      // Get Roman numeral if key context is active
      let keySubtitle: string | null = null;
      if (keyContext) {
        const numeral = getRomanNumeral(targetRoot, keyContext.root, keyContext.type);
        if (numeral) {
          const keyName = `${keyContext.root} ${keyContext.type === 'major' ? 'Major' : 'Minor'}`;
          keySubtitle = `${numeral} in ${keyName}`;
        }
      }

      return {
        state: 'selected' as const,
        primaryText: chordName,
        secondaryText: keySubtitle,
        chipEntries: intervalEntries,
      };
    }

    // State 3: Notes with matches (2+ notes and has suggestions)
    if (hasNotes && noteCount >= 2 && hasSuggestions && topSuggestion) {
      const chordName = topSuggestion.displayName;
      const missingText = formatMissingIntervals(topSuggestion.missingIntervals);
      const voicingLabel = formatVoicingType(topSuggestion.voicingType);

      // Build secondary text: voicing info only (notes are in chips now)
      const parts: string[] = [];
      if (missingText) {
        parts.push(missingText);
      } else if (voicingLabel && voicingLabel !== 'Partial') {
        parts.push(voicingLabel);
      }

      const matchCount = suggestions.length;
      if (matchCount > 1) {
        parts.push(`+${matchCount - 1} more`);
      }

      return {
        state: 'notes-with-match' as const,
        primaryText: chordName,
        secondaryText: parts.length > 0 ? parts.join(' \u00B7 ') : null,
        chipEntries: intervalEntries,
      };
    }

    // State 2: Notes but no matches yet — plain text, no chips
    if (hasNotes) {
      return {
        state: 'notes-no-match' as const,
        primaryText: playedNotes,
        secondaryText: 'Add more notes to see matches',
        chipEntries: [] as IntervalEntry[],
      };
    }

    // State 1: Blank
    return {
      state: 'blank' as const,
      primaryText: 'Tap notes or select a chord',
      secondaryText: null,
      chipEntries: [] as IntervalEntry[],
    };
  };

  const display = getDisplayContent();

  // Context-aware default tab
  const defaultPickerTab: 'library' | 'matches' =
    display.state === 'notes-with-match' && !keyContext ? 'matches' : 'library';

  return (
    <div className={styles.chordHeader}>
      {/* Tappable chord card */}
      <button
        className={styles.chordCard}
        onClick={openLibrary}
        aria-label="Open chord picker"
        data-tour="chord-card"
      >
        {display.primaryText && (
          <span className={`${styles.primaryText} ${
            display.state === 'selected' ? styles.primarySelected :
            display.state === 'notes-with-match' ? styles.primaryDetected :
            display.state === 'notes-no-match' ? styles.primaryNotes : ''
          }`}>
            {display.primaryText}
          </span>
        )}
        <div className={`${styles.chipArea} ${display.chipEntries.length > 0 ? styles.chipAreaVisible : ''}`}>
          {display.chipEntries.length > 0 && (
            <IntervalMap intervals={display.chipEntries} variant="inline" />
          )}
        </div>
        <span className={`${styles.secondaryText} ${!display.secondaryText ? styles.secondaryHidden : ''}`}>
          {display.secondaryText || '\u00A0'}
        </span>
      </button>

      {/* Chord Picker Modal */}
      <ChordPicker
        isOpen={isLibraryOpen}
        onClose={closeLibrary}
        playNotes={playNotes}
        defaultTab={defaultPickerTab}
      />
    </div>
  );
}
