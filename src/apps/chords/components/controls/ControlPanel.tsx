import { useRef, useState, useEffect, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSharedStore } from '../../../../shared/store';
import { Card } from '../../../../shared/components/Card';
import { VOICING_FILTER_OPTIONS } from '../../config/constants';
import type { VoicingFilterType } from '../../types';
import styles from './ControlPanel.module.css';

/** Voicing filter cycle order */
const VOICING_CYCLE: VoicingFilterType[] = VOICING_FILTER_OPTIONS.map(o => o.value as VoicingFilterType);

/** Display labels for voicing filter */
const VOICING_LABELS: Record<string, string> = {
  all: 'All',
  triads: 'Triads',
  shells: 'Shells',
  full: 'Full',
};

export function ControlPanel() {
  const {
    targetRoot,
    targetQuality,
    displayMode,
    setDisplayMode,
    currentVoicingIndex,
    availableVoicings,
    setVoicingIndex,
    isCustomShape,
    clearAllStrings,
    guitarStringState,
    voicingTypeFilter,
    setVoicingTypeFilter,
  } = useMusicStore();

  const { tuningName, playbackMode, setPlaybackMode, keyContext, openLibrary } = useSharedStore();

  // Carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState(0);

  const scrollToPanel = useCallback((index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const panelWidth = el.clientWidth;
    el.scrollTo({ left: index * panelWidth, behavior: 'smooth' });
  }, []);

  // Track scroll position for dot indicator
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const panelWidth = el.children[0]?.clientWidth ?? 1;
      const index = Math.round(scrollLeft / panelWidth);
      setActivePanel(index);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Position navigation
  const isFreeFormMode = !targetRoot || !targetQuality;

  const handlePrevVoicing = () => {
    if (currentVoicingIndex > 0) {
      setVoicingIndex(currentVoicingIndex - 1);
    }
  };

  const handleNextVoicing = () => {
    if (currentVoicingIndex < availableVoicings.length - 1) {
      setVoicingIndex(currentVoicingIndex + 1);
    }
  };

  const hasNotes = Object.values(guitarStringState).some(fret => fret !== null);

  // Cycle voicing filter on tap
  const cycleVoicingFilter = () => {
    const idx = VOICING_CYCLE.indexOf(voicingTypeFilter);
    const next = VOICING_CYCLE[(idx + 1) % VOICING_CYCLE.length];
    setVoicingTypeFilter(next);
  };

  // Selector display values
  const keyDisplayText = keyContext
    ? `${keyContext.root} ${keyContext.type === 'major' ? 'Major' : 'Minor'}`
    : 'Not set';
  const keyIsActive = !!keyContext;
  const voicingIsActive = voicingTypeFilter !== 'all';
  const tuningIsActive = tuningName !== 'Standard';

  return (
    <div className={styles.controlPanel} data-tour="control-panel">
      {/* Position — persistent, above cards */}
      <div className={styles.positionRow} data-tour="position-nav">
        <button
          onClick={handlePrevVoicing}
          disabled={isFreeFormMode || currentVoicingIndex === 0 || availableVoicings.length === 0}
          className={styles.navButton}
          aria-label="Previous voicing"
        >
          &lsaquo;
        </button>
        <span className={`${styles.positionLabel} ${isFreeFormMode ? styles.positionLabelInactive : ''}`}>
          {isFreeFormMode ? (
            'Position'
          ) : isCustomShape ? (
            'Custom'
          ) : availableVoicings.length > 0 ? (
            `${currentVoicingIndex + 1} of ${availableVoicings.length}`
          ) : (
            'Position'
          )}
        </span>
        <button
          onClick={handleNextVoicing}
          disabled={
            isFreeFormMode ||
            currentVoicingIndex >= availableVoicings.length - 1 ||
            availableVoicings.length === 0
          }
          className={styles.navButton}
          aria-label="Next voicing"
        >
          &rsaquo;
        </button>
      </div>

      {/* Carousel — two panels */}
      <div className={styles.carousel} ref={carouselRef}>
        {/* Panel 1: Selectors (What) */}
        <div className={styles.panel}>
          <Card>
            <div className={styles.selectorRow}>
              <button
                className={`${styles.selectorItem} ${keyIsActive ? styles.active : ''} ${!keyContext ? styles.dimmed : ''}`}
                onClick={() => openLibrary('key')}
                data-tour="key-button"
              >
                <span className={styles.selectorLabel}>Key</span>
                <span className={styles.selectorValue}>{keyDisplayText}</span>
              </button>
              <button
                className={`${styles.selectorItem} ${voicingIsActive ? styles.active : ''}`}
                onClick={cycleVoicingFilter}
              >
                <span className={styles.selectorLabel}>Voicing</span>
                <span className={styles.selectorValue}>{VOICING_LABELS[voicingTypeFilter]}</span>
              </button>
              <button
                className={`${styles.selectorItem} ${tuningIsActive ? styles.active : ''}`}
                onClick={() => openLibrary('tuning')}
                data-tour="tuning-button"
              >
                <span className={styles.selectorLabel}>Tuning</span>
                <span className={styles.selectorValue}>{tuningName}</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Panel 2: Pill toggles (How) */}
        <div className={styles.panel}>
          <Card>
            <div className={styles.pillRow}>
              <div className={styles.pillCol}>
                <span className={styles.pillLabel}>Labels</span>
                <div
                  className={styles.pillGroup}
                  onClick={() => setDisplayMode(displayMode === 'notes' ? 'intervals' : 'notes')}
                  data-tour="display-toggle"
                >
                  <span className={`${styles.pill} ${displayMode === 'notes' ? styles.active : ''}`}>
                    Notes
                  </span>
                  <span className={`${styles.pill} ${displayMode === 'intervals' ? styles.active : ''}`}>
                    Intervals
                  </span>
                </div>
              </div>
              <div className={styles.pillCol}>
                <span className={styles.pillLabel}>Playback</span>
                <div
                  className={styles.pillGroup}
                  onClick={() => setPlaybackMode(playbackMode === 'strum' ? 'block' : 'strum')}
                >
                  <span className={`${styles.pill} ${playbackMode === 'strum' ? styles.active : ''}`}>
                    Strum
                  </span>
                  <span className={`${styles.pill} ${playbackMode === 'block' ? styles.active : ''}`}>
                    Block
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dot indicators (mobile only via CSS) */}
      <div className={styles.dots}>
        <button
          className={`${styles.dot} ${activePanel === 0 ? styles.active : ''}`}
          onClick={() => scrollToPanel(0)}
          aria-label="Selectors panel"
        />
        <button
          className={`${styles.dot} ${activePanel === 1 ? styles.active : ''}`}
          onClick={() => scrollToPanel(1)}
          aria-label="Options panel"
        />
      </div>

      {/* Clear button */}
      <button
        onClick={clearAllStrings}
        disabled={!hasNotes}
        className={styles.clearButton}
        data-tour="clear-button"
      >
        Clear All
      </button>
    </div>
  );
}
