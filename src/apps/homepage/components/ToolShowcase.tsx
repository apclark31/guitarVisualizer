import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { tools, toolShowcase } from '../config/content';
import { StatsTicker } from './StatsTicker';
import styles from './ToolShowcase.module.css';

gsap.registerPlugin(ScrollTrigger);

export function ToolShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = containerRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    // Desktop: pin each section and stagger feature callouts in
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const sections = el.querySelectorAll<HTMLElement>(`.${styles.toolSection}`);

      sections.forEach((section) => {
        const mockup = section.querySelector(`.${styles.mockup}`);
        const features = section.querySelectorAll(`.${styles.featureItem}`);
        const cta = section.querySelector(`.${styles.toolCta}`);

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          pin: true,
          pinSpacing: true,
        });

        if (mockup) {
          gsap.from(mockup, {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              toggleActions: 'play none none none',
            },
          });
        }

        if (features.length > 0) {
          gsap.from(features, {
            y: 24,
            opacity: 0,
            duration: 0.5,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 50%',
              toggleActions: 'play none none none',
            },
          });
        }

        if (cta) {
          gsap.from(cta, {
            y: 16,
            opacity: 0,
            duration: 0.5,
            delay: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 50%',
              toggleActions: 'play none none none',
            },
          });
        }
      });
    });

    // Mobile: scroll reveal without pinning
    mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
      const sections = el.querySelectorAll<HTMLElement>(`.${styles.toolSection}`);

      sections.forEach((section) => {
        const mockup = section.querySelector(`.${styles.mockup}`);
        const features = section.querySelectorAll(`.${styles.featureItem}`);

        if (mockup) {
          gsap.from(mockup, {
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

        if (features.length > 0) {
          gsap.from(features, {
            y: 16,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
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

      <StatsTicker />

      {tools.map((tool, index) => (
        <section
          key={tool.name}
          className={`${styles.toolSection} ${index % 2 !== 0 ? styles.reversed : ''}`}
          style={{
            '--tool-color': tool.color,
            '--tool-color-dim': tool.colorDim,
          } as React.CSSProperties}
        >
          <div className={styles.splitLayout}>
            {/* Device mockup with screenshot */}
            <div className={styles.visualSide}>
              <div className={styles.mockup}>
                <div className={styles.mockupChrome}>
                  <span className={styles.mockupDot} />
                  <span className={styles.mockupDot} />
                  <span className={styles.mockupDot} />
                </div>
                <div className={styles.mockupScreen}>
                  <img
                    src={tool.image}
                    alt={`${tool.name} screenshot`}
                    className={styles.mockupImage}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Text + feature callouts */}
            <div className={styles.contentSide}>
              <span className={styles.toolLabel} style={{ color: tool.color }}>
                {tool.name}
              </span>
              <p className={styles.tagline}>{tool.tagline}</p>
              <ul className={styles.featureList}>
                {tool.features.map((feature) => (
                  <li key={feature.headline} className={styles.featureItem}>
                    <span className={styles.featureDot} style={{ background: tool.color }} />
                    <div>
                      <span className={styles.featureHeadline}>{feature.headline}</span>
                      <span className={styles.featureDetail}>{feature.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <Link to={tool.href} className={styles.toolCta}>
                Explore {tool.name} &rarr;
              </Link>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
