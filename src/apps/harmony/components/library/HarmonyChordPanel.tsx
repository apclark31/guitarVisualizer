/**
 * HarmonyChordPanel - Chord picker for Harmony mode progression building
 *
 * Wraps HarmonyChordPicker content as a LibrarySheet tab panel.
 */

import { HarmonyChordPicker } from '../controls/HarmonyChordPicker';
import { useSharedStore } from '../../../../shared/store';

interface HarmonyChordPanelProps {
  onInsert: (root: string, quality: string) => void;
}

export function HarmonyChordPanel({ onInsert }: HarmonyChordPanelProps) {
  const { closeLibrary } = useSharedStore();

  const handleInsert = (root: string, quality: string) => {
    onInsert(root, quality);
    closeLibrary();
  };

  return <HarmonyChordPicker onInsert={handleInsert} />;
}
