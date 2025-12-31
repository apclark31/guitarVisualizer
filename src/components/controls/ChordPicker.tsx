/**
 * ChordPicker - Multi-column chord selector modal
 *
 * Three-column picker for Root, Family, and Type selection.
 * Controlled externally via isOpen/onClose props.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { CHORD_FAMILIES, FAMILY_TO_TYPES } from '../../config/constants';
import type { ChordFamily } from '../../types';
import styles from './ChordPicker.module.css';

/** Root notes with combined enharmonic labels */
const ROOT_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A♯/B♭' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C♯/D♭' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D♯/E♭' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F♯/G♭' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G♯/A♭' },
] as const;

interface ChordPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChordPicker({ isOpen, onClose }: ChordPickerProps) {
  const { targetRoot, targetFamily, targetQuality, setChord } = useMusicStore();

  const [pendingRoot, setPendingRoot] = useState(targetRoot || 'A');
  const [pendingFamily, setPendingFamily] = useState<ChordFamily>(targetFamily || 'Major');
  const [pendingType, setPendingType] = useState(targetQuality || 'Major');

  const pickerRef = useRef<HTMLDivElement>(null);
  const rootColumnRef = useRef<HTMLDivElement>(null);
  const familyColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Sync pending state when store changes
  useEffect(() => {
    if (targetRoot) setPendingRoot(targetRoot);
    if (targetFamily) setPendingFamily(targetFamily);
    if (targetQuality) setPendingType(targetQuality);
  }, [targetRoot, targetFamily, targetQuality]);

  // Get types for selected family
  const typeOptions = FAMILY_TO_TYPES[pendingFamily] || FAMILY_TO_TYPES['Major'];

  // When family changes, reset type to first in new family
  const handleFamilyChange = useCallback((family: ChordFamily) => {
    setPendingFamily(family);
    const firstType = FAMILY_TO_TYPES[family][0];
    setPendingType(firstType);
  }, []);

  // Apply selection and close picker
  const handleApply = useCallback(() => {
    setChord(pendingRoot, pendingFamily, pendingType);
    onClose();
  }, [pendingRoot, pendingFamily, pendingType, setChord, onClose]);

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
      scrollToActive(familyColumnRef.current, pendingFamily);
      scrollToActive(typeColumnRef.current, pendingType);
    });
  }, [isOpen, pendingRoot, pendingFamily, pendingType]);

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
          <div className={styles.header}>Family</div>
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

          {/* Family column */}
          <div ref={familyColumnRef} className={styles.column}>
            {CHORD_FAMILIES.map((family) => (
              <button
                key={family}
                data-value={family}
                className={`${styles.option} ${pendingFamily === family ? styles.active : ''}`}
                onClick={() => handleFamilyChange(family)}
              >
                {family}
              </button>
            ))}
          </div>

          {/* Type column */}
          <div ref={typeColumnRef} className={styles.column}>
            {typeOptions.map((type) => (
              <button
                key={type}
                data-value={type}
                className={`${styles.option} ${pendingType === type ? styles.active : ''}`}
                onClick={() => setPendingType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Apply button */}
        <button className={styles.applyButton} onClick={handleApply}>
          Apply
        </button>
      </div>
    </>
  );
}
