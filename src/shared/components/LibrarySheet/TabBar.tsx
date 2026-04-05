/**
 * TabBar - Shared tab navigation for LibrarySheet
 *
 * Renders a horizontal row of tabs with optional badge counts.
 * Active tab indicated by bottom border + primary color.
 */

import type { LibraryTab } from './types';
import styles from './TabBar.module.css';

interface TabBarProps {
  tabs: LibraryTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabChange }: TabBarProps) {
  return (
    <div className={styles.tabBar}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTabId === tab.id ? styles.tabActive : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {activeTabId !== tab.id && tab.badge !== undefined && tab.badge > 0 && (
            <span className={styles.badge}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
