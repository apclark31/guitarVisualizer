import { ImageResponse } from '@vercel/og';
import { createElement as h } from 'react';

export const config = { runtime: 'edge' };

const NOTE_CHROMAS: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4, 'E#': 5, 'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11, 'B#': 0,
};

const STRING_CHROMAS = [4, 9, 2, 7, 11, 4];
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'E'];
const MARKER_FRETS = [3, 5, 7, 9];

const SCALE_INTERVALS: Record<string, number[]> = {
  'major': [0,2,4,5,7,9,11], 'dorian': [0,2,3,5,7,9,10],
  'phrygian': [0,1,3,5,7,8,10], 'lydian': [0,2,4,6,7,9,11],
  'mixolydian': [0,2,4,5,7,9,10], 'minor': [0,2,3,5,7,8,10],
  'locrian': [0,1,3,5,6,8,10],
  'melodic-minor': [0,2,3,5,7,9,11], 'dorian-b2': [0,1,3,5,7,9,10],
  'lydian-augmented': [0,2,4,6,8,9,11], 'lydian-dominant': [0,2,4,6,7,9,10],
  'mixolydian-b6': [0,2,4,5,7,8,10], 'locrian-nat2': [0,2,3,5,6,8,10],
  'altered': [0,1,3,4,6,8,10],
  'harmonic-minor': [0,2,3,5,7,8,11], 'locrian-nat6': [0,1,3,5,6,9,10],
  'ionian-augmented': [0,2,4,5,8,9,11], 'dorian-sharp4': [0,2,3,6,7,9,10],
  'phrygian-dominant': [0,1,4,5,7,8,10], 'lydian-sharp9': [0,3,4,6,7,9,11],
  'ultralocrian': [0,1,3,4,6,8,9],
  'major-pentatonic': [0,2,4,7,9], 'minor-pentatonic': [0,3,5,7,10],
  'blues': [0,3,5,6,7,10], 'major-blues': [0,2,3,4,7,9],
  'whole-tone': [0,2,4,6,8,10], 'diminished-hw': [0,1,3,4,6,7,9,10],
  'diminished-wh': [0,2,3,5,6,8,9,11], 'augmented': [0,3,4,7,8,11],
  'bebop': [0,2,4,5,7,9,10,11], 'bebop-major': [0,2,4,5,7,8,9,11],
  'bebop-minor': [0,2,3,4,5,7,9,10], 'bebop-locrian': [0,1,3,5,6,7,8,10],
  'double-harmonic-major': [0,1,4,5,7,8,11], 'harmonic-major': [0,2,4,5,7,8,11],
  'hungarian-minor': [0,2,3,6,7,8,11], 'hungarian-major': [0,3,4,6,7,9,10],
  'persian': [0,1,4,5,6,8,11], 'enigmatic': [0,1,4,6,8,10,11],
  'flamenco': [0,1,4,5,7,8,11], 'oriental': [0,1,4,5,6,9,10],
  'hirajoshi': [0,2,3,7,8], 'in-sen': [0,1,5,7,10],
  'iwato': [0,1,5,6,10], 'kumoi': [0,2,3,7,9],
  'pelog': [0,1,3,7,8], 'chinese': [0,4,6,7,11], 'egyptian': [0,2,5,7,10],
};

