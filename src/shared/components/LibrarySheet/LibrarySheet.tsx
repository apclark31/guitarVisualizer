/**
 * LibrarySheet - Unified fixed-height bottom sheet for all modes
 *
 * Wraps BottomSheet with a tab bar and fixed height. Each mode provides
 * its own tab configuration via the tabs prop. Active tab is managed
 * via the shared store so it persists across open/close.
 */

import { createContext, useContext } from 'react';
import { useSharedStore } from '../../store';
import { BottomSheet } from '../BottomSheet';
import { TabBar } from './TabBar';
import type { LibraryTab } from './types';
import styles from './LibrarySheet.module.css';

/* ── Audio context for shared panels (TuningPanel, etc.) ── */

interface LibraryAudioContext {
  playNote: (note: string, duration?: number) => Promise<void>;
  isAudioLoaded: boolean;
}

const AudioContext = createContext<LibraryAudioContext | null>(null);

export function LibrarySheetProvider({
  playNote,
  isAudioLoaded,
  children,
}: LibraryAudioContext & { children: React.ReactNode }) {
  return (
    <AudioContext.Provider value={{ playNote, isAudioLoaded }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useLibraryAudio(): LibraryAudioContext {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    return { playNote: async () => {}, isAudioLoaded: false };
  }
  return ctx;
}

/* ── LibrarySheet component ─────────────────────────────── */

interface LibrarySheetProps {
  tabs: LibraryTab[];
}

export function LibrarySheet({ tabs }: LibrarySheetProps) {
  const { isLibraryOpen, closeLibrary, activeLibraryTab, setActiveLibraryTab } =
    useSharedStore();

  // Find active tab, fallback to first
  const activeTab = tabs.find((t) => t.id === activeLibraryTab) || tabs[0];

  if (!activeTab) return null;

  return (
    <BottomSheet
      isOpen={isLibraryOpen}
      onClose={closeLibrary}
      className={styles.librarySheet}
    >
      <TabBar
        tabs={tabs}
        activeTabId={activeTab.id}
        onTabChange={setActiveLibraryTab}
      />
      <div className={styles.panel}>
        {activeTab.render()}
      </div>
    </BottomSheet>
  );
}
