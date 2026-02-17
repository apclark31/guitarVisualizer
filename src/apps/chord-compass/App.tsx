import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Fretboard } from './components/visuals/Fretboard';
import { ControlPanel } from './components/controls/ControlPanel';
import { ChordHeader } from './components/controls/ChordHeader';
import { AppHeader } from '../../shared/components/layout/AppHeader';
import { useMusicStore } from './store/useMusicStore';
import { useAudioEngine } from './hooks/useAudioEngine';
import { decodeTuningFromUrl, decodeKeyFromUrl } from './config/constants';
import { unlockIOSAudio } from '../../shared/lib/ios-audio-unlock';
import type { StringIndex, GuitarStringState } from './types';
import './App.css';

function App() {
  const { restoreFromUrl } = useMusicStore();
  const audioWarmedRef = useRef(false);
  const { isLoaded, playChord, playFretNote, playNote, playNotes } = useAudioEngine();

  // Parse URL params on mount to restore shared chord
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('s');
    const tuningParam = params.get('t');
    const rootParam = params.get('r');
    const qualityParam = params.get('q');
    const voicingParam = params.get('v');
    const keyParam = params.get('k');

    if (sharedState) {
      // Parse guitar state from URL
      const guitarState: GuitarStringState = {
        0: null, 1: null, 2: null, 3: null, 4: null, 5: null
      };

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
          guitarState[stringIndex as StringIndex] = fret;
        }
      }

      // Parse tuning if provided
      let tuning: string[] | undefined;
      let tuningName: string | undefined;
      if (tuningParam) {
        const decoded = decodeTuningFromUrl(tuningParam);
        if (decoded) {
          tuning = decoded.tuning;
          tuningName = decoded.name;
        }
      }

      // Parse voicing index if provided
      const voicingIndex = voicingParam ? parseInt(voicingParam, 10) : undefined;

      // Parse key context if provided
      const keyContext = keyParam ? decodeKeyFromUrl(keyParam) : undefined;

      // Restore full state in one action
      restoreFromUrl({
        guitarState,
        tuning,
        tuningName,
        root: rootParam || undefined,
        quality: qualityParam || undefined,
        voicingIndex: isNaN(voicingIndex as number) ? undefined : voicingIndex,
        keyContext: keyContext || undefined,
      });

      // Clean up URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [restoreFromUrl]);

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
          <ChordHeader playNotes={playNotes} />
        </div>

        <main className="main">
          <section className="visualizer">
            <Fretboard playFretNote={playFretNote} />
          </section>
        </main>

        <div className="controlsBar">
          <ControlPanel
            isAudioLoaded={isLoaded}
            playChord={playChord}
            playNote={playNote}
          />
        </div>

        <footer className="footer">
          <p>Made with ☕ and 🎸 by Alex in PDX</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
