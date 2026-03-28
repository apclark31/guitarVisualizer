/**
 * Card — Reusable card wrapper with token-based styling
 *
 * Surface-container background, radius, ambient shadow, no borders.
 * Used to group controls into visual sections below the fretboard.
 */

import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className }: CardProps) {
  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
