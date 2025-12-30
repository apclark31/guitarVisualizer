/**
 * TuningModal - Tuning selector modal
 *
 * Shows tuning presets grouped by category with a custom tuning editor.
 * Plays notes when adjusting custom tuning.
 */

import { useState, useEffect, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import {
  TUNING_PRESETS,
  TUNING_CATEGORIES,
  getTuningName,
  type TuningCategory,
  type TuningPreset,
} from '../../config/constants';
import { Note } from '@tonaljs/tonal';
import styles from './TuningModal.module.css';

interface TuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTuning: (tuning: string[], name: string) => void;
  playNote: (note: string) => Promise<void>;
  isAudioLoaded: boolean;
}

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

/** Format tuning notes for display (e.g., "D A D G B E") */
function formatTuningNotes(notes: readonly string[]): string {
  return notes.map(n => Note.pitchClass(n) || n).join(' ');
}

/** Transpose a note by semitones, keeping within valid range */
function transposeNote(note: string, semitones: number): string {
  const midi = Note.midi(note);
  if (midi === null) return note;

  // Clamp to reasonable range (A1 to B4)
  const newMidi = Math.max(33, Math.min(71, midi + semitones)); // A1=33, B4=71
  return Note.fromMidi(newMidi);
}

export function TuningModal({ isOpen, onClose, onSelectTuning, playNote, isAudioLoaded }: TuningModalProps) {
  const { tuning } = useMusicStore();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customTuning, setCustomTuning] = useState<string[]>([...tuning]);

  const presetsByCategory = getPresetsByCategory();

  // Sync custom tuning when modal opens or tuning changes
  useEffect(() => {
    if (isOpen) {
      setCustomTuning([...tuning]);
    }
  }, [isOpen, tuning]);

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

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: TuningPreset) => {
    onSelectTuning([...preset.notes], preset.name);
    onClose();
  }, [onSelectTuning, onClose]);

  // Handle custom note adjustment
  const handleNoteChange = useCallback((stringIndex: number, direction: 1 | -1) => {
    const newTuning = [...customTuning];
    const newNote = transposeNote(newTuning[stringIndex], direction);
    newTuning[stringIndex] = newNote;
    setCustomTuning(newTuning);

    // Play the new note
    if (isAudioLoaded) {
      playNote(newNote);
    }
  }, [customTuning, isAudioLoaded, playNote]);

  // Apply custom tuning
  const handleApplyCustom = useCallback(() => {
    const name = getTuningName(customTuning);
    onSelectTuning(customTuning, name);
    onClose();
  }, [customTuning, onSelectTuning, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Select tuning">
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Select Tuning</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'presets' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Presets
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'custom' ? styles.tabActive : ''}`}
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

        {/* Footer - only show Apply for custom tab */}
        {activeTab === 'custom' && (
          <div className={styles.footer}>
            <button className={styles.applyButton} onClick={handleApplyCustom}>
              Apply
            </button>
          </div>
        )}
      </div>
    </>
  );
}
