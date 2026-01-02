/**
 * Fretboard - Store-connected wrapper for the shared Fretboard component
 *
 * This component connects the Zustand store to the shared Fretboard,
 * passing state as props and handling callbacks.
 */

import { Fretboard as SharedFretboard } from '../../shared/components/Fretboard';
import { useMusicStore } from '../../store/useMusicStore';
import type { StringIndex } from '../../types';

interface FretboardProps {
  playFretNote: (stringIndex: StringIndex, fret: number) => Promise<void>;
}

export function Fretboard({ playFretNote }: FretboardProps) {
  const {
    guitarStringState,
    setFret,
    clearString,
    displayMode,
    targetRoot,
    detectedChord,
    tuning,
  } = useMusicStore();

  // Determine the root note to use for interval coloring
  const colorRoot = targetRoot || detectedChord?.bassNote || null;

  // Handle fret click - update store state
  const handleFretClick = (stringIndex: StringIndex, fret: number) => {
    if (fret === -1) {
      // Signal to clear the string
      clearString(stringIndex);
    } else {
      setFret(stringIndex, fret);
    }
  };

  return (
    <SharedFretboard
      guitarStringState={guitarStringState}
      tuning={tuning}
      displayMode={displayMode}
      rootNote={colorRoot}
      interactive={true}
      onFretClick={handleFretClick}
      onFretPlay={playFretNote}
    />
  );
}
