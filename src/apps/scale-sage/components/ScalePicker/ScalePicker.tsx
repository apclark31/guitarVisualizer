/**
 * ScalePicker - Harmonic panel with Library and Matches tabs
 *
 * Two-tab panel:
 * - Library: Two-column picker for Root and Scale Type selection
 * - Matches: Scale/key detection results with segmented control
 *
 * Controlled externally via isOpen/onClose props.
 * Mirrors ChordPicker pattern from Chord Compass.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useScaleStore, useSharedStore, type ScaleType, type ScaleSuggestion } from '../../store/useScaleStore';
import { ROOT_OPTIONS, SCALE_TYPE_DISPLAY, SCALE_CATEGORIES } from '../../lib/scale-data';
import { getNotesFromMultiNoteState } from '../../../../shared/lib';
import styles from './ScalePicker.module.css';

type PanelTab = 'library' | 'matches';
type MatchesSubTab = 'scales' | 'keys';

interface ScalePickerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: PanelTab;
}

export function ScalePicker({ isOpen, onClose, defaultTab }: ScalePickerProps) {
  const {
    scaleRoot, scaleType, setScaleRoot, setScaleType, setPosition,
    scaleSuggestions, keySuggestions, guitarStringState, applyScaleSuggestion,
  } = useScaleStore();
  const { tuning } = useSharedStore();

  const [pendingRoot, setPendingRoot] = useState(scaleRoot || 'C');
  const [pendingType, setPendingType] = useState<ScaleType>(scaleType || 'major');

  // Tab state — initialized lazily to avoid flash on open
  const [activeTab, setActiveTab] = useState<PanelTab>('library');
  const [matchesSubTab, setMatchesSubTab] = useState<MatchesSubTab>('scales');

  const pickerRef = useRef<HTMLDivElement>(null);
  const rootColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  // Sync pending state when store changes
  useEffect(() => {
    if (scaleRoot) setPendingRoot(scaleRoot);
    if (scaleType) setPendingType(scaleType);
  }, [scaleRoot, scaleType]);

  // Set the correct tab immediately when the panel opens (not in an effect)
  const prevIsOpenRef = useRef(false);
  if (isOpen && !prevIsOpenRef.current) {
    const targetTab = defaultTab || 'library';
    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }
  }
  prevIsOpenRef.current = isOpen;

  // Computed match data
  const matchCount = scaleSuggestions.length + keySuggestions.length;

  // Get played notes for guidance text
  const playedNotes = useMemo(() => {
    const { notes } = getNotesFromMultiNoteState(guitarStringState, tuning);
    return notes.length > 0 ? notes.join(' \u00B7 ') : '';
  }, [guitarStringState, tuning]);

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

  // Apply a scale suggestion from the Matches tab
  const handleApplyScale = useCallback((suggestion: ScaleSuggestion) => {
    applyScaleSuggestion(suggestion);
    onClose();
  }, [applyScaleSuggestion, onClose]);

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
      scrollToActive(typeColumnRef.current, pendingType);
    });
  }, [isOpen, activeTab, pendingRoot, pendingType]);

  // Build guidance text for scales sub-tab
  const getScaleGuidanceText = () => {
    return (
      <>
        The notes <strong>{playedNotes.replace(/ \u00B7 /g, ', ')}</strong> could fit the following scales.
        Select a scale to view its positions.
      </>
    );
  };

  // Build guidance text for keys sub-tab
  const getKeyGuidanceText = () => {
    return (
      <>
        The notes <strong>{playedNotes.replace(/ \u00B7 /g, ', ')}</strong> are diatonic to these keys.
      </>
    );
  };

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
          <div className={styles.libraryContent}>
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
        )}

        {/* Matches tab */}
        {activeTab === 'matches' && (
          <div className={styles.matchesContent}>
            {matchCount === 0 ? (
              <p className={styles.matchesEmpty}>
                Place 2+ notes on the fretboard to see scale and key matches.
              </p>
            ) : (
              <>
                {/* Segmented control */}
                <div className={styles.segmentedControl}>
                  <button
                    className={`${styles.segment} ${matchesSubTab === 'scales' ? styles.segmentActive : ''}`}
                    onClick={() => setMatchesSubTab('scales')}
                  >
                    Scales ({scaleSuggestions.length})
                  </button>
                  <button
                    className={`${styles.segment} ${matchesSubTab === 'keys' ? styles.segmentActive : ''}`}
                    onClick={() => setMatchesSubTab('keys')}
                  >
                    Keys ({keySuggestions.length})
                  </button>
                </div>

                {/* Scales sub-tab */}
                {matchesSubTab === 'scales' && (
                  <>
                    <p className={styles.guidance}>{getScaleGuidanceText()}</p>
                    <div className={styles.matchesList}>
                      {scaleSuggestions.map((suggestion, index) => (
                        <div
                          key={`${suggestion.root}-${suggestion.type}-${index}`}
                          className={styles.matchItem}
                        >
                          <div className={styles.matchInfo}>
                            <span className={styles.matchName}>
                              {suggestion.display}
                            </span>
                            <span className={styles.matchIntervals}>
                              {suggestion.coverage}% coverage
                              {suggestion.extraNotes.length > 0 && (
                                <span className={styles.passingText}>
                                  {' '}(passing: {suggestion.extraNotes.join(', ')})
                                </span>
                              )}
                            </span>
                          </div>
                          <button
                            className={styles.matchApplyButton}
                            onClick={() => handleApplyScale(suggestion)}
                            title={`View ${suggestion.display} positions`}
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                      {scaleSuggestions.length === 0 && (
                        <p className={styles.matchesEmpty}>No scale matches</p>
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
