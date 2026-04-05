/**
 * HarmonyPresetsPanel - Preset progression grid as a LibrarySheet tab panel
 *
 * Extracted from PresetPicker. Shows preset grid inline (no sub-sheet).
 */

import { useSharedStore } from '../../../../shared/store';
import { PRESETS } from '../../config/presets';
import styles from './HarmonyPresetsPanel.module.css';

interface HarmonyPresetsPanelProps {
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;
}

export function HarmonyPresetsPanel({ activePresetId, onSelectPreset }: HarmonyPresetsPanelProps) {
  const { closeLibrary } = useSharedStore();

  const handleSelect = (presetId: string) => {
    onSelectPreset(presetId);
    closeLibrary();
  };

  return (
    <div className={styles.presetsPanel}>
      <div className={styles.grid}>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`${styles.presetCard} ${preset.id === activePresetId ? styles.active : ''}`}
            onClick={() => handleSelect(preset.id)}
          >
            <div className={styles.presetName}>{preset.name}</div>
            <div className={styles.presetDegrees}>
              {preset.degrees.join(' - ')}
            </div>
            {preset.description && (
              <div className={styles.presetDesc}>{preset.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
