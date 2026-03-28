import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TourProvider } from './shared/tour';
import './index.css';

// Lazy load apps for code splitting
const HomepageApp = lazy(() =>
  import('./apps/homepage').then(module => ({ default: module.HomepageApp }))
);

const ChordCompassApp = lazy(() =>
  import('./apps/chord-compass').then(module => ({ default: module.ChordCompassApp }))
);

const ScaleSageApp = lazy(() =>
  import('./apps/scale-sage').then(module => ({ default: module.ScaleSageApp }))
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
      <TourProvider>
        <Suspense fallback={<AppLoading />}>
          <Routes>
            <Route path="/" element={<HomepageApp />} />
            <Route path="/chordcompass/*" element={<ChordCompassApp />} />
            <Route path="/scalesage/*" element={<ScaleSageApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </TourProvider>
    </BrowserRouter>
  </StrictMode>,
);
