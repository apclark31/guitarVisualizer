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

/**
 * High quality silence MP3 from unmute.js
 * "The silence MP3 must be high quality, when web audio sounds are played
 * in parallel the web audio sound is mixed to match the bitrate of the html sound."
 * This is 0.01 seconds of silence VBR220-260 Joint Stereo 859B
 */
function huffman(count: number, repeatStr: string): string {
  let result = repeatStr;
  for (; count > 1; count--) result += repeatStr;
  return result;
}

const SILENCE_MP3 = 'data:audio/mpeg;base64,//uQx' + huffman(23, 'A') +
  'WGluZwAAAA8AAAACAAACcQCA' + huffman(16, 'gICA') + huffman(66, '/') +
  '8AAABhTEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAAnGMHkkI' + huffman(320, 'A') +
  '//sQxAADgnABGiAAQBCqgCRMAAgEAH' + huffman(15, '/') +
  '7+n/9FTuQsQH//////2NG0jWUGlio5gLQTOtIoeR2WX////X4s9Atb/JRVCbBUpeRUq' +
  huffman(18, '/') + '9RUi0f2jn/+xDECgPCjAEQAABN4AAANIAAAAQVTEFNRTMuMTAw' +
  huffman(97, 'V') + 'Q==';

let channelTag: HTMLAudioElement | null = null;
let isUnlocked = false;

/**
 * Check if we're on iOS (including new iPads that report as Mac)
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  return (
    (ua.indexOf('iphone') >= 0 && ua.indexOf('like iphone') < 0) ||
    (ua.indexOf('ipad') >= 0 && ua.indexOf('like ipad') < 0) ||
    (ua.indexOf('ipod') >= 0 && ua.indexOf('like ipod') < 0) ||
    (ua.indexOf('mac os x') >= 0 && navigator.maxTouchPoints > 0)
  );
}

/**
 * Create the channel tag exactly as unmute.js does
 */
function createChannelTag(): HTMLAudioElement {
  // Create via innerHTML as unmute.js does
  const tmp = document.createElement('div');
  tmp.innerHTML = "<audio x-webkit-airplay='deny'></audio>";
  const audio = tmp.children.item(0) as HTMLAudioElement;

  audio.controls = false;
  audio.disableRemotePlayback = true;
  audio.preload = 'auto';
  audio.src = SILENCE_MP3;
  audio.loop = true;

  // Load immediately
  audio.load();

  return audio;
}

/**
 * Destroy channel tag (called on playback failure)
 */
function destroyChannelTag(): void {
  if (channelTag) {
    channelTag.src = '';
    channelTag.load();
    channelTag = null;
  }
}

/**
 * Start playing the silent audio track (SYNCHRONOUS - don't break gesture chain)
 * This forces iOS to use the media channel instead of ringer channel
 */
function startSilentAudio(): void {
  // Create channel tag if needed
  if (!channelTag) {
    channelTag = createChannelTag();
  }

  // Only play if paused
  if (channelTag.paused) {
    const p = channelTag.play();
    if (p) {
      p.then(() => {
        console.log('Silent audio playing - iOS media channel active');
      }).catch((err) => {
        console.warn('Playback failed, destroying tag:', err);
        destroyChannelTag();
      });
    }
  }
}

/**
 * Unlock iOS audio by starting silent audio playback (SYNCHRONOUS)
 * Must be called from a user gesture (click/touch)
 *
 * IMPORTANT: This is intentionally synchronous to stay in the same
 * call stack as the user gesture. Standalone PWA mode on iOS requires this.
 */
export function unlockIOSAudio(): void {
  // On non-iOS, just mark as unlocked (no silent audio needed)
  if (!isIOS()) {
    isUnlocked = true;
    return;
  }

  // Always try to start/resume silent audio on user gesture
  // Don't skip if already unlocked - iOS may have paused it
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
 * Stop the silent audio
 */
export function stopSilentAudio(): void {
  if (channelTag && !channelTag.paused) {
    channelTag.pause();
  }
}

/**
 * Clean up entirely
 */
export function disposeUnlockAudio(): void {
  destroyChannelTag();
  isUnlocked = false;
}
