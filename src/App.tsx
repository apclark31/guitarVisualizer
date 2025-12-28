import { useEffect } from 'react';
import { Fretboard } from './components/visuals/Fretboard';
import { ControlPanel } from './components/controls/ControlPanel';
import { ChordHeader } from './components/controls/ChordHeader';
import { AppHeader } from './components/layout/AppHeader';
import { useMusicStore } from './store/useMusicStore';
import type { StringIndex } from './types';
import './App.css';

function App() {
  const { setFret } = useMusicStore();

  // Parse URL params on mount to restore shared chord
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('s');

    if (sharedState) {
      // Format: "0-3,1-2,2-0" (string-fret pairs)
      const pairs = sharedState.split(',');
      for (const pair of pairs) {
        const [stringStr, fretStr] = pair.split('-');
        const stringIndex = parseInt(stringStr, 10);
        const fret = parseInt(fretStr, 10);

        if (
          !isNaN(stringIndex) &&
          !isNaN(fret) &&
          stringIndex >= 0 &&
          stringIndex <= 5 &&
          fret >= 0 &&
          fret <= 24
        ) {
          setFret(stringIndex as StringIndex, fret);
        }
      }

      // Clean up URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setFret]);

  return (
    <div className="app">
      <AppHeader />

      <div className="content">
        <div className="chordBar">
          <ChordHeader />
        </div>

        <main className="main">
          <section className="visualizer">
            <Fretboard />
          </section>
        </main>

        <div className="controlsBar">
          <ControlPanel />
        </div>

        <footer className="footer">
          <p>Made with ☕ and 🎸 by Alex in PDX</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
