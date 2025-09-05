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
    <div className="game-ui compact-stats">
      <div className="stat-line">⭐ {gameState.score}</div>
      <div className="stat-line">♥ {gameState.lives}</div>
      <div className="stat-line">🌍 {gameState.level}</div>
      <div className="stat-line">🍪 {gameState.cookiesCollected}/{gameState.totalCookies}</div>
    </div>
  );
};

export default GameUI;
