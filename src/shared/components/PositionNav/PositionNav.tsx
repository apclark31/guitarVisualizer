import styles from './PositionNav.module.css';

interface PositionNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  inactive?: boolean;
  highlight?: boolean;
  dataTour?: string;
}

export function PositionNav({
  label,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  inactive = false,
  highlight = false,
  dataTour,
}: PositionNavProps) {
  const labelClass = [
    styles.label,
    inactive ? styles.labelInactive : '',
    highlight ? styles.labelHighlight : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.positionNav} data-tour={dataTour}>
      <button
        className={styles.navBtn}
        onClick={onPrev}
        disabled={prevDisabled}
        aria-label="Previous position"
      >
        &lsaquo;
      </button>
      <span className={labelClass}>{label}</span>
      <button
        className={styles.navBtn}
        onClick={onNext}
        disabled={nextDisabled}
        aria-label="Next position"
      >
        &rsaquo;
      </button>
    </div>
  );
}
