/**
 * TuningPanel - Tuning selector panel for LibrarySheet
 *
 * Two sub-tabs: Presets (categorized list) and Custom (per-string editor).
 * Extracted from TuningModal. Uses LibraryAudio context for note preview.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSharedStore } from '../../../store';
import { useLibraryAudio } from '../LibrarySheet';
import {
  TUNING_PRESETS,
  TUNING_CATEGORIES,
  getTuningName,
  type TuningCategory,
  type TuningPreset,
} from '../../../config/constants';
import { Note } from '@tonaljs/tonal';
import styles from './TuningPanel.module.css';

/** Get tuning presets grouped by category */
function getPresetsByCategory(): Record<TuningCategory, TuningPreset[]> {
  const grouped: Record<TuningCategory, TuningPreset[]> = {
    Standard: [],
    Drop: [],
    Open: [],
    Modal: [],
    Special: [],
  };
  for (const preset of TUNING_PRESETS) {
    grouped[preset.category].push(preset);
  }
  return grouped;
}

/** Format tuning notes for display */
function formatTuningNotes(notes: readonly string[]): string {
  return notes.map(n => Note.pitchClass(n) || n).join(' ');
}

/** Transpose a note by semitones, keeping within valid range */
function transposeNote(note: string, semitones: number): string {
  const midi = Note.midi(note);
  if (midi === null) return note;
  const newMidi = Math.max(33, Math.min(71, midi + semitones));
  return Note.fromMidi(newMidi);
}

interface TuningPanelProps {
  onSelectTuning: (tuning: string[], name: string) => void;
}

export function TuningPanel({ onSelectTuning }: TuningPanelProps) {
  const { tuning, closeLibrary } = useSharedStore();
  const { playNote, isAudioLoaded } = useLibraryAudio();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customTuning, setCustomTuning] = useState<string[]>([...tuning]);

  const presetsByCategory = getPresetsByCategory();

  // Sync custom tuning when tuning changes
  useEffect(() => {
    setCustomTuning([...tuning]);
  }, [tuning]);

  const handlePresetSelect = useCallback((preset: TuningPreset) => {
    onSelectTuning([...preset.notes], preset.name);
    closeLibrary();
  }, [onSelectTuning, closeLibrary]);

  const handleNoteChange = useCallback((stringIndex: number, direction: 1 | -1) => {
    const newTuning = [...customTuning];
    const newNote = transposeNote(newTuning[stringIndex], direction);
    newTuning[stringIndex] = newNote;
    setCustomTuning(newTuning);
    if (isAudioLoaded) {
      playNote(newNote);
    }
  }, [customTuning, isAudioLoaded, playNote]);

  const handleApplyCustom = useCallback(() => {
    const name = getTuningName(customTuning);
    onSelectTuning(customTuning, name);
    closeLibrary();
  }, [customTuning, onSelectTuning, closeLibrary]);

  return (
    <div className={styles.tuningPanel}>
      {/* Sub-tabs */}
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${activeTab === 'presets' ? styles.subTabActive : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          Presets
        </button>
        <button
          className={`${styles.subTab} ${activeTab === 'custom' ? styles.subTabActive : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Custom
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'presets' ? (
          <div className={styles.presetList}>
            {TUNING_CATEGORIES.map(category => (
              <div key={category} className={styles.category}>
                <h3 className={styles.categoryTitle}>{category}</h3>
                <div className={styles.categoryPresets}>
                  {presetsByCategory[category].map(preset => {
                    const isActive = getTuningName(tuning) === preset.name;
                    return (
                      <button
                        key={preset.name}
                        className={`${styles.presetButton} ${isActive ? styles.presetActive : ''}`}
                        onClick={() => handlePresetSelect(preset)}
                      >
                        <span className={styles.presetName}>{preset.name}</span>
                        <span className={styles.presetNotes}>{formatTuningNotes(preset.notes)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.customEditor}>
            <p className={styles.customHint}>
              Adjust each string using the arrows. Tap a note to hear it.
            </p>
            <div className={styles.stringGrid}>
              {customTuning.map((note, i) => {
                const pitchClass = Note.pitchClass(note) || note;
                const octave = note.replace(/[A-G]#?b?/, '');
                return (
                  <div key={i} className={styles.stringColumn}>
                    <button
                      className={styles.arrowButton}
                      onClick={() => handleNoteChange(i, 1)}
                      aria-label={`Raise string ${6 - i}`}
                    >
                      ▲
                    </button>
                    <button
                      className={styles.noteDisplay}
                      onClick={() => isAudioLoaded && playNote(note)}
                      aria-label={`Play ${note}`}
                    >
                      <span className={styles.notePitch}>{pitchClass}</span>
                      <span className={styles.noteOctave}>{octave}</span>
                    </button>
                    <button
                      className={styles.arrowButton}
                      onClick={() => handleNoteChange(i, -1)}
                      aria-label={`Lower string ${6 - i}`}
                    >
                      ▼
                    </button>
                    <span className={styles.stringLabel}>{6 - i}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.customPreview}>
              <span className={styles.previewLabel}>
                {getTuningName(customTuning)}
              </span>
              <span className={styles.previewNotes}>
                {formatTuningNotes(customTuning)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Apply button for custom tab */}
      {activeTab === 'custom' && (
        <div className={styles.footer}>
          <button className={styles.applyButton} onClick={handleApplyCustom}>
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
