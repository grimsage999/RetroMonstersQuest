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
      <div className="cosmic-text">Score: {gameState.score}</div>
      <div className="cosmic-text">Lives: {'♥'.repeat(gameState.lives)}</div>
      <div className="cosmic-text">Level: {gameState.level}</div>
      <div className="cosmic-text">Cookies: {gameState.cookiesCollected}/{gameState.totalCookies}</div>
    </div>
  );
};

export default GameUI;
