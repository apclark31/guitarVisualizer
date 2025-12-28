/**
 * AppHeader - Transparent header with brand and hamburger menu
 *
 * Features:
 * - Chord Compass branding (Inter 600)
 * - Hamburger menu that opens drawer from right
 * - Drawer contains nav links with active indicator
 */

import { useState } from 'react';
import styles from './AppHeader.module.css';

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
  icon?: 'github';
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Chord Compass', href: '#', isActive: true },
  { label: 'Scale Sage', href: '#', comingSoon: true },
  { label: 'Tutorial', href: '#', comingSoon: true },
  { label: 'Feedback', href: '#', comingSoon: true },
  { label: 'GitHub', href: 'https://github.com/apclark31/guitarVisualizer', icon: 'github' },
];

export function AppHeader() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.brand}>Chord Compass</div>
        <button
          className={styles.menuButton}
          onClick={toggleDrawer}
          aria-label="Open menu"
          aria-expanded={isDrawerOpen}
        >
          <span className={styles.hamburger}>
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </span>
        </button>
      </header>

      {/* Drawer overlay */}
      {isDrawerOpen && (
        <div
          className={styles.overlay}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerBrand}>Fret Atlas</span>
          <button
            className={styles.closeButton}
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <span className={styles.closeIcon}>×</span>
          </button>
        </div>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className={`${styles.navLink} ${item.isActive ? styles.navLinkActive : ''} ${item.comingSoon ? styles.navLinkDisabled : ''}`}
                onClick={item.href === '#' ? (e) => { e.preventDefault(); if (!item.comingSoon) closeDrawer(); } : undefined}
                target={item.icon === 'github' ? '_blank' : undefined}
                rel={item.icon === 'github' ? 'noopener noreferrer' : undefined}
              >
                {item.icon === 'github' && (
                  <svg className={styles.githubIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
                <span>{item.label}</span>
                {item.comingSoon && <span className={styles.comingSoon}>Coming Soon</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
