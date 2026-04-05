/**
 * ProgressionBuilder - Roman numeral chord buttons
 *
 * Shows 7 buttons for each diatonic chord in the current key.
 * Tapping a button appends that chord to the progression.
 */

import { useSharedStore } from '../../../../shared/store';
import { getDiatonicChords } from '../../../chords/config/constants';
import styles from './ProgressionBuilder.module.css';

interface ProgressionBuilderProps {
  onAddChord: (degree: number) => void;
  onCustomChord?: () => void;
}

export function ProgressionBuilder({ onAddChord, onCustomChord }: ProgressionBuilderProps) {
  const { keyContext } = useSharedStore();

  const diatonicChords = keyContext
    ? getDiatonicChords(keyContext.root, keyContext.type)
    : [];

  return (
    <div className={styles.builder}>
      <div className={styles.label}>Add Chord</div>
      <div className={styles.buttons}>
        {diatonicChords.map((chord) => (
          <button
            key={chord.degree}
            className={styles.chordBtn}
            onClick={() => onAddChord(chord.degree)}
            title={`${chord.root} ${chord.family}`}
          >
            <span className={styles.numeral}>{chord.numeral}</span>
            <span className={styles.root}>{chord.root}</span>
          </button>
        ))}
        {onCustomChord && (
          <button
            className={`${styles.chordBtn} ${styles.customBtn}`}
            onClick={onCustomChord}
            title="Add custom chord"
          >
            <span className={styles.numeral}>+</span>
            <span className={styles.root}>Custom</span>
          </button>
        )}
      </div>
    </div>
  );
}
