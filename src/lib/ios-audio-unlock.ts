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
let isInitialized = false;

/**
 * Check if we're on iOS (Safari or Chrome, both use WebKit)
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Create and preload the audio element
 * Called on page load, before any user interaction
 */
function initAudioElement(): void {
  if (isInitialized || typeof document === 'undefined') return;

  const audio = document.createElement('audio');

  // Set source to silent MP3
  audio.src = SILENT_MP3_BASE64;

  // Loop continuously to keep media session active
  audio.loop = true;

  // Preload eagerly
  audio.preload = 'auto';

  // Required for iOS
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');

  // Add to DOM immediately (hidden)
  audio.style.display = 'none';
  document.body.appendChild(audio);

  // Force load
  audio.load();

  audioElement = audio;
  isInitialized = true;

  console.log('iOS audio element initialized and preloaded');
}

/**
 * Initialize on module load if in browser
 */
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioElement);
  } else {
    // DOM already ready
    initAudioElement();
  }
}

/**
 * Start playing the silent audio track (SYNCHRONOUS - don't break gesture chain)
 * This forces iOS to use the media channel instead of ringer channel
 */
function startSilentAudio(): void {
  // Ensure element exists
  if (!audioElement) {
    initAudioElement();
  }

  if (!audioElement) {
    console.warn('Could not create audio element');
    return;
  }

  // Check if already playing
  if (!audioElement.paused) {
    return;
  }

  // Play synchronously - do NOT await, keep in same call stack as user gesture
  audioElement.play().then(() => {
    console.log('Silent audio playing - iOS media channel active');
  }).catch((error) => {
    console.warn('Failed to start silent audio:', error);
  });
}

/**
 * Unlock iOS audio by starting silent audio playback (SYNCHRONOUS)
 * Must be called from a user gesture (click/touch)
 *
 * IMPORTANT: This is intentionally synchronous to stay in the same
 * call stack as the user gesture. Standalone PWA mode on iOS requires this.
 */
export function unlockIOSAudio(): void {
  // Skip if already unlocked
  if (isUnlocked) {
    return;
  }

  // On non-iOS, just mark as unlocked (no silent audio needed)
  if (!isIOS()) {
    isUnlocked = true;
    return;
  }

  // Start the silent audio track (synchronously)
  startSilentAudio();
  isUnlocked = true;
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
  if (audioElement && !audioElement.paused) {
    audioElement.pause();
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
