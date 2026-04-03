/**
 * TempoControl - BPM slider (40-240)
 */

import styles from './TempoControl.module.css';

interface TempoControlProps {
  tempo: number;
  onTempoChange: (bpm: number) => void;
}

export function TempoControl({ tempo, onTempoChange }: TempoControlProps) {
  return (
    <div className={styles.control}>
      <div className={styles.header}>
        <span className={styles.label}>Tempo</span>
        <span className={styles.value}>{tempo} BPM</span>
      </div>
      <input
        type="range"
        min={40}
        max={240}
        step={5}
        value={tempo}
        onChange={(e) => onTempoChange(Number(e.target.value))}
        className={styles.slider}
        aria-label="Tempo in BPM"
      />
    </div>
  );
}
