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
      <div className="cosmic-text" style={{fontSize: '32px'}}>SCORE: {gameState.score}</div>
      <div className="cosmic-text" style={{fontSize: '32px'}}>LIVES: {'♥'.repeat(gameState.lives)}</div>
      <div className="cosmic-text" style={{fontSize: '32px'}}>LEVEL: {gameState.level}</div>
      <div className="cosmic-text" style={{fontSize: '32px'}}>COOKIES: {gameState.cookiesCollected}/{gameState.totalCookies}</div>
    </div>
  );
};

export default GameUI;