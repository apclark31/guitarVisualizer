/**
 * Card — Reusable card wrapper with token-based styling
 *
 * Surface-container background, radius, ghost border, layered shadow.
 * Used to group controls into visual sections below the fretboard.
 */

import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  className?: string;
}

export function Card({ children, title, icon, className }: CardProps) {
  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      {title && (
        <h3 className={styles.title}>
          {icon && <span className={styles.titleIcon}>{icon}</span>}
          {title}
        </h3>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
