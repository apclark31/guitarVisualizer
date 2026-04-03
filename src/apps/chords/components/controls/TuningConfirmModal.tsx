/**
 * TuningConfirmModal - Confirmation modal for tuning changes
 *
 * Shows when changing tuning with notes on the fretboard.
 * Offers three options: adapt, keep fingering, or clear.
 */

import { useEffect } from 'react';
import type { TuningChangeMode } from '../../types';
import styles from './TuningConfirmModal.module.css';

interface TuningConfirmModalProps {
  isOpen: boolean;
  tuningName: string;
  onSelect: (mode: TuningChangeMode) => void;
  onCancel: () => void;
}

export function TuningConfirmModal({
  isOpen,
  tuningName,
  onSelect,
  onCancel,
}: TuningConfirmModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onCancel} aria-hidden="true" />
      <div className={styles.modal} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title" className={styles.title}>
          Changing to {tuningName}
        </h2>

        <div className={styles.options}>
          <button
            className={styles.option}
            onClick={() => onSelect('adapt')}
          >
            <span className={styles.optionTitle}>Adapt to new tuning</span>
            <span className={styles.optionDesc}>Transpose notes to maintain pitch</span>
          </button>

          <button
            className={styles.option}
            onClick={() => onSelect('keep')}
          >
            <span className={styles.optionTitle}>Keep fingering</span>
            <span className={styles.optionDesc}>Same frets, pitch changes</span>
          </button>

          <button
            className={`${styles.option} ${styles.optionDestructive}`}
            onClick={() => onSelect('clear')}
          >
            <span className={styles.optionTitle}>Clear fretboard</span>
            <span className={styles.optionDesc}>Start fresh</span>
          </button>
        </div>

        <button className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </>
  );
}
