import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import GameUI from './GameUI';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [gameState, setGameState] = useState({
    score: 0,
    lives: 3,
    level: 1,
    phase: 'playing' as 'playing' | 'gameOver' | 'victory' | 'levelComplete',
    cookiesCollected: 0,
    totalCookies: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize game engine
    const gameEngine = new GameEngine(canvas, (state) => {
      setGameState(state);
    });
    
    gameEngineRef.current = gameEngine;
    
    // Don't auto-start, wait for user interaction
    // gameEngine.start();

    return () => {
      gameEngine.stop();
    };
  }, []);

  const handleStart = async () => {
    if (gameEngineRef.current && !isStarted) {
      await gameEngineRef.current.start();
      setIsStarted(true);
    }
  };

  const handleRestart = async () => {
    if (gameEngineRef.current) {
      await gameEngineRef.current.restart();
      setIsStarted(true);
    }
  };

  const handleNextLevel = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.nextLevel();
    }
  };

  const handleMobileControl = (key: string, pressed: boolean) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.handleMobileInput(key, pressed);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="game-canvas"
      />
      
      {/* Start button overlay */}
      {!isStarted && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 800,
          height: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px', textShadow: '0 0 10px #00ffff' }}>
            Cosmic Playground
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            Alien Cookie Quest
          </p>
          <button
            onClick={handleStart}
            style={{
              padding: '15px 40px',
              fontSize: '24px',
              fontFamily: 'monospace',
              backgroundColor: '#00ffff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 0 20px #00ffff',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            START GAME
          </button>
          <p style={{ fontSize: '14px', marginTop: '20px', color: '#888' }}>
            Use arrow keys to move • Collect all cookies • Reach the finish line
          </p>
        </div>
      )}
      
      <GameUI gameState={gameState} />
      
      {/* Mobile Controls */}
      <div className="mobile-controls">
        <div className="control-pad">
          <button 
            className="control-btn up"
            onTouchStart={() => handleMobileControl('ArrowUp', true)}
            onTouchEnd={() => handleMobileControl('ArrowUp', false)}
            onMouseDown={() => handleMobileControl('ArrowUp', true)}
            onMouseUp={() => handleMobileControl('ArrowUp', false)}
          >
            ↑
          </button>
          <button 
            className="control-btn left"
            onTouchStart={() => handleMobileControl('ArrowLeft', true)}
            onTouchEnd={() => handleMobileControl('ArrowLeft', false)}
            onMouseDown={() => handleMobileControl('ArrowLeft', true)}
            onMouseUp={() => handleMobileControl('ArrowLeft', false)}
          >
            ←
          </button>
          <button 
            className="control-btn right"
            onTouchStart={() => handleMobileControl('ArrowRight', true)}
            onTouchEnd={() => handleMobileControl('ArrowRight', false)}
            onMouseDown={() => handleMobileControl('ArrowRight', true)}
            onMouseUp={() => handleMobileControl('ArrowRight', false)}
          >
            →
          </button>
          <button 
            className="control-btn down"
            onTouchStart={() => handleMobileControl('ArrowDown', true)}
            onTouchEnd={() => handleMobileControl('ArrowDown', false)}
            onMouseDown={() => handleMobileControl('ArrowDown', true)}
            onMouseUp={() => handleMobileControl('ArrowDown', false)}
          >
            ↓
          </button>
        </div>
      </div>

      {/* Game Over Screen */}
      {gameState.phase === 'gameOver' && (
        <div className="game-over-screen">
          <div>💀 GAME OVER 💀</div>
          <div style={{ fontSize: '16px', marginTop: '10px' }}>
            Final Score: {gameState.score}
          </div>
          <button className="restart-btn" onClick={handleRestart}>
            Press SPACE to Restart
          </button>
        </div>
      )}

      {/* Victory Screen */}
      {gameState.phase === 'victory' && (
        <div className="victory-screen">
          <div>🎉 VICTORY! 🎉</div>
          <div style={{ fontSize: '16px', marginTop: '10px' }}>
            You saved the galaxy!<br />
            Final Score: {gameState.score}
          </div>
          <button className="restart-btn" onClick={handleRestart}>
            Press SPACE to Play Again
          </button>
        </div>
      )}

      {/* Level Complete Screen */}
      {gameState.phase === 'levelComplete' && (
        <div className="victory-screen">
          <div>🌟 LEVEL COMPLETE! 🌟</div>
          <div style={{ fontSize: '16px', marginTop: '10px' }}>
            Level {gameState.level} Complete!<br />
            Score: {gameState.score}
          </div>
          <button className="restart-btn" onClick={handleNextLevel}>
            Press SPACE for Next Level
          </button>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
