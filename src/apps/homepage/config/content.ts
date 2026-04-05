export const hero = {
  headlinePrefix: 'Built for',
  rotatingWords: ['beginners', 'musicians', 'exploration', 'learning', 'fun'] as const,
  subtitle:
    'A free, interactive toolkit to visualize chords, master scales, and unlock music theory on the guitar fretboard.',
  primaryCta: 'Start Playing',
  primaryHref: '/chords/',
} as const;

export const toolShowcase = {
  heading: 'Your Guitar Theory Toolkit',
} as const;

export interface ToolCard {
  name: string;
  description: string;
  href: string;
  color: string;
  image: string;
}

export const tools: ToolCard[] = [
  {
    name: 'Chords',
    description:
      'Navigate voicings and inversions across the entire neck. Detect chords from any fingering, explore suggestions, and hear every voicing.',
    href: '/chords/',
    color: '#3b82f6',
    image: '/images/homepage/tool-chords.webp',
  },
  {
    name: 'Scales',
    description:
      'Visualize any scale or mode in every key. Navigate CAGED boxes and 3NPS positions with interval color coding.',
    href: '/scales/',
    color: '#22c55e',
    image: '/images/homepage/tool-scales.webp',
  },
  {
    name: 'Harmony',
    description:
      'Build chord progressions, explore harmonic relationships, and hear them played back with adjustable tempo.',
    href: '/harmony/',
    color: '#eab308',
    image: '/images/homepage/tool-harmony.webp',
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
    description: 'Tap any fret and instantly see chord detection, quality, and ranked suggestions update in real time.',
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
  headline: 'Ready to Explore?',
  subtitle:
    'Fret Atlas is completely free. No sign-ups, no paywalls. Open it and start playing.',
  primaryCta: 'Explore Chords',
  primaryHref: '/chords/',
  secondaryText: 'Explore Scales',
  secondaryHref: '/scales/',
  tertiaryCta: 'Try Harmony',
  tertiaryHref: '/harmony/',
  badges: ['100% Free', 'No Account Required'],
} as const;

export const footer = {
  tagline: 'Guitar theory, visualized.',
  github: 'https://github.com/apclark31/guitarVisualizer',
  copyright: `\u00A9 ${new Date().getFullYear()} Fret Atlas`,
} as const;
