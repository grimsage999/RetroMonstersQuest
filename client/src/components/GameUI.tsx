import React from 'react';

interface GameState {
  score: number;
  lives: number;
  level: number;
  phase: string;
  cookiesCollected: number;
  totalCookies: number;
}

interface GameUIProps {
  gameState: GameState;
}

const GameUI: React.FC<GameUIProps> = ({ gameState }) => {
  return (
    <div className="game-ui cosmic-ui">
      <h3>🛸 COSMIC STATS 🛸</h3>
      <div className="cosmic-text">SCORE: {gameState.score}</div>
      <div className="cosmic-text">LIVES: {'♥'.repeat(gameState.lives)}</div>
      <div className="cosmic-text">LEVEL: {gameState.level}</div>
      <div className="cosmic-text">COOKIES: {gameState.cookiesCollected}/{gameState.totalCookies}</div>
    </div>
  );
};

export default GameUI;
