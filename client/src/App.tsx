import React from 'react';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <div className="game-container">
      <h1 className="game-title">🛸 COSMIC PLAYGROUND 🛸</h1>
      <div className="game-instructions">
        Use arrows to control Cosmo • Collect all cookies • Avoid CIA agents • Reach the finish line!
      </div>
      <GameCanvas />
    </div>
  );
}

export default App;
