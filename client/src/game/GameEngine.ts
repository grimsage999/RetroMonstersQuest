import { Player } from './Player';
import { Enemy } from './Enemy';
import { Level } from './Level';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';

export interface GameState {
  score: number;
  lives: number;
  level: number;
  phase: 'playing' | 'gameOver' | 'victory' | 'levelComplete';
  cookiesCollected: number;
  totalCookies: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private onStateChange: (state: GameState) => void;
  
  private player: Player;
  private currentLevel: Level;
  private audioManager: AudioManager;
  private inputManager: InputManager;
  
  private animationId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;
    
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing',
      cookiesCollected: 0,
      totalCookies: 0
    };

    // Initialize game components
    this.player = new Player(canvas.width / 2, canvas.height - 50);
    this.currentLevel = new Level(1, canvas.width, canvas.height);
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager();
    
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.updateState();
    
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      this.inputManager.handleKeyDown(e.key);
      
      // Special keys
      if (e.key === ' ' || e.key === 'Space') {
        if (this.gameState.phase === 'gameOver' || this.gameState.phase === 'victory') {
          this.restart();
        } else if (this.gameState.phase === 'levelComplete') {
          this.nextLevel();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      this.inputManager.handleKeyUp(e.key);
    });
  }

  public handleMobileInput(key: string, pressed: boolean) {
    if (pressed) {
      this.inputManager.handleKeyDown(key);
    } else {
      this.inputManager.handleKeyUp(key);
    }
  }

  public start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop(0);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public restart() {
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing',
      cookiesCollected: 0,
      totalCookies: 0
    };
    
    this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
    this.currentLevel = new Level(1, this.canvas.width, this.canvas.height);
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.updateState();
  }

  public nextLevel() {
    this.gameState.level++;
    this.gameState.cookiesCollected = 0;
    this.gameState.phase = 'playing';
    
    this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
    this.currentLevel = new Level(this.gameState.level, this.canvas.width, this.canvas.height);
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.updateState();
  }

  private gameLoop(currentTime: number) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.gameState.phase === 'playing') {
      this.update(deltaTime);
    }
    
    this.render();
    
    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number) {
    // Update player
    this.player.update(this.inputManager, deltaTime, this.canvas.width, this.canvas.height);
    
    // Update level (enemies, etc.)
    this.currentLevel.update(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Check win condition
    if (this.gameState.cookiesCollected >= this.gameState.totalCookies) {
      const finishLine = this.currentLevel.getFinishLine();
      if (this.checkCollision(this.player.getBounds(), finishLine)) {
        if (this.gameState.level >= 3) {
          this.gameState.phase = 'victory';
          this.audioManager.playSuccess();
        } else {
          this.gameState.phase = 'levelComplete';
          this.audioManager.playSuccess();
        }
        this.updateState();
      }
    }
  }

  private checkCollisions() {
    const playerBounds = this.player.getBounds();
    
    // Check cookie collisions
    const collectedCookies = this.currentLevel.checkCookieCollisions(playerBounds);
    if (collectedCookies > 0) {
      this.gameState.cookiesCollected += collectedCookies;
      this.gameState.score += collectedCookies * 10;
      this.audioManager.playHit(); // Use hit sound for cookie collection
      this.updateState();
    }
    
    // Check enemy collisions
    if (this.currentLevel.checkEnemyCollisions(playerBounds)) {
      this.gameState.lives--;
      this.audioManager.playHit();
      
      if (this.gameState.lives <= 0) {
        this.gameState.phase = 'gameOver';
      } else {
        // Respawn player
        this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
      }
      this.updateState();
    }
  }

  private checkCollision(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render level background and objects
    this.currentLevel.render(this.ctx);
    
    // Render player
    this.player.render(this.ctx);
  }

  private updateState() {
    this.onStateChange({ ...this.gameState });
  }
}
