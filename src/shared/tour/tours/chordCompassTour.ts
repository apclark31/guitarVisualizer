/**
 * Chord Compass Tour - Guided walkthrough of the Chord Compass app
 *
 * Uses Scale Sage as the tour guide character.
 * Content is defined in ../scripts/chordCompassScript.ts for easy editing.
 */

import Shepherd, { type Tour, type StepOptions } from 'shepherd.js';
import { chordCompassScript, type TourStep, type TourButton } from '../scripts/chordCompassScript';

// Scale Sage avatar URL
const sageAvatarUrl = `${import.meta.env.BASE_URL}scale-sage-icon.png`;

/**
 * Detect mobile viewport
 */
function isMobile(): boolean {
  return window.innerWidth <= 768;
}

/**
 * Create progress indicator HTML
 */
function progressIndicator(current: number, total: number): string {
  return `<div class="tour-progress">${current} of ${total}</div>`;
}

/**
 * Create tour step text with Scale Sage avatar
 */
function sageMessage(content: string, action?: string, stepNum?: number, totalSteps?: number): string {
  const progress = stepNum && totalSteps ? progressIndicator(stepNum, totalSteps) : '';
  return `
    <div class="sage-guide">
      <img src="${sageAvatarUrl}" alt="Scale Sage" class="sage-avatar" />
      <div class="sage-message">
        ${content}
        ${action ? `<div class="sage-action">${action}</div>` : ''}
      </div>
    </div>
    ${progress}
  `;
}

/**
 * Create welcome/completion centered content
 */
function centeredContent(title: string, content: string, stepNum?: number, totalSteps?: number): string {
  const progress = stepNum && totalSteps ? progressIndicator(stepNum, totalSteps) : '';
  return `
    <div class="tour-welcome-content">
      <img src="${sageAvatarUrl}" alt="Scale Sage" class="sage-avatar" />
      <h2>${title}</h2>
      <p>${content}</p>
    </div>
    ${progress}
  `;
}

/**
 * Default step options
 */
const defaultStepOptions: StepOptions = {
  classes: 'fret-atlas-tour',
  scrollTo: { behavior: 'smooth', block: 'center' },
  cancelIcon: { enabled: true },
  modalOverlayOpeningPadding: 12,
  modalOverlayOpeningRadius: 12,
};

/**
 * Wait for an element to appear in the DOM
 * Polls every 100ms up to maxWait (default 5 seconds)
 */
function waitForElement(selector: string, maxWait = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime >= maxWait) {
        console.warn(`[Tour] Element not found after ${maxWait}ms: ${selector}`);
        resolve(null);
        return;
      }

      requestAnimationFrame(checkElement);
    };

    checkElement();
  });
}

/**
 * Map button action string to Shepherd action function
 */
