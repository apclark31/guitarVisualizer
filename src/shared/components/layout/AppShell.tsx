/**
 * AppShell - Unified layout with sidebar (desktop) and bottom tabs (mobile)
 *
 * Wraps mode-specific content via React Router <Outlet />.
 * Provides persistent navigation between Chords, Scales, and Library.
 */

import { Outlet, NavLink } from 'react-router-dom';
import { useSharedStore } from '../../store';
import { AppHeader } from './AppHeader';
import styles from './AppShell.module.css';

/** Brand logo path — uses BASE_URL for subdirectory routing */
const BRAND_LOGO = `${import.meta.env.BASE_URL}fret-atlas-logo.png`;

/** Chord diagram icon — classic chord chart: thick nut, grid, bold finger dots */
function ChordsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
      {/* Nut — heavy bar */}
      <rect x="3.5" y="1.5" width="17" height="2.5" rx="0.4" stroke="none" />
      {/* Strings (vertical) */}
      <line x1="4.5" y1="4" x2="4.5" y2="22.5" strokeWidth="1.1" />
      <line x1="7.8" y1="4" x2="7.8" y2="22.5" strokeWidth="1.1" />
      <line x1="11.1" y1="4" x2="11.1" y2="22.5" strokeWidth="1.1" />
      <line x1="14.4" y1="4" x2="14.4" y2="22.5" strokeWidth="1.1" />
      <line x1="17.7" y1="4" x2="17.7" y2="22.5" strokeWidth="1.1" />
      <line x1="19.5" y1="4" x2="19.5" y2="22.5" strokeWidth="1.1" />
      {/* Frets (horizontal) */}
      <line x1="4.5" y1="8.6" x2="19.5" y2="8.6" strokeWidth="0.7" />
      <line x1="4.5" y1="13.2" x2="19.5" y2="13.2" strokeWidth="0.7" />
      <line x1="4.5" y1="17.8" x2="19.5" y2="17.8" strokeWidth="0.7" />
      <line x1="4.5" y1="22.5" x2="19.5" y2="22.5" strokeWidth="0.7" />
      {/* Finger dots — chord cluster */}
      <circle cx="11.1" cy="6.3" r="1.7" stroke="none" />
      <circle cx="14.4" cy="10.9" r="1.7" stroke="none" />
      <circle cx="17.7" cy="10.9" r="1.7" stroke="none" />
    </svg>
  );
}

/** Scale pattern icon — ascending staircase dots suggesting upward movement */
function ScalesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      {/* Ascending scale dots — bold staircase pattern */}
      <circle cx="4" cy="20" r="2.2" />
      <circle cx="9" cy="15.5" r="2.2" />
      <circle cx="14" cy="11" r="2.2" />
      <circle cx="19" cy="6.5" r="2.2" />
      {/* Connecting line — subtle movement hint */}
      <line x1="4" y1="20" x2="19" y2="6.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
    </svg>
  );
}

/** Harmony icon — connected chord progression bars */
function HarmonyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      {/* Three connected bars suggesting progression flow */}
      <rect x="2" y="8" width="5" height="8" rx="1.2" />
      <rect x="9.5" y="6" width="5" height="12" rx="1.2" />
      <rect x="17" y="9" width="5" height="6" rx="1.2" />
      {/* Connecting line */}
      <line x1="7" y1="12" x2="9.5" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="14.5" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

/** Library icon — open book */
function LibraryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function AppShell() {
  const { isLibraryOpen, openLibrary, matchCount } = useSharedStore();
  const hasMatches = matchCount > 0;

  return (
    <div className={styles.shell}>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <a href="/" className={styles.sidebarBrand}>
          <img src={BRAND_LOGO} alt="Fret Atlas" className={styles.sidebarLogo} />
          <span className={styles.sidebarBrandName}>Fret Atlas</span>
        </a>
        <nav className={styles.sidebarNav}>
          <NavLink
            to="/chords/"
            className={({ isActive }) =>
              `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
            }
          >
            <ChordsIcon />
            <span>Chords</span>
          </NavLink>
          <NavLink
            to="/scales/"
            className={({ isActive }) =>
              `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
            }
          >
            <ScalesIcon />
            <span>Scales</span>
          </NavLink>
          <NavLink
            to="/harmony/"
            className={({ isActive }) =>
              `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
            }
          >
            <HarmonyIcon />
            <span>Harmony</span>
          </NavLink>
          <button
            className={`${styles.sidebarLink} ${isLibraryOpen ? styles.sidebarLinkActive : ''}`}
            onClick={openLibrary}
          >
            <span className={styles.libraryIconWrap}>
              <LibraryIcon />
              {hasMatches && <span className={styles.matchDot} />}
            </span>
            <span>Library</span>
          </button>
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.sidebarVersion}>v2.0</span>
        </div>
      </aside>

      {/* Main content area */}
      <div className={styles.main}>
        <AppHeader />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <nav className={styles.bottomTabs}>
        <NavLink
          to="/chords/"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          <ChordsIcon />
          <span className={styles.tabLabel}>Chords</span>
        </NavLink>
        <NavLink
          to="/harmony/"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          <HarmonyIcon />
          <span className={styles.tabLabel}>Harmony</span>
        </NavLink>
        <button
          className={`${styles.tab} ${isLibraryOpen ? styles.tabActive : ''}`}
          onClick={openLibrary}
        >
          <span className={styles.libraryIconWrap}>
            <LibraryIcon />
            {hasMatches && <span className={styles.matchDot} />}
          </span>
          <span className={styles.tabLabel}>Library</span>
        </button>
        <NavLink
          to="/scales/"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          <ScalesIcon />
          <span className={styles.tabLabel}>Scales</span>
        </NavLink>
      </nav>
    </div>
  );
}
