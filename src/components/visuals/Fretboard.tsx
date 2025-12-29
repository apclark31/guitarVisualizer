import { useRef, useEffect } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import {
  FRET_COUNT,
  STRING_COUNT,
  STANDARD_TUNING,
  TUNING_NOTES,
  MARKER_FRETS,
  DOUBLE_MARKER_FRETS,
  FRETBOARD_DIMENSIONS as DIM,
} from '../../config/constants';
import { COLORS } from '../../config/theme';
import { Note } from '@tonaljs/tonal';
import type { StringIndex } from '../../types';
import styles from './Fretboard.module.css';

/** Calculate the note at a given string and fret */
function getNoteAtPosition(stringIndex: number, fret: number): string {
  const openNote = STANDARD_TUNING[stringIndex];
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

export function Fretboard() {
  const { guitarStringState, setFret, clearString, displayMode, targetRoot, detectedChord } = useMusicStore();
  const { playFretNote, isLoaded } = useAudioEngine();
  const containerRef = useRef<HTMLDivElement>(null);

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

    // Find the center of the voicing
    const minFret = Math.min(...activeFrets);
    const maxFret = Math.max(...activeFrets);
    const centerFret = (minFret + maxFret) / 2;

    // Calculate the x position of the center fret in SVG coordinates
    const centerX = DIM.PADDING + DIM.NUT_WIDTH + (centerFret - 0.5) * DIM.FRET_SPACING;

    // Get the scale factor (SVG width vs actual container scroll width)
    const svgWidth = DIM.PADDING * 2 + DIM.NUT_WIDTH + FRET_COUNT * DIM.FRET_SPACING;
    const scrollWidth = container.scrollWidth;
    const scale = scrollWidth / svgWidth;

    // Calculate target scroll position to center the voicing
    const scaledCenterX = centerX * scale;
    const containerWidth = container.clientWidth;
    const targetScroll = scaledCenterX - containerWidth / 2;

    // Only scroll on mobile (when there's actual overflow)
    if (scrollWidth > containerWidth) {
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [guitarStringState]);

  // Calculate SVG dimensions
  const width = DIM.PADDING * 2 + DIM.NUT_WIDTH + FRET_COUNT * DIM.FRET_SPACING;
  const height = DIM.PADDING * 2 + (STRING_COUNT - 1) * DIM.STRING_SPACING;

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
      if (isLoaded) {
        playFretNote(stringIndex, fret);
      }
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

  // Render string labels
  const renderStringLabels = () => {
    return TUNING_NOTES.map((note, i) => (
      <text
        key={`label-${i}`}
        x={DIM.PADDING - 10}
        y={getStringY(i) + 4}
        textAnchor="end"
        fill={COLORS.ui.textMuted}
        fontSize={12}
        fontFamily="monospace"
      >
        {note}
      </text>
    ));
  };

  // Render fret numbers
  const renderFretNumbers = () => {
    const numbers = [];
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      const x = getFretX(fret);
      numbers.push(
        <text
          key={`fretnum-${fret}`}
          x={x}
          y={height - 5}
          textAnchor="middle"
          fill={COLORS.ui.textMuted}
          fontSize={10}
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
      const fullNote = getNoteAtPosition(stringIndex, fret);
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
