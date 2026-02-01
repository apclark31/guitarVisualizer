// Shared library exports
export { detectKeys, normalizePitchClass as normalizeKeyPitchClass } from './key-detector';
export type { KeyMatch, KeyType } from './key-detector';

export {
  getNotesFromGuitarState,
  getNotesFromMultiNoteState,
  normalizePitchClass,
  getNoteAtPosition,
  getPitchClassAtPosition,
} from './note-utils';

export { unlockIOSAudio } from './ios-audio-unlock';
