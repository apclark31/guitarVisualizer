import { useMusicStore } from '../../store/useMusicStore';
import { STANDARD_TUNING } from '../../config/constants';
import { Note } from '@tonaljs/tonal';
import type { StringIndex } from '../../types';
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

export function ChordDisplay() {
  const {
    targetRoot,
    targetQuality,
    detectedChord,
    guitarStringState,
    availableVoicings,
    currentVoicingIndex,
  } = useMusicStore();

  const playedNotes = getPlayedNotesDisplay(guitarStringState);

  // Get current voicing for inversion detection
  const currentVoicing = availableVoicings[currentVoicingIndex];

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
      };
    }

    return {
      main: 'Fretboard Explorer',
      sub: 'Tap frets to build chords',
      notes: null,
    };
  };

  const display = getChordDisplay();

  return (
    <div className={styles.chordDisplay}>
      <span className={styles.chordName}>{display.main}</span>
      {display.sub && <span className={styles.chordSub}>{display.sub}</span>}
      {display.notes && <span className={styles.chordNotes}>{display.notes}</span>}
    </div>
  );
}
