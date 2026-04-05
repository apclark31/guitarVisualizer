import { Link } from 'react-router-dom';
import { tools, toolShowcase } from '../config/content';
import appStyles from '../App.module.css';
import styles from './ToolShowcase.module.css';

export function ToolShowcase() {
  return (
    <section className={appStyles.section} style={{ background: 'var(--hp-bg-alt)' }}>
      <h2 className={styles.heading}>{toolShowcase.heading}</h2>
      <div className={styles.grid}>
        {tools.map((tool) => (
          <Link key={tool.name} to={tool.href} className={styles.card}>
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
              <span className={styles.arrow}>Explore &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
