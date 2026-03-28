import { useEffect } from 'react';
import { useTheme } from '../../shared/hooks/useTheme';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ToolShowcase } from './components/ToolShowcase';
import { Features } from './components/Features';
import { TechStack } from './components/TechStack';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';
import styles from './App.module.css';

function App() {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'Fret Atlas';
    return () => {
      document.title = 'Fret Atlas';
    };
  }, []);

  return (
    <div className={styles.homepage} data-theme={theme}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero />
        <ToolShowcase />
        <Features />
        <TechStack />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

export default App;
