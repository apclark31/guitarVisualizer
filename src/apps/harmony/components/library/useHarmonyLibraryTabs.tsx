/**
 * useHarmonyLibraryTabs - Tab configuration for Harmony mode Library
 *
 * Returns [Library, Presets, Key, Tuning] tabs for LibrarySheet.
 */

import { HarmonyChordPanel } from './HarmonyChordPanel';
import { HarmonyPresetsPanel } from './HarmonyPresetsPanel';
import { KeyPanel } from '../../../../shared/components/LibrarySheet/panels/KeyPanel';
import { TuningPanel } from '../../../../shared/components/LibrarySheet/panels/TuningPanel';
import type { LibraryTab } from '../../../../shared/components/LibrarySheet';

interface UseHarmonyLibraryTabsOptions {
  onInsertChord: (root: string, quality: string) => void;
  onSelectTuning: (tuning: string[], name: string) => void;
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;
}

export function useHarmonyLibraryTabs({
  onInsertChord,
  onSelectTuning,
  activePresetId,
  onSelectPreset,
}: UseHarmonyLibraryTabsOptions): LibraryTab[] {
  return [
    {
      id: 'library',
      label: 'Chords',
      render: () => <HarmonyChordPanel onInsert={onInsertChord} />,
    },
    {
      id: 'presets',
      label: 'Presets',
      render: () => (
        <HarmonyPresetsPanel
          activePresetId={activePresetId}
          onSelectPreset={onSelectPreset}
        />
      ),
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
