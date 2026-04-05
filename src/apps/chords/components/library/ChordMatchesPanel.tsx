/**
 * ChordMatchesPanel - Chord/key detection results
 *
 * Extracted from ChordPicker Matches tab. Shows chord suggestions and
 * key matches with segmented control. Handles apply suggestion and set key.
 */

import { useState, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../../../shared/store';
import { Note } from '@tonaljs/tonal';
import type { VoicingType, VoicingFilterType, ChordSuggestion, KeySuggestion, StringIndex } from '../../types';
import styles from './ChordMatchesPanel.module.css';

type MatchesSubTab = 'chords' | 'keys';

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

function getFilterForVoicingType(type: VoicingType): VoicingFilterType {
  if (type === 'triad') return 'triads';
  if (type.startsWith('shell-')) return 'shells';
  if (type === 'full') return 'full';
  return 'all';
}

function isShellVoicing(type: VoicingType | null): boolean {
  return type === 'shell-major' || type === 'shell-minor' || type === 'shell-dominant';
}

function getQualityDisplayName(quality: string): string {
  const map: Record<string, string> = {
    'Major 7': 'Major 7',
    'Minor 7': 'Minor 7',
    'Dominant 7': 'Dominant 7',
  };
  return map[quality] || quality;
}

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

export function ChordMatchesPanel() {
  const {
    suggestions, keySuggestions, voicingType, guitarStringState,
    applySuggestion,
  } = useMusicStore();
  const { tuning, keyContext, setKeyContext, closeLibrary, setActiveLibraryTab } = useSharedStore();

  const [subTab, setSubTab] = useState<MatchesSubTab>(
    suggestions.length === 0 && keySuggestions.length > 0 ? 'keys' : 'chords'
  );

  const playedNotes = getPlayedNotesDisplay(guitarStringState, tuning);
  const matchCount = suggestions.length + keySuggestions.length;
  const isShell = isShellVoicing(voicingType);
  const topSuggestion = suggestions[0] || null;

  const handleApplyChord = useCallback((suggestion: ChordSuggestion) => {
    const filter = getFilterForVoicingType(suggestion.voicingType);
    applySuggestion(suggestion, filter);
    closeLibrary();
  }, [applySuggestion, closeLibrary]);

  const handleSetKey = useCallback((keySuggestion: KeySuggestion) => {
    setKeyContext({ root: keySuggestion.root, type: keySuggestion.type });
    setActiveLibraryTab('library');
  }, [setKeyContext, setActiveLibraryTab]);

  const handleClearKey = useCallback(() => {
    setKeyContext(null);
  }, [setKeyContext]);

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

  const getKeyGuidanceText = () => (
    <>
      The notes <strong>{playedNotes.replace(/ \u00B7 /g, ', ')}</strong> fit these keys.
      Set a key to filter the chord picker to diatonic chords.
    </>
  );

  return (
    <div className={styles.matchesContent}>
      {keyContext && (
        <div className={styles.keyActiveBanner}>
          <span className={styles.keyActiveBannerText}>
            <strong>{keyContext.root} {keyContext.type === 'major' ? 'Major' : 'Minor'}</strong> key active — Library is filtered to diatonic chords.
            Clear to explore freely.
          </span>
          <button className={styles.keyActiveClearButton} onClick={handleClearKey}>
            Clear Key
          </button>
        </div>
      )}

      {matchCount === 0 ? (
        <p className={styles.matchesEmpty}>
          {keyContext
            ? 'Place notes on the fretboard to find new matches.'
            : 'Place 2+ notes on the fretboard to see chord and key matches.'}
        </p>
      ) : (
        <>
          <div className={styles.segmentedControl}>
            <button
              className={`${styles.segment} ${subTab === 'chords' ? styles.segmentActive : ''}`}
              onClick={() => setSubTab('chords')}
            >
              Chords ({suggestions.length})
            </button>
            <button
              className={`${styles.segment} ${subTab === 'keys' ? styles.segmentActive : ''}`}
              onClick={() => setSubTab('keys')}
            >
              Keys ({keySuggestions.length})
            </button>
          </div>

          {subTab === 'chords' && (
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
                          {typeTag && <span className={styles.typeTag}>[{typeTag}]</span>}
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

          {subTab === 'keys' && (
            <>
              <p className={styles.guidance}>{getKeyGuidanceText()}</p>
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
  );
}
