/**
 * AppHeader - Transparent header with brand and hamburger menu
 *
 * Features:
 * - Dynamic branding based on current app (Chord Compass or Scale Sage)
 * - Hamburger menu that opens drawer from right
 * - Drawer contains nav links with active indicator
 */

import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTour } from '../../tour';
import styles from './AppHeader.module.css';

interface NavItem {
  label: string;
  href: string;
  icon?: 'github' | 'compass' | 'scaleSage';
  comingSoon?: boolean;
  action?: 'tour'; // Special action instead of navigation
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Chord Compass', href: '/chordcompass/', icon: 'compass' },
  { label: 'Scale Sage', href: '/scalesage/', icon: 'scaleSage' },
  { label: 'Take the Tour', href: '#', action: 'tour' },
  { label: 'Feedback', href: '#', comingSoon: true },
  { label: 'GitHub', href: 'https://github.com/apclark31/guitarVisualizer', icon: 'github' },
];

const compassIconUrl = `${import.meta.env.BASE_URL}compass-icon.png`;
const scaleSageIconUrl = `${import.meta.env.BASE_URL}scale-sage-icon.png`;
const fretAtlasIconUrl = `${import.meta.env.BASE_URL}fret-atlas-icon.png`;

export function AppHeader() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const { startChordCompassTour } = useTour();

  // Determine current app based on path
  const isScaleSage = location.pathname.startsWith('/scalesage');
  const currentAppName = isScaleSage ? 'Scale Sage' : 'Chord Compass';
  const currentAppIcon = isScaleSage ? scaleSageIconUrl : compassIconUrl;

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleTourClick = () => {
    closeDrawer();
    // Currently only Chord Compass tour is implemented
    if (!isScaleSage) {
      startChordCompassTour();
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={currentAppIcon} alt="" className={isScaleSage ? styles.brandIconLarge : styles.brandIcon} />
          {currentAppName}
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
            <img src={fretAtlasIconUrl} alt="" className={styles.drawerBrandIcon} />
            <span>Fret Atlas</span>
          </div>
          <button
            className={styles.closeButton}
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <span className={styles.closeIcon}>×</span>
          </button>
        </div>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.href.replace(/\/$/, ''));
            const isExternal = item.href.startsWith('http');
            const isTourAction = item.action === 'tour';
            const isDisabled = item.comingSoon || (item.href === '#' && !isTourAction);

            // Tour action button (only enabled for current app)
            if (isTourAction) {
              // Disable tour on Scale Sage until implemented
              const tourDisabled = isScaleSage;
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

            // External links use <a>
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

            // Internal links use React Router <Link>
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  onClick={closeDrawer}
                >
                  {item.icon === 'compass' && (
                    <img src={compassIconUrl} alt="" className={styles.compassIcon} />
                  )}
                  {item.icon === 'scaleSage' && (
                    <img src={scaleSageIconUrl} alt="" className={styles.scaleSageIcon} />
                  )}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
