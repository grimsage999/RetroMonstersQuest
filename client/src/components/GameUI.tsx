import React from 'react';

interface GameState {
  score: number;
  lives: number;
  level: number;
  phase: string;
  cookiesCollected: number;
  totalCookies: number;
  canDash?: boolean;
  canTeleport?: boolean;
  teleportCooldown?: number;
}

interface GameUIProps {
  gameState: GameState;
}

const GameUI: React.FC<GameUIProps> = ({ gameState }) => {
  // Calculate teleport cooldown display (0-2 seconds)
  const teleportCooldown = gameState.teleportCooldown || 0;
  const teleportCooldownText = teleportCooldown > 0 
    ? `${(teleportCooldown / 1000).toFixed(1)}s` 
    : '✓';
  
  return (
    <div className="game-ui compact-stats">
      <div className="stat-line">⭐ {gameState.score}</div>
      <div className="stat-line">♥ {gameState.lives}</div>
      <div className="stat-line">🌍 {gameState.level}</div>
      <div className="stat-line">🍪 {gameState.cookiesCollected}/{gameState.totalCookies}</div>
      <div className="stat-line" style={{ opacity: gameState.canDash ? 1 : 0.3 }}>
        ⚡ DASH {gameState.canDash ? '✓' : '⏳'}
      </div>
      <div className="stat-line" style={{ opacity: gameState.canTeleport ? 1 : 0.3 }}>
        ✨ TELEPORT {teleportCooldownText}
      </div>
    </div>
  );
};

export default GameUI;
