import { techStack, footer as footerContent } from '../config/content';
import { useScrollReveal } from '../hooks/useScrollReveal';
import appStyles from '../App.module.css';
import styles from './TechStack.module.css';

export function TechStack() {
  const gridRef = useScrollReveal<HTMLDivElement>({
    selector: `.${styles.pill}`,
    stagger: 0.08,
  });

  return (
    <section className={appStyles.section} style={{ background: 'var(--hp-bg-alt)' }}>
      <h2 className={styles.heading}>Built with modern tools</h2>
      <div ref={gridRef} className={styles.grid}>
        {techStack.map((item) => {
          if (item.label === 'Open Source') {
            return (
              <a
                key={item.label}
                href={footerContent.github}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pill}
              >
                <span className={styles.pillLabel}>{item.label}</span>
                <span className={styles.pillDesc}>{item.description}</span>
              </a>
            );
          }
          return (
            <div key={item.label} className={styles.pill}>
              <span className={styles.pillLabel}>{item.label}</span>
              <span className={styles.pillDesc}>{item.description}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