const SCALE_DISPLAY: Record<string, string> = {
  'major': 'Ionian (Major)', 'minor': 'Aeolian (Natural Minor)',
  'dorian': 'Dorian', 'phrygian': 'Phrygian', 'lydian': 'Lydian',
  'mixolydian': 'Mixolydian', 'locrian': 'Locrian',
  'melodic-minor': 'Melodic Minor', 'dorian-b2': 'Dorian b2',
  'lydian-augmented': 'Lydian Augmented', 'lydian-dominant': 'Lydian Dominant',
  'mixolydian-b6': 'Mixolydian b6', 'locrian-nat2': 'Locrian #2', 'altered': 'Altered',
  'harmonic-minor': 'Harmonic Minor', 'locrian-nat6': 'Locrian #6',
  'ionian-augmented': 'Ionian #5', 'dorian-sharp4': 'Dorian #4',
  'phrygian-dominant': 'Phrygian Dominant', 'lydian-sharp9': 'Lydian #2',
  'ultralocrian': 'Ultralocrian',
  'major-pentatonic': 'Major Pentatonic', 'minor-pentatonic': 'Minor Pentatonic',
  'blues': 'Blues', 'major-blues': 'Major Blues',
  'whole-tone': 'Whole Tone', 'diminished-hw': 'Diminished (H-W)',
  'diminished-wh': 'Diminished (W-H)', 'augmented': 'Augmented',
  'bebop': 'Bebop Dominant', 'bebop-major': 'Bebop Major',
  'bebop-minor': 'Bebop Minor', 'bebop-locrian': 'Bebop Locrian',
  'double-harmonic-major': 'Double Harmonic Major', 'harmonic-major': 'Harmonic Major',
  'hungarian-minor': 'Hungarian Minor', 'hungarian-major': 'Hungarian Major',
  'persian': 'Persian', 'enigmatic': 'Enigmatic', 'flamenco': 'Flamenco',
  'oriental': 'Oriental', 'hirajoshi': 'Hirajoshi', 'in-sen': 'In-Sen',
  'iwato': 'Iwato', 'kumoi': 'Kumoi', 'pelog': 'Pelog',
  'chinese': 'Chinese', 'egyptian': 'Egyptian',
};

function getIntervalColor(semitone: number): string {
  const s = ((semitone % 12) + 12) % 12;
  if (s === 0) return '#ef4444';
  if (s === 3 || s === 4) return '#3b82f6';
  if (s === 7) return '#22c55e';
  if (s === 10 || s === 11) return '#eab308';
  return '#a855f7';
}

function formatSlug(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

interface FretNote { stringIdx: number; fret: number; color: string; isRoot: boolean; }

function computeScaleNotes(root: string, scaleSlug: string): FretNote[] {
  const rootChroma = NOTE_CHROMAS[root];
  const intervals = SCALE_INTERVALS[scaleSlug];
  if (rootChroma === undefined || !intervals) return [];
  const scaleChromas = intervals.map(i => (rootChroma + i) % 12);
  const notes: FretNote[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= 12; f++) {
      const chroma = (STRING_CHROMAS[s] + f) % 12;
      const idx = scaleChromas.indexOf(chroma);
      if (idx !== -1) {
        notes.push({ stringIdx: s, fret: f, color: getIntervalColor(intervals[idx]), isRoot: intervals[idx] === 0 });
      }
    }
  }
  return notes;
}

const FRET_W = 78;
const STRING_GAP = 34;
const DOT_SIZE = 22;
const NUT_W = 4;
const FRET_COUNT = 12;
const LABEL_W = 28;

