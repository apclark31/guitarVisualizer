/**
 * Chord Compass Tour Script
 *
 * Edit this file to refine tour content without touching tour logic.
 * Target duration: Under 60 seconds
 *
 * Each step has:
 *   - id: Unique identifier
 *   - element: CSS selector for the highlighted element (omit for centered modal)
 *   - position: Where tooltip appears relative to element
 *   - title: Optional header text
 *   - content: Main message (supports HTML)
 *   - action: Optional action prompt shown as a callout
 *   - buttons: Custom button configuration
 *   - interactive: If true, requires user interaction to advance
 *   - waitFor: CSS selector to wait for before showing step
 */

export interface TourButton {
  text: string;
  action: 'next' | 'back' | 'complete' | 'skip' | 'close-picker' | 'close-and-next' | 'force-close-picker-next';
  style: 'primary' | 'secondary' | 'skip';
}

export interface TourStep {
  id: string;
  element?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  mobilePosition?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  title?: string;
  content: string;
  action?: string;
  buttons?: TourButton[];
  interactive?: boolean;
  interactiveEvent?: string;
  interactiveSelector?: string;  // Different selector for advanceOn
  waitFor?: string;              // Wait for this element before showing
  closePickerOnAdvance?: boolean;
  openPicker?: boolean;          // Should this step open a picker/modal?
  closePicker?: boolean;         // Should close any open picker before showing
  noOverlay?: boolean;           // Disable Shepherd's modal overlay for this step
}

// =============================================================================
// SECTION 1: WELCOME & OVERVIEW
// =============================================================================

const welcomeSteps: TourStep[] = [
  {
    id: 'cc-welcome',
    title: 'Welcome to Chord Compass!',
    content: `A tool that helps you find and explore chords on the fretboard. This quick tour takes <strong>less than 60 seconds</strong>.`,
    buttons: [
      { text: "Let's Go!", action: 'next', style: 'primary' },
      { text: 'Skip Tour', action: 'complete', style: 'skip' },
    ],
  },
  {
    id: 'cc-overview-card',
    element: '[data-tour="chord-card"]',
    position: 'bottom',
    mobilePosition: 'bottom',
    content: `The <strong>Chord Card</strong> — see what notes you've placed, or tap to select from hundreds of chords.`,
  },
  {
    id: 'cc-overview-fretboard',
    element: '[data-tour="fretboard"]',
    position: 'top',
    mobilePosition: 'top',
    content: `The <strong>Fretboard</strong> — interact with it directly. Tap to place notes, and watch chords come to life.`,
  },
  {
    id: 'cc-overview-controls',
    element: '[data-tour="position-nav"]',
    position: 'bottom',
    mobilePosition: 'bottom',
    content: `The <strong>Control Panel</strong> — navigate voicings, change settings, and more. We'll explore each one.`,
  },
];

// =============================================================================
// SECTION 2: FREE PLAY & DETECTION
// =============================================================================

const freePlaySteps: TourStep[] = [
  {
    id: 'cc-freeplay-intro',
    element: '[data-tour="fretboard"]',
    position: 'top',
    mobilePosition: 'top',
    content: `Let's try <strong>free play mode</strong>. Tap the <strong>5th fret on the low E string</strong> to place a note.`,
    action: 'Tap the 5th fret (E string)',
    interactive: true,
  },
  {
    id: 'cc-freeplay-second',
    element: '[data-tour="fretboard"]',
    position: 'top',
    mobilePosition: 'top',
    content: `Woah, are you a wizard? Now tap the <strong>4th fret on the A string</strong>.`,
    action: 'Tap the 4th fret (A string)',
    interactive: true,
  },
  {
    id: 'cc-detection-intro',
    element: '[data-tour="info-button"]',  // Highlight the (i) button directly
    position: 'left',
    mobilePosition: 'bottom',
    waitFor: '[data-tour="info-button"]',  // Wait for (i) button to appear
    content: `See that <strong>(i) button</strong>? The detection system found chords that match your notes. Tap it to see suggestions.`,
    action: 'Tap the (i) button',
    interactive: true,
  },
  {
    id: 'cc-detection-modal',
    element: '[data-tour="suggestion-modal"]',
    position: 'left',
    mobilePosition: 'bottom',
    content: `These are chords that match the notes you've placed. Tap <strong>Apply</strong> on any chord to load it onto the fretboard.`,
    action: 'Apply a chord',
    interactive: true,
    interactiveSelector: '[data-tour="suggestion-apply"]',
  },
];

// =============================================================================
// SECTION 3: CHORD PLAYBACK
// =============================================================================

const playbackSteps: TourStep[] = [
  {
    id: 'cc-play-chord',
    element: '[data-tour="play-button"]',
    position: 'top',
    mobilePosition: 'top',
    content: `Look at that! The chord is now on the fretboard. Tap <strong>Play Chord</strong> to hear it.`,
    action: 'Press Play',
    interactive: true,
  },
  {
    id: 'cc-play-confirm',
    element: '[data-tour="play-button"]',
    position: 'top',
    mobilePosition: 'top',
    content: `Wow, that sounds great! You're a natural.`,
  },
];

// =============================================================================
// SECTION 4: CHORD CARD & PICKER
// =============================================================================

