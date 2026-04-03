/**
 * ProgressionTimeline - Horizontal scrollable row of ChordCards
 */

import type { ReactNode } from 'react';
import styles from './ProgressionTimeline.module.css';

interface ProgressionTimelineProps {
  children: ReactNode;
}

export function ProgressionTimeline({ children }: ProgressionTimelineProps) {
  return (
    <div className={styles.timeline}>
      <div className={styles.track}>
        {children}
      </div>
    </div>
  );
}
