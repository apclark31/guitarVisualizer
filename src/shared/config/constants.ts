// Shared guitar and music constants - NO MAGIC NUMBERS
// Used across Fret Atlas apps (Chord Compass, Scale Sage)

/** Standard guitar tuning (Low E to High E) */
export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] as const;

/** Tuning category types */
export const TUNING_CATEGORIES = ['Standard', 'Drop', 'Open', 'Modal', 'Special'] as const;
export type TuningCategory = typeof TUNING_CATEGORIES[number];

/** Tuning preset definition */
export interface TuningPreset {
  name: string;
  notes: readonly string[];
  category: TuningCategory;
}

/** All available tuning presets */
export const TUNING_PRESETS: TuningPreset[] = [
  // Standard tunings
  { name: 'Standard', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], category: 'Standard' },
  { name: 'Half-step Down', notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'], category: 'Standard' },
  { name: 'D Standard', notes: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'], category: 'Standard' },
  { name: 'C Standard', notes: ['C2', 'F2', 'Bb2', 'Eb3', 'G3', 'C4'], category: 'Standard' },
  { name: 'B Standard', notes: ['B1', 'E2', 'A2', 'D3', 'Gb3', 'B3'], category: 'Standard' },
  // Drop tunings
  { name: 'Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], category: 'Drop' },
  { name: 'Drop C', notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'], category: 'Drop' },
  { name: 'Drop B', notes: ['B1', 'Gb2', 'B2', 'E3', 'Ab3', 'Db4'], category: 'Drop' },
  { name: 'Drop A', notes: ['A1', 'E2', 'A2', 'D3', 'Gb3', 'B3'], category: 'Drop' },
  { name: 'Double Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'], category: 'Drop' },
  // Open tunings
  { name: 'Open D', notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], category: 'Open' },
  { name: 'Open E', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], category: 'Open' },
  { name: 'Open G', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'], category: 'Open' },
  { name: 'Open A', notes: ['E2', 'A2', 'E3', 'A3', 'C#4', 'E4'], category: 'Open' },
  { name: 'Open C', notes: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'], category: 'Open' },
  // Modal tunings
  { name: 'DADGAD', notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'], category: 'Modal' },
  { name: 'DADGBD', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'], category: 'Modal' },
  { name: 'CGCGCE', notes: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'], category: 'Modal' },
  // Special tunings
  { name: 'Nashville', notes: ['E3', 'A3', 'D4', 'G4', 'B3', 'E4'], category: 'Special' },
  { name: 'All Fourths', notes: ['E2', 'A2', 'D3', 'G3', 'C4', 'F4'], category: 'Special' },
];

/** Get tuning preset by name */
export function getTuningByName(name: string): TuningPreset | undefined {
  return TUNING_PRESETS.find(t => t.name === name);
}

/** Check if a tuning array matches a preset, return preset name or 'Custom' */
export function getTuningName(notes: readonly string[]): string {
  const preset = TUNING_PRESETS.find(t =>
    t.notes.length === notes.length &&
    t.notes.every((note, i) => note === notes[i])
  );
  return preset?.name ?? 'Custom';
}

/** Get tunings by category */
export function getTuningsByCategory(category: TuningCategory): TuningPreset[] {
  return TUNING_PRESETS.filter(t => t.category === category);
}

/** Convert tuning preset name to URL slug (camelCase) */
function toSlug(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/^(.)/, (c) => c.toLowerCase());
}

/** Map preset names to URL slugs */
const TUNING_SLUG_MAP: Record<string, string> = Object.fromEntries(
  TUNING_PRESETS.map(t => [toSlug(t.name), t.name])
);

/** Encode tuning for URL - returns slug for presets, hyphenated notes for custom */
export function encodeTuningForUrl(notes: readonly string[]): string {
  const presetName = getTuningName(notes);
  if (presetName !== 'Custom') {
    const slug = toSlug(presetName);
    // Standard is default, don't include in URL
    if (slug === 'standard') return '';
    return slug;
  }
  // Custom tuning: join notes with hyphens
  return notes.join('-');
}

/** Decode tuning from URL - returns [tuning, name] or null if invalid */
export function decodeTuningFromUrl(value: string): { tuning: string[]; name: string } | null {
  if (!value) return null;

  // Check if it's a preset slug
  const presetName = TUNING_SLUG_MAP[value];
  if (presetName) {
    const preset = getTuningByName(presetName);
    if (preset) {
      return { tuning: [...preset.notes], name: preset.name };
    }
  }

  // Check if it's a custom tuning (hyphenated notes)
  if (value.includes('-')) {
    const notes = value.split('-');
    if (notes.length === 6) {
      // Validate each note has a valid format (e.g., "E2", "Ab3")
      const validNote = /^[A-G][#b]?\d$/;
      if (notes.every(n => validNote.test(n))) {
        const name = getTuningName(notes);
        return { tuning: notes, name };
      }
    }
  }

  return null;
}

/** Number of frets to display */
export const FRET_COUNT = 12;

/** Number of strings on a guitar */
export const STRING_COUNT = 6;

/** Maximum fret span for a playable chord (hand span constraint) */
export const MAX_HAND_SPAN = 4;

/** Frets with position markers (dots) */
export const MARKER_FRETS = [3, 5, 7, 9, 12] as const;

/** Double dot fret positions */
export const DOUBLE_MARKER_FRETS = [12] as const;

/** All chromatic notes (sharp notation) */
export const CHROMATIC_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

/** Playback timing constants (in seconds) */
export const PLAYBACK_TIMING = {
  /** Delay between notes in strum mode */
  STRUM_DELAY: 0.05,
  /** Delay between notes in arpeggio mode */
  ARPEGGIO_DELAY: 0.25,
  /** Default note duration */
  NOTE_DURATION: 2,
} as const;

/** Fretboard SVG dimensions */
export const FRETBOARD_DIMENSIONS = {
  /** Width of the nut (fret 0) */
  NUT_WIDTH: 6,
  /** Width of regular frets */
  FRET_WIDTH: 2,
  /** Height of each string spacing (desktop) */
  STRING_SPACING: 30,
  /** Height of each string spacing (mobile - larger tap targets) */
  STRING_SPACING_MOBILE: 36,
  /** Width of each fret spacing */
  FRET_SPACING: 60,
  /** Padding around the fretboard (increased for sharp/flat labels) */
  PADDING: 30,
  /** Radius of note dots */
  DOT_RADIUS: 12,
  /** Radius of fret position markers */
  MARKER_RADIUS: 6,
} as const;
