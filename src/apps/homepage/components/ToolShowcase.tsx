import { Link } from 'react-router-dom';
import { tools } from '../config/content';
import appStyles from '../App.module.css';
import styles from './ToolShowcase.module.css';

export function ToolShowcase() {
  return (
    <section className={appStyles.section} style={{ background: 'var(--hp-bg-alt)' }}>
      <h2 className={styles.heading}>Built for Precision</h2>
      <div className={styles.grid}>
        {tools.map((tool) => {
          const inner = (
            <>
              <div
                className={styles.cardImage}
                style={{
                  background: `linear-gradient(135deg, ${tool.color}22, ${tool.color}08)`,
                }}
                aria-hidden="true"
              />
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle} style={{ color: tool.color }}>
                  {tool.name}
                </h3>
                <p className={styles.cardDesc}>{tool.description}</p>
                {tool.comingSoon ? (
                  <span className={styles.badge}>Coming Soon</span>
                ) : (
                  <span className={styles.arrow}>Explore &rarr;</span>
                )}
              </div>
            </>
          );

          if (tool.comingSoon) {
            return (
              <div key={tool.name} className={`${styles.card} ${styles.disabled}`}>
                {inner}
              </div>
            );
          }

          return (
            <Link key={tool.name} to={tool.href} className={styles.card}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
