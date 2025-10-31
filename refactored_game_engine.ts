/**
 * REFACTORED GAME ENGINE DESIGN
 * Following Single Responsibility Principle with modular systems
 */

import { Player } from './Player';
import { Level } from './Level';
import { GameState } from './GameState';
import { GameRenderer } from './GameRenderer';
import { InputSystem } from './InputSystem';
import { CollisionSystem } from './CollisionSystem';
import { StateManager } from './StateManager';
import { AudioManager } from './AudioManager';
import { LevelTransitionManager } from './LevelTransitionManager';

// Interface for game state changes
interface OnStateChangeCallback {
  (state: GameState): void;
}

/**
 * Main Game Engine - now follows Single Responsibility Principle
 * Orchestrates game systems without managing their internal logic
 */
export class RefactoredGameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: GameRenderer;
  private inputSystem: InputSystem;
  private collisionSystem: CollisionSystem;
  private stateManager: StateManager;
  private audioManager: AudioManager;
  private levelTransitionManager: LevelTransitionManager;
  
  // Game entities
  private player: Player;
  private currentLevel: Level;
  
  // Core systems
  private gameLoopId: number | null = null;
  private isRunning: boolean = false;
  
  // Callback for UI state updates
  private onStateChange: OnStateChangeCallback;
  
  constructor(canvas: HTMLCanvasElement, onStateChange: OnStateChangeCallback) {
    this.canvas = canvas;
    this.onStateChange = onStateChange;
    
    // Initialize canvas dimensions using constants
    this.canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
    this.canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;
    
    // Initialize modular systems
    this.renderer = new GameRenderer(canvas);
    this.inputSystem = new InputSystem();
    this.collisionSystem = new CollisionSystem(canvas.width, canvas.height);
    this.stateManager = new StateManager();
    this.audioManager = new AudioManager();
    this.levelTransitionManager = new LevelTransitionManager();
    
    // Initialize game entities
    this.player = new Player(GAME_CONSTANTS.PLAYER_START_X, GAME_CONSTANTS.PLAYER_START_Y);
    this.currentLevel = new Level(1, canvas.width, canvas.height, this.audioManager);
    
    // Initialize state
    this.stateManager.initializeGameState();
    this.updateUI();
  }
  
  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.gameLoop();
  }
  
  /**
   * Stop the game
   */
  public stop(): void {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    this.isRunning = false;
  }
  
  /**
   * Restart the game
   */
  public restart(): void {
    this.stop();
    
    // Reset all systems
    this.inputSystem.reset();
    this.collisionSystem.reset();
    this.stateManager.reset();
    this.audioManager.stopAll();
    this.levelTransitionManager.reset();
    
    // Reset game entities
    this.player.reset(GAME_CONSTANTS.PLAYER_START_X, GAME_CONSTANTS.PLAYER_START_Y);
    this.currentLevel = new Level(1, this.canvas.width, this.canvas.height, this.audioManager);
    
    this.stateManager.initializeGameState();
    this.updateUI();
    
    this.start();
  }
  
  /**
   * Main game loop - now delegates to individual systems
   */
  private gameLoop = (): void => {
    if (!this.isRunning) return;
    
    // Process input
    this.inputSystem.processInput();
    
    // Update game state if in playing state
    if (this.stateManager.isGameActive()) {
      this.updateGame();
    }
    
    // Render the game
    this.renderer.render(this.player, this.currentLevel, this.stateManager.getCurrentState());
    
    // Continue the loop
    this.gameLoopId = requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * Update game logic - delegates to individual systems
   */
  private updateGame(): void {
    // Update player with input
    const deltaTime = 16; // Fixed timestep for consistency
    this.player.update(
      this.inputSystem.getMovementInput(), 
      deltaTime, 
      this.canvas.width, 
      this.canvas.height
    );
    
    // Update level (enemies, hazards, etc.)
    this.currentLevel.update(
      deltaTime, 
      this.player.getX(), 
      this.player.getY(), 
      this.stateManager.getGameState().cookiesCollected
    );
    
    // Handle collisions using dedicated system
    this.handleCollisions();
    
    // Check win/lose conditions
    this.checkGameConditions();
  }
  
  /**
   * Handle all collision detection using the dedicated system
   */
  private handleCollisions(): void {
    const playerBounds = this.player.getBounds();
    
    // Check cookie collisions
    const collectedCookies = this.currentLevel.checkCookieCollisions(playerBounds);
    if (collectedCookies > 0) {
      this.stateManager.addCookies(collectedCookies);
      this.audioManager.playCookieCollect();
      this.updateUI();
    }
    
    // Check enemy collisions
    if (this.currentLevel.checkEnemyCollisions(playerBounds)) {
      if (!this.player.isDashing()) {
        this.stateManager.takeDamage();
        this.player.takeDamage();
        this.updateUI();
        
        if (this.stateManager.isPlayerDead()) {
          this.handleGameOver();
        }
      }
    }
    
    // Check hazard collisions
    if (this.currentLevel.checkHazardCollisions(playerBounds)) {
      if (!this.player.isDashing()) {
        this.stateManager.takeDamage();
        this.player.takeDamage();
        this.updateUI();
        
        if (this.stateManager.isPlayerDead()) {
          this.handleGameOver();
        }
      }
    }
  }
  
  /**
   * Check win/lose conditions
   */
  private checkGameConditions(): void {
    const gameState = this.stateManager.getGameState();
    const finishLine = this.currentLevel.getFinishLine();
    
    // Check level completion
    if (gameState.cookiesCollected >= this.currentLevel.getTotalCookies()) {
      if (this.collisionSystem.checkCollision(this.player.getBounds(), finishLine)) {
        if (gameState.level >= 5) {
          this.handleVictory();
        } else {
          this.handleLevelComplete();
        }
      }
    }
  }
  
  /**
   * Handle game over state
   */
  private handleGameOver(): void {
    this.stateManager.setGameOver();
    this.audioManager.playGameOver();
    this.updateUI();
  }
  
  /**
   * Handle level completion
   */
  private handleLevelComplete(): void {
    this.stateManager.setLevelComplete();
    this.audioManager.playLevelComplete();
    this.updateUI();
  }
  
  /**
   * Handle victory state
   */
  private handleVictory(): void {
    this.stateManager.setVictory();
    this.audioManager.playVictory();
    this.updateUI();
  }
  
  /**
   * Update UI by calling the state change callback
   */
  private updateUI(): void {
    this.onStateChange(this.stateManager.getGameState());
  }
  
  /**
   * Handle mobile input
   */
  public handleMobileInput(key: string, pressed: boolean): void {
    this.inputSystem.handleMobileInput(key, pressed);
  }
  
  /**
   * Advance to next level
   */
  public nextLevel(): void {
    const nextLevelNum = this.stateManager.getCurrentLevel() + 1;
    this.currentLevel = new Level(nextLevelNum, this.canvas.width, this.canvas.height, this.audioManager);
    this.stateManager.startNextLevel(nextLevelNum);
    this.player.reset(GAME_CONSTANTS.PLAYER_START_X, GAME_CONSTANTS.PLAYER_START_Y);
    this.updateUI();
  }
  
  /**
   * Get current game state
   */
  public getGameState(): GameState {
    return this.stateManager.getGameState();
  }
}

/**
 * Constants to replace magic numbers
 */
export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 600,
  PLAYER_START_X: (canvasWidth: number) => canvasWidth / 2, // This would need to be a function or we set a fixed value
  PLAYER_START_Y: (canvasHeight: number) => canvasHeight - 50, // This would need to be a function or we set a fixed value
  SPATIAL_GRID_CELL_SIZE: 100,
  AUDIO_POOL_SIZE: 5,
  PLAYER_LIVES: 3,
  PLAYER_DEFAULT_SPEED: 5,
  DASH_SPEED_MULTIPLIER: 2.5,
  DASH_DURATION: 200,
  DASH_COOLDOWN: 800,
  INVINCIBILITY_DURATION: 1500
} as const;

// Updated fixed values since we can't use functions in constants
export const FIXED_GAME_CONSTANTS = {
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 600,
  PLAYER_START_X: 500,  // canvasWidth / 2 for default
  PLAYER_START_Y: 550,  // canvasHeight - 50 for default
  PLAYER_DEFAULT_Y_OFFSET: 50,
  SPATIAL_GRID_CELL_SIZE: 100,
  AUDIO_POOL_SIZE: 5,
  PLAYER_LIVES: 3
} as const;