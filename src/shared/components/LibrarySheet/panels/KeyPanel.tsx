/**
 * KeyPanel - Shared key selector panel for LibrarySheet
 *
 * Two-column picker: Root note + Key type (Major/Minor).
 * Used by all three modes via the unified Library.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSharedStore } from '../../../store';
import type { KeyType } from '../../../types';
import styles from './KeyPanel.module.css';

const ROOT_OPTIONS = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C#/Db' },
  { value: 'D', label: 'D' },
  { value: 'Eb', label: 'D#/Eb' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F#/Gb' },
  { value: 'G', label: 'G' },
  { value: 'Ab', label: 'G#/Ab' },
  { value: 'A', label: 'A' },
  { value: 'Bb', label: 'A#/Bb' },
  { value: 'B', label: 'B' },
] as const;

const TYPE_OPTIONS: { value: KeyType; label: string }[] = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
];

export function KeyPanel() {
  const { keyContext, setKeyContext, closeLibrary } = useSharedStore();

  const [pendingRoot, setPendingRoot] = useState(keyContext?.root || 'C');
  const [pendingType, setPendingType] = useState<KeyType>(keyContext?.type || 'major');

  const rootColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Sync pending state when store changes
  useEffect(() => {
    if (keyContext) {
      setPendingRoot(keyContext.root);
      setPendingType(keyContext.type);
    }
  }, [keyContext]);

  // Scroll active items into view on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollActiveIntoView(rootColumnRef.current, pendingRoot);
      scrollActiveIntoView(typeColumnRef.current, pendingType);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = useCallback(() => {
    setKeyContext({ root: pendingRoot, type: pendingType });
    closeLibrary();
  }, [pendingRoot, pendingType, setKeyContext, closeLibrary]);

  const handleClear = useCallback(() => {
    setKeyContext(null);
    closeLibrary();
  }, [setKeyContext, closeLibrary]);

  return (
    <div className={styles.keyPanel}>
      {/* Column headers */}
      <div className={styles.headers}>
        <div className={styles.header}>Root</div>
        <div className={styles.header}>Type</div>
      </div>

      {/* Columns */}
      <div className={styles.columns}>
        <div className={styles.column} ref={rootColumnRef}>
          {ROOT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              data-value={opt.value}
              className={`${styles.option} ${pendingRoot === opt.value ? styles.active : ''}`}
              onClick={() => setPendingRoot(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={styles.column} ref={typeColumnRef}>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              data-value={opt.value}
              className={`${styles.option} ${pendingType === opt.value ? styles.active : ''}`}
              onClick={() => setPendingType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.clearButton} onClick={handleClear}>
          Clear
        </button>
        <button className={styles.applyButton} onClick={handleApply} data-tour="key-apply">
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
