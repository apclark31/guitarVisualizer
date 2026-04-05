/**
 * ChordLibraryPanel - Three-column chord picker (Root/Family/Type)
 *
 * Extracted from ChordPicker Library tab. Handles pending state,
 * diatonic key filtering, scroll-to-active, preview, and apply.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../../../shared/store';
import { CHORD_FAMILIES, FAMILY_TO_TYPES, getDiatonicChords } from '../../config/constants';
import { getVoicingsForChord } from '../../lib/chord-data';
import { Note } from '@tonaljs/tonal';
import type { ChordFamily } from '../../types';
import styles from './ChordLibraryPanel.module.css';

const ROOT_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A\u266F/B\u266D' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C\u266F/D\u266D' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D\u266F/E\u266D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F\u266F/G\u266D' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G\u266F/A\u266D' },
] as const;

interface ChordLibraryPanelProps {
  playNotes: (notes: string[]) => Promise<void>;
}

export function ChordLibraryPanel({ playNotes }: ChordLibraryPanelProps) {
  const {
    targetRoot, targetFamily, targetQuality, setChord,
  } = useMusicStore();
  const { tuning, keyContext, closeLibrary } = useSharedStore();

  const [pendingRoot, setPendingRoot] = useState(targetRoot || 'A');
  const [pendingFamily, setPendingFamily] = useState<ChordFamily>(targetFamily || 'Major');
  const [pendingType, setPendingType] = useState(targetQuality || 'Major');

  const rootColumnRef = useRef<HTMLDivElement>(null);
  const familyColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Diatonic filtering
  const diatonicChords = useMemo(() => {
    if (!keyContext) return null;
    return getDiatonicChords(keyContext.root, keyContext.type);
  }, [keyContext]);

  const rootOptions = useMemo(() => {
    if (!diatonicChords) return ROOT_OPTIONS;
    return diatonicChords.map(chord => ({
      value: chord.root,
      label: `${chord.root} - ${chord.numeral}`,
      family: chord.family,
      hasDominantOption: chord.hasDominantOption,
    }));
  }, [diatonicChords]);

  const currentDiatonicInfo = useMemo(() => {
    if (!diatonicChords) return null;
    return diatonicChords.find(c => c.root === pendingRoot) || null;
  }, [diatonicChords, pendingRoot]);

  const availableFamilies = useMemo(() => {
    if (!currentDiatonicInfo) return CHORD_FAMILIES;
    if (currentDiatonicInfo.hasDominantOption) {
      if (currentDiatonicInfo.family === 'Major') {
        return ['Major', 'Dominant'] as const;
      }
      if (currentDiatonicInfo.family === 'Minor') {
        return ['Minor', 'Dominant'] as const;
      }
    }
    return [currentDiatonicInfo.family] as const;
  }, [currentDiatonicInfo]);

  const typeOptions = FAMILY_TO_TYPES[pendingFamily] || FAMILY_TO_TYPES['Major'];

  // Sync pending state when store changes
  useEffect(() => {
    if (targetRoot) setPendingRoot(targetRoot);
    if (targetFamily) setPendingFamily(targetFamily);
    if (targetQuality) setPendingType(targetQuality);
  }, [targetRoot, targetFamily, targetQuality]);

  // Scroll active items into view on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollActiveIntoView(rootColumnRef.current, pendingRoot);
      scrollActiveIntoView(familyColumnRef.current, pendingFamily);
      scrollActiveIntoView(typeColumnRef.current, pendingType);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRootChange = useCallback((root: string) => {
    setPendingRoot(root);
    if (diatonicChords) {
      const diatonicInfo = diatonicChords.find(c => c.root === root);
      if (diatonicInfo) {
        setPendingFamily(diatonicInfo.family);
        const firstType = FAMILY_TO_TYPES[diatonicInfo.family][0];
        setPendingType(firstType);
      }
    }
  }, [diatonicChords]);

  const handleFamilyChange = useCallback((family: ChordFamily) => {
    setPendingFamily(family);
    const firstType = FAMILY_TO_TYPES[family][0];
    setPendingType(firstType);
  }, []);

  const handleApply = useCallback(() => {
    setChord(pendingRoot, pendingFamily, pendingType);
    closeLibrary();
  }, [pendingRoot, pendingFamily, pendingType, setChord, closeLibrary]);

  const handlePreview = useCallback(() => {
    const voicings = getVoicingsForChord(pendingRoot, pendingType, 1, 'all', tuning);
    if (voicings.length === 0) return;
    const voicing = voicings[0];
    const notes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const fret = voicing.frets[i];
      if (fret !== null) {
        const openMidi = Note.midi(tuning[i]);
        if (openMidi !== null) {
          notes.push(Note.fromMidi(openMidi + fret));
        }
      }
    }
    if (notes.length > 0) {
      playNotes(notes);
    }
  }, [pendingRoot, pendingType, tuning, playNotes]);

  return (
    <div className={styles.libraryContent}>
      <div className={styles.headers}>
        <div className={styles.header}>Root</div>
        <div className={styles.header}>Family</div>
        <div className={styles.header}>Type</div>
      </div>

      <div className={styles.columns} data-tour="picker-columns">
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

      <div className={styles.actionButtons}>
        <button className={styles.previewButton} onClick={handlePreview}>
          Preview
        </button>
        <button className={styles.applyButton} onClick={handleApply} data-tour="picker-apply">
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
