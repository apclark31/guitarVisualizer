import { useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { CHROMATIC_NOTES, CHORD_QUALITIES } from '../../config/constants';
import type { StringIndex } from '../../types';
import styles from './ControlPanel.module.css';

export function ControlPanel() {
  const {
    targetRoot,
    targetQuality,
    setTargetChord,
    displayMode,
    setDisplayMode,
    playbackMode,
    setPlaybackMode,
    availableVoicings,
    currentVoicingIndex,
    setVoicingIndex,
    isCustomShape,
    clearAllStrings,
    guitarStringState,
  } = useMusicStore();

  const { isLoaded, playChord } = useAudioEngine();

  // Check if there are any notes to play
  const hasNotes = Object.values(guitarStringState).some(fret => fret !== null);

  const handleRootChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoot = e.target.value;
    if (newRoot && targetQuality) {
      setTargetChord(newRoot, targetQuality);
    } else if (newRoot && !targetQuality) {
      setTargetChord(newRoot, 'Major');
    }
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value;
    if (targetRoot && newQuality) {
      setTargetChord(targetRoot, newQuality);
    } else if (!targetRoot && newQuality) {
      setTargetChord('C', newQuality);
    }
  };

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

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'notes' ? 'intervals' : 'notes');
  };

  const togglePlaybackMode = () => {
    setPlaybackMode(playbackMode === 'strum' ? 'block' : 'strum');
  };

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Build query string from guitar state
    const parts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const fret = guitarStringState[i as StringIndex];
      if (fret !== null) {
        parts.push(`${i}-${fret}`);
      }
    }

    const url = `${window.location.origin}${window.location.pathname}?s=${parts.join(',')}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.controlPanel}>
      {/* Row 1: Chord Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Chord Selection</h3>
        <div className={styles.row}>
          <label className={styles.label}>
            Root
            <select
              value={targetRoot}
              onChange={handleRootChange}
              className={styles.select}
            >
              <option value="">--</option>
              {CHROMATIC_NOTES.map((note) => (
                <option key={note} value={note}>
                  {note}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Quality
            <select
              value={targetQuality}
              onChange={handleQualityChange}
              className={styles.select}
            >
              <option value="">--</option>
              {CHORD_QUALITIES.map((quality) => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Row 1: Voicing */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Voicing</h3>
        <div className={styles.voicingSpacer} />
        <div className={styles.voicingNav}>
          <button
            onClick={handlePrevVoicing}
            disabled={currentVoicingIndex === 0 || availableVoicings.length === 0}
            className={styles.navButton}
          >
            &lt;
          </button>
          <span className={styles.voicingLabel}>
            {isFreeFormMode ? (
              'Free Play'
            ) : isCustomShape ? (
              'Custom'
            ) : availableVoicings.length > 0 ? (
              `${currentVoicingIndex + 1} of ${availableVoicings.length}`
            ) : (
              'No voicings'
            )}
          </span>
          <button
            onClick={handleNextVoicing}
            disabled={
              currentVoicingIndex >= availableVoicings.length - 1 ||
              availableVoicings.length === 0
            }
            className={styles.navButton}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Row 2: Toggles (Display + Playback side by side) */}
      <div className={styles.togglesRow}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Display</h3>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Intervals</span>
            <div
              className={`${styles.toggleSwitch} ${displayMode === 'intervals' ? styles.active : ''}`}
              onClick={toggleDisplayMode}
              role="switch"
              aria-checked={displayMode === 'intervals'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleDisplayMode()}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Playback</h3>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Block</span>
            <div
              className={`${styles.toggleSwitch} ${playbackMode === 'block' ? styles.active : ''}`}
              onClick={togglePlaybackMode}
              role="switch"
              aria-checked={playbackMode === 'block'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && togglePlaybackMode()}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Action Buttons */}
      <div className={styles.buttonsRow}>
        <button
          onClick={() => playChord()}
          disabled={!isLoaded || !hasNotes}
          className={styles.playButton}
        >
          {!isLoaded ? 'Loading...' : 'Play Chord'}
        </button>
        <div className={styles.secondaryButtons}>
          <button
            onClick={handleShare}
            disabled={!hasNotes}
            className={styles.shareButton}
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button onClick={clearAllStrings} className={styles.clearButton}>
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
