/**
 * useScaleLibraryTabs - Tab configuration for Scales mode Library
 *
 * Returns [Library, Matches, Key, Tuning] tabs for LibrarySheet.
 */

import { useScaleStore } from '../../store/useScaleStore';
import { ScaleLibraryPanel } from './ScaleLibraryPanel';
import { ScaleMatchesPanel } from './ScaleMatchesPanel';
import { KeyPanel } from '../../../../shared/components/LibrarySheet/panels/KeyPanel';
import { TuningPanel } from '../../../../shared/components/LibrarySheet/panels/TuningPanel';
import type { LibraryTab } from '../../../../shared/components/LibrarySheet';

interface UseScaleLibraryTabsOptions {
  onSelectTuning: (tuning: string[], name: string) => void;
}

export function useScaleLibraryTabs({
  onSelectTuning,
}: UseScaleLibraryTabsOptions): LibraryTab[] {
  const { scaleSuggestions, keySuggestions } = useScaleStore();
  const matchCount = scaleSuggestions.length + keySuggestions.length;

  return [
    {
      id: 'library',
      label: 'Library',
      render: () => <ScaleLibraryPanel />,
    },
    {
      id: 'matches',
      label: 'Matches',
      badge: matchCount > 0 ? matchCount : undefined,
      render: () => <ScaleMatchesPanel />,
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