function buildFretboard(notes: FretNote[]) {
  const boardW = LABEL_W + NUT_W + FRET_COUNT * FRET_W;

  const stringLabels = [5, 4, 3, 2, 1, 0].map(s =>
    h('div', { key: `lbl-${s}`, style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 14, color: '#a3a3a3', fontSize: 11, fontWeight: 500 } }, STRING_LABELS[s])
  );

  const fretLines = Array.from({ length: FRET_COUNT }, (_, f) =>
    h('div', { key: `fl-${f}`, style: { display: 'flex', position: 'absolute' as const, left: (f + 1) * FRET_W - 1, top: 0, width: 2, height: '100%', backgroundColor: '#71706e' } })
  );

  const markers = MARKER_FRETS.map(f =>
    h('div', { key: `mk-${f}`, style: { display: 'flex', position: 'absolute' as const, left: (f - 1) * FRET_W + FRET_W / 2 - 5, top: 5 * STRING_GAP / 2 + DOT_SIZE / 2 - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#292524' } })
  );
  markers.push(
    h('div', { key: 'mk-12a', style: { display: 'flex', position: 'absolute' as const, left: 11 * FRET_W + FRET_W / 2 - 5, top: STRING_GAP + DOT_SIZE / 2 - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#292524' } }),
    h('div', { key: 'mk-12b', style: { display: 'flex', position: 'absolute' as const, left: 11 * FRET_W + FRET_W / 2 - 5, top: 4 * STRING_GAP + DOT_SIZE / 2 - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#292524' } })
  );

  const strings = [5, 4, 3, 2, 1, 0].map((s, i) => {
    const thickness = [2.5, 2.0, 1.6, 1.3, 1.0, 0.8][s];
    return h('div', { key: `str-${s}`, style: { display: 'flex', position: 'absolute' as const, left: 0, right: 0, top: i * STRING_GAP + DOT_SIZE / 2 - thickness / 2, height: Math.max(thickness, 1), backgroundColor: '#b0afad', opacity: 0.6 } });
  });

  const dots = notes.map((n, i) => {
    const row = 5 - n.stringIdx;
    const x = n.fret === 0 ? -DOT_SIZE / 2 : (n.fret - 1) * FRET_W + FRET_W / 2 - DOT_SIZE / 2;
    const y = row * STRING_GAP;
    return h('div', { key: `dot-${i}`, style: { display: 'flex', position: 'absolute' as const, left: x, top: y, width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: n.color, opacity: n.isRoot ? 1 : 0.85 } });
  });

  const fretNums = Array.from({ length: FRET_COUNT }, (_, f) =>
    h('div', { key: `fn-${f}`, style: { display: 'flex', width: FRET_W, justifyContent: 'center', color: '#525252', fontSize: 11, paddingTop: 4 } }, String(f + 1))
  );

  return h('div', { style: { display: 'flex', flexDirection: 'column' as const } },
    h('div', { style: { display: 'flex', width: boardW, height: 5 * STRING_GAP + DOT_SIZE, backgroundColor: '#3d3533', borderRadius: 8, overflow: 'hidden' } },
      h('div', { style: { display: 'flex', flexDirection: 'column' as const, width: LABEL_W, paddingTop: DOT_SIZE / 2 - 7, gap: STRING_GAP - 14 } }, ...stringLabels),
      h('div', { style: { display: 'flex', width: NUT_W, backgroundColor: '#fafaf9', borderRadius: 2 } }),
      h('div', { style: { display: 'flex', position: 'relative' as const, flex: 1 } }, ...fretLines, ...markers, ...strings, ...dots),
    ),
    h('div', { style: { display: 'flex', paddingLeft: LABEL_W + NUT_W } }, ...fretNums),
  );
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const root = url.searchParams.get('r');
  const scaleSlug = url.searchParams.get('s');
  const quality = url.searchParams.get('q');
  const key = url.searchParams.get('k');

  let title = 'Fret Atlas';
  let subtitle = 'Interactive guitar fretboard toolkit';
  let fretNotes: FretNote[] = [];

  if (root && scaleSlug) {
    const displayName = SCALE_DISPLAY[scaleSlug] || formatSlug(scaleSlug);
    title = `${root} ${displayName}`;
    subtitle = 'Interactive scale positions, intervals & audio playback';
    fretNotes = computeScaleNotes(root, scaleSlug);
  } else if (root && quality) {
    title = `${root} ${quality}`;
    subtitle = 'Interactive chord voicings, intervals & audio playback';
  } else if (key) {
    const keyRoot = key.replace(/maj|min/i, '').toUpperCase();
    const keyType = key.toLowerCase().includes('min') ? 'Minor' : 'Major';
    title = `Progression in ${keyRoot} ${keyType}`;
    subtitle = 'Build and play chord progressions with interactive playback';
  }

  const accentDots = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'].map((c, i) =>
    h('div', { key: `a-${i}`, style: { display: 'flex', width: 40, height: 6, borderRadius: 3, backgroundColor: c } })
  );

  const element = h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' as const, backgroundColor: '#121212', padding: '44px 52px', fontFamily: 'Inter, sans-serif' },
  },
    h('div', { style: { display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const } },
      h('div', { style: { display: 'flex', color: '#3b82f6', fontSize: 20, fontWeight: 700, letterSpacing: 1.5 } }, 'FRET ATLAS'),
      h('div', { style: { display: 'flex', color: '#525252', fontSize: 16 } }, 'fretatlas.com'),
    ),
    h('div', { style: { display: 'flex', flexDirection: 'column' as const, marginTop: 28 } },
      h('div', { style: { display: 'flex', color: '#ffffff', fontSize: 48, fontWeight: 700, lineHeight: 1.1 } }, title),
      h('div', { style: { display: 'flex', color: '#a3a3a3', fontSize: 20, marginTop: 8 } }, subtitle),
    ),
    fretNotes.length > 0
      ? h('div', { style: { display: 'flex', marginTop: 32, justifyContent: 'center' as const } }, buildFretboard(fretNotes))
      : h('div', { style: { display: 'flex', marginTop: 'auto', marginBottom: 20, gap: 8 } }, ...accentDots),
  );

  return new ImageResponse(element, { width: 1200, height: 630 });
}
