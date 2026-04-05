/**
 * useChordLibraryTabs - Tab configuration for Chords mode Library
 *
 * Returns [Library, Matches, Key, Tuning] tabs for LibrarySheet.
 */

import { useMusicStore } from '../../store/useMusicStore';
import { ChordLibraryPanel } from './ChordLibraryPanel';
import { ChordMatchesPanel } from './ChordMatchesPanel';
import { KeyPanel } from '../../../../shared/components/LibrarySheet/panels/KeyPanel';
import { TuningPanel } from '../../../../shared/components/LibrarySheet/panels/TuningPanel';
import type { LibraryTab } from '../../../../shared/components/LibrarySheet';
import type { PlaybackMode } from '../../types';

interface UseChordLibraryTabsOptions {
  playNotes: (notes: string[], mode?: PlaybackMode) => Promise<void>;
  onSelectTuning: (tuning: string[], name: string) => void;
}

export function useChordLibraryTabs({
  playNotes,
  onSelectTuning,
}: UseChordLibraryTabsOptions): LibraryTab[] {
  const { suggestions, keySuggestions } = useMusicStore();
  const matchCount = suggestions.length + keySuggestions.length;

  return [
    {
      id: 'library',
      label: 'Library',
      render: () => <ChordLibraryPanel playNotes={playNotes} />,
    },
    {
      id: 'matches',
      label: 'Matches',
      badge: matchCount > 0 ? matchCount : undefined,
      render: () => <ChordMatchesPanel />,
    },
    {
      id: 'key',
      label: 'Key',
      render: () => <KeyPanel />,
    },
    {
      id: 'tuning',
      label: 'Tuning',
      render: () => <TuningPanel onSelectTuning={onSelectTuning} />,
    },
  ];
}
