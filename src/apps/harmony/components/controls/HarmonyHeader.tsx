/**
 * HarmonyHeader - Key display + progression name
 */

import { useSharedStore } from '../../../../shared/store';
import { getPresetById } from '../../config/presets';
import styles from './HarmonyHeader.module.css';

interface HarmonyHeaderProps {
  activePresetId: string | null;
}

export function HarmonyHeader({ activePresetId }: HarmonyHeaderProps) {
  const { keyContext } = useSharedStore();

  const preset = activePresetId ? getPresetById(activePresetId) : null;
  const keyLabel = keyContext
    ? `${keyContext.root} ${keyContext.type === 'major' ? 'Major' : 'Minor'}`
    : 'No Key Selected';

  return (
    <div className={styles.header}>
      <div className={styles.keyLabel}>{keyLabel}</div>
      {preset && (
        <div className={styles.presetName}>{preset.name}</div>
      )}
      {!preset && keyContext && (
        <div className={styles.presetName}>Custom Progression</div>
      )}
    </div>
  );
}
