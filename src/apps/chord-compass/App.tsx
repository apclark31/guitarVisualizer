import { useEffect, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { Note } from '@tonaljs/tonal';
import { Fretboard } from './components/visuals/Fretboard';
import { ControlPanel } from './components/controls/ControlPanel';
import { ChordHeader } from './components/controls/ChordHeader';
import { AppHeader } from '../../shared/components/layout/AppHeader';
import { Card } from '../../shared/components/Card';
import { IntervalMap } from '../../shared/components/IntervalMap';
import type { IntervalEntry } from '../../shared/components/IntervalMap';
import { useMusicStore } from './store/useMusicStore';
import { useSharedStore } from '../../shared/store';
import { useAudioEngine } from './hooks/useAudioEngine';
import { decodeTuningFromUrl, decodeKeyFromUrl } from './config/constants';
import { unlockIOSAudio } from '../../shared/lib/ios-audio-unlock';
import { getNoteAtPosition } from '../../shared/lib';
import type { StringIndex, GuitarStringState } from './types';
import './App.css';

/** Semitone → interval label map */
const INTERVAL_LABELS: Record<number, string> = {
  0: 'R', 1: '\u266D2', 2: '2', 3: '\u266D3', 4: '3',
  5: '4', 6: '\u266D5', 7: '5', 8: '\u266F5', 9: '6',
  10: '\u266D7', 11: '7',
};

function App() {
  const { restoreFromUrl, guitarStringState: ccGuitarState, targetRoot, detectedChord } = useMusicStore();
  const { tuning } = useSharedStore();
  const audioWarmedRef = useRef(false);
  const { isLoaded, playChord, playFretNote, playNote, playNotes } = useAudioEngine();

  // Compute interval entries for IntervalMap
  const intervalEntries: IntervalEntry[] = useMemo(() => {
    const rootNote = targetRoot || detectedChord?.bassNote || null;
    if (!rootNote) return [];

    const seen = new Set<number>();
    const entries: IntervalEntry[] = [];
    const rootMidi = Note.midi(rootNote + '4') || 60;

    for (let s = 0; s < 6; s++) {
      const fret = ccGuitarState[s as StringIndex];
      if (fret === null) continue;

      const fullNote = getNoteAtPosition(s, fret, tuning);
      const noteName = Note.pitchClass(fullNote) || fullNote;
      const noteMidi = Note.midi(fullNote) || 60;
      const semitones = (noteMidi - rootMidi + 120) % 12;

      if (!seen.has(semitones)) {
        seen.add(semitones);
        entries.push({
          label: INTERVAL_LABELS[semitones] ?? String(semitones),
          note: noteName,
          semitones,
        });
      }
    }

    // Sort by semitones (root first)
    entries.sort((a, b) => a.semitones - b.semitones);
    return entries;
  }, [ccGuitarState, targetRoot, detectedChord, tuning]);

  // Set document title for this app
  useEffect(() => {
    document.title = 'Chord Compass | Fret Atlas';
    return () => {
      document.title = 'Fret Atlas';
    };
  }, []);

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
          {intervalEntries.length > 0 && (
            <Card title="Interval Map" className="intervalMapCard">
              <IntervalMap intervals={intervalEntries} />
            </Card>
          )}
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
