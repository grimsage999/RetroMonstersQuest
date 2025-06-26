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
    <div className="game-ui">
      <div>Score: {gameState.score}</div>
      <div>Lives: {'♥'.repeat(gameState.lives)}</div>
      <div>Level: {gameState.level}</div>
      <div>Cookies: {gameState.cookiesCollected}/{gameState.totalCookies}</div>
    </div>
  );
};

export default GameUI;
