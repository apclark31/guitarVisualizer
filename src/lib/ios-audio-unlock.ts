/**
 * iOS Audio Unlock Utility
 *
 * On iOS, Web Audio is treated as "Ambient" audio which respects the silent switch.
 * Playing an unmuted video elevates the audio session to "Playback" category,
 * which ignores the physical silent switch.
 *
 * This must be called from a user gesture (click/touch).
 */

// Minimal silent MP4 with audio track (base64 encoded)
// This is a ~1KB silent video that tricks iOS into Playback mode
const SILENT_VIDEO_BASE64 =
  'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA' +
  'NBtZGF0AAACoAYF//+c3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWUxO' +
  'WY5IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6L' +
  'y93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVib' +
  'G9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9M' +
  'S4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4e' +
  'DhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNld' +
  'D0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZ' +
  'GVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhP' +
  'TAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlna' +
  'HRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY' +
  '3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZ' +
  'j0yMyBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhc' +
  'T0xOjEuMDAAgAAAAA9liIQAV/0TAAYdeBTXzg8AAALZbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAADA' +
  'AADIAAB9AAAAAAAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAgAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAI0dHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAA' +
  'AAAACAAAAAAAAAAAAAAAAAAAAAAAEAAAAABAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAABA' +
  'AAAAGxwMT0AAAB4bWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAoAAAAKABVxAAAAAAALWhkbHIAA' +
  'AAAAAAAAHNvdW4AAAAAAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAABI21pbmYAAAAQc21oZAAAA' +
  'AAAAAAAAAAAACR4aW5mAAAAABRodHRwOi8vd3d3Lm1wNHJhLm9yZwAAACBkYXRhAQAAAAAAAAABA' +
  'AAAAAAAAAEAAAAAAAADOHVkdGEAAAAwbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAA' +
  'AAAAAAAAAAAAAAA';

let unlockVideoElement: HTMLVideoElement | null = null;
let isUnlocked = false;

/**
 * Check if we're on iOS (Safari or Chrome, both use WebKit)
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Create the hidden video element for audio unlock
 */
function createUnlockVideo(): HTMLVideoElement {
  const video = document.createElement('video');

  // Set attributes for iOS compatibility
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('preload', 'auto');

  // Critical: must NOT be muted to trigger Playback mode
  video.muted = false;
  video.volume = 0.001; // Nearly silent but not muted

  // Hide but keep in DOM
  video.style.position = 'fixed';
  video.style.top = '-1px';
  video.style.left = '-1px';
  video.style.width = '1px';
  video.style.height = '1px';
  video.style.opacity = '0.01';
  video.style.pointerEvents = 'none';
  video.style.zIndex = '-1000';

  // Set source
  video.src = SILENT_VIDEO_BASE64;

  // Loop to keep session alive
  video.loop = true;

  return video;
}

/**
 * Unlock iOS audio by playing a silent video
 * Must be called from a user gesture (click/touch)
 *
 * @returns Promise that resolves when audio is unlocked
 */
export async function unlockIOSAudio(): Promise<boolean> {
  // Skip if already unlocked or not on iOS
  if (isUnlocked) {
    return true;
  }

  // On non-iOS, just mark as unlocked
  if (!isIOS()) {
    isUnlocked = true;
    return true;
  }

  try {
    // Create video element if needed
    if (!unlockVideoElement) {
      unlockVideoElement = createUnlockVideo();
      document.body.appendChild(unlockVideoElement);
    }

    // Attempt to play
    await unlockVideoElement.play();

    isUnlocked = true;
    console.log('iOS audio unlocked - silent switch bypassed');

    return true;
  } catch (error) {
    console.warn('iOS audio unlock failed:', error);
    return false;
  }
}

/**
 * Check if audio has been unlocked
 */
export function isAudioUnlocked(): boolean {
  return isUnlocked;
}

/**
 * Clean up the unlock video element (call on unmount if needed)
 */
export function disposeUnlockVideo(): void {
  if (unlockVideoElement) {
    unlockVideoElement.pause();
    unlockVideoElement.remove();
    unlockVideoElement = null;
  }
  isUnlocked = false;
}
