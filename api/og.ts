export const config = { runtime: 'edge' };

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const SCALE_DISPLAY: Record<string, string> = {
  major: 'Ionian (Major)',
  minor: 'Aeolian (Natural Minor)',
  'major-pentatonic': 'Major Pentatonic',
  'minor-pentatonic': 'Minor Pentatonic',
  'major-blues': 'Major Blues',
  'melodic-minor': 'Melodic Minor',
  'harmonic-minor': 'Harmonic Minor',
  'harmonic-major': 'Harmonic Major',
  'double-harmonic-major': 'Double Harmonic Major',
  'dorian-b2': 'Dorian b2',
  'lydian-augmented': 'Lydian Augmented',
  'lydian-dominant': 'Lydian Dominant',
  'mixolydian-b6': 'Mixolydian b6',
  'locrian-nat2': 'Locrian #2',
  'locrian-nat6': 'Locrian #6',
  'ionian-augmented': 'Ionian #5',
  'dorian-sharp4': 'Dorian #4',
  'phrygian-dominant': 'Phrygian Dominant',
  'lydian-sharp9': 'Lydian #2',
  'diminished-hw': 'Diminished (H-W)',
  'diminished-wh': 'Diminished (W-H)',
  'whole-tone': 'Whole Tone',
  'bebop-major': 'Bebop Major',
  'bebop-minor': 'Bebop Minor',
  'bebop-locrian': 'Bebop Locrian',
  'hungarian-minor': 'Hungarian Minor',
  'hungarian-major': 'Hungarian Major',
  'in-sen': 'In-Sen',
};

function getScaleDisplayName(slug: string): string {
  return SCALE_DISPLAY[slug] || formatSlug(slug);
}

function buildCanonicalUrl(pathname: string, params: URLSearchParams): string {
  const clean = new URLSearchParams(params);
  clean.delete('_app');
  return `https://fretatlas.com${pathname}?${clean.toString()}`;
}

function buildMeta(params: URLSearchParams, pathname: string) {
  const root = params.get('r');

  if (pathname.startsWith('/scales') && root) {
    const scaleSlug = params.get('s');
    const name = scaleSlug ? `${root} ${getScaleDisplayName(scaleSlug)}` : `${root} Scale`;
    return {
      title: `${name} | Fret Atlas`,
      description: `Check out ${name} on Fret Atlas. Interactive scale positions, intervals, and audio playback on guitar.`,
    };
  }

  if (pathname.startsWith('/chords') && root) {
    const quality = params.get('q') || 'chord';
    const name = `${root} ${quality}`;
    return {
      title: `${name} | Fret Atlas`,
      description: `Check out ${name} on Fret Atlas. Interactive chord voicings, intervals, and audio playback on guitar.`,
    };
  }

  if (pathname.startsWith('/harmony')) {
    const key = params.get('k');
    if (key) {
      const keyRoot = key.replace(/maj|min/i, '').toUpperCase();
      const keyType = key.toLowerCase().includes('min') ? 'Minor' : 'Major';
      return {
        title: `Chord Progression in ${keyRoot} ${keyType} | Fret Atlas`,
        description: `Check out this chord progression in ${keyRoot} ${keyType} on Fret Atlas. Build and play progressions with interactive playback.`,
      };
    }
  }

  return null;
}

export default async function handler(request: Request) {
  const url = new URL(request.url);

  const forwardedPath = request.headers.get('x-forwarded-uri')
    || request.headers.get('x-matched-path')
    || url.pathname;

  const appPath = url.searchParams.get('_app');
  const pathname = appPath ? `/${appPath}/` : forwardedPath;

  const meta = buildMeta(url.searchParams, pathname);

  if (!meta) {
    return fetch(new URL('/index.html', url.origin));
  }

  const htmlResponse = await fetch(new URL('/index.html', url.origin));
  let html = await htmlResponse.text();

  const safeTitle = meta.title.replace(/"/g, '&quot;');
  const safeDesc = meta.description.replace(/"/g, '&quot;');

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${safeTitle}"`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${safeDesc}"`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${safeTitle}"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${safeDesc}"`
    )
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${safeDesc}"`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${buildCanonicalUrl(pathname, url.searchParams)}"`
    );

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
