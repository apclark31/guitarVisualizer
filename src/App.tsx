import { Fretboard } from './components/visuals/Fretboard';
import { ControlPanel } from './components/controls/ControlPanel';
import { ChordDisplay } from './components/controls/ChordDisplay';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Guitar Theory Visualizer</h1>
      </header>

      <div className="chordBar">
        <ChordDisplay />
      </div>

      <div className="controlsBar">
        <ControlPanel />
      </div>

      <main className="main">
        <section className="visualizer">
          <Fretboard />
        </section>
      </main>

      <footer className="footer">
        <p>Made with ☕ and 🎸 by Alex in PDX</p>
      </footer>
    </div>
  );
}

export default App;
