/**
 * ScaleSuggestionModal - Display scale and key suggestions
 *
 * Two tabs:
 * - Scales: Shows detected scales with Apply button
 * - Keys: Shows detected keys (from shared key-detector)
 *
 * Mirrors SuggestionModal pattern from Chord Compass.
 */

import { useEffect, useState } from 'react';
import { useScaleStore, type ScaleSuggestion, type KeyMatch } from '../../store/useScaleStore';
import styles from './ScaleSuggestionModal.module.css';

type TabType = 'scales' | 'keys';

interface ScaleSuggestionModalProps {
  suggestions: ScaleSuggestion[];
  keySuggestions: KeyMatch[];
  playedNotes: string;
  onClose: () => void;
}

export function ScaleSuggestionModal({
  suggestions,
  keySuggestions,
  playedNotes,
  onClose
}: ScaleSuggestionModalProps) {
  const { applyScaleSuggestion } = useScaleStore();
  const [activeTab, setActiveTab] = useState<TabType>('scales');

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleApplyScale = (suggestion: ScaleSuggestion) => {
    applyScaleSuggestion(suggestion);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Build guidance text for scales tab
  const getScaleGuidanceText = () => {
    return (
      <>
        The notes <strong>{playedNotes.replace(/ · /g, ', ')}</strong> could fit the following scales.
        Select a scale to view its positions.
      </>
    );
  };

  // Build guidance text for keys tab
  const getKeyGuidanceText = () => {
    return (
      <>
        The notes <strong>{playedNotes.replace(/ · /g, ', ')}</strong> are diatonic to these keys.
      </>
    );
  };

  const hasKeys = keySuggestions.length > 0;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {activeTab === 'scales' ? 'Scale Matches' : 'Key Matches'}
          </h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Tab bar - only show if there are key suggestions */}
        {hasKeys && (
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === 'scales' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('scales')}
            >
              Scales ({suggestions.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'keys' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('keys')}
            >
              Keys ({keySuggestions.length})
            </button>
          </div>
        )}

        {activeTab === 'scales' && (
          <>
            <p className={styles.guidance}>{getScaleGuidanceText()}</p>

            <div className={styles.suggestionList}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.root}-${suggestion.type}-${index}`}
                  className={styles.suggestionItem}
                >
                  <div className={styles.suggestionInfo}>
                    <span className={styles.scaleName}>
                      {suggestion.display}
                    </span>
                    <span className={styles.details}>
                      {suggestion.coverage}% coverage
                      {suggestion.extraNotes.length > 0 && (
                        <span className={styles.passing}>
                          {' '} (passing: {suggestion.extraNotes.join(', ')})
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    className={styles.applyButton}
                    onClick={() => handleApplyScale(suggestion)}
                    title={`View ${suggestion.display} positions`}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>

            {suggestions.length === 0 && (
              <p className={styles.emptyMessage}>No scale suggestions available</p>
            )}
          </>
        )}

        {activeTab === 'keys' && (
          <>
            <p className={styles.guidance}>{getKeyGuidanceText()}</p>

            <div className={styles.suggestionList}>
              {keySuggestions.map((keySuggestion, index) => (
                <div
                  key={`${keySuggestion.root}-${keySuggestion.type}-${index}`}
                  className={styles.suggestionItem}
                >
                  <div className={styles.suggestionInfo}>
                    <span className={styles.scaleName}>
                      {keySuggestion.display}
                    </span>
                    <span className={styles.details}>
                      {keySuggestion.reason}
                    </span>
                  </div>
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
