import { useMusicStore } from '../../store/useMusicStore';
import type { ChordSuggestion, VoicingType } from '../../types';
import styles from './SuggestionModal.module.css';

interface SuggestionModalProps {
  suggestions: ChordSuggestion[];
  voicingType: VoicingType | null;
  playedNotes: string;
  onClose: () => void;
}

/** Format voicing type for display */
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

export function SuggestionModal({ suggestions, voicingType, playedNotes, onClose }: SuggestionModalProps) {
  const { applySuggestion, applyContext } = useMusicStore();

  const handleApplyContext = (suggestion: ChordSuggestion) => {
    applyContext(suggestion);
    onClose();
  };

  const handleApplyChord = (suggestion: ChordSuggestion) => {
    applySuggestion(suggestion);
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

  // Build guidance text
  const getGuidanceText = () => {
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
        Select <strong>Context</strong> to update the display, or <strong>Chord</strong> to load a voicing from the library.
      </>
    );
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Chord Matches</h3>
          {voicingType && voicingType !== 'unknown' && voicingType !== 'partial' && (
            <span className={styles.voicingBadge}>
              {formatVoicingType(voicingType)}
            </span>
          )}
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <p className={styles.guidance}>{getGuidanceText()}</p>

        <div className={styles.suggestionList}>
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <div key={`${suggestion.root}-${suggestion.quality}-${index}`} className={styles.suggestionItem}>
              <div className={styles.suggestionInfo}>
                <span className={styles.chordName}>
                  {suggestion.root} {suggestion.quality}
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
              <div className={styles.buttonGroup}>
                <button
                  className={styles.contextButton}
                  onClick={() => handleApplyContext(suggestion)}
                  title="Keep your notes, set chord context"
                >
                  Context
                </button>
                <button
                  className={styles.applyButton}
                  onClick={() => handleApplyChord(suggestion)}
                  title="Apply full voicing from library"
                >
                  Chord
                </button>
              </div>
            </div>
          ))}
        </div>

        {suggestions.length === 0 && (
          <p className={styles.emptyMessage}>No chord suggestions available</p>
        )}
      </div>
    </div>
  );
}
