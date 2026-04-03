import type { Preset } from '../types';

/** Common chord progressions as scale degree arrays */
export const PRESETS: Preset[] = [
  {
    id: 'pop-1564',
    name: 'Pop (I-V-vi-IV)',
    degrees: [1, 5, 6, 4],
    description: 'The most common pop progression',
  },
  {
    id: 'blues-145',
    name: '12-Bar Blues (I-IV-V)',
    degrees: [1, 4, 5],
    description: 'Foundation of blues and rock',
  },
  {
    id: 'fifties-1645',
    name: "'50s (I-vi-IV-V)",
    degrees: [1, 6, 4, 5],
    description: 'Classic doo-wop progression',
  },
  {
    id: 'pachelbel-1534',
    name: 'Canon (I-V-vi-iii-IV)',
    degrees: [1, 5, 6, 3, 4],
    description: "Pachelbel's Canon progression",
  },
  {
    id: 'sad-6415',
    name: 'Sad (vi-IV-I-V)',
    degrees: [6, 4, 1, 5],
    description: 'Minor feel starting on vi',
  },
  {
    id: 'jazz-2517',
    name: 'Jazz ii-V-I',
    degrees: [2, 5, 1],
    description: 'Essential jazz cadence',
  },
  {
    id: 'andalusian-6-5-4-3',
    name: 'Andalusian (vi-V-IV-III)',
    degrees: [6, 5, 4, 3],
    description: 'Flamenco-inspired descending',
  },
  {
    id: 'axis-1-5-6-4',
    name: 'Axis (I-V-vi-IV)',
    degrees: [1, 5, 6, 4],
    description: 'Axis of awesome progression',
  },
  {
    id: 'country-1-4-5-5',
    name: 'Country (I-IV-V-V)',
    degrees: [1, 4, 5, 5],
    description: 'Classic country turnaround',
  },
  {
    id: 'royal-4-1-5-6',
    name: 'Royal (IV-I-V-vi)',
    degrees: [4, 1, 5, 6],
    description: 'Rotation of the pop progression',
  },
];

/** Find a preset by ID */
export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id);
}
