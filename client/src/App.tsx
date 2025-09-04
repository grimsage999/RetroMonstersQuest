import React from 'react';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <div className="game-container">
      <h1 className="game-title">✨🛸 COSMIC PLAYGROUND 🌟👽</h1>
      <div className="game-instructions">
        Guide Cosmo through colorful cosmic worlds • Collect magical cookies • Avoid space patrol • Discover cosmic secrets!
      </div>
      <GameCanvas />
    </div>
  );
}

export default App;
