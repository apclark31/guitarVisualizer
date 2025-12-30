import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Fretboard } from './components/visuals/Fretboard';
import { ControlPanel } from './components/controls/ControlPanel';
import { ChordHeader } from './components/controls/ChordHeader';
import { AppHeader } from './components/layout/AppHeader';
import { useMusicStore } from './store/useMusicStore';
import { decodeTuningFromUrl } from './config/constants';
import { unlockIOSAudio } from './lib/ios-audio-unlock';
import type { StringIndex } from './types';
import './App.css';

function App() {
  const { setFret, setTuning } = useMusicStore();
  const audioWarmedRef = useRef(false);

  // Parse URL params on mount to restore shared chord
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('s');
    const tuningParam = params.get('t');

    // Apply tuning first (before setting frets)
    if (tuningParam) {
      const decoded = decodeTuningFromUrl(tuningParam);
      if (decoded) {
        // Use 'clear' mode since we're restoring state from URL
        setTuning(decoded.tuning, decoded.name, 'clear');
      }
    }

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
  }, [setFret, setTuning]);

  // iOS PWA fix: Pre-warm audio context on first touch anywhere
  // This helps iOS PWA mode recognize the user gesture before Play is tapped
  useEffect(() => {
    const warmUpAudio = async () => {
      if (audioWarmedRef.current) return;
      audioWarmedRef.current = true;

      // Unlock iOS audio (silent audio element)
      unlockIOSAudio();

      // Start Tone.js audio context
      if (Tone.getContext().state !== 'running') {
        try {
          await Tone.start();
          console.log('Audio context pre-warmed on first touch');
        } catch (e) {
          console.warn('Audio pre-warm failed:', e);
        }
      }
    };

    // Listen for first touch/click anywhere
    document.addEventListener('touchstart', warmUpAudio, { once: true });
    document.addEventListener('click', warmUpAudio, { once: true });

    return () => {
      document.removeEventListener('touchstart', warmUpAudio);
      document.removeEventListener('click', warmUpAudio);
    };
  }, []);

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
