/**
 * ControlPanel - Scale Sage controls
 *
 * Two-panel carousel layout:
 * - Position nav (persistent, above cards)
 * - Panel 1: Selectors (Key, Tuning)
 * - Panel 2: Pills (Labels, Pattern, Direction)
 * - Dot indicators (mobile only)
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useScaleStore, useSharedStore, type ScaleType } from '../../store/useScaleStore';
import { useSharedStore as useGlobalSharedStore } from '../../../../shared/store';
import { Card } from '../../../../shared/components/Card';
import styles from './ControlPanel.module.css';

/** Get position count based on scale type */
function getPositionCount(scaleType: ScaleType | null): number {
  if (!scaleType) return 0;
  if (scaleType === 'major-pentatonic' || scaleType === 'minor-pentatonic' || scaleType === 'blues') {
    return 5;
  }
  return 7;
}

export function ControlPanel() {
  const {
    scaleRoot,
    scaleType,
    currentPosition,
    displayMode,
    playbackDirection,
    guitarStringState,
    setPosition,
    setDisplayMode,
    setPlaybackDirection,
    clearScale,
    clearFrets,
  } = useScaleStore();

  const { tuningName, keyContext } = useSharedStore();
  const { openLibrary } = useGlobalSharedStore();

  const hasScale = scaleRoot && scaleType;
  const positionCount = getPositionCount(scaleType);

  // Check for free-play mode
  const noteCount = Object.values(guitarStringState).reduce(
    (sum, frets) => sum + frets.length,
    0
  );
  const isFreePlayMode = !hasScale && noteCount > 0;

  // Carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState(0);

  const scrollToPanel = useCallback((index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const panelWidth = el.clientWidth;
    el.scrollTo({ left: index * panelWidth, behavior: 'smooth' });
  }, []);

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
  const handlePrevPosition = () => {
    if (currentPosition > 0) {
      setPosition(currentPosition - 1);
    }
  };

  const handleNextPosition = () => {
    if (currentPosition < positionCount) {
      setPosition(currentPosition + 1);
    }
  };

  const getPositionLabel = () => {
    if (isFreePlayMode) return 'Free Play';
    if (!hasScale) return 'Position';
    if (currentPosition === 0) return 'Full';
    return `${currentPosition} of ${positionCount}`;
  };

  // Selector display
  const keyIsActive = !!keyContext;
  const keyDisplayText = keyContext
    ? `${keyContext.root} ${keyContext.type === 'major' ? 'Major' : 'Minor'}`
    : 'Not set';
  const tuningIsActive = tuningName !== 'Standard';

  // Pattern: Shape (position boxes) vs Full
  // currentPosition 0 = Full, anything else = Shape
  const isFullPattern = hasScale && currentPosition === 0;

  const handlePatternChange = (pattern: 'shape' | 'full') => {
    if (!hasScale) return;
    if (pattern === 'full') {
      setPosition(0);
    } else if (currentPosition === 0) {
      // Switch from Full to Shape: go to position 1
      setPosition(1);
    }
  };

  // Clear handler
  const handleClear = () => {
    if (hasScale) {
      clearScale();
    } else if (isFreePlayMode) {
      clearFrets();
    }
  };

  const canClear = hasScale || isFreePlayMode;

  return (
    <div className={styles.controlPanel}>
      {/* Position — persistent, above cards */}
      <div className={styles.positionRow}>
        <button
          onClick={handlePrevPosition}
          disabled={!hasScale || currentPosition === 0}
          className={styles.navButton}
          aria-label="Previous position"
        >
          &lt;
        </button>
        <span className={`${styles.positionLabel} ${!hasScale && !isFreePlayMode ? styles.positionLabelInactive : ''} ${isFreePlayMode ? styles.positionLabelFreePlay : ''}`}>
          {getPositionLabel()}
        </span>
        <button
          onClick={handleNextPosition}
          disabled={!hasScale || currentPosition >= positionCount}
          className={styles.navButton}
          aria-label="Next position"
        >
          &gt;
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
              >
                <span className={styles.selectorLabel}>Key</span>
                <span className={styles.selectorValue}>{keyDisplayText}</span>
              </button>
              <button
                className={`${styles.selectorItem} ${tuningIsActive ? styles.active : ''}`}
                onClick={() => openLibrary('tuning')}
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
                <span className={styles.pillLabel}>Pattern</span>
                <div
                  className={styles.pillGroup}
                  onClick={() => handlePatternChange(isFullPattern ? 'shape' : 'full')}
                >
                  <span className={`${styles.pill} ${hasScale && !isFullPattern ? styles.active : ''}`}>
                    Shape
                  </span>
                  <span className={`${styles.pill} ${isFullPattern ? styles.active : ''}`}>
                    Full
                  </span>
                </div>
              </div>
              <div className={styles.pillCol}>
                <span className={styles.pillLabel}>Direction</span>
                <div
                  className={styles.pillGroup}
                  onClick={() => setPlaybackDirection(playbackDirection === 'ascending' ? 'descending' : 'ascending')}
                >
                  <span className={`${styles.pill} ${playbackDirection === 'ascending' ? styles.active : ''}`}>
                    Asc
                  </span>
                  <span className={`${styles.pill} ${playbackDirection === 'descending' ? styles.active : ''}`}>
                    Desc
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
        onClick={handleClear}
        disabled={!canClear}
        className={styles.clearButton}
      >
        Clear
      </button>
    </div>
  );
}
