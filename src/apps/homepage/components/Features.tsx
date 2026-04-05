import { featuresLeft, featuresRight } from '../config/content';
import { useScrollReveal } from '../hooks/useScrollReveal';
import appStyles from '../App.module.css';
import styles from './Features.module.css';

export function Features() {
  const layoutRef = useScrollReveal<HTMLDivElement>({
    selector: `.${styles.block}, .${styles.row}`,
    stagger: 0.1,
  });

  return (
    <section className={appStyles.section}>
      <h2 className={styles.heading}>Master theory with a hands-on workflow</h2>
      <div ref={layoutRef} className={styles.layout}>
        <div className={styles.left}>
          {featuresLeft.map((f) => (
            <div key={f.title} className={styles.block}>
              <h3 className={styles.blockTitle}>{f.title}</h3>
              <p className={styles.blockDesc}>{f.description}</p>
            </div>
          ))}
        </div>
        <div className={styles.right}>
          {featuresRight.map((f) => (
            <div key={f.title} className={styles.row}>
              <h3 className={styles.rowTitle}>{f.title}</h3>
              <p className={styles.rowDesc}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
