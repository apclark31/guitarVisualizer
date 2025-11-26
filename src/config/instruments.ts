/**
 * Instrument sample configurations for Tone.js Sampler
 *
 * Using community-hosted samples for MVP.
 * TODO: Download and self-host for production reliability.
 */

export const GUITAR_SAMPLER_CONFIG = {
  urls: {
    // Open string notes for guitar - Tone.js will pitch-shift for other notes
    'E2': 'E2.mp3',
    'A2': 'A2.mp3',
    'D3': 'D3.mp3',
    'G3': 'G3.mp3',
    'B3': 'B3.mp3',
    'E4': 'E4.mp3',
    // Additional samples for better pitch accuracy across the fretboard
    'A3': 'A3.mp3',
    'E3': 'E3.mp3',
    'A4': 'A4.mp3',
    'D4': 'D4.mp3',
    'G4': 'G4.mp3',
  },
  release: 1.5,
  baseUrl: 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/guitar-acoustic/',
};


export const PIANO_SAMPLER_CONFIG = {
  urls: {
    'C4': 'C4.mp3',
    'D#4': 'Ds4.mp3',
    'F#4': 'Fs4.mp3',
    'A4': 'A4.mp3',
  },
  release: 1,
  baseUrl: 'https://tonejs.github.io/audio/salamander/',
};
