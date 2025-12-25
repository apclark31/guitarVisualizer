import { useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { STANDARD_TUNING } from '../../config/constants';
import { Note } from '@tonaljs/tonal';
import type { StringIndex } from '../../types';
import { SuggestionModal } from './SuggestionModal';
import styles from './ChordDisplay.module.css';

/** Get played notes as a formatted string */
function getPlayedNotesDisplay(guitarState: Record<StringIndex, number | null>): string {
  const notes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as StringIndex];
    if (fret !== null) {
      const openMidi = Note.midi(STANDARD_TUNING[i]);
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

export function ChordDisplay() {
  const [showModal, setShowModal] = useState(false);

  const {
    targetRoot,
    targetQuality,
    detectedChord,
    guitarStringState,
    availableVoicings,
    currentVoicingIndex,
    suggestions,
    voicingType,
  } = useMusicStore();

  const hasSuggestions = suggestions.length > 0;

  const playedNotes = getPlayedNotesDisplay(guitarStringState);

  // Get current voicing for inversion detection
  const currentVoicing = availableVoicings[currentVoicingIndex];

  // Get top suggestion for context display
  const topSuggestion = suggestions[0] || null;

  // Determine what to display
  const getChordDisplay = () => {
    if (targetRoot && targetQuality) {
      // Check if current voicing is an inversion (slash chord)
      const isInversion = currentVoicing?.isInversion && currentVoicing?.bassNote;
      const chordName = isInversion
        ? `${targetRoot} ${targetQuality}/${currentVoicing.bassNote}`
        : `${targetRoot} ${targetQuality}`;

      return {
        main: chordName,
        sub: playedNotes || null,
        suggestion: null,
      };
    }

    // Free-form mode with suggestions - show notes and voicing type
    if (topSuggestion) {
      const voicingLabel = formatVoicingType(topSuggestion.voicingType);

      return {
        main: playedNotes || 'Notes',
        sub: 'Check Possible Chord Matches',
        suggestion: {
          voicingType: voicingLabel,
        },
      };
    }

    if (detectedChord) {
      const altText = detectedChord.alternatives.length > 0
        ? `Also: ${detectedChord.alternatives.slice(0, 2).join(', ')}`
        : null;
      return {
        main: detectedChord.name,
        sub: altText,
        notes: playedNotes,
        suggestion: null,
      };
    }

    return {
      main: 'Fretboard Explorer',
      sub: 'Tap frets to build chords',
      notes: null,
      suggestion: null,
    };
  };

  const display = getChordDisplay();

  return (
    <div className={styles.chordDisplay}>
      <div className={styles.mainRow}>
        <span className={styles.chordName}>{display.main}</span>
        {display.suggestion?.voicingType && (
          <span className={styles.voicingBadge}>{display.suggestion.voicingType}</span>
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
      {display.sub && <span className={styles.chordSub}>{display.sub}</span>}
      {display.notes && <span className={styles.chordNotes}>{display.notes}</span>}

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
