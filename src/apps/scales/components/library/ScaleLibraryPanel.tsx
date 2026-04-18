/**
 * ScaleLibraryPanel - Two-column scale picker (Root/Scale Type)
 *
 * Extracted from ScalePicker Library tab. Handles pending state,
 * scroll-to-active, categorized scale types, apply and clear.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useScaleStore, type ScaleType } from '../../store/useScaleStore';
import { useSharedStore } from '../../../../shared/store';
import { ROOT_OPTIONS, SCALE_TYPE_DISPLAY, SCALE_CATEGORIES } from '../../lib/scale-data';
import styles from './ScaleLibraryPanel.module.css';

export function ScaleLibraryPanel() {
  const { scaleRoot, scaleType, setScaleRoot, setScaleType, setPosition } = useScaleStore();
  const { closeLibrary } = useSharedStore();

  const [pendingRoot, setPendingRoot] = useState(scaleRoot || 'C');
  const [pendingType, setPendingType] = useState<ScaleType>(scaleType || 'major');

  const rootColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Sync pending state when store changes
  useEffect(() => {
    if (scaleRoot) setPendingRoot(scaleRoot);
    if (scaleType) setPendingType(scaleType);
  }, [scaleRoot, scaleType]);

  // Scroll active items into view on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollActiveIntoView(rootColumnRef.current, pendingRoot);
      scrollActiveIntoView(typeColumnRef.current, pendingType);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = useCallback(() => {
    setScaleRoot(pendingRoot);
    setScaleType(pendingType);
    setPosition(1);
    closeLibrary();
  }, [pendingRoot, pendingType, setScaleRoot, setScaleType, setPosition, closeLibrary]);

  const handleClear = useCallback(() => {
    setScaleRoot(null);
    setScaleType(null);
    setPosition(1);
    closeLibrary();
  }, [setScaleRoot, setScaleType, setPosition, closeLibrary]);

  return (
    <div className={styles.libraryContent}>
      <div className={styles.headers}>
        <div className={styles.header}>Root</div>
        <div className={styles.header}>Scale Type</div>
      </div>

      <div className={styles.columns}>
        <div ref={rootColumnRef} className={styles.column}>
          {ROOT_OPTIONS.map((option) => (
            <button
              key={option.value}
              data-value={option.value}
              className={`${styles.option} ${pendingRoot === option.value ? styles.active : ''}`}
              onClick={() => setPendingRoot(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div ref={typeColumnRef} className={styles.column}>
          <div className={styles.categoryHeader}>Diatonic</div>
          {SCALE_CATEGORIES.diatonic.map((type) => (
            <button
              key={type}
              data-value={type}
              className={`${styles.option} ${pendingType === type ? styles.active : ''}`}
              onClick={() => setPendingType(type)}
            >
              {SCALE_TYPE_DISPLAY[type]}
            </button>
          ))}

          <div className={styles.categoryHeader}>Modes</div>
          {SCALE_CATEGORIES.modes.map((type) => (
            <button
              key={type}
              data-value={type}
              className={`${styles.option} ${pendingType === type ? styles.active : ''}`}
              onClick={() => setPendingType(type)}
            >
              {SCALE_TYPE_DISPLAY[type]}
            </button>
          ))}

          <div className={styles.categoryHeader}>Pentatonic</div>
          {SCALE_CATEGORIES.pentatonic.map((type) => (
            <button
              key={type}
              data-value={type}
              className={`${styles.option} ${pendingType === type ? styles.active : ''}`}
              onClick={() => setPendingType(type)}
            >
              {SCALE_TYPE_DISPLAY[type]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button className={styles.clearButton} onClick={handleClear}>
          Clear
        </button>
        <button className={styles.applyButton} onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}

function scrollActiveIntoView(container: HTMLElement | null, value: string) {
  if (!container) return;
  const active = container.querySelector(`[data-value="${value}"]`) as HTMLElement;
  if (active) {
    active.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}
