/**
 * Gameplay Demo - Complete Working Example
 * 
 * Learning Focus: How to integrate all systems into a playable experience
 * This demonstrates the complete flow from infrastructure to gameplay
 */

import { EntityManager, EntityFactory } from './core/Entity';
import { SystemManager } from './systems/System';
import { InputSystem } from './systems/InputSystem';
import { MovementSystem } from './systems/MovementSystem';
import { CollisionSystem, CollisionEvent } from './systems/CollisionSystem';
import { RenderSystem } from './systems/RenderSystem';

export interface GameplayState {
  score: number;
  cookiesCollected: number;
  totalCookies: number;
  playerHealth: number;
  gamePhase: 'playing' | 'gameOver' | 'victory';
}

export class GameplayDemo {
  private entityManager: EntityManager;
  private systemManager: SystemManager;
  private entityFactory: EntityFactory;
  
  private canvas: HTMLCanvasElement;
  private gameState: GameplayState;
  private onStateChange: (state: GameplayState) => void;
  
  private animationId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  
  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameplayState) => void) {
    this.canvas = canvas;
    this.onStateChange = onStateChange;
    
    // Initialize ECS architecture
    this.entityManager = new EntityManager();
    this.systemManager = new SystemManager();
    this.entityFactory = new EntityFactory(this.entityManager);
    
    // Initialize game state
    this.gameState = {
      score: 0,
      cookiesCollected: 0,
      totalCookies: 0,
      playerHealth: 100,
      gamePhase: 'playing'
    };
    
    this.setupSystems();
    this.setupGameplayHandlers();
  }
  
  /**
   * Set up all game systems in correct order
   * Learning Focus: System coordination and priorities
   */
  private setupSystems(): void {
    // Input system - highest priority, processes first
    const inputSystem = new InputSystem();
    this.systemManager.addSystem(inputSystem);
    
    // Movement system - processes input results
    const movementSystem = new MovementSystem();
    this.systemManager.addSystem(movementSystem);
    
    // Collision system - handles interactions
    const collisionSystem = new CollisionSystem();
    this.systemManager.addSystem(collisionSystem);
    
    // Render system - lowest priority, processes last
    const renderSystem = new RenderSystem(this.canvas);
    this.systemManager.addSystem(renderSystem);
    
    console.log('GameplayDemo: All systems initialized');
  }
  
  /**
   * Set up gameplay event handlers
   * Learning Focus: How systems communicate game events
   */
  private setupGameplayHandlers(): void {
    const collisionSystem = this.systemManager.getSystem<CollisionSystem>('CollisionSystem');
    
    if (collisionSystem) {
      // Handle cookie collection
      collisionSystem.registerCollisionHandler('player_collect', (event: CollisionEvent) => {
        if (event.data.collectibleType === 'cookie') {
          this.handleCookieCollection(event.data.points);
        }
      });
      
      // Handle player-enemy collisions
      collisionSystem.registerCollisionHandler('player_enemy_contact', (event: CollisionEvent) => {
        this.handlePlayerDamage(event.data.damage);
      });
    }
  }
  
  /**
   * Start the demo with a simple level
   * Learning Focus: How to create a complete playable experience
   */
  start(): void {
    if (this.isRunning) return;
    
    // Create a simple demo level
    this.createDemoLevel();
    
    // Start the game loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
    
    console.log('GameplayDemo: Started');
  }
  
  /**
   * Stop the demo
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    console.log('GameplayDemo: Stopped');
  }
  
  /**
   * Create a simple demo level
   * Learning Focus: How to populate a game world with entities
   */
  private createDemoLevel(): void {
    // Clear any existing entities
    this.entityManager.clear();
    
    // Create player in center of screen
    const player = this.entityFactory.createPlayer(400, 300);
    console.log('Created player entity:', player.id);
    
    // Create cookies in a pattern
    const cookiePositions = [
      { x: 200, y: 150 }, { x: 600, y: 150 },
      { x: 150, y: 300 }, { x: 650, y: 300 },
      { x: 200, y: 450 }, { x: 600, y: 450 },
      { x: 400, y: 100 }, { x: 400, y: 500 }
    ];
    
    for (const pos of cookiePositions) {
      const cookie = this.entityFactory.createCookie(pos.x, pos.y);
      console.log('Created cookie entity:', cookie.id);
    }
    
    // Create a few enemies
    const enemyPositions = [
      { x: 100, y: 100 }, { x: 700, y: 100 },
      { x: 100, y: 500 }, { x: 700, y: 500 }
    ];
    
    for (const pos of enemyPositions) {
      const enemy = this.entityFactory.createBasicEnemy(pos.x, pos.y);
      console.log('Created enemy entity:', enemy.id);
    }
    
    // Update game state
    this.gameState.totalCookies = cookiePositions.length;
    this.gameState.cookiesCollected = 0;
    this.updateGameState();
    
    console.log('Demo level created with:', {
      cookies: cookiePositions.length,
      enemies: enemyPositions.length,
      totalEntities: this.entityManager.getAllEntities().length
    });
  }
  
  /**
   * Main game loop
   * Learning Focus: How all systems work together each frame
   */
  private gameLoop(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update all systems in priority order
    this.systemManager.update(this.entityManager, deltaTime);
    
    // Check win/lose conditions
    this.checkGameConditions();
    
    // Schedule next frame
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }
  
  /**
   * Handle cookie collection
   * Learning Focus: How gameplay events update game state
   */
  private handleCookieCollection(points: number): void {
    this.gameState.score += points;
    this.gameState.cookiesCollected += 1;
    
    console.log(`Cookie collected! Score: ${this.gameState.score}, Cookies: ${this.gameState.cookiesCollected}/${this.gameState.totalCookies}`);
    
    this.updateGameState();
  }
  
  /**
   * Handle player taking damage
   */
  private handlePlayerDamage(damage: number): void {
    this.gameState.playerHealth = Math.max(0, this.gameState.playerHealth - damage);
    
    console.log(`Player took ${damage} damage! Health: ${this.gameState.playerHealth}`);
    
    // Set player invulnerability briefly
    const player = this.entityManager.getEntity('player');
    if (player) {
      const health = this.entityManager.getComponent(player.id, 'health');
      if (health) {
        health.invulnerable = true;
        health.invulnerabilityTime = 1000; // 1 second
        
        // Remove invulnerability after timeout
        setTimeout(() => {
          if (health) {
            health.invulnerable = false;
            health.invulnerabilityTime = 0;
          }
        }, 1000);
      }
    }
    
    this.updateGameState();
  }
  
  /**
   * Check win/lose conditions
   */
  private checkGameConditions(): void {
    // Win condition: all cookies collected
    if (this.gameState.cookiesCollected >= this.gameState.totalCookies) {
      this.gameState.gamePhase = 'victory';
      this.updateGameState();
      this.stop();
      console.log('Victory! All cookies collected!');
      return;
    }
    
    // Lose condition: player health reaches zero
    if (this.gameState.playerHealth <= 0) {
      this.gameState.gamePhase = 'gameOver';
      this.updateGameState();
      this.stop();
      console.log('Game Over! Player health reached zero.');
      return;
    }
  }
  
  /**
   * Update game state and notify listeners
   */
  private updateGameState(): void {
    this.onStateChange(this.gameState);
  }
  
  /**
   * Restart the demo
   */
  restart(): void {
    this.stop();
    this.gameState = {
      score: 0,
      cookiesCollected: 0,
      totalCookies: 0,
      playerHealth: 100,
      gamePhase: 'playing'
    };
    this.start();
  }
  
  /**
   * Get diagnostic information for debugging
   */
  getDiagnosticInfo(): any {
    return {
      isRunning: this.isRunning,
      gameState: this.gameState,
      entityManager: this.entityManager.getDiagnosticInfo(),
      systemManager: this.systemManager.getDiagnosticInfo(),
      systemPerformance: this.systemManager.getPerformanceReport()
    };
  }
  
  /**
   * Handle mobile input injection
   */
  handleMobileInput(key: string, pressed: boolean): void {
    const inputSystem = this.systemManager.getSystem<InputSystem>('InputSystem');
    if (inputSystem) {
      inputSystem.injectInput(key, pressed);
    }
  }
  
  /**
   * Run diagnostic check
   */
  runDiagnostic(): void {
    console.log('=== GAMEPLAY DEMO DIAGNOSTIC ===');
    console.log('Diagnostic Info:', this.getDiagnosticInfo());
    
    const entities = this.entityManager.getAllEntities();
    console.log('Active Entities:');
    entities.forEach(entity => {
      const components = Array.from(entity.components.keys());
      console.log(`  ${entity.id}: [${components.join(', ')}]`);
    });
    
    console.log('System Performance:');
    this.systemManager.getPerformanceReport().forEach(metric => {
      console.log(`  ${metric.name}: ${metric.lastFrameTime}ms (${metric.enabled ? 'enabled' : 'disabled'})`);
    });
    
    console.log('=== END DIAGNOSTIC ===');
  }
}