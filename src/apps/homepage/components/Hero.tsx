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
        <video
          className={styles.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          poster={`${import.meta.env.BASE_URL}images/homepage/hero-poster.webp`}
        >
          <source src={`${import.meta.env.BASE_URL}images/homepage/hero.webm`} type="video/webm" />
          <source src={`${import.meta.env.BASE_URL}images/homepage/hero.mp4`} type="video/mp4" />
        </video>
      </div>
    </section>
  );
}
