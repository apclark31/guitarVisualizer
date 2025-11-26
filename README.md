# Guitar Theory Visualizer

An interactive web app for exploring guitar chords, voicings, and music theory.

**Live Demo:** https://guitar-visualizer-iota.vercel.app/

## Features

- **Interactive Fretboard** - Click to place notes on a 12-fret, 6-string guitar
- **Real-time Chord Detection** - Automatically identifies chords as you build them
- **Algorithmic Chord Solver** - Select any chord and get practical, playable voicings
- **Audio Playback** - Hear your chords with real guitar samples
  - Block (all notes at once)
  - Strum (quick sweep)
  - Arpeggio (melodic sequence)
- **Interval Color Coding** - Visual feedback showing Root, 3rd, 5th, 7th
- **Two Modes:**
  - *Free-form* - Explore by placing notes manually
  - *Chord Selection* - Pick root + quality, browse voicings

## Tech Stack

- React 18 + TypeScript + Vite
- Zustand (state management)
- Tonal.js (music theory)
- Tone.js (audio engine)
- CSS Modules

## Philosophy

**"Solve, Don't Store"** - Chord voicings are calculated algorithmically using a sliding window approach with hand-span constraints, rather than stored in static databases.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## How It Works

### Chord Solver
The solver scans the fretboard in 4-fret windows (typical hand span) and scores voicings based on:
- Open position preference
- Open string usage
- Root note in bass
- Playability (contiguous strings, minimal stretch)

### Audio Engine
Uses Tone.js with a Sampler loaded with acoustic guitar samples, routed through Reverb and Limiter for natural sound.

## License

MIT

---

Made with ☕ and 🎸 by Alex in PDX
