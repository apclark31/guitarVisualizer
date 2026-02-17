/**
 * ChordPicker - Multi-column chord selector modal
 *
 * Three-column picker for Root, Family, and Type selection.
 * Controlled externally via isOpen/onClose props.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../../../shared/store';
import { CHORD_FAMILIES, FAMILY_TO_TYPES, getDiatonicChords } from '../../config/constants';
import { getVoicingsForChord } from '../../lib/chord-data';
import { useTour } from '../../../../shared/tour/TourContext';
import { Note } from '@tonaljs/tonal';
import type { ChordFamily, PlaybackMode } from '../../types';
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
  playNotes: (notes: string[], mode?: PlaybackMode) => Promise<void>;
}

export function ChordPicker({ isOpen, onClose, playNotes }: ChordPickerProps) {
  const { targetRoot, targetFamily, targetQuality, setChord, keyContext } = useMusicStore();
  const { tuning } = useSharedStore();
  const { isActive: isTourActive } = useTour();

  const [pendingRoot, setPendingRoot] = useState(targetRoot || 'A');
  const [pendingFamily, setPendingFamily] = useState<ChordFamily>(targetFamily || 'Major');
  const [pendingType, setPendingType] = useState(targetQuality || 'Major');

  const pickerRef = useRef<HTMLDivElement>(null);
  const rootColumnRef = useRef<HTMLDivElement>(null);
  const familyColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Get diatonic chords when key context is active
  const diatonicChords = useMemo(() => {
    if (!keyContext) return null;
    return getDiatonicChords(keyContext.root, keyContext.type);
  }, [keyContext]);

  // Get root options - filtered to diatonic when key is active
  const rootOptions = useMemo(() => {
    if (!diatonicChords) return ROOT_OPTIONS;

    return diatonicChords.map(chord => ({
      value: chord.root,
      label: `${chord.root} - ${chord.numeral}`,
      family: chord.family,
      hasDominantOption: chord.hasDominantOption,
    }));
  }, [diatonicChords]);

  // Get diatonic info for the currently selected root
  const currentDiatonicInfo = useMemo(() => {
    if (!diatonicChords) return null;
    return diatonicChords.find(c => c.root === pendingRoot) || null;
  }, [diatonicChords, pendingRoot]);

  // Get available families - normally all, but filtered when key is active
  const availableFamilies = useMemo(() => {
    if (!currentDiatonicInfo) return CHORD_FAMILIES;

    // V chord gets both Major and Dominant
    if (currentDiatonicInfo.hasDominantOption) {
      if (currentDiatonicInfo.family === 'Major') {
        return ['Major', 'Dominant'] as const;
      }
      // Minor v chord in minor key can go to Dominant (borrowed)
      if (currentDiatonicInfo.family === 'Minor') {
        return ['Minor', 'Dominant'] as const;
      }
    }

    // Other degrees get just their diatonic family
    return [currentDiatonicInfo.family] as const;
  }, [currentDiatonicInfo]);

  // Sync pending state when store changes
  useEffect(() => {
    if (targetRoot) setPendingRoot(targetRoot);
    if (targetFamily) setPendingFamily(targetFamily);
    if (targetQuality) setPendingType(targetQuality);
  }, [targetRoot, targetFamily, targetQuality]);

  // Get types for selected family
  const typeOptions = FAMILY_TO_TYPES[pendingFamily] || FAMILY_TO_TYPES['Major'];

  // When root changes, auto-select diatonic family if key is active
  const handleRootChange = useCallback((root: string) => {
    setPendingRoot(root);

    // Auto-select diatonic family when key is active
    if (diatonicChords) {
      const diatonicInfo = diatonicChords.find(c => c.root === root);
      if (diatonicInfo) {
        setPendingFamily(diatonicInfo.family);
        const firstType = FAMILY_TO_TYPES[diatonicInfo.family][0];
        setPendingType(firstType);
      }
    }
  }, [diatonicChords]);

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

  // Preview the pending chord selection
  const handlePreview = useCallback(() => {
    // Get the first voicing for the pending chord
    const voicings = getVoicingsForChord(pendingRoot, pendingType, 1, 'all', tuning);
    if (voicings.length === 0) return;

    const voicing = voicings[0];
    const notes: string[] = [];

    // Convert fret positions to note names
    for (let i = 0; i < 6; i++) {
      const fret = voicing.frets[i];
      if (fret !== null) {
        const openMidi = Note.midi(tuning[i]);
        if (openMidi !== null) {
          const note = Note.fromMidi(openMidi + fret);
          notes.push(note);
        }
      }
    }

    if (notes.length > 0) {
      playNotes(notes);
    }
  }, [pendingRoot, pendingType, tuning, playNotes]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Don't close if clicking inside the picker
      if (pickerRef.current && pickerRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking inside any Shepherd tour element
      if (target.closest('.shepherd-element, .shepherd-button, .shepherd-modal-overlay-container')) {
        return;
      }

      onClose();
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
      {/* Hide backdrop during tour to prevent click interference */}
      {!isTourActive && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div ref={pickerRef} className={styles.picker} data-tour="chord-picker">
        {/* Close button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close picker"
          data-tour="picker-close"
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
        <div className={styles.columns} data-tour="picker-columns">
          {/* Root column */}
          <div ref={rootColumnRef} className={styles.column}>
            {rootOptions.map((option) => (
              <button
                key={option.value}
                data-value={option.value}
                className={`${styles.option} ${pendingRoot === option.value ? styles.active : ''}`}
                onClick={() => handleRootChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Family column */}
          <div ref={familyColumnRef} className={styles.column}>
            {availableFamilies.map((family) => (
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

        {/* Action buttons */}
        <div className={styles.actionButtons}>
          <button className={styles.previewButton} onClick={handlePreview}>
            Preview
          </button>
          <button className={styles.applyButton} onClick={handleApply} data-tour="picker-apply">
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
