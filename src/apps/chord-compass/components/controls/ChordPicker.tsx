/**
 * ChordPicker - Harmonic panel with Library and Matches tabs
 *
 * Two-tab panel:
 * - Library: Three-column picker for Root, Family, and Type selection
 * - Matches: Chord/key detection results with segmented control
 *
 * Controlled externally via isOpen/onClose props.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../../../shared/store';
import { CHORD_FAMILIES, FAMILY_TO_TYPES, getDiatonicChords } from '../../config/constants';
import { getVoicingsForChord } from '../../lib/chord-data';
import { useTour } from '../../../../shared/tour/TourContext';
import { Note } from '@tonaljs/tonal';
import type { ChordFamily, PlaybackMode, ChordSuggestion, KeySuggestion, VoicingType, VoicingFilterType, StringIndex } from '../../types';
import styles from './ChordPicker.module.css';

/** Root notes with combined enharmonic labels */
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

type PanelTab = 'library' | 'matches';
type MatchesSubTab = 'chords' | 'keys';

// ---- Utility functions (moved from SuggestionModal) ----

/** Format voicing type for display in header */
function formatVoicingType(type: VoicingType): string {
  const labels: Record<VoicingType, string> = {
    'shell-major': 'Major Shell',
    'shell-minor': 'Minor Shell',
    'shell-dominant': 'Dom7 Shell',
    'triad': 'Triad',
    'partial': 'Partial',
    'full': 'Full Voicing',
    'unknown': 'Unknown',
  };
  return labels[type] || type;
}

/** Get short tag label for suggestion list */
function getTypeTag(type: VoicingType): string {
  const tags: Record<VoicingType, string> = {
    'shell-major': 'shell',
    'shell-minor': 'shell',
    'shell-dominant': 'shell',
    'triad': 'triad',
    'partial': 'partial',
    'full': 'full',
    'unknown': '',
  };
  return tags[type] || '';
}

/** Map VoicingType to VoicingFilterType for the dropdown */
function getFilterForVoicingType(type: VoicingType): VoicingFilterType {
  if (type === 'triad') return 'triads';
  if (type.startsWith('shell-')) return 'shells';
  if (type === 'full') return 'full';
  return 'all';
}

/** Check if voicing type is a shell */
function isShellVoicing(type: VoicingType | null): boolean {
  return type === 'shell-major' || type === 'shell-minor' || type === 'shell-dominant';
}

/** Get friendly name for chord quality */
function getQualityDisplayName(quality: string): string {
  const map: Record<string, string> = {
    'Major 7': 'Major 7',
    'Minor 7': 'Minor 7',
    'Dominant 7': 'Dominant 7',
  };
  return map[quality] || quality;
}

/** Get played notes as a formatted string */
function getPlayedNotesDisplay(
  guitarState: Record<StringIndex, number | null>,
  tuning: readonly string[]
): string {
  const notes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as StringIndex];
    if (fret !== null) {
      const openMidi = Note.midi(tuning[i]);
      if (openMidi) {
        const noteName = Note.pitchClass(Note.fromMidi(openMidi + fret));
        if (noteName && !notes.includes(noteName)) {
          notes.push(noteName);
        }
      }
    }
  }
  return notes.length > 0 ? notes.join(' \u00B7 ') : '';
}

interface ChordPickerProps {
  isOpen: boolean;
  onClose: () => void;
  playNotes: (notes: string[], mode?: PlaybackMode) => Promise<void>;
  defaultTab?: PanelTab;
}