const chordCardSteps: TourStep[] = [
  {
    id: 'cc-card-updated',
    element: '[data-tour="chord-card"]',
    position: 'bottom',
    mobilePosition: 'bottom',
    content: `Notice how the Chord Card updated to show your selection. Tap it to explore more chords.`,
    action: 'Tap the Chord Card',
    interactive: true,
  },
  {
    id: 'cc-picker-explore',
    element: '[data-tour="chord-picker"]',
    position: 'left',
    mobilePosition: 'bottom',
    content: `Pick any <strong>root</strong>, <strong>family</strong>, and <strong>type</strong>. Use <strong>Preview</strong> to hear it first, then tap <strong>Apply</strong>.`,
    action: 'Select a different chord',
    interactive: true,
    interactiveSelector: '[data-tour="picker-apply"]',
  },
];

// =============================================================================
// SECTION 5: CONTROL PANEL FEATURES
// =============================================================================

const controlPanelSteps: TourStep[] = [
  {
    id: 'cc-position-nav',
    element: '[data-tour="position-nav"]',
    position: 'bottom',
    mobilePosition: 'bottom',
    content: `Most chords have multiple <strong>voicings</strong> — different positions on the neck. Use the arrows to explore them all.`,
  },
  {
    id: 'cc-display-toggle',
    element: '[data-tour="display-toggle"]',
    position: 'top',
    mobilePosition: 'top',
    content: `Toggle between <strong>note names</strong> and <strong>intervals</strong> to see the relationships between notes.`,
    action: 'Try toggling it',
    interactive: true,
    interactiveSelector: '[data-tour="display-toggle"]',
  },
];

// =============================================================================
// SECTION 6: KEY CONTEXT
// =============================================================================

const keyContextSteps: TourStep[] = [
  {
    id: 'cc-key-intro',
    element: '[data-tour="key-button"]',
    position: 'top',
    mobilePosition: 'top',
    content: `Set a <strong>key</strong> to filter chords to only those that fit. Tap to try it.`,
    action: 'Select a key',
    interactive: true,
  },
  {
    id: 'cc-key-picker',
    element: '[data-tour="key-picker"]',
    position: 'left',
    mobilePosition: 'bottom',
    content: `Pick a key — like <strong>C Major</strong> or <strong>A Minor</strong>. This filters the chord picker to diatonic chords only.`,
    action: 'Apply a key',
    interactive: true,
    interactiveSelector: '[data-tour="key-apply"]',
  },
  {
    id: 'cc-key-filtered',
    element: '[data-tour="chord-picker"]',
    position: 'left',
    mobilePosition: 'bottom',
    openPicker: true,
    waitFor: '[data-tour="chord-picker"]',
    content: `See? Now you only see chords <strong>in that key</strong>. Super helpful when writing songs or trying to impress Griselda the witch with a fancy new chord.`,
    buttons: [
      { text: 'Wait, what?', action: 'force-close-picker-next', style: 'primary' },
    ],
  },
];

// =============================================================================
// SECTION 7: TUNING & SHARING
// =============================================================================

const advancedSteps: TourStep[] = [
  {
    id: 'cc-tuning',
    element: '[data-tour="tuning-button"]',
    position: 'top',
    mobilePosition: 'top',
    content: `Wait, who's Griselda? <em>*Ahem*</em> Anyway... tap here to <strong>change tuning</strong>. Choose from presets like Drop D or Open G, or create your own.`,
  },
  {
    id: 'cc-share',
    element: '[data-tour="share-button"]',
    position: 'top',
    mobilePosition: 'top',
    content: `The <strong>Share</strong> button copies a link to exactly what's on your fretboard. Great for sending a chord to your bandmate.`,
  },
  {
    id: 'cc-clear',
    element: '[data-tour="clear-button"]',
    position: 'top',
    mobilePosition: 'top',
    content: `And <strong>Clear All</strong> wipes the fretboard so you can start fresh.`,
  },
];

// =============================================================================
// SECTION 8: COMPLETION
// =============================================================================

const completionSteps: TourStep[] = [
  {
    id: 'cc-complete',
    title: `You're Ready!`,
    content: `That's Chord Compass! Explore chords, experiment with keys and tunings, and most importantly — have fun. Rock on!`,
    buttons: [
      { text: 'Start Exploring', action: 'complete', style: 'primary' },
    ],
  },
];

// =============================================================================
// EXPORT: Complete tour script
// =============================================================================

export const chordCompassScript: TourStep[] = [
  ...welcomeSteps,
  ...freePlaySteps,
  ...playbackSteps,
  ...chordCardSteps,
  ...controlPanelSteps,
  ...keyContextSteps,
  ...advancedSteps,
  ...completionSteps,
];

/**
 * Get a specific step by ID
 */
export function getStepById(id: string): TourStep | undefined {
  return chordCompassScript.find(step => step.id === id);
}

/**
 * Tour section markers for progress indication
 */
export const tourSections = [
  { id: 'welcome', label: 'Welcome', startStep: 'cc-welcome' },
  { id: 'freeplay', label: 'Free Play', startStep: 'cc-freeplay-intro' },
  { id: 'playback', label: 'Playback', startStep: 'cc-chord-placed' },
  { id: 'picker', label: 'Chord Picker', startStep: 'cc-card-updated' },
  { id: 'controls', label: 'Controls', startStep: 'cc-position-nav' },
  { id: 'key', label: 'Key', startStep: 'cc-key-intro' },
  { id: 'advanced', label: 'More', startStep: 'cc-tuning' },
  { id: 'complete', label: 'Done', startStep: 'cc-complete' },
];
