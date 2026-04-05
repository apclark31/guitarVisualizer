import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cta } from '../config/content';
import styles from './CallToAction.module.css';

gsap.registerPlugin(ScrollTrigger);

export function CallToAction() {
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = innerRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(el, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  }, { scope: innerRef });

  return (
    <section className={styles.section}>
      <div ref={innerRef} className={styles.inner}>
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
