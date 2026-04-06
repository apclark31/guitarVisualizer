import { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { hero } from '../config/content';
import { useRotatingText } from '../hooks/useRotatingText';
import styles from './Hero.module.css';

const BASE = import.meta.env.BASE_URL;
const MOBILE_SRC = `${BASE}images/homepage/fret-atlas-hp-hero-mobile.mp4`;
const DESKTOP_SRC = `${BASE}images/homepage/fret-atlas-hp-hero-desktop.mp4`;

export function Hero() {
  const rotatingRef = useRotatingText({ words: hero.rotatingWords });
  const sectionRef = useRef<HTMLElement>(null);

  const videoSrc = useMemo(
    () => (window.innerWidth < 768 ? MOBILE_SRC : DESKTOP_SRC),
    []
  );

  useGSAP(() => {
    const el = sectionRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from(el.querySelector(`.${styles.headline}`), { opacity: 0, y: 20, duration: 0.6 })
        .from(el.querySelector(`.${styles.subtitle}`), { opacity: 0, y: 20, duration: 0.5 }, '-=0.3')
        .from(el.querySelector(`.${styles.ctas}`), { opacity: 0, y: 20, duration: 0.5 }, '-=0.3');
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.hero}>
      <video
        className={styles.bgVideo}
        autoPlay
        muted
        loop
        playsInline
        poster={`${BASE}images/homepage/chords_image.png`}
        src={videoSrc}
      />
      <div className={styles.overlay} />
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
        </div>
      </div>
    </section>
  );
}