export function ChordPicker({ isOpen, onClose, playNotes, defaultTab }: ChordPickerProps) {
  const {
    targetRoot, targetFamily, targetQuality, setChord, keyContext,
    suggestions, keySuggestions, voicingType, guitarStringState,
    applySuggestion, setKeyContext,
  } = useMusicStore();
  const { tuning } = useSharedStore();
  const { isActive: isTourActive } = useTour();

  const [pendingRoot, setPendingRoot] = useState(targetRoot || 'A');
  const [pendingFamily, setPendingFamily] = useState<ChordFamily>(targetFamily || 'Major');
  const [pendingType, setPendingType] = useState(targetQuality || 'Major');

  // Tab state
  const [activeTab, setActiveTab] = useState<PanelTab>(defaultTab || 'library');
  const [matchesSubTab, setMatchesSubTab] = useState<MatchesSubTab>('chords');

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

  // Sync activeTab when panel opens with a defaultTab
  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Get types for selected family
  const typeOptions = FAMILY_TO_TYPES[pendingFamily] || FAMILY_TO_TYPES['Major'];

  // Computed match data
  const playedNotes = getPlayedNotesDisplay(guitarStringState, tuning);
  const matchCount = suggestions.length + keySuggestions.length;
  const isShell = isShellVoicing(voicingType);
  const topSuggestion = suggestions[0] || null;

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

  // Apply a chord suggestion from the Matches tab
  const handleApplyChord = useCallback((suggestion: ChordSuggestion) => {
    const filter = getFilterForVoicingType(suggestion.voicingType);
    applySuggestion(suggestion, filter);
    onClose();
  }, [applySuggestion, onClose]);

  // Set a key from the Matches tab
  const handleSetKey = useCallback((keySuggestion: KeySuggestion) => {
    setKeyContext({ root: keySuggestion.root, type: keySuggestion.type });
    onClose();
  }, [setKeyContext, onClose]);

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

  // Scroll active items into view when picker opens on Library tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'library') return;

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
  }, [isOpen, activeTab, pendingRoot, pendingFamily, pendingType]);

  // Build guidance text for chords sub-tab
  const getChordGuidanceText = () => {
    if (isShell && topSuggestion) {
      const missingText = topSuggestion.missingIntervals.length > 0
        ? topSuggestion.missingIntervals.join(', ')
        : null;
      return (
        <>
          You've selected <strong>{playedNotes.replace(/ \u00B7 /g, ', ')}</strong>, which is a{' '}
          <strong>{getQualityDisplayName(topSuggestion.quality)} Shell</strong>
          {missingText && <> without the {missingText}</>}.
          Select <strong>Chord</strong> to explore full voicings in the library.
        </>
      );
    }

    return (
      <>
        <strong>{playedNotes.replace(/ \u00B7 /g, ' and ')}</strong> could fit the following chords.
        Select a chord to load a voicing from the library.
      </>
    );
  };

  // Build guidance text for keys sub-tab
  const getKeyGuidanceText = () => {
    return (
      <>
        The notes <strong>{playedNotes.replace(/ \u00B7 /g, ', ')}</strong> fit these keys.
        Set a key to filter the chord picker to diatonic chords.
      </>
    );
  };

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
          &#x2715;
        </button>

        {/* Panel tabs */}
        <div className={styles.panelTabs}>
          <button
            className={`${styles.panelTab} ${activeTab === 'library' ? styles.panelTabActive : ''}`}
            onClick={() => setActiveTab('library')}
          >
            Library
          </button>
          <button
            className={`${styles.panelTab} ${activeTab === 'matches' ? styles.panelTabActive : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Matches
            {activeTab !== 'matches' && matchCount > 0 && (
              <span className={styles.matchesBadge}>{matchCount}</span>
            )}
          </button>
        </div>

        {/* Library tab */}
        {activeTab === 'library' && (
          <>
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
          </>
        )}

        {/* Matches tab */}
        {activeTab === 'matches' && (
          <div className={styles.matchesContent}>
            {matchCount === 0 ? (
              <p className={styles.matchesEmpty}>
                Place 2+ notes on the fretboard to see chord and key matches.
              </p>
            ) : (
              <>
                {/* Segmented control */}
                <div className={styles.segmentedControl}>
                  <button
                    className={`${styles.segment} ${matchesSubTab === 'chords' ? styles.segmentActive : ''}`}
                    onClick={() => setMatchesSubTab('chords')}
                  >
                    Chords ({suggestions.length})
                  </button>
                  <button
                    className={`${styles.segment} ${matchesSubTab === 'keys' ? styles.segmentActive : ''}`}
                    onClick={() => setMatchesSubTab('keys')}
                  >
                    Keys ({keySuggestions.length})
                  </button>
                </div>

                {/* Chords sub-tab */}
                {matchesSubTab === 'chords' && (
                  <>
                    <p className={styles.guidance}>{getChordGuidanceText()}</p>
                    <div className={styles.matchesList}>
                      {suggestions.map((suggestion, index) => {
                        const typeTag = getTypeTag(suggestion.voicingType);
                        return (
                          <div
                            key={`${suggestion.root}-${suggestion.quality}-${index}`}
                            className={styles.matchItem}
                            data-tour={index === 0 ? 'suggestion-first' : undefined}
                          >
                            <div className={styles.matchInfo}>
                              <span className={styles.matchName}>
                                {suggestion.root} {suggestion.quality}
                                {typeTag && (
                                  <span className={styles.typeTag}>[{typeTag}]</span>
                                )}
                              </span>
                              <span className={styles.matchIntervals}>
                                {suggestion.presentIntervals.join(' \u00B7 ')}
                                {suggestion.missingIntervals.length > 0 && (
                                  <span className={styles.missingText}>
                                    {' '}(missing: {suggestion.missingIntervals.join(', ')})
                                  </span>
                                )}
                              </span>
                            </div>
                            <button
                              className={styles.matchApplyButton}
                              onClick={() => handleApplyChord(suggestion)}
                              title={`Load ${typeTag || 'voicing'} from library`}
                              data-tour={index === 0 ? 'suggestion-apply' : undefined}
                            >
                              Apply
                            </button>
                          </div>
                        );
                      })}
                      {suggestions.length === 0 && (
                        <p className={styles.matchesEmpty}>No chord matches</p>
                      )}
                    </div>
                  </>
                )}

                {/* Keys sub-tab */}
                {matchesSubTab === 'keys' && (
                  <>
                    <p className={styles.guidance}>{getKeyGuidanceText()}</p>
                    <div className={styles.matchesList}>
                      {keySuggestions.map((keySuggestion, index) => (
                        <div
                          key={`${keySuggestion.root}-${keySuggestion.type}-${index}`}
                          className={styles.matchItem}
                        >
                          <div className={styles.matchInfo}>
                            <span className={styles.matchName}>
                              {keySuggestion.display}
                            </span>
                            <span className={styles.matchIntervals}>
                              {keySuggestion.reason}
                            </span>
                          </div>
                          <button
                            className={styles.matchSetButton}
                            onClick={() => handleSetKey(keySuggestion)}
                            title={`Set ${keySuggestion.display} as key context`}
                          >
                            Set
                          </button>
                        </div>
                      ))}
                      {keySuggestions.length === 0 && (
                        <p className={styles.matchesEmpty}>No key matches</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
