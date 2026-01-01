/**
 * KeyPicker - Two-column key selector modal
 *
 * Two-column picker for Root and Type (Major/Minor) selection.
 * Controlled externally via isOpen/onClose props.
 * Extensible for future modes (Dorian, Mixolydian, etc.)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import type { KeyType } from '../../config/constants';
import styles from './KeyPicker.module.css';

/** Root notes with combined enharmonic labels */
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

/** Key type options - extensible for future modes */
const TYPE_OPTIONS: { value: KeyType; label: string }[] = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  // Future: { value: 'dorian', label: 'Dorian' },
  // Future: { value: 'mixolydian', label: 'Mixolydian' },
];

interface KeyPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyPicker({ isOpen, onClose }: KeyPickerProps) {
  const { keyContext, setKeyContext } = useMusicStore();

  const [pendingRoot, setPendingRoot] = useState(keyContext?.root || 'C');
  const [pendingType, setPendingType] = useState<KeyType>(keyContext?.type || 'major');

  const pickerRef = useRef<HTMLDivElement>(null);
  const rootColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Sync pending state when store changes
  useEffect(() => {
    if (keyContext) {
      setPendingRoot(keyContext.root);
      setPendingType(keyContext.type);
    }
  }, [keyContext]);

  // Apply selection and close picker
  const handleApply = useCallback(() => {
    setKeyContext({ root: pendingRoot, type: pendingType });
    onClose();
  }, [pendingRoot, pendingType, setKeyContext, onClose]);

  // Clear key context
  const handleClear = useCallback(() => {
    setKeyContext(null);
    onClose();
  }, [setKeyContext, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Scroll active items into view when picker opens
  useEffect(() => {
    if (!isOpen) return;

    const scrollToActive = (column: HTMLDivElement | null, value: string) => {
      if (!column) return;
      const activeItem = column.querySelector(`[data-value="${value}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    };

    // Small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      scrollToActive(rootColumnRef.current, pendingRoot);
      scrollToActive(typeColumnRef.current, pendingType);
    });
  }, [isOpen, pendingRoot, pendingType]);

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />
      <div ref={pickerRef} className={styles.picker}>
        {/* Close button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close picker"
        >
          ✕
        </button>

        {/* Column headers */}
        <div className={styles.headers}>
          <div className={styles.header}>Root</div>
          <div className={styles.header}>Type</div>
        </div>

        {/* Columns container */}
        <div className={styles.columns}>
          {/* Root column */}
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

          {/* Type column */}
          <div ref={typeColumnRef} className={styles.column}>
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                data-value={option.value}
                className={`${styles.option} ${pendingType === option.value ? styles.active : ''}`}
                onClick={() => setPendingType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button className={styles.clearButton} onClick={handleClear}>
            Clear
          </button>
          <button className={styles.applyButton} onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
