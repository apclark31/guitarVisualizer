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
          <img
            src={`${import.meta.env.BASE_URL}fret-atlas-logo.png`}
            alt=""
            className={styles.brandIcon}
            width={28}
            height={28}
          />
          Fret Atlas
        </Link>

        <div className={styles.desktopLinks}>
          <Link to="/chords/" className={styles.link}>
            Chords
          </Link>
          <Link to="/scales/" className={styles.link}>
            Scales
          </Link>
          <Link to="/harmony/" className={styles.link}>
            Harmony
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
            to="/chords/"
            className={styles.mobileLink}
            onClick={() => setMenuOpen(false)}
          >
            Chords
          </Link>
          <Link
            to="/scales/"
            className={styles.mobileLink}
            onClick={() => setMenuOpen(false)}
          >
            Scales
          </Link>
          <Link
            to="/harmony/"
            className={styles.mobileLink}
            onClick={() => setMenuOpen(false)}
          >
            Harmony
          </Link>
        </div>
      )}
    </nav>
  );
}
