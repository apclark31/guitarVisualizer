import { Link } from 'react-router-dom';
import { hero } from '../config/content';
import { useRotatingText } from '../hooks/useRotatingText';
import styles from './Hero.module.css';

export function Hero() {
  const rotatingRef = useRotatingText({ words: hero.rotatingWords });

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.headline}>
          {hero.headlinePrefix}{' '}
          <span ref={rotatingRef} className={styles.rotatingWord} />
        </h1>
        <p className={styles.subtitle}>{hero.subtitle}</p>
        <div className={styles.ctas}>
          <Link to={hero.primaryHref} className={styles.primaryBtn}>
            {hero.primaryCta}
          </Link>
          <Link to={hero.secondaryHref} className={styles.secondaryBtn}>
            {hero.secondaryCta}
          </Link>
        </div>
      </div>
      <div className={styles.visual}>
        <div className={styles.placeholder} aria-hidden="true" />
      </div>
    </section>
  );
}
