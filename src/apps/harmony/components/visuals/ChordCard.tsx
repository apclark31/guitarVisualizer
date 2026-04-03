/**
 * ChordCard - Single chord in the progression timeline
 *
 * Shows numeral + root, tap to select, glow when playing, X to remove.
 */

import type { ProgressionChord } from '../../types';
import styles from './ChordCard.module.css';

interface ChordCardProps {
  chord: ProgressionChord;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function ChordCard({ chord, isSelected, isPlaying, onSelect, onRemove }: ChordCardProps) {
  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${isPlaying ? styles.playing : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    >
      <button
        className={styles.removeBtn}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label={`Remove ${chord.root} ${chord.quality}`}
      >
        &times;
      </button>
      <div className={styles.numeral}>{chord.numeral}</div>
      <div className={styles.root}>{chord.root}</div>
      <div className={styles.quality}>{chord.quality}</div>
    </div>
  );
}
