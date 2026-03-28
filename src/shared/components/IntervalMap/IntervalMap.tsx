/**
 * IntervalMap — Color-coded interval legend for active notes
 *
 * Shows each unique interval present on the fretboard as a colored dot
 * with interval label and note name. Updates reactively as state changes.
 * Used by both Chord Compass and Scale Sage below the fretboard.
 */

import { getIntervalColor } from '../../config/theme';
import styles from './IntervalMap.module.css';

export interface IntervalEntry {
  /** Display label (e.g., "R", "b3", "5", "b7") */
  label: string;
  /** Note name (e.g., "C", "Eb", "G") */
  note: string;
  /** Semitones from root (0-11) — determines dot color */
  semitones: number;
}

interface IntervalMapProps {
  intervals: IntervalEntry[];
}

export function IntervalMap({ intervals }: IntervalMapProps) {
  if (intervals.length === 0) return null;

  return (
    <div className={styles.map}>
      {intervals.map((entry) => (
        <div key={`${entry.semitones}-${entry.note}`} className={styles.entry}>
          <span
            className={styles.dot}
            style={{ backgroundColor: getIntervalColor(entry.semitones) }}
          />
          <span className={styles.label}>{entry.label}</span>
          <span className={styles.note}>{entry.note}</span>
        </div>
      ))}
    </div>
  );
}
