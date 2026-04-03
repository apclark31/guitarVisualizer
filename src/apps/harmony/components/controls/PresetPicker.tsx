/**
 * PresetPicker - Preset progression grid in a BottomSheet
 */

import { useState } from 'react';
import { BottomSheet } from '../../../../shared/components/BottomSheet';
import { PRESETS } from '../../config/presets';
import styles from './PresetPicker.module.css';

interface PresetPickerProps {
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;
}

export function PresetPicker({ activePresetId, onSelectPreset }: PresetPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (presetId: string) => {
    onSelectPreset(presetId);
    setIsOpen(false);
  };

  return (
    <>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
      >
        Presets
      </button>
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className={styles.sheet}>
          <div className={styles.sheetTitle}>Chord Progressions</div>
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
      </BottomSheet>
    </>
  );
}
