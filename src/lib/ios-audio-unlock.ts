/**
 * iOS Audio Unlock Utility
 *
 * On iOS, Web Audio uses the "ringer" channel which respects the silent switch.
 * HTML <audio> elements use the "media" channel which ignores silent mode.
 *
 * By playing a silent audio track continuously via <audio>, we force iOS
 * to treat the entire audio session as media playback.
 *
 * Based on: https://github.com/swevans/unmute
 *
 * This must be called from a user gesture (click/touch).
 */

// Tiny silent MP3 - base64 encoded (~1KB)
// Source: https://gist.github.com/novwhisky/8a1a0168b94f3b6abfaa
const SILENT_MP3_BASE64 =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0VAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA' +
  '//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAw' +
  'MDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v//' +
  '//////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAA' +
  'ASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAA' +
  'AAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAA' +
  'NVVV';

let audioElement: HTMLAudioElement | null = null;
let isUnlocked = false;
let isPlaying = false;

/**
 * Check if we're on iOS (Safari or Chrome, both use WebKit)
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Create the hidden audio element for silent playback
 */
function createSilentAudio(): HTMLAudioElement {
  const audio = document.createElement('audio');

  // Set source to silent MP3
  audio.src = SILENT_MP3_BASE64;

  // Loop continuously to keep media session active
  audio.loop = true;

  // Preload
  audio.preload = 'auto';

  // Required for iOS
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');

  return audio;
}

/**
 * Start playing the silent audio track
 * This forces iOS to use the media channel instead of ringer channel
 */
async function startSilentAudio(): Promise<boolean> {
  if (!audioElement) {
    audioElement = createSilentAudio();
  }

  if (isPlaying) {
    return true;
  }

  try {
    await audioElement.play();
    isPlaying = true;
    console.log('Silent audio playing - iOS media channel active');
    return true;
  } catch (error) {
    console.warn('Failed to start silent audio:', error);
    return false;
  }
}

/**
 * Unlock iOS audio by starting silent audio playback
 * Must be called from a user gesture (click/touch)
 *
 * @returns Promise that resolves when audio is unlocked
 */
export async function unlockIOSAudio(): Promise<boolean> {
  // Skip if already unlocked
  if (isUnlocked) {
    return true;
  }

  // On non-iOS, just mark as unlocked (no silent audio needed)
  if (!isIOS()) {
    isUnlocked = true;
    return true;
  }

  // Start the silent audio track
  const success = await startSilentAudio();

  if (success) {
    isUnlocked = true;
    console.log('iOS audio unlocked - silent switch bypassed');
  }

  return success;
}

/**
 * Check if audio has been unlocked
 */
export function isAudioUnlocked(): boolean {
  return isUnlocked;
}

/**
 * Stop the silent audio (call when leaving page or cleaning up)
 */
export function stopSilentAudio(): void {
  if (audioElement && isPlaying) {
    audioElement.pause();
    isPlaying = false;
  }
}

/**
 * Clean up the audio element entirely
 */
export function disposeUnlockAudio(): void {
  stopSilentAudio();
  if (audioElement) {
    audioElement.src = '';
    audioElement = null;
  }
  isUnlocked = false;
}
