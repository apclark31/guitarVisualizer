import { useMusicStore } from '../../store/useMusicStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { CHROMATIC_NOTES, CHORD_QUALITIES } from '../../config/constants';
import type { PlaybackMode } from '../../types';
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
    // Only trigger solver if both root and quality are selected
    if (newRoot && targetQuality) {
      setTargetChord(newRoot, targetQuality);
    } else if (newRoot && !targetQuality) {
      // If quality not yet selected, default to Major
      setTargetChord(newRoot, 'Major');
    }
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value;
    // Only trigger solver if both root and quality are selected
    if (targetRoot && newQuality) {
      setTargetChord(targetRoot, newQuality);
    } else if (!targetRoot && newQuality) {
      // If root not yet selected, default to C
      setTargetChord('C', newQuality);
    }
  };

  // Check if we're in free-form mode (no chord selected)
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

  return (
    <div className={styles.controlPanel}>
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

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Voicing</h3>
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

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Display</h3>
        <div className={styles.toggleGroup}>
          <button
            onClick={() => setDisplayMode('notes')}
            className={`${styles.toggleButton} ${displayMode === 'notes' ? styles.active : ''}`}
          >
            Notes
          </button>
          <button
            onClick={() => setDisplayMode('intervals')}
            className={`${styles.toggleButton} ${displayMode === 'intervals' ? styles.active : ''}`}
          >
            Intervals
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Playback Mode</h3>
        <div className={styles.toggleGroup}>
          {(['block', 'strum', 'arpeggio'] as PlaybackMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setPlaybackMode(mode)}
              className={`${styles.toggleButton} ${playbackMode === mode ? styles.active : ''}`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <button
          onClick={() => playChord()}
          disabled={!isLoaded || !hasNotes}
          className={styles.playButton}
        >
          {!isLoaded ? 'Loading...' : 'Play Chord'}
        </button>
      </div>

      <div className={styles.section}>
        <button onClick={clearAllStrings} className={styles.clearButton}>
          Clear All
        </button>
      </div>
    </div>
  );
}
