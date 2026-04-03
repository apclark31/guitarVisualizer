/**
 * IntervalMap — Color-coded interval legend for active notes
 *
 * Shows each unique interval present on the fretboard as a colored card
 * with interval label and note name. 3-column grid layout.
 * Used by both Chord Compass and Scale Sage below the fretboard.
 */

import { getIntervalColor } from '../../config/theme';
import styles from './IntervalMap.module.css';

export interface IntervalEntry {
  /** Display label (e.g., "ROOT", "3RD", "5TH", "b7") */
  label: string;
  /** Note name (e.g., "C", "Eb", "G") */
  note: string;
  /** Semitones from root (0-11) — determines color */
  semitones: number;
}

interface IntervalMapProps {
  intervals: IntervalEntry[];
  /** 'grid' = 3-col card layout (default), 'inline' = horizontal chip row */
  variant?: 'grid' | 'inline';
}

export function IntervalMap({ intervals, variant = 'grid' }: IntervalMapProps) {
  if (intervals.length === 0) return null;

  if (variant === 'inline') {
    return (
      <div className={styles.inlineMap}>
        {intervals.map((entry) => (
          <div key={`${entry.semitones}-${entry.note}`} className={`${styles.chip} ${!entry.label ? styles.chipNoteOnly : ''}`}>
            {entry.label && (
              <span
                className={styles.chipLabel}
                style={{ color: getIntervalColor(entry.semitones) }}
              >
                {entry.label}
              </span>
            )}
            <span className={styles.chipNote}>{entry.note}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.map}>
      {intervals.map((entry) => (
        <div key={`${entry.semitones}-${entry.note}`} className={styles.entry}>
          <span
            className={styles.label}
            style={{ color: getIntervalColor(entry.semitones) }}
          >
            {entry.label}
          </span>
          <span className={styles.note}>{entry.note}</span>
        </div>
      ))}
    </div>
  );
}
