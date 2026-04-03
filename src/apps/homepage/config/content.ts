export const hero = {
  headline: 'Demystify the Fretboard.',
  accentWord: 'Fretboard.',
  subtitle:
    'A free toolkit for guitarists. Visualize chords, master scales, and understand music theory through an intuitive, interactive fretboard.',
  primaryCta: 'Explore Chords',
  primaryHref: '/chords/',
  secondaryCta: 'Explore Scales',
  secondaryHref: '/scales/',
} as const;

export interface ToolCard {
  name: string;
  description: string;
  href: string;
  color: string;
  comingSoon?: boolean;
}

export const tools: ToolCard[] = [
  {
    name: 'Chords',
    description:
      'Navigate voicings and inversions across the entire neck. Detect chords, explore suggestions, hear every voicing.',
    href: '/chords/',
    color: '#3b82f6',
  },
  {
    name: 'Scales',
    description:
      'Visualize scales and modes in any key. Navigate box and 3NPS positions with interval color coding.',
    href: '/scales/',
    color: '#22c55e',
  },
  {
    name: 'Harmony Hub',
    description:
      'Build chord progressions, explore harmonic relationships, and bridge chords with scales.',
    href: '#',
    color: '#eab308',
    comingSoon: true,
  },
];

export interface Feature {
  title: string;
  description: string;
}

export const featuresLeft: Feature[] = [
  {
    title: 'Interval Color Coding',
    description: 'See the relationships between notes directly on the fretboard — roots, thirds, fifths, and sevenths each get a distinct color.',
  },
  {
    title: 'Dynamic Feedback',
    description: 'Tap any fret and instantly see chord detection, quality analysis, and ranked suggestions update in real time.',
  },
];

export const featuresRight: Feature[] = [
  {
    title: 'Studio-Sampled Audio',
    description: 'Hear every voicing with Tone.js-powered guitar and piano playback — block chords or strummed.',
  },
  {
    title: 'Scale Positions',
    description: 'CAGED boxes, 3-notes-per-string, pentatonic, and blues patterns — all with interval overlays.',
  },
  {
    title: 'Key Context',
    description: 'Set a key to filter diatonic chords, see Roman numeral analysis, and understand harmonic function.',
  },
];

export interface TechItem {
  label: string;
  description: string;
}

export const techStack: TechItem[] = [
  { label: 'React + TypeScript', description: 'Modern, type-safe UI' },
  { label: 'Tone.js', description: 'Studio-sampled audio engine' },
  { label: 'Tonal.js', description: 'Music theory computation' },
  { label: 'PWA', description: 'Install on any device' },
  { label: 'Mobile-First', description: 'Responsive on all screens' },
  { label: 'Open Source', description: 'View on GitHub' },
];

export const cta = {
  headline: 'Start Exploring',
  subtitle:
    'Fret Atlas is completely free. No sign-ups, no paywalls — just open and play.',
  primaryCta: 'Explore Chords',
  primaryHref: '/chords/',
  secondaryText: 'Or explore Scales',
  secondaryHref: '/scales/',
  badges: ['100% Free', 'No Account Required'],
} as const;

export const footer = {
  tagline: 'Making guitar theory visual and interactive',
  github: 'https://github.com/apclark31/guitarVisualizer',
  copyright: `\u00A9 ${new Date().getFullYear()} Fret Atlas`,
} as const;
