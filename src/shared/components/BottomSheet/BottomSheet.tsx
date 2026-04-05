/**
 * BottomSheet — iOS-style slide-up panel with drag handle and swipe-to-dismiss
 *
 * Used for Library picker (chords + scales). Slides up from bottom with
 * a drag handle capsule. Swipe down or tap backdrop to dismiss.
 */

import { useRef, useEffect, useCallback, type ReactNode } from 'react';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/** Minimum drag distance (px) to trigger close */
const CLOSE_THRESHOLD_RATIO = 0.25;

export function BottomSheet({ isOpen, onClose, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, currentY: 0, isDragging: false });

  // Lock body scroll when open, compensate for scrollbar removal
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Touch handlers for swipe-to-dismiss on the drag handle
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.isDragging = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - dragRef.current.startY;
    // Only allow dragging downward
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current.isDragging || !sheetRef.current) return;
    dragRef.current.isDragging = false;

    const sheetHeight = sheetRef.current.offsetHeight;
    const deltaY = parseFloat(sheetRef.current.style.transform.replace(/[^0-9.-]/g, '')) || 0;

    // Reset inline styles, let CSS transition handle snap
    sheetRef.current.style.transition = '';

    if (deltaY > sheetHeight * CLOSE_THRESHOLD_RATIO) {
      onClose();
    }
    // Reset transform to let CSS class handle it
    sheetRef.current.style.transform = '';
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${className || ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={styles.handleArea}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.dragHandle} />
        </div>
        <div className={styles.sheetContent}>
          {children}
        </div>
      </div>
    </>
  );
}
