/**
 * ScalePicker - Two-column scale selector modal
 *
 * Two-column picker for Root and Scale Type selection.
 * Controlled externally via isOpen/onClose props.
 * Mirrors ChordPicker pattern from Chord Compass.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useScaleStore, type ScaleType } from '../../store/useScaleStore';
import { ROOT_OPTIONS, SCALE_TYPE_DISPLAY, SCALE_CATEGORIES } from '../../lib/scale-data';
import styles from './ScalePicker.module.css';

interface ScalePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScalePicker({ isOpen, onClose }: ScalePickerProps) {
  const { scaleRoot, scaleType, setScaleRoot, setScaleType, setPosition } = useScaleStore();

  const [pendingRoot, setPendingRoot] = useState(scaleRoot || 'C');
  const [pendingType, setPendingType] = useState<ScaleType>(scaleType || 'major');

  const pickerRef = useRef<HTMLDivElement>(null);
  const rootColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Sync pending state when store changes
  useEffect(() => {
    if (scaleRoot) setPendingRoot(scaleRoot);
    if (scaleType) setPendingType(scaleType);
  }, [scaleRoot, scaleType]);

  // Apply selection and close picker
  const handleApply = useCallback(() => {
    setScaleRoot(pendingRoot);
    setScaleType(pendingType);
    // Reset to position 1 when scale changes
    setPosition(1);
    onClose();
  }, [pendingRoot, pendingType, setScaleRoot, setScaleType, setPosition, onClose]);

  // Clear scale selection
  const handleClear = useCallback(() => {
    setScaleRoot(null);
    setScaleType(null);
    setPosition(1);
    onClose();
  }, [setScaleRoot, setScaleType, setPosition, onClose]);

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
          <div className={styles.header}>Scale Type</div>
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

          {/* Scale Type column with category headers */}
          <div ref={typeColumnRef} className={styles.column}>
            {/* Diatonic category */}
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

            {/* Pentatonic category */}
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

        {/* Action buttons */}
        <div className={styles.actionButtons}>
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
