/**
 * ChordHeader - Unified chord display card + picker trigger
 *
 * A tappable card that shows contextual state and opens the chord picker modal.
 * Four states:
 * 1. Blank: "Select a chord or tap fretboard"
 * 2. Notes (no matches): Shows note names + "Add more notes"
 * 3. Notes (with matches): Shows note names + voicing type + (i) button
 * 4. Chord Selected: Shows chord name + notes
 *
 * Position controls are included below the card.
 */

import { useState, useEffect } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../shared/store';
import { Note } from '@tonaljs/tonal';
import type { StringIndex, PlaybackMode } from '../../types';
import { ChordPicker } from './ChordPicker';
import { SuggestionModal } from './SuggestionModal';
import { getRomanNumeral } from '../../config/constants';
import styles from './ChordHeader.module.css';

interface ChordHeaderProps {
  playNotes: (notes: string[], mode?: PlaybackMode) => Promise<void>;
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
  return notes.length > 0 ? notes.join(' · ') : '';
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

export function ChordHeader({ playNotes }: ChordHeaderProps) {
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  const {
    targetRoot,
    targetQuality,
    guitarStringState,
    suggestions,
    keySuggestions,
    voicingType,
    availableVoicings,
    currentVoicingIndex,
    keyContext,
  } = useMusicStore();

  const { tuning } = useSharedStore();

  // Listen for tour event to force-close the picker
  useEffect(() => {
    const handleTourClosePicker = () => setShowPickerModal(false);
    window.addEventListener('tour-close-picker', handleTourClosePicker);
    return () => window.removeEventListener('tour-close-picker', handleTourClosePicker);
  }, []);

  const hasSuggestions = suggestions.length > 0;
  const playedNotes = getPlayedNotesDisplay(guitarStringState, tuning);
  const hasNotes = playedNotes.length > 0;
  const noteCount = playedNotes.split(' · ').filter(Boolean).length;

  // Get current voicing for inversion detection
  const currentVoicing = availableVoicings[currentVoicingIndex];

  // Get top suggestion for voicing type
  const topSuggestion = suggestions[0] || null;

  // Determine what to display based on state
  const getDisplayContent = () => {
    // State 4: Chord selected - no (i) button, just display
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

      // Show notes, and key subtitle if present (both together)
      let secondaryText: string | null = null;
      if (keySubtitle && playedNotes) {
        secondaryText = `${playedNotes} · ${keySubtitle}`;
      } else if (keySubtitle) {
        secondaryText = keySubtitle;
      } else if (playedNotes) {
        secondaryText = playedNotes;
      }

      return {
        state: 'selected' as const,
        primaryText: chordName,
        secondaryText,
        showSuggestions: false, // No (i) when chord is selected
      };
    }

    // State 3: Notes with matches (2+ notes and has suggestions)
    if (hasNotes && noteCount >= 2 && hasSuggestions && topSuggestion) {
      // Show the detected chord name as primary text
      const chordName = topSuggestion.displayName;
      const missingText = formatMissingIntervals(topSuggestion.missingIntervals);
      const voicingLabel = formatVoicingType(topSuggestion.voicingType);

      // Build secondary text: notes + missing intervals + voicing type
      const parts: string[] = [];
      parts.push(playedNotes);
      if (missingText) {
        parts.push(missingText);
      } else if (voicingLabel && voicingLabel !== 'Partial') {
        // Only show voicing type if it's meaningful (not just "Partial")
        parts.push(voicingLabel);
      }

      // Add indicator for more matches
      const matchCount = suggestions.length;
      if (matchCount > 1) {
        parts.push(`+${matchCount - 1} more`);
      }

      return {
        state: 'notes-with-match' as const,
        primaryText: chordName,
        secondaryText: parts.join(' · '),
        showSuggestions: true,
      };
    }

    // State 2: Notes but no matches yet (< 3 notes or no suggestions)
    if (hasNotes) {
      return {
        state: 'notes-no-match' as const,
        primaryText: playedNotes,
        secondaryText: 'Add more notes to see matches',
        showSuggestions: false,
      };
    }

    // State 1: Blank - no notes, no selection
    return {
      state: 'blank' as const,
      primaryText: 'Select a chord or tap the fretboard to begin',
      secondaryText: null,
      showSuggestions: false,
    };
  };

  const display = getDisplayContent();

  return (
    <div className={styles.chordHeader}>
      {/* Tappable chord card */}
      <div className={styles.cardRow}>
        <button
          className={styles.chordCard}
          onClick={() => setShowPickerModal(true)}
          aria-label="Open chord picker"
          data-tour="chord-card"
        >
          <span className={`${styles.primaryText} ${
            display.state === 'selected' ? styles.primarySelected :
            display.state === 'notes-with-match' ? styles.primaryDetected : ''
          }`}>
            {display.primaryText}
          </span>
          {display.secondaryText && (
            <span className={styles.secondaryText}>{display.secondaryText}</span>
          )}
        </button>

        {/* Info bubble - only when suggestions available in free-play mode */}
        {display.showSuggestions && (
          <button
            className={styles.infoBubble}
            onClick={() => setShowSuggestionModal(true)}
            aria-label="View chord suggestions"
            data-tour="info-button"
          >
            i
          </button>
        )}
      </div>

      {/* Chord Picker Modal */}
      <ChordPicker
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        playNotes={playNotes}
      />

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <SuggestionModal
          suggestions={suggestions}
          keySuggestions={keySuggestions}
          voicingType={voicingType}
          playedNotes={playedNotes}
          onClose={() => setShowSuggestionModal(false)}
        />
      )}
    </div>
  );
}
