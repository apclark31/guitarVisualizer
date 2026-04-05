import { Link } from 'react-router-dom';
import { cta } from '../config/content';
import styles from './CallToAction.module.css';

export function CallToAction() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>{cta.headline}</h2>
        <p className={styles.subtitle}>{cta.subtitle}</p>
        <div className={styles.ctas}>
          <Link to={cta.primaryHref} className={styles.primaryBtn}>
            {cta.primaryCta}
          </Link>
          <Link to={cta.secondaryHref} className={styles.secondaryLink}>
            {cta.secondaryText} &rarr;
          </Link>
          <Link to={cta.tertiaryHref} className={styles.secondaryLink}>
            {cta.tertiaryCta} &rarr;
          </Link>
        </div>
        <div className={styles.badges}>
          {cta.badges.map((b) => (
            <span key={b} className={styles.badge}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