function mapButtonAction(action: TourButton['action'], tour: Tour): () => void {
  switch (action) {
    case 'next':
      return () => tour.next();
    case 'back':
      return () => tour.back();
    case 'complete':
      return () => tour.complete();
    case 'skip':
      return () => tour.complete();
    case 'close-picker':
      return () => {
        // Try to close any open picker/modal
        const closeBtn = document.querySelector('[data-tour="picker-close"], [data-tour="key-close"]') as HTMLElement;
        if (closeBtn) {
          // Hide current step immediately to prevent positioning issues
          const currentStep = tour.getCurrentStep();
          if (currentStep) {
            currentStep.hide();
          }
          closeBtn.click();
          // Wait for modal close animation, then advance
          setTimeout(() => tour.next(), 300);
        } else {
          tour.next();
        }
      };
    case 'close-and-next':
      return () => {
        // Close picker first, then advance - prevents tooltip positioning issues
        const closeBtn = document.querySelector('[data-tour="picker-close"], [data-tour="key-close"]') as HTMLElement;

        // Hide the current step's tooltip element directly via DOM
        const tooltipEl = document.querySelector('.shepherd-element.shepherd-enabled');
        if (tooltipEl) {
          (tooltipEl as HTMLElement).style.display = 'none';
        }

        if (closeBtn) {
          closeBtn.click();
        }

        // Wait for picker to fully close, then advance
        setTimeout(() => {
          tour.next();
        }, 400);
      };
    case 'force-close-picker-next':
      return () => {
        // Hide ALL Shepherd elements immediately via DOM to prevent flash
        document.querySelectorAll('.shepherd-element').forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
        const overlay = document.querySelector('.shepherd-modal-overlay-container');
        if (overlay) {
          (overlay as HTMLElement).style.display = 'none';
        }

        // Force close picker via custom event
        window.dispatchEvent(new CustomEvent('tour-close-picker'));

        // Minimal delay for React state update, then advance
        requestAnimationFrame(() => {
          if (overlay) {
            (overlay as HTMLElement).style.display = '';
          }
          tour.next();
        });
      };
    case 'apply-key-and-next':
      return () => {
        // Click C root, Major type, then Apply button on the KeyPicker
        const cButton = document.querySelector('[data-tour="key-picker"] [data-value="C"]') as HTMLElement;
        const majorButton = document.querySelector('[data-tour="key-picker"] [data-value="major"]') as HTMLElement;
        const applyButton = document.querySelector('[data-tour="key-apply"]') as HTMLElement;

        if (cButton) cButton.click();
        if (majorButton) majorButton.click();
        if (applyButton) applyButton.click();

        // Advance after modal closes
        requestAnimationFrame(() => {
          tour.next();
        });
      };
    default:
      return () => tour.next();
  }
}

/**
 * Map button style to CSS class
 */
function mapButtonStyle(style: TourButton['style']): string {
  switch (style) {
    case 'primary':
      return 'tour-btn-primary';
    case 'secondary':
      return 'tour-btn-secondary';
    case 'skip':
      return 'tour-btn-skip';
    default:
      return 'tour-btn-secondary';
  }
}

/**
 * Dispatch custom event to highlight specific frets during tour
 */
function setTourHighlightedFrets(frets: Array<{ string: number; fret: number }> | null): void {
  window.dispatchEvent(new CustomEvent('tour-highlight-frets', { detail: frets }));
}

/**
 * Convert script step to Shepherd step options
 */
