import React from 'react';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <div className="game-container">
      <h1 className="cosmic-text" style={{fontSize: '68px', marginBottom: '10px'}}>🛸 COSMIC PLAYGROUND 🛸</h1>
      <div className="game-instructions">
        Use arrow keys to pilot your UFO • Collect all cookies • Avoid CIA agents • Reach the finish line!
      </div>
      <GameCanvas />
    </div>
  );
}

export default App;
