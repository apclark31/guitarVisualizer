import { Link } from 'react-router-dom';
import { footer as content } from '../config/content';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.name}>Fret Atlas</span>
          <span className={styles.tagline}>{content.tagline}</span>
        </div>

        <div className={styles.links}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Platform</span>
            <Link to="/chordcompass/" className={styles.link}>
              Chord Compass
            </Link>
            <Link to="/scalesage/" className={styles.link}>
              Scale Sage
            </Link>
            <span className={styles.linkDisabled}>
              Harmony Hub <span className={styles.soon}>Soon</span>
            </span>
          </div>
          <div className={styles.group}>
            <span className={styles.groupLabel}>More</span>
            <a
              href={content.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              GitHub
            </a>
          </div>
        </div>

        <div className={styles.bottom}>
          <span className={styles.copyright}>{content.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
