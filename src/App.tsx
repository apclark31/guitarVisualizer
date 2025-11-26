import { Fretboard } from './components/visuals/Fretboard';
import { ControlPanel } from './components/controls/ControlPanel';
import { useMusicStore } from './store/useMusicStore';
import { STANDARD_TUNING } from './config/constants';
import { Note } from '@tonaljs/tonal';
import type { StringIndex } from './types';
import './App.css';

/** Get played notes as a formatted string */
function getPlayedNotesDisplay(guitarState: Record<StringIndex, number | null>): string {
  const notes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const fret = guitarState[i as StringIndex];
    if (fret !== null) {
      const openMidi = Note.midi(STANDARD_TUNING[i]);
      if (openMidi) {
        const noteName = Note.pitchClass(Note.fromMidi(openMidi + fret));
        if (noteName && !notes.includes(noteName)) {
          notes.push(noteName);
        }
      }
    }
  }
  return notes.length > 0 ? `Notes: ${notes.join(' - ')}` : '';
}

function App() {
  const { targetRoot, targetQuality, detectedChord, guitarStringState } = useMusicStore();

  // Get the notes being played
  const playedNotes = getPlayedNotesDisplay(guitarStringState);

  // Determine what to display as the chord name
  const getChordDisplay = () => {
    // If a chord is selected from the menu, show that
    if (targetRoot && targetQuality) {
      return {
        main: `${targetRoot} ${targetQuality}`,
        sub: playedNotes || '\u00A0', // Show notes or non-breaking space
      };
    }

    // If we've detected a chord from manual placement
    if (detectedChord) {
      const altText = detectedChord.alternatives.length > 0
        ? `Also: ${detectedChord.alternatives.slice(0, 2).join(', ')}`
        : playedNotes;
      return {
        main: detectedChord.name,
        sub: altText || '\u00A0',
      };
    }

    // Empty state
    return {
      main: 'Fretboard Explorer',
      sub: 'Place notes to detect chords',
    };
  };

  const chordDisplay = getChordDisplay();

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Guitar Theory Visualizer</h1>
        <p className="chordName">{chordDisplay.main}</p>
        <p className="chordSub">{chordDisplay.sub}</p>
      </header>

      <main className="main">
        <section className="visualizer">
          <Fretboard />
        </section>

        <aside className="controls">
          <ControlPanel />
        </aside>
      </main>

      <footer className="footer">
        <p>Click on the fretboard to place notes</p>
      </footer>
    </div>
  );
}

export default App;
