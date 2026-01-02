/**
 * TourContext - React context for managing Shepherd JS tours
 *
 * Provides tour instances and control functions to the app.
 * Tours are lazily initialized and shared across components.
 */

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react';
import { type Tour } from 'shepherd.js';
import { createChordCompassTour } from './tours/chordCompassTour';
import './styles/tour.css';

interface TourContextValue {
  startChordCompassTour: () => void;
  isActive: boolean;
  hasSeenChordCompassTour: boolean;
  markTourSeen: (tourId: 'chordCompass' | 'scaleSage') => void;
}

const TourContext = createContext<TourContextValue | null>(null);

const TOUR_SEEN_KEYS = {
  chordCompass: 'fretAtlas_hasSeenTour_CC',
  scaleSage: 'fretAtlas_hasSeenTour_SS',
} as const;

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [chordCompassTour, setChordCompassTour] = useState<Tour | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasSeenChordCompassTour, setHasSeenChordCompassTour] = useState(true); // Default true to avoid flash

  // Check localStorage on mount
  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEYS.chordCompass) === 'true';
    setHasSeenChordCompassTour(seen);
  }, []);

  // Initialize Chord Compass tour lazily
  const getChordCompassTour = useCallback(() => {
    if (chordCompassTour) return chordCompassTour;

    const tour = createChordCompassTour();

    // Track active state
    tour.on('start', () => setIsActive(true));
    tour.on('complete', () => {
      setIsActive(false);
      localStorage.setItem(TOUR_SEEN_KEYS.chordCompass, 'true');
      setHasSeenChordCompassTour(true);
    });
    tour.on('cancel', () => {
      setIsActive(false);
      // Also mark as seen if cancelled - user chose to skip
      localStorage.setItem(TOUR_SEEN_KEYS.chordCompass, 'true');
      setHasSeenChordCompassTour(true);
    });

    setChordCompassTour(tour);
    return tour;
  }, [chordCompassTour]);

  const startChordCompassTour = useCallback(() => {
    const tour = getChordCompassTour();
    // Small delay to ensure DOM is ready
    setTimeout(() => tour.start(), 100);
  }, [getChordCompassTour]);

  const markTourSeen = useCallback((tourId: 'chordCompass' | 'scaleSage') => {
    localStorage.setItem(TOUR_SEEN_KEYS[tourId], 'true');
    if (tourId === 'chordCompass') {
      setHasSeenChordCompassTour(true);
    }
  }, []);

  const value: TourContextValue = {
    startChordCompassTour,
    isActive,
    hasSeenChordCompassTour,
    markTourSeen,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return ctx;
}
