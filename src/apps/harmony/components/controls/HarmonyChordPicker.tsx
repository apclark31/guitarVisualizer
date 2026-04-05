/**
 * HarmonyChordPicker - Three-column chord picker for inserting custom chords
 *
 * Two-tier library: "In Key" shows diatonic chords filtered by key context,
 * "All Chords" shows full chromatic picker for substitutions and borrowed chords.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as Tone from 'tone';
import { useSharedStore } from '../../../../shared/store';
import { CHORD_FAMILIES, FAMILY_TO_TYPES, getDiatonicChords } from '../../../chords/config/constants';
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

type PickerScope = 'inKey' | 'all';

interface HarmonyChordPickerProps {
  onInsert: (root: string, quality: string) => void;
}

export function HarmonyChordPicker({ onInsert }: HarmonyChordPickerProps) {
  const { tuning, keyContext } = useSharedStore();
  const { samplerRef, isLoaded, startAudio } = useSamplerEngine();

  const [scope, setScope] = useState<PickerScope>(keyContext ? 'inKey' : 'all');
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedFamily, setSelectedFamily] = useState<ChordFamily>('Major');
  const [selectedType, setSelectedType] = useState('Major');

  const rootColumnRef = useRef<HTMLDivElement>(null);
  const familyColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Diatonic chords for key filtering
  const diatonicChords = useMemo(() => {
    if (!keyContext) return null;
    return getDiatonicChords(keyContext.root, keyContext.type);
  }, [keyContext]);

  // Filtered root options based on scope
  const rootOptions = useMemo(() => {
    if (scope === 'all' || !diatonicChords) return ROOT_OPTIONS.map(o => ({ ...o }));

    return diatonicChords.map(chord => ({
      value: chord.root,
      label: `${chord.root} - ${chord.numeral}`,
      family: chord.family,
      hasDominantOption: chord.hasDominantOption,
    }));
  }, [scope, diatonicChords]);

  // Get diatonic info for selected root (when in-key)
  const currentDiatonicInfo = useMemo(() => {
    if (scope === 'all' || !diatonicChords) return null;
    return diatonicChords.find(c => c.root === selectedRoot) || null;
  }, [scope, diatonicChords, selectedRoot]);

  // Filtered families based on scope + selected root
  const availableFamilies = useMemo(() => {
    if (!currentDiatonicInfo) return CHORD_FAMILIES;

    // V chord gets both Major and Dominant
    if (currentDiatonicInfo.hasDominantOption) {
      if (currentDiatonicInfo.family === 'Major') {
        return ['Major', 'Dominant'] as ChordFamily[];
      }
      if (currentDiatonicInfo.family === 'Minor') {
        return ['Minor', 'Dominant'] as ChordFamily[];
      }
    }

    return [currentDiatonicInfo.family] as ChordFamily[];
  }, [currentDiatonicInfo]);

  // Available types for selected family
  const availableTypes = useMemo(
    () => FAMILY_TO_TYPES[selectedFamily] ?? [],
    [selectedFamily]
  );

  // When scope changes, reset selection to first available option
  useEffect(() => {
    if (rootOptions.length > 0) {
      const firstRoot = rootOptions[0].value;
      setSelectedRoot(firstRoot);

      // If in-key, auto-set family to diatonic family
      if (scope === 'inKey' && diatonicChords) {
        const info = diatonicChords.find(c => c.root === firstRoot);
        if (info) {
          setSelectedFamily(info.family);
          const types = FAMILY_TO_TYPES[info.family];
          if (types) setSelectedType(types[0]);
        }
      }
    }
  }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  // When root changes in-key mode, auto-select diatonic family
  useEffect(() => {
    if (currentDiatonicInfo) {
      setSelectedFamily(currentDiatonicInfo.family);
      const types = FAMILY_TO_TYPES[currentDiatonicInfo.family];
      if (types) setSelectedType(types[0]);
    }
  }, [currentDiatonicInfo]);

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

  const hasKeyContext = !!keyContext;

  return (
    <div className={styles.picker}>
      {/* Scope toggle — only show when key context is set */}
      {hasKeyContext && (
        <div className={styles.scopeToggle}>
          <button
            className={`${styles.scopeBtn} ${scope === 'inKey' ? styles.scopeBtnActive : ''}`}
            onClick={() => setScope('inKey')}
          >
            In Key
          </button>
          <button
            className={`${styles.scopeBtn} ${scope === 'all' ? styles.scopeBtnActive : ''}`}
            onClick={() => setScope('all')}
          >
            All Chords
          </button>
        </div>
      )}

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
          {rootOptions.map(opt => (
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
          {availableFamilies.map(family => (
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
