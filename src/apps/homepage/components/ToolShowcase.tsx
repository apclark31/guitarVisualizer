import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { tools, toolShowcase } from '../config/content';
import styles from './ToolShowcase.module.css';

gsap.registerPlugin(ScrollTrigger);

export function ToolShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = containerRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    // Desktop: pin each section and animate content in
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const sections = el.querySelectorAll<HTMLElement>(`.${styles.toolSection}`);

      sections.forEach((section) => {
        const content = section.querySelector(`.${styles.content}`);
        const image = section.querySelector(`.${styles.screenshot}`);

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          pin: true,
          pinSpacing: true,
        });

        if (content) {
          gsap.from(content, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 60%',
              toggleActions: 'play none none none',
            },
          });
        }

        if (image) {
          gsap.from(image, {
            scale: 1.05,
            opacity: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          });
        }
      });
    });

    // Mobile: simple scroll reveal, no pinning
    mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
      const sections = el.querySelectorAll<HTMLElement>(`.${styles.toolSection}`);

      sections.forEach((section) => {
        const content = section.querySelector(`.${styles.content}`);
        const image = section.querySelector(`.${styles.screenshot}`);

        if (image) {
          gsap.from(image, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          });
        }

        if (content) {
          gsap.from(content, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            delay: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          });
        }
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={styles.showcase}>
      <div className={styles.introSection}>
        <h2 className={styles.heading}>{toolShowcase.heading}</h2>
      </div>

      {tools.map((tool) => (
        <section key={tool.name} className={styles.toolSection}>
          <div className={styles.screenshotWrap}>
            <img
              src={tool.image}
              alt={`${tool.name} screenshot`}
              className={styles.screenshot}
              loading="lazy"
            />
          </div>
          <div className={styles.overlay} />
          <div className={styles.content}>
            <span className={styles.toolLabel} style={{ color: tool.color }}>
              {tool.name}
            </span>
            <p className={styles.toolDesc}>{tool.description}</p>
            <Link to={tool.href} className={styles.toolCta} style={{ background: tool.color }}>
              Explore {tool.name} &rarr;
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
}
