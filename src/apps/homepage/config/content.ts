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

export interface ToolFeature {
  headline: string;
  detail: string;
}

export interface ToolCard {
  name: string;
  tagline: string;
  description: string;
  href: string;
  color: string;
  colorDim: string;
  image: string;
  features: ToolFeature[];
}

export const tools: ToolCard[] = [
  {
    name: 'Chords',
    tagline: 'Every voicing, visualized.',
    description:
      'Navigate voicings and inversions across the entire neck. Detect chords from any fingering, explore suggestions, and hear every voicing.',
    href: '/chords/',
    color: '#3b82f6',
    colorDim: '#1e3a5f',
    image: '/images/homepage/chords_image.png',
    features: [
      {
        headline: 'Tap any fret to detect the chord',
        detail: 'Place notes freely and get instant chord detection with ranked suggestions.',
      },
      {
        headline: 'Browse voicings across the neck',
        detail: 'Rotate through positions and inversions for any chord in any key.',
      },
      {
        headline: 'Hear every voicing played back',
        detail: 'Studio-sampled guitar audio with block and strum playback modes.',
      },
    ],
  },
  {
    name: 'Scales',
    tagline: 'The full fretboard, mapped.',
    description:
      'Visualize any scale or mode in every key. Navigate CAGED boxes and 3NPS positions with interval color coding.',
    href: '/scales/',
    color: '#22c55e',
    colorDim: '#14532d',
    image: '/images/homepage/scales_image.png',
    features: [
      {
        headline: 'Navigate CAGED and 3NPS positions',
        detail: 'Step through box shapes or see the full scale laid out across every fret.',
      },
      {
        headline: 'Intervals color-coded on every note',
        detail: 'Roots, thirds, fifths, and sevenths are instantly visible by color.',
      },
      {
        headline: 'Switch scales and modes in any key',
        detail: 'Major, minor, pentatonic, blues, modes, and more with one tap.',
      },
    ],
  },
  {
    name: 'Harmony',
    tagline: 'Progressions, assembled.',
    description:
      'Build chord progressions, explore harmonic relationships, and hear them played back with adjustable tempo.',
    href: '/harmony/',
    color: '#eab308',
    colorDim: '#713f12',
    image: '/images/homepage/harmony_image.png',
    features: [
      {
        headline: 'Build progressions from diatonic chords',
        detail: 'Tap Roman numerals to assemble I-IV-V-I, ii-V-I, or any custom sequence.',
      },
      {
        headline: 'Preview any chord voicing instantly',
        detail: 'Tap a chord in your progression to see and hear it on the fretboard.',
      },
      {
        headline: 'Share progressions with a link',
        detail: 'Copy a URL that restores your key, chords, and tempo for anyone.',
      },
    ],
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
