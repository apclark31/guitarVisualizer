/**
 * AppHeader - Fret Atlas header with brand, mode tabs, and hamburger menu
 *
 * Mobile: Shows "Fret Atlas" brand. Desktop: Shows mode tabs (Chords/Scales)
 * with underline indicator. Hamburger opens drawer with site-wide navigation
 * (Tour, Feedback, GitHub).
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTour } from '../../tour';
import { useTheme } from '../../hooks/useTheme';
import styles from './AppHeader.module.css';

interface NavItem {
  label: string;
  href: string;
  icon?: 'github';
  comingSoon?: boolean;
  action?: 'tour';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Take the Tour', href: '#', action: 'tour' },
  { label: 'Feedback', href: '#', comingSoon: true },
  { label: 'GitHub', href: 'https://github.com/apclark31/guitarVisualizer', icon: 'github' },
];

export function AppHeader() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const { startChordCompassTour } = useTour();
  const { theme, toggleTheme } = useTheme();

  // Determine current mode for desktop header
  const isScalesMode = location.pathname.startsWith('/scales');
  const isHarmonyMode = location.pathname.startsWith('/harmony');

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleTourClick = () => {
    closeDrawer();
    if (!isScalesMode) {
      startChordCompassTour();
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.brand}>
          <a href="/" className={styles.brandMobile}>
            <img
              src={`${import.meta.env.BASE_URL}fret-atlas-logo.png`}
              alt=""
              className={styles.brandIcon}
            />
            Fret Atlas
          </a>
          <div className={styles.brandDesktop}>
            <NavLink
              to="/chords/"
              className={({ isActive }) =>
                `${styles.modeTab} ${isActive ? styles.modeTabActive : ''}`
              }
            >
              Chords
            </NavLink>
            <NavLink
              to="/scales/"
              className={({ isActive }) =>
                `${styles.modeTab} ${isActive ? styles.modeTabActive : ''}`
              }
            >
              Scales
            </NavLink>
            <NavLink
              to="/harmony/"
              className={({ isActive }) =>
                `${styles.modeTab} ${isActive ? styles.modeTabActive : ''}`
              }
            >
              Harmony
            </NavLink>
          </div>
        </div>
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
          <div className={styles.drawerBrand}>
            <span>Fret Atlas</span>
          </div>
          <button
            className={styles.closeButton}
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <span className={styles.closeIcon}>&times;</span>
          </button>
        </div>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const isExternal = item.href.startsWith('http');
            const isTourAction = item.action === 'tour';
            const isDisabled = item.comingSoon;

            // Tour action button
            if (isTourAction) {
              const tourDisabled = isScalesMode || isHarmonyMode;
              return (
                <li key={item.label}>
                  <button
                    className={`${styles.navLink} ${tourDisabled ? styles.navLinkDisabled : ''}`}
                    onClick={tourDisabled ? undefined : handleTourClick}
                    disabled={tourDisabled}
                  >
                    <span>{item.label}</span>
                    {tourDisabled && <span className={styles.comingSoon}>Coming Soon</span>}
                  </button>
                </li>
              );
            }

            // External links
            if (isExternal) {
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={styles.navLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeDrawer}
                  >
                    <svg className={styles.githubIcon} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            }

            // Disabled items
            if (isDisabled) {
              return (
                <li key={item.label}>
                  <span className={`${styles.navLink} ${styles.navLinkDisabled}`}>
                    <span>{item.label}</span>
                    <span className={styles.comingSoon}>Coming Soon</span>
                  </span>
                </li>
              );
            }

            return null;
          })}
        </ul>
        <div className={styles.drawerFooter}>
          <span className={styles.drawerVersion}>v2.0</span>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            <span className={styles.themeIcon}>
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
