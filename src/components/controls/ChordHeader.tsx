/**
 * ChordHeader - Unified chord identity display + picker
 *
 * Combines the previous ChordDisplay and ChordPicker into a single component.
 * Three states:
 * 1. Empty: "Tap notes on the fretboard or select below"
 * 2. Free-form: Shows detected notes + suggestions
 * 3. Selected: Shows chord name + notes + aliases
 */

import { useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { VOICING_FILTER_OPTIONS } from '../../config/constants';
import { Note } from '@tonaljs/tonal';
import type { StringIndex, VoicingFilterType } from '../../types';
import { ChordPicker } from './ChordPicker';
import { SuggestionModal } from './SuggestionModal';
import styles from './ChordHeader.module.css';

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

export function ChordHeader() {
  const [showModal, setShowModal] = useState(false);

  const {
    targetRoot,
    targetQuality,
    guitarStringState,
    availableVoicings,
    currentVoicingIndex,
    suggestions,
    voicingType,
    voicingTypeFilter,
    setVoicingTypeFilter,
    tuning,
  } = useMusicStore();

  const hasSuggestions = suggestions.length > 0;
  const playedNotes = getPlayedNotesDisplay(guitarStringState, tuning);
  const hasNotes = playedNotes.length > 0;

  // Get current voicing for inversion detection
  const currentVoicing = availableVoicings[currentVoicingIndex];

  // Get top suggestion for context display
  const topSuggestion = suggestions[0] || null;

  const handleVoicingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVoicingTypeFilter(e.target.value as VoicingFilterType);
  };

  // Determine what to display based on state
  const getDisplayContent = () => {
    // State 3: Chord selected
    if (targetRoot && targetQuality) {
      const isInversion = currentVoicing?.isInversion && currentVoicing?.bassNote;
      const chordName = isInversion
        ? `${targetRoot} ${targetQuality}/${currentVoicing.bassNote}`
        : `${targetRoot} ${targetQuality}`;

      return {
        state: 'selected' as const,
        title: chordName,
        notes: playedNotes || null,
        subtext: null, // Could add "Also known as: Gmaj7, GM7" here
        voicingBadge: null,
      };
    }

    // State 2: Free-form with notes placed
    if (hasNotes && topSuggestion) {
      const voicingLabel = formatVoicingType(topSuggestion.voicingType);
      return {
        state: 'freeform' as const,
        title: playedNotes,
        notes: null,
        subtext: 'Check Possible Chord Matches',
        voicingBadge: voicingLabel,
      };
    }

    // State 2b: Notes placed but no suggestions yet (only 1 note)
    if (hasNotes) {
      return {
        state: 'freeform' as const,
        title: playedNotes,
        notes: null,
        subtext: 'Add more notes to see chord matches',
        voicingBadge: null,
      };
    }

    // State 1: Empty - no notes, no selection
    return {
      state: 'empty' as const,
      title: null,
      notes: null,
      subtext: 'Select a chord or tap the fretboard',
      voicingBadge: null,
    };
  };

  const display = getDisplayContent();

  return (
    <div className={styles.chordHeader}>
      {/* Top section: Chord identity */}
      <div className={styles.identitySection}>
        {display.title ? (
          <div className={styles.mainRow}>
            <span className={`${styles.title} ${display.state === 'selected' ? styles.titleSelected : ''}`}>
              {display.title}
            </span>
            {display.voicingBadge && (
              <span className={styles.voicingBadge}>{display.voicingBadge}</span>
            )}
            {/* Info bubble - only in free-form mode with suggestions */}
            {hasSuggestions && !targetRoot && (
              <button
                className={styles.infoBubble}
                onClick={() => setShowModal(true)}
                aria-label="View chord suggestions"
              >
                i
              </button>
            )}
          </div>
        ) : null}
        {display.notes && <span className={styles.notes}>{display.notes}</span>}
        {display.subtext && (
          <span className={`${styles.subtext} ${display.state === 'empty' ? styles.subtextEmpty : ''}`}>
            {display.subtext}
          </span>
        )}
      </div>

      {/* Bottom section: Picker + Voicing dropdown */}
      <div className={styles.controlsRow}>
        <ChordPicker className={styles.picker} />
        <label className={styles.voicingLabel}>
          <span className={styles.voicingLabelText}>Voicing</span>
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
        </label>
      </div>

      {/* Suggestion Modal */}
      {showModal && (
        <SuggestionModal
          suggestions={suggestions}
          voicingType={voicingType}
          playedNotes={playedNotes}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
