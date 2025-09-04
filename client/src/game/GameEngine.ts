import { Player } from './Player';
import { Enemy } from './Enemy';
import { Level } from './Level';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { Cutscene, CutsceneData } from './Cutscene';
import { SpatialGrid } from './SpatialGrid';
import { SpriteBatcher } from './SpriteBatcher';
import { AudioPool } from './AudioPool';
import { GameStateManager, GamePhase } from './GameStateManager';
import { LevelTransitionManager } from './LevelTransitionManager';
import { DamageSystem } from './DamageSystem';
import { UIStateController } from './UIStateController';
import { DiagnosticSystem } from './DiagnosticSystem';
import { BossStateMachine, GameContext } from './BossStateMachine';
import { CommandInputSystem, GameCommand, InputCommand } from './CommandInputSystem';
import { GAME_CONFIG, CUTSCENE_DATA } from './GameConfig';

export interface GameState {
  score: number;
  lives: number;
  level: number;
  phase: 'playing' | 'gameOver' | 'victory' | 'levelComplete';
  cookiesCollected: number;
  totalCookies: number;
  hasRayGun: boolean;
  hasAdjudicator: boolean;
  bossHealth: number;
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
  
  private bullets: Array<{x: number, y: number, vx: number, vy: number, hits: number, toRemove?: boolean}> = [];
  private adjudicatorCooldown: number = 0;
  private currentCutscene: Cutscene | null = null;
  
  private animationId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  
  // Performance metrics
  private drawCallCount: number = 0;
  private entityCount: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private currentFPS: number = 0;
  
  // Optimization systems
  private spatialGrid: SpatialGrid;
  private spriteBatcher: SpriteBatcher;
  private audioPool: AudioPool;
  private activeTimeouts: Set<number> = new Set();
  
  // Bug fix systems
  private stateManager: GameStateManager;
  private transitionManager: LevelTransitionManager;
  private damageSystem: DamageSystem;
  private uiController: UIStateController;
  private diagnosticSystem: DiagnosticSystem;
  private bossStateMachine: BossStateMachine | null = null;
  private commandInputSystem: CommandInputSystem;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;
    
    this.gameState = {
      score: 0,
      lives: GAME_CONFIG.PLAYER.INITIAL_LIVES,
      level: 1,
      phase: 'playing',
      cookiesCollected: 0,
      totalCookies: 0,
      hasRayGun: false,
      hasAdjudicator: false,
      bossHealth: GAME_CONFIG.BOSS.INITIAL_HEALTH
    };

    // Initialize game components
    this.player = new Player(canvas.width / 2, canvas.height - GAME_CONFIG.PLAYER.STARTING_Y_OFFSET);
    this.currentLevel = new Level(1, canvas.width, canvas.height);
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager();
    
    // Initialize optimization systems
    this.spatialGrid = new SpatialGrid(canvas.width, canvas.height, GAME_CONFIG.COLLISION.SPATIAL_GRID_CELL_SIZE);
    this.spriteBatcher = new SpriteBatcher(this.ctx);
    this.audioPool = new AudioPool(GAME_CONFIG.AUDIO.POOL_SIZE);
    this.initializeAudioPool();
    
    // Initialize bug fix systems
    this.stateManager = new GameStateManager(GamePhase.TITLE);
    this.transitionManager = new LevelTransitionManager(canvas);
    this.damageSystem = new DamageSystem(GAME_CONFIG.PLAYER.INITIAL_LIVES);
    this.uiController = new UIStateController();
    
    // Initialize diagnostic system
    this.diagnosticSystem = new DiagnosticSystem(
      this.stateManager,
      this.uiController,
      this.transitionManager,
      this.damageSystem,
      this.audioManager
    );
    
    // Initialize command input system with proper filtering
    this.commandInputSystem = new CommandInputSystem();
    this.setupCommandExecutors();
    
    // Sync initial state with state manager to prevent opening glitches
    this.commandInputSystem.setGamePhase(GamePhase.TITLE);
    
    // Set damage callbacks
    this.damageSystem.setOnDamage((health, maxHealth) => {
      this.gameState.lives = health;
      this.updateState();
    });
    
