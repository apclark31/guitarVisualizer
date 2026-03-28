import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import styles from './Navbar.module.css';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          Fret Atlas
        </Link>

        <div className={styles.desktopLinks}>
          <Link to="/chordcompass/" className={styles.link}>
            Chord Compass
          </Link>
          <Link to="/scalesage/" className={styles.link}>
            Scale Sage
          </Link>
        </div>

        <div className={styles.actions}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link
            to="/chordcompass/"
            className={styles.mobileLink}
            onClick={() => setMenuOpen(false)}
          >
            Chord Compass
          </Link>
          <Link
            to="/scalesage/"
            className={styles.mobileLink}
            onClick={() => setMenuOpen(false)}
          >
            Scale Sage
          </Link>
        </div>
      )}
    </nav>
  );
}
