import { useEffect, useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import type { ChordSuggestion, VoicingType, VoicingFilterType, KeySuggestion } from '../../types';
import styles from './SuggestionModal.module.css';

type TabType = 'chords' | 'keys';

interface SuggestionModalProps {
  suggestions: ChordSuggestion[];
  keySuggestions: KeySuggestion[];
  voicingType: VoicingType | null;
  playedNotes: string;
  onClose: () => void;
}

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
  return 'all'; // partial, unknown -> default
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

export function SuggestionModal({ suggestions, keySuggestions, voicingType, playedNotes, onClose }: SuggestionModalProps) {
  const { applySuggestion, setKeyContext } = useMusicStore();
  const [activeTab, setActiveTab] = useState<TabType>('chords');

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleApplyChord = (suggestion: ChordSuggestion, filter: VoicingFilterType) => {
    applySuggestion(suggestion, filter);
    onClose();
  };

  const handleSetKey = (keySuggestion: KeySuggestion) => {
    setKeyContext({ root: keySuggestion.root, type: keySuggestion.type });
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get the top suggestion for shell explanation
  const topSuggestion = suggestions[0];
  const isShell = isShellVoicing(voicingType);

  // Build guidance text for chords tab
  const getChordGuidanceText = () => {
    if (isShell && topSuggestion) {
      const missingText = topSuggestion.missingIntervals.length > 0
        ? topSuggestion.missingIntervals.join(', ')
        : null;
      return (
        <>
          You've selected <strong>{playedNotes.replace(/ · /g, ', ')}</strong>, which is a{' '}
          <strong>{getQualityDisplayName(topSuggestion.quality)} Shell</strong>
          {missingText && <> without the {missingText}</>}.
          Select <strong>Chord</strong> to explore full voicings in the library.
        </>
      );
    }

    return (
      <>
        <strong>{playedNotes.replace(/ · /g, ' and ')}</strong> could fit the following chords.
        Select a chord to load a voicing from the library.
      </>
    );
  };

  // Build guidance text for keys tab
  const getKeyGuidanceText = () => {
    return (
      <>
        The notes <strong>{playedNotes.replace(/ · /g, ', ')}</strong> fit these keys.
        Set a key to filter the chord picker to diatonic chords.
      </>
    );
  };

  const hasKeys = keySuggestions.length > 0;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {activeTab === 'chords' ? 'Chord Matches' : 'Key Matches'}
          </h3>
          {activeTab === 'chords' && voicingType && voicingType !== 'unknown' && voicingType !== 'partial' && (
            <span className={styles.voicingBadge}>
              {formatVoicingType(voicingType)}
            </span>
          )}
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Tab bar - only show if there are key suggestions */}
        {hasKeys && (
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === 'chords' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('chords')}
            >
              Chords ({suggestions.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'keys' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('keys')}
            >
              Keys ({keySuggestions.length})
            </button>
          </div>
        )}

        {activeTab === 'chords' && (
          <>
            <p className={styles.guidance}>{getChordGuidanceText()}</p>

            <div className={styles.suggestionList}>
              {suggestions.map((suggestion, index) => {
                const typeTag = getTypeTag(suggestion.voicingType);
                const filter = getFilterForVoicingType(suggestion.voicingType);

                return (
                  <div key={`${suggestion.root}-${suggestion.quality}-${index}`} className={styles.suggestionItem}>
                    <div className={styles.suggestionInfo}>
                      <span className={styles.chordName}>
                        {suggestion.root} {suggestion.quality}
                        {typeTag && (
                          <span className={styles.typeTag}>[{typeTag}]</span>
                        )}
                      </span>
                      <span className={styles.intervals}>
                        {suggestion.presentIntervals.join(' · ')}
                        {suggestion.missingIntervals.length > 0 && (
                          <span className={styles.missing}>
                            {' '}(missing: {suggestion.missingIntervals.join(', ')})
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      className={styles.applyButton}
                      onClick={() => handleApplyChord(suggestion, filter)}
                      title={`Load ${typeTag || 'voicing'} from library`}
                    >
                      Apply
                    </button>
                  </div>
                );
              })}
            </div>

            {suggestions.length === 0 && (
              <p className={styles.emptyMessage}>No chord suggestions available</p>
            )}
          </>
        )}

        {activeTab === 'keys' && (
          <>
            <p className={styles.guidance}>{getKeyGuidanceText()}</p>

            <div className={styles.suggestionList}>
              {keySuggestions.map((keySuggestion, index) => (
                <div key={`${keySuggestion.root}-${keySuggestion.type}-${index}`} className={styles.suggestionItem}>
                  <div className={styles.suggestionInfo}>
                    <span className={styles.chordName}>
                      {keySuggestion.display}
                    </span>
                    <span className={styles.intervals}>
                      {keySuggestion.reason}
                    </span>
                  </div>
                  <button
                    className={styles.setButton}
                    onClick={() => handleSetKey(keySuggestion)}
                    title={`Set ${keySuggestion.display} as key context`}
                  >
                    Set
                  </button>
                </div>
              ))}
            </div>

            {keySuggestions.length === 0 && (
              <p className={styles.emptyMessage}>No key suggestions available</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
