# chords-db Guitar Chord Data

This directory contains the guitar chord voicing database sourced from [chords-db](https://github.com/tombatossals/chords-db).

## File Structure

```
src/data/chords-db/
├── guitar.json    # Main chord database (~378KB)
├── types.ts       # TypeScript interfaces
├── index.ts       # Data loader and query functions
└── README.md      # This file
```

## How It Works

The JSON is bundled at build time via Vite. Changes to `guitar.json` require a rebuild:

```bash
npm run build   # Production build
npm run dev     # Dev server (hot reloads on save)
```

## JSON Structure

### Root Level
```json
{
  "main": { "strings": 6, "fretsOnChord": 4, "name": "guitar" },
  "tunings": { "standard": ["E2", "A2", "D3", "G3", "B3", "E4"] },
  "keys": ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"],
  "suffixes": ["major", "minor", "7", "m7", ...],
  "chords": { ... }
}
```

### Chords Object
Indexed by root note. Note: sharps use "Csharp", "Fsharp" format:

```json
{
  "chords": {
    "C": [ { "key": "C", "suffix": "major", "positions": [...] }, ... ],
    "Csharp": [ ... ],
    "D": [ ... ]
  }
}
```

### Chord Entry
```json
{
  "key": "C",
  "suffix": "major",
  "positions": [
    {
      "frets": [-1, 3, 2, 0, 1, 0],
      "fingers": [0, 3, 2, 0, 1, 0],
      "baseFret": 1,
      "barres": [],
      "midi": [48, 52, 55, 60, 64]
    }
  ]
}
```

### Position Fields

| Field | Type | Description |
|-------|------|-------------|
| `frets` | `number[]` | Fret for each string. `-1` = muted, `0` = open |
| `fingers` | `number[]` | Finger numbers (1-4). `0` = not fingered |
| `baseFret` | `number` | Starting fret position (1 = nut) |
| `barres` | `number[]` | Fret numbers that are barred |
| `capo` | `boolean?` | True if position requires a barre |
| `midi` | `number[]` | MIDI note values for sounding notes |

### Fret Calculation

The actual fret position is calculated as:
```
actualFret = (fret === 0) ? 0 : baseFret + fret - 1
```

Example for C Major barre at 3rd position:
- `baseFret: 3`, `frets: [-1, 1, 3, 3, 3, 1]`
- String 2 (A): baseFret(3) + fret(1) - 1 = fret 3
- String 3 (D): baseFret(3) + fret(3) - 1 = fret 5

## Adding/Editing Voicings

### Add a New Voicing to Existing Chord

1. Open `guitar.json`
2. Find the chord (e.g., search for `"key": "G", "suffix": "major"`)
3. Add a new position object to the `positions` array:

```json
{
  "frets": [3, 2, 0, 0, 0, 3],
  "fingers": [2, 1, 0, 0, 0, 3],
  "baseFret": 1,
  "barres": [],
  "midi": [43, 47, 50, 55, 59, 67]
}
```

4. Save and rebuild (`npm run dev` will hot reload)

### Add a New Chord Type

1. Add the suffix to the root `suffixes` array if not present
2. Add an entry to each key in the `chords` object:

```json
{
  "key": "C",
  "suffix": "newchordtype",
  "positions": [ ... ]
}
```

3. Update `src/lib/chord-data.ts` to map your UI quality name:

```typescript
const QUALITY_TO_SUFFIX: Record<string, string> = {
  // ... existing mappings
  'New Chord Type': 'newchordtype',
};
```

4. Add to `CHORD_QUALITIES` in `src/config/constants.ts` if it should appear in the UI dropdown.

### MIDI Values

MIDI values are optional but useful for audio. Calculate them:
- Low E open = 40 (E2)
- A open = 45 (A2)
- D open = 50 (D3)
- G open = 55 (G3)
- B open = 59 (B3)
- High E open = 64 (E4)

Add the fret number to get the MIDI value for that position.

## Troubleshooting

### Chord Not Appearing
1. Check the suffix mapping in `chord-data.ts` → `QUALITY_TO_SUFFIX`
2. Verify the key format (use "Csharp" not "C#" in JSON keys)
3. Ensure the chord entry exists for that root note

### Wrong Fret Positions
1. Remember frets are relative to `baseFret` (except `0` which is always open)
2. `-1` means muted, not fret -1

### Fallback to Solver
If a chord isn't in the database, the app silently falls back to the algorithmic solver. Check the browser console for warnings like:
```
Unknown quality "...", falling back to solver
```

## Updating from Upstream

To pull fresh data from chords-db:

```bash
curl -sL "https://raw.githubusercontent.com/tombatossals/chords-db/master/lib/guitar.json" \
  -o src/data/chords-db/guitar.json
```

Note: This will overwrite any custom edits. Consider maintaining a patch file for local modifications.
