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
import type { StringIndex } from '../../types';
import { getRomanNumeral, QUALITY_TO_SYMBOL } from '../../config/constants';
import styles from './ChordHeader.module.css';

interface ChordHeaderProps {
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

/** Convert interval label to readable form: "5" -> "5th", "b3" -> "♭3rd", "R" -> "root". */
function formatIntervalLabel(label: string): string {
  if (label === 'R') return 'root';
  const match = label.match(/^([b#]?)(\d+)$/);
  if (!match) return label;
  const [, accidental, digits] = match;
  const n = parseInt(digits, 10);
  const suffix = n % 100 >= 11 && n % 100 <= 13
    ? 'th'
    : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  const accent = accidental === 'b' ? '♭' : accidental === '#' ? '♯' : '';
  return `${accent}${n}${suffix}`;
}

/** Semitone offset from the root for each interval label used by the analyzer. */
const INTERVAL_TO_SEMITONES: Record<string, number> = {
  'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, 'b5': 6, '5': 7,
  '#5': 8, '6': 9, 'b7': 10, '7': 11,
  // Compound — collapsed into the same octave for display purposes
  'b9': 1, '9': 2, '#9': 3, '11': 5, '#11': 6, 'b13': 8, '13': 9,
};

/** Resolve an interval label to a pitch class name relative to a root. */
function intervalToPitchClass(root: string, intervalLabel: string): string | null {
  const semitones = INTERVAL_TO_SEMITONES[intervalLabel];
  if (semitones === undefined) return null;
  const rootMidi = Note.midi(root + '4');
  if (rootMidi === null) return null;
  return Note.pitchClass(Note.fromMidi(rootMidi + semitones)) || null;
}

/**
 * Format missing intervals for display.
 * Single missing -> "No 5th · D" (names the specific note to teach the mapping)
 * Multiple missing -> "No 5th, ♭7th" (lists only, to keep the line compact)
 */
function formatMissingIntervals(root: string, missing: string[]): string | null {
  if (!missing || missing.length === 0) return null;
  if (missing.length === 1) {
    const label = formatIntervalLabel(missing[0]);
    const note = intervalToPitchClass(root, missing[0]);
    return note ? `No ${label} \u00B7 ${note}` : `No ${label}`;
  }
  return `No ${missing.map(formatIntervalLabel).join(', ')}`;
}

/**
 * Build the display name for a chord in the header.
 * Mirrors Tonal's symbols but forces an explicit "maj" for plain major,
 * so a two-note root+3rd voicing reads as "Gmaj" instead of the ambiguous "G".
 */
function formatChordDisplayName(root: string, quality: string): string {
  if (quality === 'Major') return `${root}maj`;
  const symbol = QUALITY_TO_SYMBOL[quality];
  if (symbol === undefined || symbol === 'M') return `${root}maj`;
  return `${root}${symbol}`;
}

export function ChordHeader({ intervalEntries }: ChordHeaderProps) {
  const {
    targetRoot,
    targetQuality,
    guitarStringState,
    suggestions,
    availableVoicings,
    currentVoicingIndex,
  } = useMusicStore();

  const { tuning, keyContext, openLibrary, closeLibrary } = useSharedStore();

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
      const baseName = formatChordDisplayName(targetRoot, targetQuality);
      const isInversion = currentVoicing?.isInversion && currentVoicing?.bassNote;
      const chordName = isInversion
        ? `${baseName}/${currentVoicing.bassNote}`
        : baseName;

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
      const chordName = formatChordDisplayName(topSuggestion.root, topSuggestion.quality);
      const missingText = formatMissingIntervals(topSuggestion.root, topSuggestion.missingIntervals);
      const voicingLabel = formatVoicingType(topSuggestion.voicingType);

      // Lead with a description of the voicing (missing note or shape name),
      // then parenthesize the match-count aside so the count reads as supporting info.
      let lead: string | null = null;
      if (missingText) {
        lead = missingText;
      } else if (voicingLabel && voicingLabel !== 'Partial') {
        lead = `${voicingLabel} voicing`;
      }

      const otherCount = suggestions.length - 1;
      const aside = otherCount > 0
        ? `(${otherCount} other ${otherCount === 1 ? 'match' : 'matches'})`
        : null;

      const secondaryText = [lead, aside].filter(Boolean).join(' ') || null;

      return {
        state: 'notes-with-match' as const,
        primaryText: chordName,
        secondaryText,
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
        onClick={() => openLibrary(defaultPickerTab)}
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
        <span className={`${styles.secondaryText} ${
          display.state === 'notes-with-match' ? styles.secondarySuggestion : ''
        } ${!display.secondaryText ? styles.secondaryHidden : ''}`}>
          {display.secondaryText || '\u00A0'}
        </span>
      </button>
    </div>
  );
}
