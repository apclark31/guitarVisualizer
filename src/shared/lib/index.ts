// Shared library exports
export { detectKeys } from './key-detector';
export type { KeyMatch, KeyType } from './key-detector';

export {
  getNotesFromGuitarState,
  getNotesFromMultiNoteState,
  normalizePitchClass,
  noteToPitchClass,
  areEnharmonic,
  getNoteAtPosition,
  getPitchClassAtPosition,
} from './note-utils';

export { unlockIOSAudio } from './ios-audio-unlock';
