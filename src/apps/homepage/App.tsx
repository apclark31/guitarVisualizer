import { useEffect, useState } from 'react';
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
  const [navTransparent, setNavTransparent] = useState(true);

  useEffect(() => {
    document.title = 'Fret Atlas';
    return () => {
      document.title = 'Fret Atlas';
    };
  }, []);

  useEffect(() => {
    const threshold = window.innerHeight * 0.6;
    const onScroll = () => {
      setNavTransparent(window.scrollY < threshold);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={styles.homepage} data-theme={theme}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} transparent={navTransparent} />
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
