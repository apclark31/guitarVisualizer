/**
 * ScaleMatchesPanel - Scale/key detection results
 *
 * Extracted from ScalePicker Matches tab. Shows scale suggestions with
 * coverage and key matches with segmented control.
 */

import { useState, useCallback, useMemo } from 'react';
import { useScaleStore, useSharedStore, type ScaleSuggestion } from '../../store/useScaleStore';
import { useSharedStore as useGlobalSharedStore } from '../../../../shared/store';
import { getNotesFromMultiNoteState } from '../../../../shared/lib';
import styles from './ScaleMatchesPanel.module.css';

type MatchesSubTab = 'scales' | 'keys';

export function ScaleMatchesPanel() {
  const {
    scaleSuggestions, keySuggestions, guitarStringState, applyScaleSuggestion,
  } = useScaleStore();
  const { tuning } = useSharedStore();
  const { closeLibrary } = useGlobalSharedStore();

  const [subTab, setSubTab] = useState<MatchesSubTab>('scales');
  const matchCount = scaleSuggestions.length + keySuggestions.length;

  const playedNotes = useMemo(() => {
    const { notes } = getNotesFromMultiNoteState(guitarStringState, tuning);
    return notes.length > 0 ? notes.join(' \u00B7 ') : '';
  }, [guitarStringState, tuning]);

  const handleApplyScale = useCallback((suggestion: ScaleSuggestion) => {
    applyScaleSuggestion(suggestion);
    closeLibrary();
  }, [applyScaleSuggestion, closeLibrary]);

  return (
    <div className={styles.matchesContent}>
      {matchCount === 0 ? (
        <p className={styles.matchesEmpty}>
          Place 2+ notes on the fretboard to see scale and key matches.
        </p>
      ) : (
        <>
          <div className={styles.segmentedControl}>
            <button
              className={`${styles.segment} ${subTab === 'scales' ? styles.segmentActive : ''}`}
              onClick={() => setSubTab('scales')}
            >
              Scales ({scaleSuggestions.length})
            </button>
            <button
              className={`${styles.segment} ${subTab === 'keys' ? styles.segmentActive : ''}`}
              onClick={() => setSubTab('keys')}
            >
              Keys ({keySuggestions.length})
            </button>
          </div>

          {subTab === 'scales' && (
            <>
              <p className={styles.guidance}>
                The notes <strong>{playedNotes.replace(/ \u00B7 /g, ', ')}</strong> could fit the following scales.
                Select a scale to view its positions.
              </p>
              <div className={styles.matchesList}>
                {scaleSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.root}-${suggestion.type}-${index}`}
                    className={styles.matchItem}
                  >
                    <div className={styles.matchInfo}>
                      <span className={styles.matchName}>{suggestion.display}</span>
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

          {subTab === 'keys' && (
            <>
              <p className={styles.guidance}>
                The notes <strong>{playedNotes.replace(/ \u00B7 /g, ', ')}</strong> are diatonic to these keys.
              </p>
              <div className={styles.matchesList}>
                {keySuggestions.map((keySuggestion, index) => (
                  <div
                    key={`${keySuggestion.root}-${keySuggestion.type}-${index}`}
                    className={styles.matchItem}
                  >
                    <div className={styles.matchInfo}>
                      <span className={styles.matchName}>{keySuggestion.display}</span>
                      <span className={styles.matchIntervals}>{keySuggestion.reason}</span>
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
  );
}
