import { useRef, useEffect, useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import {
  FRET_COUNT,
  STRING_COUNT,
  MARKER_FRETS,
  DOUBLE_MARKER_FRETS,
  FRETBOARD_DIMENSIONS as BASE_DIM,
} from '../../config/constants';
import { COLORS } from '../../config/theme';
import { Note } from '@tonaljs/tonal';
import type { StringIndex } from '../../types';
import styles from './Fretboard.module.css';

/** Calculate the note at a given string and fret */
function getNoteAtPosition(stringIndex: number, fret: number, tuning: readonly string[]): string {
  const openNote = tuning[stringIndex];
  const midi = Note.midi(openNote);
  if (midi === null) return '';
  const newMidi = midi + fret;
  return Note.fromMidi(newMidi);
}

/** Get just the note name without octave */
function getNoteName(fullNote: string): string {
  return Note.pitchClass(fullNote) || fullNote;
}

/** String thickness by index (0=low E, 5=high E) */
const STRING_THICKNESS = [2.5, 2.0, 1.6, 1.3, 1.0, 0.8];

interface FretboardProps {
  playFretNote: (stringIndex: StringIndex, fret: number) => Promise<void>;
}

export function Fretboard({ playFretNote }: FretboardProps) {
  const { guitarStringState, setFret, clearString, displayMode, targetRoot, detectedChord, tuning } = useMusicStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile for larger string spacing (better tap targets)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Use mobile string spacing for larger tap targets
  const DIM = {
    ...BASE_DIM,
    STRING_SPACING: isMobile ? BASE_DIM.STRING_SPACING_MOBILE : BASE_DIM.STRING_SPACING,
  };

  // Determine the root note to use for interval coloring
  const colorRoot = targetRoot || (detectedChord?.bassNote) || null;

  // Auto-scroll to keep active frets visible when voicing changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Get all active fret positions (non-null, non-zero for more useful centering)
    const activeFrets = Object.values(guitarStringState).filter(
      (fret): fret is number => fret !== null && fret > 0
    );

    if (activeFrets.length === 0) return;

    // Find the bounds of the voicing
    const minFret = Math.min(...activeFrets);
    const maxFret = Math.max(...activeFrets);
    const centerFret = (minFret + maxFret) / 2;

    // Get the scale factor (SVG width vs actual container scroll width)
    const svgWidth = DIM.PADDING * 2 + DIM.NUT_WIDTH + FRET_COUNT * DIM.FRET_SPACING;
    const scrollWidth = container.scrollWidth;
    const containerWidth = container.clientWidth;

    // Only proceed if there's actual overflow (mobile)
    if (scrollWidth <= containerWidth) return;

    const scale = scrollWidth / svgWidth;

    // Calculate x positions for min/max frets
    const minFretX = (DIM.PADDING + DIM.NUT_WIDTH + (minFret - 0.5) * DIM.FRET_SPACING) * scale;
    const maxFretX = (DIM.PADDING + DIM.NUT_WIDTH + (maxFret - 0.5) * DIM.FRET_SPACING) * scale;

    // Current visible bounds with margin (don't scroll if voicing is comfortably visible)
    const margin = 60; // px margin before triggering scroll
    const visibleLeft = container.scrollLeft + margin;
    const visibleRight = container.scrollLeft + containerWidth - margin;

    // Check if voicing is already within visible bounds
    const isVisible = minFretX >= visibleLeft && maxFretX <= visibleRight;

    if (!isVisible) {
      // Calculate target scroll position to center the voicing
      const centerX = (DIM.PADDING + DIM.NUT_WIDTH + (centerFret - 0.5) * DIM.FRET_SPACING) * scale;
      const targetScroll = centerX - containerWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [guitarStringState]);

  // Calculate SVG dimensions (extra 4px bottom padding for fret numbers)
  const width = DIM.PADDING * 2 + DIM.NUT_WIDTH + FRET_COUNT * DIM.FRET_SPACING;
  const height = DIM.PADDING * 2 + (STRING_COUNT - 1) * DIM.STRING_SPACING + 4;

  // X position for a given fret
  const getFretX = (fret: number): number => {
    if (fret === 0) return DIM.PADDING + DIM.NUT_WIDTH / 2;
    return DIM.PADDING + DIM.NUT_WIDTH + (fret - 0.5) * DIM.FRET_SPACING;
  };

  // Y position for a given string (0 = Low E at bottom visually)
  const getStringY = (stringIndex: number): number => {
    return DIM.PADDING + (STRING_COUNT - 1 - stringIndex) * DIM.STRING_SPACING;
  };

  // Handle click on a fret position
  const handleFretClick = (stringIndex: StringIndex, fret: number) => {
    const currentFret = guitarStringState[stringIndex];
    if (currentFret === fret) {
      clearString(stringIndex);
    } else {
      setFret(stringIndex, fret);
      // playFretNote handles the audio loaded check internally
      playFretNote(stringIndex, fret);
    }
  };

  // Render fret lines
  const renderFrets = () => {
    const frets = [];

    // Nut (fret 0) - thicker, bone colored
    frets.push(
      <rect
        key="nut"
        x={DIM.PADDING}
        y={DIM.PADDING - 5}
        width={DIM.NUT_WIDTH + 2}
        height={height - DIM.PADDING * 2 + 10}
        fill={COLORS.fretboard.nut}
        rx={2}
      />
    );

    // Regular frets
    for (let i = 1; i <= FRET_COUNT; i++) {
      const x = DIM.PADDING + DIM.NUT_WIDTH + i * DIM.FRET_SPACING;
      frets.push(
        <rect
          key={`fret-${i}`}
          x={x - DIM.FRET_WIDTH / 2}
          y={DIM.PADDING - 2}
          width={DIM.FRET_WIDTH}
          height={height - DIM.PADDING * 2 + 4}
          fill={COLORS.fretboard.fret}
        />
      );
    }

    return frets;
  };

  // Render position markers (dots) - now darker/inset
  const renderMarkers = () => {
    const markers = [];
    const centerY = height / 2;

    for (const fret of MARKER_FRETS) {
      if (fret > FRET_COUNT) continue;

      const x = DIM.PADDING + DIM.NUT_WIDTH + (fret - 0.5) * DIM.FRET_SPACING;

      if (DOUBLE_MARKER_FRETS.includes(fret as typeof DOUBLE_MARKER_FRETS[number])) {
        markers.push(
          <circle
            key={`marker-${fret}-1`}
            cx={x}
            cy={centerY - DIM.STRING_SPACING}
            r={DIM.MARKER_RADIUS}
            fill={COLORS.fretboard.marker}
          />,
          <circle
            key={`marker-${fret}-2`}
            cx={x}
            cy={centerY + DIM.STRING_SPACING}
            r={DIM.MARKER_RADIUS}
            fill={COLORS.fretboard.marker}
          />
        );
      } else {
        markers.push(
          <circle
            key={`marker-${fret}`}
            cx={x}
            cy={centerY}
            r={DIM.MARKER_RADIUS}
            fill={COLORS.fretboard.marker}
          />
        );
      }
    }

    return markers;
  };

  // Render strings with varying thickness
  const renderStrings = () => {
    const strings = [];

    for (let i = 0; i < STRING_COUNT; i++) {
      const y = getStringY(i);
      const thickness = STRING_THICKNESS[i];

      strings.push(
        <line
          key={`string-${i}`}
          x1={DIM.PADDING}
          y1={y}
          x2={width - DIM.PADDING}
          y2={y}
          stroke={COLORS.fretboard.string}
          strokeWidth={thickness}
        />
      );
    }

    return strings;
  };

  // Render string labels (derived from current tuning)
  const renderStringLabels = () => {
    return tuning.map((noteWithOctave, i) => {
      const noteName = Note.pitchClass(noteWithOctave) || noteWithOctave;
      return (
        <text
          key={`label-${i}`}
          x={4}
          y={getStringY(i) + 5}
          textAnchor="start"
          fill={COLORS.ui.textMuted}
          fontSize={16}
          fontFamily="monospace"
        >
          {noteName}
        </text>
      );
    });
  };

  // Render fret numbers (skip 0 - users learn to tap the nut)
  const renderFretNumbers = () => {
    const numbers = [];
    for (let fret = 1; fret <= FRET_COUNT; fret++) {
      const x = getFretX(fret);
      numbers.push(
        <text
          key={`fretnum-${fret}`}
          x={x}
          y={height - 2}
          textAnchor="middle"
          fill={COLORS.ui.textMuted}
          fontSize={16}
          fontFamily="monospace"
        >
          {fret}
        </text>
      );
    }
    return numbers;
  };

  // Render clickable areas
  const renderClickAreas = () => {
    const areas = [];

    for (let stringIndex = 0; stringIndex < STRING_COUNT; stringIndex++) {
      for (let fret = 0; fret <= FRET_COUNT; fret++) {
        const x = getFretX(fret);
        const y = getStringY(stringIndex);

        areas.push(
          <circle
            key={`click-${stringIndex}-${fret}`}
            cx={x}
            cy={y}
            r={DIM.DOT_RADIUS + 2}
            fill="transparent"
            className={styles.clickArea}
            onClick={() => handleFretClick(stringIndex as StringIndex, fret)}
          />
        );
      }
    }

    return areas;
  };

  // Render active notes with glow effects
  const renderActiveNotes = () => {
    const notes = [];

    for (let stringIndex = 0; stringIndex < STRING_COUNT; stringIndex++) {
      const fret = guitarStringState[stringIndex as StringIndex];
      if (fret === null) continue;

      const x = getFretX(fret);
      const y = getStringY(stringIndex);
      const fullNote = getNoteAtPosition(stringIndex, fret, tuning);
      const noteName = getNoteName(fullNote);

      // Determine color and interval label based on semitone distance from root
      let color: string = COLORS.intervals.extension;
      let semitones = -1;
      let intervalLabel = '';

      // Map semitones to interval degree labels
      const getIntervalLabel = (semi: number): string => {
        const labels: Record<number, string> = {
          0: 'R',
          1: '♭2',
          2: '2',
          3: '♭3',
          4: '3',
          5: '4',
          6: '♭5',
          7: '5',
          8: '♯5',
          9: '6',
          10: '♭7',
          11: '7',
        };
        return labels[semi] ?? String(semi);
      };

      if (colorRoot) {
        const rootMidi = Note.midi(colorRoot + '4') || 60;
        const noteMidi = Note.midi(fullNote) || 60;
        semitones = (noteMidi - rootMidi + 120) % 12;
        intervalLabel = getIntervalLabel(semitones);

        if (semitones === 0) {
          color = COLORS.intervals.root;
        } else if (semitones === 3 || semitones === 4) {
          color = COLORS.intervals.third;
        } else if (semitones === 7) {
          color = COLORS.intervals.fifth;
        } else if (semitones === 10 || semitones === 11) {
          color = COLORS.intervals.seventh;
        }
      } else {
        color = COLORS.ui.primary;
      }

      notes.push(
        <g key={`note-${stringIndex}-${fret}`} style={{ pointerEvents: 'none' }}>
          <circle
            cx={x}
            cy={y}
            r={DIM.DOT_RADIUS}
            fill={color}
            className={styles.noteDot}
          />
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {displayMode === 'notes' || semitones === -1
              ? noteName
              : intervalLabel}
          </text>
        </g>
      );
    }

    return notes;
  };

  return (
    <div className={styles.fretboardWrapper}>
      <div className={styles.fretboardContainer} ref={containerRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className={styles.fretboardSvg}
        >
          {/* Background */}
          <rect
            x={DIM.PADDING + DIM.NUT_WIDTH}
            y={DIM.PADDING - 10}
            width={FRET_COUNT * DIM.FRET_SPACING}
            height={height - DIM.PADDING * 2 + 20}
            fill={COLORS.fretboard.wood}
            rx={4}
          />

          {/* Position markers */}
          {renderMarkers()}

          {/* Frets */}
          {renderFrets()}

          {/* Strings */}
          {renderStrings()}

          {/* String labels */}
          {renderStringLabels()}

          {/* Fret numbers */}
          {renderFretNumbers()}

          {/* Active notes */}
          {renderActiveNotes()}

          {/* Clickable areas */}
          {renderClickAreas()}
        </svg>
      </div>
      {/* Scroll hint gradient (mobile only) */}
      <div className={styles.scrollHint} />
    </div>
  );
}