    this.damageSystem.setOnDeath(() => {
      this.handleGameOver();
    });
    
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.updateState();
    
    this.setupEventListeners();
  }
  
  private initializeAudioPool(): void {
    // Initialize audio pools for existing sound effects only
    this.audioPool.initializeSound('hit', '/sounds/hit.mp3', 6);
    this.audioPool.initializeSound('success', '/sounds/success.mp3', 4);
    this.audioPool.initializeSound('background', '/sounds/background.mp3', 1);
    
    // Preload all sounds
    this.audioPool.preloadAll().catch(err => {
      console.warn('Failed to preload some audio:', err);
    });
  }

  private createBossContext(deltaTime: number = 16): GameContext {
    // Add null check for player bounds
    if (!this.player) {
      throw new Error('GameEngine: Player not initialized when creating boss context');
    }
    
    const playerBounds = this.player.getBounds();
    if (!playerBounds) {
      throw new Error('GameEngine: Unable to get player bounds for boss context');
    }
    
    // Build weapons array efficiently
    const weapons: string[] = [];
    if (this.gameState.hasRayGun) weapons.push('raygun');
    if (this.gameState.hasAdjudicator) weapons.push('adjudicator');
    
    return {
      playerPosition: { x: playerBounds.x, y: playerBounds.y },
      playerHealth: this.gameState.lives,
      bossHealth: this.gameState.bossHealth,
      deltaTime: Math.max(GAME_CONFIG.PERFORMANCE.MIN_DELTA_TIME, deltaTime),
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      currentWeapons: weapons
    };
  }

  private setupCommandExecutors() {
    // Set up command executors with proper filtering
    this.commandInputSystem.registerCommandExecutor(GameCommand.MOVE_UP, (cmd: InputCommand) => {
      if (cmd.pressed) this.inputManager.handleKeyDown('ArrowUp');
      else this.inputManager.handleKeyUp('ArrowUp');
    });
    
    this.commandInputSystem.registerCommandExecutor(GameCommand.MOVE_DOWN, (cmd: InputCommand) => {
      if (cmd.pressed) this.inputManager.handleKeyDown('ArrowDown');
      else this.inputManager.handleKeyUp('ArrowDown');
    });
    
    this.commandInputSystem.registerCommandExecutor(GameCommand.MOVE_LEFT, (cmd: InputCommand) => {
      if (cmd.pressed) this.inputManager.handleKeyDown('ArrowLeft');
      else this.inputManager.handleKeyUp('ArrowLeft');
    });
    
    this.commandInputSystem.registerCommandExecutor(GameCommand.MOVE_RIGHT, (cmd: InputCommand) => {
      if (cmd.pressed) this.inputManager.handleKeyDown('ArrowRight');
      else this.inputManager.handleKeyUp('ArrowRight');
    });
    
    this.commandInputSystem.registerCommandExecutor(GameCommand.FIRE_PRIMARY, (cmd: InputCommand) => {
      if (!cmd.pressed) return; // Only on key press, not release
      
      // Handle title screen - start the game
      if (this.stateManager.getCurrentPhase() === GamePhase.TITLE) {
        // Starting gameplay transition
        
        // Initialize the game state for level 1
        this.gameState.level = 1;
        this.gameState.cookiesCollected = 0;
        this.bullets = [];
        
        // Transition to CUTSCENE phase first, don't set gameState.phase yet
        this.stateManager.transitionTo(GamePhase.CUTSCENE);
        this.showLevelCutscene();
        return;
      }
      
      if (this.gameState.phase === 'gameOver' || this.gameState.phase === 'victory') {
        // Don't handle restart here - let the UI handle it
        return;
      } else if (this.gameState.phase === 'levelComplete') {
        this.nextLevel();
      } else if (this.gameState.hasRayGun && this.gameState.phase === 'playing') {
        this.fireRayGun();
      }
    });
    
    this.commandInputSystem.registerCommandExecutor(GameCommand.FIRE_SECONDARY, (cmd: InputCommand) => {
      if (!cmd.pressed) return; // Only on key press, not release
      
      if (this.gameState.hasAdjudicator && this.adjudicatorCooldown <= 0) {
        this.fireAdjudicator();
      }
    });
    
    this.commandInputSystem.registerCommandExecutor(GameCommand.SKIP_CUTSCENE, (cmd: InputCommand) => {
      if (!cmd.pressed) return;
      // Handled by cutscene directly
    });
    
    this.commandInputSystem.registerCommandExecutor(GameCommand.DEBUG_DIAGNOSTIC, (cmd: InputCommand) => {
      if (!cmd.pressed) return;
      this.runDiagnostic();
    });
  }

  private setupEventListeners() {
    // The CommandInputSystem now handles all input with proper filtering
    // Update game phase when state changes
    this.stateManager.addListener((phase: GamePhase) => {
      this.commandInputSystem.setGamePhase(phase);
    });
  }

  public handleMobileInput(key: string, pressed: boolean) {
    if (pressed) {
      this.inputManager.handleKeyDown(key);
    } else {
      this.inputManager.handleKeyUp(key);
    }
  }

  public async start() {
    if (!this.isRunning) {
      // Game initialization started
      
      // Set running flag and start game loop immediately for responsiveness
      this.isRunning = true;
      this.lastTime = performance.now();
      
      // Initialize game state for level 1
      this.gameState.level = 1;
      this.gameState.cookiesCollected = 0;
      this.bullets = [];
      
      // Go directly to CUTSCENE phase to show level title card
      this.stateManager.transitionTo(GamePhase.CUTSCENE);
      
      // Start game loop immediately
      this.gameLoop(this.lastTime);
      
      // Show level title card immediately
      this.showLevelCutscene();
      
      // Initialize audio asynchronously in background (non-blocking)
      this.audioManager.initialize().then(() => {
        this.audioManager.playGameStart();
        this.audioManager.playBackgroundMusic();
        // Audio system ready
      }).catch(error => {
        console.warn('GameEngine: Audio initialization failed, continuing without audio:', error);
      });
      
      // Game ready, showing intro
    }
  }

  /**
   * Run diagnostic check
   */
  public runDiagnostic() {
    const report = this.diagnosticSystem.runDiagnostic(this.gameState, this.currentFPS);
    this.diagnosticSystem.logDiagnostic(report);
    
    // Auto-fix critical issues
    if (report.issues.length > 0) {
      console.warn('🔧 Attempting auto-fix for critical issues...');
      
      // Check for overlapping transitions
      if (report.issues.some(issue => issue.includes('overlapping'))) {
        // Auto-fix: Resetting UI controller
        this.uiController.forceReset();
      }
      
      // Check for invalid states
      if (report.issues.some(issue => issue.includes('Invalid transition'))) {
        // Auto-fix: Resetting state manager
        this.stateManager.forceTransitionTo(GamePhase.TITLE);
      }
    }
  }

  public stop() {
    // Set flag first to prevent any new game loop iterations
    this.isRunning = false;
    
    // Cancel animation frame immediately
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    
    // Clean up all active timeouts to prevent memory leaks
    Array.from(this.activeTimeouts).forEach(timeout => {
      clearTimeout(timeout);
    });
    this.activeTimeouts.clear();
    
    // Clean up command input system to prevent memory leaks
    this.commandInputSystem.cleanup();
    
    // Game stopped and cleaned up
  }

  public restart() {
    // Restarting to initial state
    
    // Stop current game loop but don't cleanup input system
    this.isRunning = false;
    
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    
    // Clear timeouts
    Array.from(this.activeTimeouts).forEach(timeout => {
      clearTimeout(timeout);
    });
    this.activeTimeouts.clear();
    
    // Reset all systems comprehensively
    this.damageSystem.reset();
    this.stateManager.reset();
    this.uiController.forceReset();
    this.transitionManager.reset();
    
    // Reset optimization systems to prevent state pollution
    this.spatialGrid.clear();
    this.audioPool.stopAll();
    this.spriteBatcher.clear();
    
    // Reset performance tracking
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.currentFPS = 0;
    this.drawCallCount = 0;
    this.entityCount = 0;
    
    // Clear all game objects
    this.bullets = [];
    this.bossStateMachine = null;
    this.currentCutscene = null;
    this.adjudicatorCooldown = 0;
    
    // Reset to completely fresh state
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing',
      cookiesCollected: 0,
      totalCookies: 0,
      hasRayGun: false,
      hasAdjudicator: false,
      bossHealth: 100
    };
    
    // Reset player completely including movement system
    this.player.reset(this.canvas.width / 2, this.canvas.height - GAME_CONFIG.PLAYER.STARTING_Y_OFFSET);
    this.player.resetMovementSystem();
    
    // Reset input manager to clear any stuck keys
    this.inputManager.reset();
    
    // Create fresh level
    this.currentLevel = new Level(1, this.canvas.width, this.canvas.height);
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    
    // Clear canvas to prevent visual artifacts
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Reset input system state without cleaning up listeners
    this.commandInputSystem.emergencyReset();
    this.commandInputSystem.setGamePhase(GamePhase.TITLE);
    
    // Update state for React UI
    this.updateState();
    
    // System reset complete
  }

  private handleLevelComplete() {
    // Level completed
    
    // Use UI controller to properly queue the transition with delay
    this.uiController.queueTransition('levelCard', () => {
      this.nextLevel();
    }, 2000); // 2 second delay to show "Level Complete" message
  }
  
  private handleGameOver() {
    // Game over - player defeated
    
    // Clean transition to game over state
    this.gameState.phase = 'gameOver';
    this.gameState.lives = 0;
    this.stateManager.transitionTo(GamePhase.GAME_OVER);
    this.audioManager.playHit();
    
    // Update state immediately to show game over screen
    this.updateState();
    
    // Game over screen shown
  }
  


  public nextLevel() {
    // Use transition manager for smooth level change
    const currentLevel = this.gameState.level;
    const nextLevel = currentLevel + 1;
    
    this.stateManager.transitionTo(GamePhase.LEVEL_TRANSITION);
    
    // Start transition with loading screen
    this.transitionManager.startTransition(currentLevel, nextLevel, () => {
      this.gameState.level = nextLevel;
      this.gameState.cookiesCollected = 0;
      this.bullets = [];
      
      // Initialize new level immediately to prevent null reference issues
      this.initializeLevel();
      
      // Show cutscene for new level after initialization
      this.showLevelCutscene();
    });
  }
  
  private showLevelCutscene() {
    // Showing level cutscene
    const cutsceneData: CutsceneData = this.getCutsceneData(this.gameState.level);
    
    // Create cutscene immediately without UI controller queue to prevent conflicts
    this.currentCutscene = new Cutscene(this.canvas, cutsceneData, () => {
      // Cutscene finished, starting gameplay
      this.currentCutscene = null;
      
      // Now set the game phase and initialize level
      this.gameState.phase = 'playing';
      this.initializeLevel();
      this.stateManager.transitionTo(GamePhase.PLAYING);
      
      // Level ready for play
    });
    
    this.currentCutscene.start();
  }
  
  private getCutsceneData(level: number): CutsceneData {
    return CUTSCENE_DATA[level as keyof typeof CUTSCENE_DATA] || {
      levelNumber: level,
      title: `Level ${level}`,
      description: "The cosmic adventure continues...\nWill Cosmo escape Earth's grasp?"
    };
  }
  
  private initializeLevel() {
    // Initializing level
    
    // Unlock weapons based on level progression
    if (this.gameState.level >= GAME_CONFIG.WEAPONS.RAY_GUN.UNLOCK_LEVEL) {
      this.gameState.hasRayGun = true;
    }
    
    if (this.gameState.level >= GAME_CONFIG.WEAPONS.ADJUDICATOR.UNLOCK_LEVEL) {
      this.gameState.hasAdjudicator = true;
    }
    
    this.player.reset(this.canvas.width / 2, this.canvas.height - GAME_CONFIG.PLAYER.STARTING_Y_OFFSET);
    this.currentLevel = new Level(this.gameState.level, this.canvas.width, this.canvas.height);
    
    // Initialize boss for final level
    if (this.gameState.level === GAME_CONFIG.BOSS.SPAWN_LEVEL && this.currentLevel.hasBoss()) {
      this.bossStateMachine = new BossStateMachine();
      this.gameState.bossHealth = GAME_CONFIG.BOSS.INITIAL_HEALTH;
      // Boss initialized for final level
      
      // Start boss intro sequence
      const context = this.createBossContext(GAME_CONFIG.PERFORMANCE.DEFAULT_DELTA_TIME);
      this.bossStateMachine.start('BOSS_INTRO', context);
    } else {
      this.bossStateMachine = null;
      this.gameState.bossHealth = 0;
    }
    
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.gameState.phase = 'playing';
    this.bullets = []; // Clear bullets when starting new level
    this.updateState();
    
    // Level setup complete
  }

  private fireRayGun() {
    if (!this.gameState.hasRayGun) return;
    
    const playerBounds = this.player.getBounds();
    const bullet = {
      x: playerBounds.x + playerBounds.width / 2,
      y: playerBounds.y,
      vx: 0,
      vy: GAME_CONFIG.WEAPONS.RAY_GUN.BULLET_SPEED,
      hits: 0
    };
    
    this.bullets.push(bullet);
    this.audioManager.playHit(); // Ray gun firing sound
  }

  private fireAdjudicator() {
    if (!this.gameState.hasAdjudicator || this.adjudicatorCooldown > 0) return;
    
    // Find nearest enemy for tracking orb
    const enemies = this.currentLevel.getEnemies();
    const playerBounds = this.player.getBounds();
    let nearestEnemy = null;
    let minDistance = Infinity;
    
    enemies.forEach(enemy => {
      if (enemy.isActive()) {
        const enemyBounds = enemy.getBounds();
        const dx = enemyBounds.x - playerBounds.x;
        const dy = enemyBounds.y - playerBounds.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = enemy;
        }
      }
    });
    
    if (nearestEnemy) {
      // Instant kill nearest enemy
      (nearestEnemy as Enemy).destroy();
      // Play adjudicator sound
      this.audioManager.playAdjudicator();
    }
    
    this.adjudicatorCooldown = GAME_CONFIG.WEAPONS.ADJUDICATOR.COOLDOWN;
  }

  private updateBullets(deltaTime: number) {
    // Update bullet positions - faster bullets
    this.bullets.forEach(bullet => {
      bullet.x += bullet.vx * deltaTime * 0.3;
      bullet.y += bullet.vy * deltaTime * 0.3;
    });
    
    // Clean up marked bullets after iteration to prevent splice issues
    this.bullets = this.bullets.filter(bullet => !bullet.toRemove);

    // Rebuild spatial grid with current enemy positions (null check)
    if (this.currentLevel) {
      const enemies = this.currentLevel.getEnemies();
      this.spatialGrid.clear();
      
      // Add regular enemies to spatial grid
      for (const enemy of enemies) {
        if (enemy && enemy.isActive()) {
          const bounds = enemy.getBounds();
          if (bounds) {
            this.spatialGrid.insert(enemy, bounds.x, bounds.y, bounds.width, bounds.height);
          }
        }
      }
      
      // CRITICAL FIX: Add boss to spatial grid for bullet collision detection
      const boss = this.currentLevel.getBoss();
      if (boss && boss.isActive()) {
        const bounds = boss.getBounds();
        if (bounds) {
          this.spatialGrid.insert(boss, bounds.x, bounds.y, bounds.width, bounds.height);
        }
      }
    }

    // Check bullet collisions using spatial grid (with bounds checking)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (i >= this.bullets.length) break; // Array bounds check
      const bullet = this.bullets[i];
      if (!bullet) continue; // Null check
      
      // Sanitize bullet position to prevent NaN/Infinity crashes
      if (!Number.isFinite(bullet.x) || !Number.isFinite(bullet.y)) {
        bullet.toRemove = true;
        continue;
      }
      let bulletHit = false;

      const bulletBounds = {
        x: bullet.x - GAME_CONFIG.COLLISION.BULLET_RADIUS,
        y: bullet.y - GAME_CONFIG.COLLISION.BULLET_RADIUS,
        width: GAME_CONFIG.COLLISION.BULLET_RADIUS * 2,
        height: GAME_CONFIG.COLLISION.BULLET_RADIUS * 2
      };
      
      // Get only nearby enemies from spatial grid
      const potentialEnemies = this.spatialGrid.getPotentialCollisions(
        bulletBounds.x, 
        bulletBounds.y, 
        bulletBounds.width, 
        bulletBounds.height
      );

      // Check collision only with nearby enemies
      for (const enemy of potentialEnemies) {
        const typedEnemy = enemy as Enemy;
        if (typedEnemy && typedEnemy.isActive()) {
          const enemyBounds = typedEnemy.getBounds();

          if (enemyBounds && this.checkCollision(bulletBounds, enemyBounds)) {
            // Check if this is the boss
            const boss = this.currentLevel.getBoss();
            if (boss && typedEnemy === boss) {
              // BOSS DAMAGE SYSTEM: Reduce boss health instead of instant kill
              const damageAmount = this.gameState.hasAdjudicator ? GAME_CONFIG.WEAPONS.ADJUDICATOR.DAMAGE : GAME_CONFIG.WEAPONS.RAY_GUN.DAMAGE;
              this.gameState.bossHealth = Math.max(0, this.gameState.bossHealth - damageAmount);
              
              console.log(`Boss hit! Health: ${this.gameState.bossHealth}/100 (${damageAmount} damage)`);
              
              // Play boss hit sound
              try {
                this.audioPool.play('hit');
              } catch (error) {
                this.audioManager.playHit();
              }
              
              this.gameState.score += GAME_CONFIG.SCORING.BOSS_HIT_POINTS;
              bullet.hits++;
              
              // Bullets always disappear when hitting boss (even Adjudicator)
              bulletHit = true;
            } else {
              // Regular enemy - instant kill with weapons
              typedEnemy.destroy();
              // Play hit sound with fallback
              try {
                this.audioPool.play('hit');
              } catch (error) {
                this.audioManager.playHit();
              }
              this.gameState.score += GAME_CONFIG.SCORING.ENEMY_HIT_POINTS;
              bullet.hits++;
              
              // Ray Gun bullets disappear after hitting enemy
              // Adjudicator bullets pierce through (up to 3 enemies)
              if (!this.gameState.hasAdjudicator || bullet.hits >= 3) {
                bulletHit = true;
              }
            }
            break;
          }
        }
      }

      // Mark bullets for removal instead of splicing during iteration
      if (bulletHit || bullet.y < 0 || bullet.y > this.canvas.height ||
          bullet.x < 0 || bullet.x > this.canvas.width) {
        bullet.toRemove = true;
      }
    }
  }

  private gameLoop(currentTime: number) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Performance monitoring
    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
      
      // Log performance metrics
      if (this.currentFPS < 30) {
        console.warn(`Low FPS detected: ${this.currentFPS}`);
      }
      
      // Only run diagnostic when FPS drops significantly
      if (this.currentFPS < 30) {
        this.runDiagnostic();
      }
    }
    
    // Update damage system
    this.damageSystem.update(deltaTime);
    
    // Update transition manager
    this.transitionManager.update(deltaTime);
    
    // Process filtered input events
    this.commandInputSystem.processEventQueue();

    // Only update game logic if not in cutscene and playing
    try {
      if (this.gameState.phase === 'playing' && !this.currentCutscene && !this.transitionManager.isInTransition()) {
        this.update(deltaTime);
      }
      
      this.render();
    } catch (error) {
      console.error('GameEngine: Critical error in game loop:', error);
      // Emergency fallback: pause game and transition to safe state
      this.isRunning = false;
      this.stateManager.forceTransitionTo(GamePhase.TITLE);
      this.uiController.forceReset();
    }
    
    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number) {
    // Update player
    this.player.update(this.inputManager, deltaTime, this.canvas.width, this.canvas.height);
    
    // Update level (enemies, etc.)
    this.currentLevel.update(deltaTime);
    
    // Update boss state machine if active
    if (this.bossStateMachine) {
      const context = this.createBossContext(deltaTime);
      const result = this.bossStateMachine.update(context);
      
      // Handle boss state transitions
      if (result && result.shouldTransition) {
        // Boss state transition
        
        // Boss defeated - trigger victory
        if (result.nextState === 'DEFEATED') {
          this.gameState.bossHealth = 0;
          this.audioManager.playVictoryFanfare();
          // Boss defeated - victory achieved
        }
      }
    }
    
    // Update bullets
    this.updateBullets(deltaTime);
    
    // Update weapon cooldowns
    if (this.adjudicatorCooldown > 0) {
      this.adjudicatorCooldown -= deltaTime;
    }
    
    // Check collisions
    this.checkCollisions();
    
    // Check win condition - Act progression: Escape → Discovery → Boss → Catharsis → Mystery
    if (this.gameState.cookiesCollected >= this.gameState.totalCookies) {
      const finishLine = this.currentLevel.getFinishLine();
      if (this.checkCollision(this.player.getBounds(), finishLine)) {
        if (this.gameState.level >= GAME_CONFIG.BOSS.SPAWN_LEVEL) {
          // Final level: Must also defeat boss to win
          if (this.bossStateMachine && this.gameState.bossHealth > 0) {
            // Boss still alive - cannot finish level
            return;
          }
          // Final victory: Cosmic resistance successful, joy reclaimed
          this.gameState.phase = 'victory';
          this.audioManager.playVictoryFanfare();
          this.showVictorySequence();
        } else {
          // Level complete: Progress in Cosmo's escape journey
          this.gameState.phase = 'levelComplete';
          this.audioManager.playSuccess();
          this.handleLevelComplete();
        }
      }
    }
  }

  private checkCollisions() {
    if (!this.player || !this.currentLevel) return;
    
    const playerBounds = this.player.getBounds();
    if (!playerBounds) return;
    
    // Check cookie collisions - Core feedback loop: Visual pop + audio crunch + brief screen flash
    const collectedCookies = this.currentLevel.checkCookieCollisions(playerBounds);
    if (collectedCookies > 0) {
      this.gameState.cookiesCollected += collectedCookies;
      this.gameState.score += collectedCookies * GAME_CONFIG.SCORING.COOKIE_POINTS;
      
      // Satisfying feedback: Cookie collection sound
      try {
        this.audioPool.play('success');
      } catch (error) {
        this.audioManager.playSuccess();
      }
      
      // Screen flash effect for visual feedback
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
      
      // Joy reclamation narrative: Each cookie = encoded happiness freed from CIA control
      this.updateState();
    }
    
    // Check enemy collisions with damage system
    if (this.currentLevel.checkEnemyCollisions(playerBounds)) {
      // Use damage system to handle hits properly
      const damageApplied = this.damageSystem.takeDamage('enemy', 1, {
        x: playerBounds.x,
        y: playerBounds.y
      });
      
      if (damageApplied) {
        this.audioManager.playHit();
        
        if (this.damageSystem.getHealth() <= 0) {
          // Game over - use UI controller to properly queue the transition
          this.handleGameOver();
        } else {
          // Respawn player but keep invincibility
          this.player.reset(this.canvas.width / 2, this.canvas.height - GAME_CONFIG.PLAYER.STARTING_Y_OFFSET);
        }
      }
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
    
    // Don't render game content if we're still in TITLE phase (React overlay handles it)
    const currentPhase = this.stateManager.getCurrentPhase();
    if (!this.isRunning || currentPhase === GamePhase.TITLE) {
      return;
    }
    
    // If cutscene is active, render it and return
    if (this.currentCutscene && this.currentCutscene.isReady()) {
      this.currentCutscene.render();
      return;
    } else if (this.currentCutscene) {
      // Cutscene exists but not ready - render black screen with loading text
      this.ctx.fillStyle = '#000022';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Show loading text to reduce perceived glitch
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '20px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'alphabetic'; // Reset text baseline for consistency
      return;
    }
    
    // If transitioning, render transition effect
    if (this.transitionManager.isInTransition()) {
      // Render current level if available
      if (this.currentLevel) {
        this.currentLevel.render(this.ctx);
      }
      // Overlay transition effect
      this.transitionManager.render();
      return;
    }
    
    // Normal game rendering
    if (this.currentLevel) {
      // Render level background and objects
      this.currentLevel.render(this.ctx);
      
      // Render player with invincibility effect
      if (!this.damageSystem.shouldRenderInvincibility()) {
        this.player.render(this.ctx);
      } else {
        // Blink effect during invincibility
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.player.render(this.ctx);
        this.ctx.restore();
      }
      
      // Render damage flash
      if (this.damageSystem.shouldShowDamageFlash()) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
      }
      
      // Render bullets
      this.renderBullets();
      
      // Render weapon UI indicators
      this.renderWeaponUI();
    }
  }

  private renderBullets() {
    this.ctx.save();
    
    // Disable shadows for better performance
    this.ctx.shadowBlur = 0;
    
    this.bullets.forEach(bullet => {
      if (this.gameState.hasAdjudicator) {
        // Adjudicator: Golden energy blasts (no shadow for performance)
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(bullet.x - 6, bullet.y - 6, 12, 12);
        
        // Core effect
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(bullet.x - 3, bullet.y - 3, 6, 6);
      } else {
        // Ray Gun: Cyan lightning bolts (no shadow for performance)
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.fillRect(bullet.x - 4, bullet.y - 8, 8, 16);
        
        // Lightning core
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(bullet.x - 2, bullet.y - 6, 4, 12);
      }
    });
    this.ctx.restore();
  }

  private renderWeaponUI() {
    this.ctx.save();
    this.ctx.font = '12px monospace';
    
    let yOffset = 20;
    
    // Ray Gun indicator
    if (this.gameState.hasRayGun) {
      this.ctx.fillStyle = '#00FFFF';
      this.ctx.fillText('RAY GUN [SPACE]', 10, yOffset);
      yOffset += 20;
    }
    
    // Adjudicator indicator
    if (this.gameState.hasAdjudicator) {
      const cooldownText = this.adjudicatorCooldown > 0 
        ? `[${Math.ceil(Math.max(this.adjudicatorCooldown, 0) / Math.max(1000, 1))}s]` 
        : '[X]';
      this.ctx.fillStyle = this.adjudicatorCooldown > 0 ? '#666666' : '#FFD700';
      this.ctx.fillText(`ADJUDICATOR ${cooldownText}`, 10, yOffset);
      
      // Render floating orb above player if available
      if (this.adjudicatorCooldown <= 0 && this.player) {
        const playerBounds = this.player.getBounds();
        if (playerBounds) {
          this.ctx.fillStyle = '#FFD700';
          this.ctx.shadowColor = '#FFD700';
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          this.ctx.arc(
            playerBounds.x + playerBounds.width / 2,
            playerBounds.y - 20,
            8,
            0,
            2 * Math.PI
          );
          this.ctx.fill();
        }
      }
    }
    
    this.ctx.restore();
  }

  private showVictorySequence() {
    // Victory sequence initiated
    
    // Use UI controller to properly queue the victory screen
    this.uiController.queueTransition('victory', () => {
      // Epilogue: Mystery + sequel tease as specified in design doc
      const epilogueData: CutsceneData = {
        levelNumber: 6,
        title: "🎃 COSMIC PLAYGROUND EPILOGUE 🎃",
        description: "Cosmo escapes through the facility doors...\nAmbience drops to empty hallway echoes.\nA white room appears...\n\n\"what?\"\n\nCosmic Playground will be back on Halloween!"
      };
      
      this.currentCutscene = new Cutscene(this.canvas, epilogueData, () => {
        this.currentCutscene = null;
        this.gameState.phase = 'victory';
        this.stateManager.transitionTo(GamePhase.VICTORY);
        this.updateState();
        
        // Stop the game after showing victory (prevent memory leak)
        const victoryTimeout = window.setTimeout(() => {
          if (this.isRunning) {
            this.stop();
          }
          this.activeTimeouts.delete(victoryTimeout);
        }, 5000); // Show victory for 5 seconds
        
        // Track timeout for cleanup
        this.activeTimeouts.add(victoryTimeout);
        
        // Clear timeout if game is stopped manually
        const clearVictoryTimeout = () => {
          this.activeTimeouts.delete(victoryTimeout);
          clearTimeout(victoryTimeout);
        };
        
        // Store timeout reference for cleanup during stop()
        // Timeout will auto-cleanup when it executes
      });
      
      this.currentCutscene.start();
    }, 1000); // 1 second delay before showing victory screen
  }

  private updateState() {
    this.onStateChange({ ...this.gameState });
  }
}
