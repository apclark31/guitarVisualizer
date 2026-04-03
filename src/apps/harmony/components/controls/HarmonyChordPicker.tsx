/**
 * HarmonyChordPicker - Three-column chord picker for inserting custom chords
 *
 * Simplified version of ChordPicker focused on chord insertion into progressions.
 * Root → Family → Type columns, with Preview and Insert actions.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as Tone from 'tone';
import { useSharedStore } from '../../../../shared/store';
import { CHORD_FAMILIES, FAMILY_TO_TYPES } from '../../../chords/config/constants';
import { getVoicingsForChord } from '../../../chords/lib/chord-data';
import { useSamplerEngine } from '../../../../shared/hooks/useSamplerEngine';
import { PLAYBACK_TIMING } from '../../../../shared/config/constants';
import { Note } from '@tonaljs/tonal';
import type { ChordFamily } from '../../../chords/types';
import styles from './HarmonyChordPicker.module.css';

/** Root note options with enharmonic labels */
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

interface HarmonyChordPickerProps {
  onInsert: (root: string, quality: string) => void;
}

export function HarmonyChordPicker({ onInsert }: HarmonyChordPickerProps) {
  const { tuning } = useSharedStore();
  const { samplerRef, isLoaded, startAudio } = useSamplerEngine();

  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedFamily, setSelectedFamily] = useState<ChordFamily>('Major');
  const [selectedType, setSelectedType] = useState('Major');

  const rootColumnRef = useRef<HTMLDivElement>(null);
  const familyColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Available types for selected family
  const availableTypes = useMemo(
    () => FAMILY_TO_TYPES[selectedFamily] ?? [],
    [selectedFamily]
  );

  // When family changes, reset type to first option
  useEffect(() => {
    const types = FAMILY_TO_TYPES[selectedFamily];
    if (types && !types.includes(selectedType)) {
      setSelectedType(types[0]);
    }
  }, [selectedFamily, selectedType]);

  // Scroll active option into view
  useEffect(() => {
    scrollActiveIntoView(rootColumnRef.current, selectedRoot);
  }, [selectedRoot]);

  useEffect(() => {
    scrollActiveIntoView(familyColumnRef.current, selectedFamily);
  }, [selectedFamily]);

  useEffect(() => {
    scrollActiveIntoView(typeColumnRef.current, selectedType);
  }, [selectedType]);

  // Preview: play the selected chord
  const handlePreview = useCallback(async () => {
    await startAudio();
    if (!samplerRef.current || !isLoaded) return;

    const voicings = getVoicingsForChord(selectedRoot, selectedType, 1, 'all', tuning);
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

    if (notes.length === 0) return;

    const now = Tone.now();
    samplerRef.current.releaseAll();
    notes.forEach((note, index) => {
      samplerRef.current?.triggerAttackRelease(
        note,
        PLAYBACK_TIMING.NOTE_DURATION,
        now + index * PLAYBACK_TIMING.STRUM_DELAY
      );
    });
  }, [selectedRoot, selectedType, tuning, isLoaded, startAudio, samplerRef]);

  // Insert: add chord to progression
  const handleInsert = useCallback(() => {
    onInsert(selectedRoot, selectedType);
  }, [selectedRoot, selectedType, onInsert]);

  return (
    <div className={styles.picker}>
      {/* Column headers */}
      <div className={styles.headers}>
        <div className={styles.header}>Root</div>
        <div className={styles.header}>Family</div>
        <div className={styles.header}>Type</div>
      </div>

      {/* Three-column picker */}
      <div className={styles.columns}>
        {/* Root column */}
        <div className={styles.column} ref={rootColumnRef}>
          {ROOT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`${styles.option} ${selectedRoot === opt.value ? styles.active : ''}`}
              onClick={() => setSelectedRoot(opt.value)}
              data-value={opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Family column */}
        <div className={styles.column} ref={familyColumnRef}>
          {CHORD_FAMILIES.map(family => (
            <button
              key={family}
              className={`${styles.option} ${selectedFamily === family ? styles.active : ''}`}
              onClick={() => setSelectedFamily(family)}
              data-value={family}
            >
              {family}
            </button>
          ))}
        </div>

        {/* Type column */}
        <div className={styles.column} ref={typeColumnRef}>
          {availableTypes.map(type => (
            <button
              key={type}
              className={`${styles.option} ${selectedType === type ? styles.active : ''}`}
              onClick={() => setSelectedType(type)}
              data-value={type}
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
        <button className={styles.insertButton} onClick={handleInsert}>
          Add to Progression
        </button>
      </div>
    </div>
  );
}

/** Scroll the active option into view within a column */
function scrollActiveIntoView(container: HTMLElement | null, value: string) {
  if (!container) return;
  const active = container.querySelector(`[data-value="${value}"]`) as HTMLElement;
  if (active) {
    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}