function convertStep(step: TourStep, tour: Tour, isFirstAttached: boolean, stepIndex: number, totalSteps: number): StepOptions {
  const mobile = isMobile();
  const position = mobile && step.mobilePosition ? step.mobilePosition : step.position;
  const stepNum = stepIndex + 1; // 1-based for display

  // Base step config
  const shepherdStep: StepOptions = {
    id: step.id,
    classes: step.element ? 'fret-atlas-tour' : 'fret-atlas-tour tour-centered',
  };

  // Handle noOverlay - hide Shepherd's modal overlay for this step
  if (step.noOverlay) {
    shepherdStep.when = {
      show: () => {
        const overlay = document.querySelector('.shepherd-modal-overlay-container');
        if (overlay) {
          (overlay as HTMLElement).style.opacity = '0';
          (overlay as HTMLElement).style.pointerEvents = 'none';
        }
      },
      hide: () => {
        const overlay = document.querySelector('.shepherd-modal-overlay-container');
        if (overlay) {
          (overlay as HTMLElement).style.opacity = '';
          (overlay as HTMLElement).style.pointerEvents = '';
        }
      },
    };
  }

  // Text content with progress indicator
  if (step.title && !step.element) {
    // Centered welcome/completion step
    shepherdStep.text = centeredContent(step.title, step.content, stepNum, totalSteps);
  } else {
    // Regular step with avatar
    shepherdStep.text = sageMessage(step.content, step.action, stepNum, totalSteps);
  }

  // Element attachment
  if (step.element) {
    shepherdStep.attachTo = {
      element: step.element,
      on: position || 'auto',
    };
  }

  // Handle buttons - custom buttons take priority
  if (step.buttons && step.buttons.length > 0) {
    // Custom buttons from script
    shepherdStep.buttons = step.buttons.map((btn) => ({
      text: btn.text,
      action: mapButtonAction(btn.action, tour),
      classes: mapButtonStyle(btn.style),
    }));
  } else if (step.interactive) {
    // Interactive step - requires user interaction
    const advanceSelector = step.interactiveSelector || step.element || 'body';
    shepherdStep.advanceOn = {
      selector: advanceSelector,
      event: step.interactiveEvent || 'click',
    };
    // Provide skip option for interactive steps
    shepherdStep.buttons = [
      { text: 'Skip', action: () => tour.next(), classes: 'tour-btn-skip' },
    ];
  } else if (!step.element) {
    // Centered step (welcome/complete) without custom buttons
    const isComplete = step.id.includes('complete');
    shepherdStep.buttons = [
      {
        text: isComplete ? 'Start Exploring' : "Let's Go!",
        action: isComplete ? () => tour.complete() : () => tour.next(),
        classes: 'tour-btn-primary',
      },
    ];
  } else {
    // Regular navigation step
    shepherdStep.buttons = isFirstAttached
      ? [{ text: 'Next', action: () => tour.next(), classes: 'tour-btn-primary' }]
      : [
          { text: 'Back', action: () => tour.back(), classes: 'tour-btn-secondary' },
          { text: 'Next', action: () => tour.next(), classes: 'tour-btn-primary' },
        ];
  }

  // Handle closePicker, openPicker, waitFor, and modal delays in beforeShowPromise
  if (step.closePicker || step.openPicker || step.waitFor || (step.element?.includes('picker') || step.element?.includes('modal'))) {
    shepherdStep.beforeShowPromise = async () => {
      // If closePicker is true, close any open picker/modal first
      if (step.closePicker) {
        const closeBtn = document.querySelector('[data-tour="picker-close"], [data-tour="key-close"]') as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
          // Wait for modal close animation
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
      // If openPicker is true, click the chord card to open the picker
      if (step.openPicker) {
        const chordCard = document.querySelector('[data-tour="chord-card"]') as HTMLElement;
        if (chordCard) {
          chordCard.click();
          // Wait a bit for the click to register
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      // If waitFor is specified, poll for the element
      if (step.waitFor) {
        await waitForElement(step.waitFor);
      }
      // Additional delay for modals/pickers to animate in
      if (step.element?.includes('picker') || step.element?.includes('modal')) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    };
  }

  return shepherdStep;
}

/**
 * Fret highlight configurations for specific steps
 */
const STEP_FRET_HIGHLIGHTS: Record<string, Array<{ string: number; fret: number }>> = {
  // Step 5: Tap 5th fret on low E string (string index 0)
  'cc-freeplay-intro': [{ string: 0, fret: 5 }],
  // Step 6: Tap 4th fret on A string (string index 1)
  'cc-freeplay-second': [{ string: 1, fret: 4 }],
};

/**
 * Creates and returns the Chord Compass tour instance
 */
export function createChordCompassTour(): Tour {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions,
    exitOnEsc: true,
    keyboardNavigation: true,
  });

  const totalSteps = chordCompassScript.length;

  // Track first attached element step (for button logic)
  let foundFirstAttached = false;

  // Convert all script steps to Shepherd steps
  chordCompassScript.forEach((step, index) => {
    const isFirstAttached = !foundFirstAttached && !!step.element;
    if (isFirstAttached) {
      foundFirstAttached = true;
    }
    tour.addStep(convertStep(step, tour, isFirstAttached, index, totalSteps));
  });

  // Add event listener to manage fret highlights
  tour.on('show', (evt) => {
    const stepId = evt.step.id;
    const highlights = STEP_FRET_HIGHLIGHTS[stepId] || null;
    setTourHighlightedFrets(highlights);
  });

  // Clear highlights when tour ends or is cancelled
  tour.on('complete', () => {
    setTourHighlightedFrets(null);
  });

  tour.on('cancel', () => {
    setTourHighlightedFrets(null);
  });

  return tour;
}
