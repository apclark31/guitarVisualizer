import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './StatsTicker.module.css';

gsap.registerPlugin(ScrollTrigger);

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 40, suffix: '+', label: 'Chord Types' },
  { value: 15, suffix: '+', label: 'Scales & Modes' },
  { value: 20, suffix: '', label: 'Tunings' },
  { value: 3, suffix: '', label: 'Tools' },
];

export function StatsTicker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = containerRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const numberEls = el.querySelectorAll<HTMLElement>(`.${styles.number}`);

      numberEls.forEach((numEl, i) => {
        const target = STATS[i].value;

        // Counter object for GSAP to tween
        const counter = { val: 0 };

        gsap.to(counter, {
          val: target,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            numEl.textContent = `${Math.round(counter.val)}${STATS[i].suffix}`;
          },
        });
      });

      // Fade in the whole strip
      gsap.from(el.querySelectorAll(`.${styles.statItem}`), {
        y: 16,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={styles.ticker}>
      <div className={styles.track}>
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.statItem}>
            <span className={styles.number}>0{stat.suffix}</span>
            <span className={styles.label}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
