/**
 * ScaleLibraryPanel - Three-column scale picker (Root/Category/Type)
 *
 * Mirrors the ChordLibraryPanel layout. Category column filters the
 * type column to show only scales in the selected group.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useScaleStore, type ScaleType } from '../../store/useScaleStore';
import { useSharedStore } from '../../../../shared/store';
import { ROOT_OPTIONS, SCALE_TYPE_DISPLAY, SCALE_CATEGORIES } from '../../lib/scale-data';
import styles from './ScaleLibraryPanel.module.css';

type ScaleCategory = keyof typeof SCALE_CATEGORIES;

const CATEGORY_DISPLAY: Record<ScaleCategory, string> = {
  'diatonic-modes': 'Diatonic Modes',
  'melodic-minor': 'Melodic Minor',
  'harmonic-minor': 'Harmonic Minor',
  pentatonic: 'Pentatonic',
  symmetric: 'Symmetric',
  bebop: 'Bebop',
  exotic: 'Exotic',
};

const CATEGORY_ORDER: ScaleCategory[] = [
  'diatonic-modes', 'melodic-minor', 'harmonic-minor',
  'pentatonic', 'symmetric', 'bebop', 'exotic',
];

function getCategoryForType(type: ScaleType): ScaleCategory {
  for (const cat of CATEGORY_ORDER) {
    if ((SCALE_CATEGORIES[cat] as readonly ScaleType[]).includes(type)) return cat;
  }
  return 'diatonic-modes';
}

export function ScaleLibraryPanel() {
  const { scaleRoot, scaleType, setScaleRoot, setScaleType, setPosition } = useScaleStore();
  const { closeLibrary } = useSharedStore();

  const [pendingRoot, setPendingRoot] = useState(scaleRoot || 'C');
  const [pendingCategory, setPendingCategory] = useState<ScaleCategory>(
    scaleType ? getCategoryForType(scaleType) : 'diatonic-modes'
  );
  const [pendingType, setPendingType] = useState<ScaleType>(scaleType || 'major');

  const rootColumnRef = useRef<HTMLDivElement>(null);
  const categoryColumnRef = useRef<HTMLDivElement>(null);
  const typeColumnRef = useRef<HTMLDivElement>(null);

  const typeOptions = useMemo(() => SCALE_CATEGORIES[pendingCategory], [pendingCategory]);

  useEffect(() => {
    if (scaleRoot) setPendingRoot(scaleRoot);
    if (scaleType) {
      setPendingType(scaleType);
      setPendingCategory(getCategoryForType(scaleType));
    }
  }, [scaleRoot, scaleType]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollActiveIntoView(rootColumnRef.current, pendingRoot);
      scrollActiveIntoView(categoryColumnRef.current, pendingCategory);
      scrollActiveIntoView(typeColumnRef.current, pendingType);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = useCallback((category: ScaleCategory) => {
    setPendingCategory(category);
    setPendingType(SCALE_CATEGORIES[category][0]);
  }, []);

  const handleApply = useCallback(() => {
    setScaleRoot(pendingRoot);
    setScaleType(pendingType);
    setPosition(1);
    closeLibrary();
  }, [pendingRoot, pendingType, setScaleRoot, setScaleType, setPosition, closeLibrary]);

  const handleClear = useCallback(() => {
    setScaleRoot(null);
    setScaleType(null);
    setPosition(1);
    closeLibrary();
  }, [setScaleRoot, setScaleType, setPosition, closeLibrary]);

  return (
    <div className={styles.libraryContent}>
      <div className={styles.headers}>
        <div className={styles.header}>Root</div>
        <div className={styles.header}>Category</div>
        <div className={styles.header}>Type</div>
      </div>

      <div className={styles.columns}>
        <div ref={rootColumnRef} className={styles.column}>
          {ROOT_OPTIONS.map((option) => (
            <button
              key={option.value}
              data-value={option.value}
              className={`${styles.option} ${pendingRoot === option.value ? styles.active : ''}`}
              onClick={() => setPendingRoot(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div ref={categoryColumnRef} className={styles.column}>
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              data-value={cat}
              className={`${styles.option} ${pendingCategory === cat ? styles.active : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {CATEGORY_DISPLAY[cat]}
            </button>
          ))}
        </div>

        <div ref={typeColumnRef} className={styles.column}>
          {typeOptions.map((type) => (
            <button
              key={type}
              data-value={type}
              className={`${styles.option} ${pendingType === type ? styles.active : ''}`}
              onClick={() => setPendingType(type)}
            >
              {SCALE_TYPE_DISPLAY[type]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button className={styles.clearButton} onClick={handleClear}>
          Clear
        </button>
        <button className={styles.applyButton} onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}

function scrollActiveIntoView(container: HTMLElement | null, value: string) {
  if (!container) return;
  const active = container.querySelector(`[data-value="${value}"]`) as HTMLElement;
  if (active) {
    active.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}
