/**
 * Streamlined Game Engine - ECS Integration
 * 
 * Learning Focus: Clean integration of gameplay systems with React
 * This replaces the complex old engine with a simple, working implementation
 */

import { GameplayDemo, GameplayState } from './GameplayDemo';

export interface GameState {
  score: number;
  lives: number;
  level: number;
  phase: 'playing' | 'gameOver' | 'victory' | 'levelComplete';
  cookiesCollected: number;
  totalCookies: number;
  hasRayGun: boolean;
  hasAdjudicator: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private gameState: GameState;
  private onStateChange: (state: GameState) => void;
  
  // New ECS-based gameplay
  private gameplayDemo: GameplayDemo;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.onStateChange = onStateChange;
    
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing',
      cookiesCollected: 0,
      totalCookies: 0,
      hasRayGun: false,
      hasAdjudicator: false
    };
    
    // Initialize ECS gameplay demo
    this.gameplayDemo = new GameplayDemo(canvas, this.handleGameplayStateChange.bind(this));
    
    console.log('GameEngine: Initialized with clean ECS architecture');
  }

  /**
   * Handle state changes from the gameplay demo
   */
  private handleGameplayStateChange(gameplayState: GameplayState): void {
    // Map gameplay state to engine state
    this.gameState.score = gameplayState.score;
    this.gameState.cookiesCollected = gameplayState.cookiesCollected;
    this.gameState.totalCookies = gameplayState.totalCookies;
    this.gameState.phase = gameplayState.gamePhase;
    
    // Update lives based on health
    this.gameState.lives = Math.ceil(gameplayState.playerHealth / 33.33); // 3 lives = 100 health
    
    // Notify React component
    this.onStateChange(this.gameState);
  }

  /**
   * Start the game
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.gameplayDemo.start();
    
    console.log('GameEngine: Game started');
  }

  /**
   * Stop the game
   */
  stop(): void {
    this.isRunning = false;
    this.gameplayDemo.stop();
    
    console.log('GameEngine: Game stopped');
  }

  /**
   * Restart the game
   */
  async restart(): Promise<void> {
    this.stop();
    
    // Reset game state
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing',
      cookiesCollected: 0,
      totalCookies: 0,
      hasRayGun: false,
      hasAdjudicator: false
    };
    
    this.gameplayDemo.restart();
    this.isRunning = true;
    
    console.log('GameEngine: Game restarted');
  }

  /**
   * Advance to next level (placeholder for multi-level support)
   */
  nextLevel(): void {
    this.gameState.level += 1;
    this.restart(); // For now, just restart with same level
  }

  /**
   * Handle mobile input
   */
  handleMobileInput(key: string, pressed: boolean): void {
    this.gameplayDemo.handleMobileInput(key, pressed);
  }

  /**
   * Run diagnostic check
   */
  runDiagnostic(): void {
    console.log('=== GAME ENGINE DIAGNOSTIC ===');
    console.log('Game State:', this.gameState);
    console.log('Is Running:', this.isRunning);
    
    // Run gameplay demo diagnostics
    this.gameplayDemo.runDiagnostic();
    
    console.log('=== END GAME ENGINE DIAGNOSTIC ===');
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Check if game is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}