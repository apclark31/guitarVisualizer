import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TourProvider } from './shared/tour';
import { AppShell } from './shared/components/layout/AppShell';
import './index.css';

/** Keeps the canonical link tag in sync with the current route */
function CanonicalURL() {
  const { pathname } = useLocation();

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (link) {
      link.href = `https://fretatlas.com${pathname}`;
    }
  }, [pathname]);

  return null;
}

// Lazy load mode content for code splitting
const HomepageApp = lazy(() =>
  import('./apps/homepage').then(module => ({ default: module.HomepageApp }))
);

const ChordsContent = lazy(() =>
  import('./apps/chords/ChordsContent').then(module => ({ default: module.ChordsContent }))
);

const ScalesContent = lazy(() =>
  import('./apps/scales/ScalesContent').then(module => ({ default: module.ScalesContent }))
);

const HarmonyContent = lazy(() =>
  import('./apps/harmony/HarmonyContent').then(module => ({ default: module.HarmonyContent }))
);

// Loading fallback component
function AppLoading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--surface)',
      color: 'var(--on-surface-muted)',
      fontFamily: 'var(--font-ui)',
    }}>
      Loading...
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CanonicalURL />
      <TourProvider>
        <Suspense fallback={<AppLoading />}>
          <Routes>
            <Route path="/" element={<HomepageApp />} />
            <Route element={<AppShell />}>
              <Route path="/chords/*" element={<ChordsContent />} />
              <Route path="/scales/*" element={<ScalesContent />} />
              <Route path="/harmony/*" element={<HarmonyContent />} />
            </Route>
            {/* Legacy redirects */}
            <Route path="/chordcompass/*" element={<Navigate to="/chords/" replace />} />
            <Route path="/scalesage/*" element={<Navigate to="/scales/" replace />} />
            <Route path="*" element={<Navigate to="/chords/" replace />} />
          </Routes>
        </Suspense>
      </TourProvider>
    </BrowserRouter>
  </StrictMode>,
);
