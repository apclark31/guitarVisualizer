/**
 * KeyPicker - Key selector for Harmony mode
 *
 * Shown as an inline grid and also rendered inside the Library BottomSheet.
 * Sets keyContext on the shared store.
 */

import { useSharedStore } from '../../../../shared/store';
import { KEY_OPTIONS } from '../../../chords/config/constants';
import type { KeyType } from '../../../../shared/types';
import styles from './KeyPicker.module.css';

interface KeyPickerProps {
  variant?: 'inline' | 'sheet';
}

export function KeyPicker({ variant = 'inline' }: KeyPickerProps) {
  const { keyContext, setKeyContext } = useSharedStore();

  const majorKeys = KEY_OPTIONS.filter(k => k.type === 'major');
  const minorKeys = KEY_OPTIONS.filter(k => k.type === 'minor');

  const handleSelect = (root: string, type: KeyType) => {
    setKeyContext({ root, type });
  };

  const handleClear = () => {
    setKeyContext(null);
  };

  return (
    <div className={`${styles.picker} ${variant === 'sheet' ? styles.sheet : ''}`}>
      {variant === 'sheet' && (
        <div className={styles.sheetTitle}>Select Key</div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Major</div>
        <div className={styles.keyGrid}>
          {majorKeys.map(k => (
            <button
              key={k.display}
              className={`${styles.keyBtn} ${
                keyContext?.root === k.root && keyContext?.type === k.type
                  ? styles.active
                  : ''
              }`}
              onClick={() => handleSelect(k.root, k.type)}
            >
              {k.root}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Minor</div>
        <div className={styles.keyGrid}>
          {minorKeys.map(k => (
            <button
              key={k.display}
              className={`${styles.keyBtn} ${
                keyContext?.root === k.root && keyContext?.type === k.type
                  ? styles.active
                  : ''
              }`}
              onClick={() => handleSelect(k.root, k.type)}
            >
              {k.root}
            </button>
          ))}
        </div>
      </div>

      {keyContext && (
        <button className={styles.clearBtn} onClick={handleClear}>
          Clear Key
        </button>
      )}
    </div>
  );
}
