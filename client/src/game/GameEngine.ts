import { Player } from './Player';
import { Enemy } from './Enemy';
import { Level } from './Level';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { Cutscene } from './Cutscene';
import { SpatialGrid } from './SpatialGrid';
import { SpriteBatcher } from './SpriteBatcher';
import { AudioPool } from './AudioPool';
import { GameStateManager, GamePhase } from './GameStateManager';
import { LevelTransitionManager } from './LevelTransitionManager';
import { DamageSystem } from './DamageSystem';
import { UIStateController } from './UIStateController';
import { PerformanceProfiler } from './PerformanceProfiler';
import { BossStateMachine, GameContext } from './BossStateMachine';
import { CommandInputSystem, GameCommand, InputCommand } from './CommandInputSystem';
import { GameUtils } from './GameUtils'; // Assuming GameUtils contains createBounds
import { COLLISION_CONFIG } from './GameConstants';

export interface GameState {
  score: number;
  lives: number;
  level: number;
  phase: 'playing' | 'gameOver' | 'victory' | 'levelComplete';
  cookiesCollected: number;
  totalCookies: number;
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

  // No weapons system
  private currentCutscene: Cutscene | null = null;

  private animationId: number = 0;
  private lastTime: number = 0; // Renamed to lastFrameTime for clarity
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
  private performanceProfiler: PerformanceProfiler;
  private bossStateMachine: BossStateMachine | null = null;
  private commandInputSystem: CommandInputSystem;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;

    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing', // Will be synced with state manager
      cookiesCollected: 0,
      totalCookies: 0,
      bossHealth: 100
    };

    // Initialize game components
    this.player = new Player(canvas.width / 2, canvas.height - 50);
    this.currentLevel = new Level(1, canvas.width, canvas.height);
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager();

    // Initialize optimization systems
    this.spatialGrid = new SpatialGrid(canvas.width, canvas.height, 100);
    this.spriteBatcher = new SpriteBatcher(this.ctx);
    this.audioPool = new AudioPool(5);
    this.initializeAudioPool();

    // Initialize bug fix systems
    this.stateManager = new GameStateManager(GamePhase.TITLE);
    this.transitionManager = new LevelTransitionManager(canvas);
    this.damageSystem = new DamageSystem(3);
    this.uiController = new UIStateController();

    // Initialize performance profiler for critical monitoring
    this.performanceProfiler = new PerformanceProfiler();

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
      // Failed to preload some audio
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



    return {
      playerPosition: { x: playerBounds.x, y: playerBounds.y },
      playerHealth: this.gameState.lives,
      bossHealth: this.gameState.bossHealth,
      deltaTime: Math.max(1, deltaTime), // Use actual deltaTime, minimum 1ms
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      currentWeapons: []
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
        // Starting gameplay from title screen

        // Initialize the game state for level 1
        this.gameState.level = 1;
        this.gameState.cookiesCollected = 0;

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
      }

    });

    this.commandInputSystem.registerCommandExecutor(GameCommand.FIRE_SECONDARY, (cmd: InputCommand) => {
      if (!cmd.pressed) return; // Only on key press, not release


    });

    this.commandInputSystem.registerCommandExecutor(GameCommand.SKIP_CUTSCENE, (cmd: InputCommand) => {
      if (!cmd.pressed) return;
      // Handled by cutscene directly
    });

    this.commandInputSystem.registerCommandExecutor(GameCommand.DEBUG_DIAGNOSTIC, (cmd: InputCommand) => {
      if (!cmd.pressed) return;
      // Diagnostic system removed
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
      // Starting game

      // Set running flag and start game loop immediately for responsiveness
      this.isRunning = true;
      this.lastTime = performance.now(); // Renamed variable

      // Initialize game state for level 1
      this.gameState.level = 1;
      this.gameState.cookiesCollected = 0;

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
        // Audio initialized successfully
      }).catch(error => {
        // Audio initialization failed, continuing without audio
      });

      // Game started, showing level title card
    }
  }

  // Diagnostic system removed for performance

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

    // Stopped all game loops and cleaned up resources
  }

  public restart() {
    // Restarting game to initial state

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

    // Reset optimization systems
    this.spatialGrid.clear();
    this.audioPool.stopAll();
    this.spriteBatcher.clear();

    // Clear all game objects
    this.bossStateMachine = null;
    this.currentCutscene = null;

    // Reset to completely fresh state
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing',
      cookiesCollected: 0,
      totalCookies: 0,
      bossHealth: 100
    };

    // Reset player completely including movement system
    this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
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

    // Complete system reset
  }

  private handleLevelComplete() {
    // Level complete

    // Use UI controller to properly queue the transition with delay
    this.uiController.queueTransition('levelCard', () => {
      this.nextLevel();
    }, 2000); // 2 second delay to show "Level Complete" message
  }

  private handleGameOver() {
    // CRITICAL BUG FIX: Prevent multiple game over calls
    if (this.gameState.phase === 'gameOver') {
      return; // Already handled
    }

    // Clean transition to game over state
    this.gameState.phase = 'gameOver';
    this.gameState.lives = 0;
    this.stateManager.transitionTo(GamePhase.GAME_OVER);
    this.audioManager.playHit();

    // Update state immediately to show game over screen
    this.updateState();

    // Game over screen displayed
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


      // Initialize new level immediately to prevent null reference issues
      this.initializeLevel();

      // Show cutscene for new level after initialization
      this.showLevelCutscene();
    });
  }

  private showLevelCutscene() {
    // Showing cutscene for level
    const cutsceneData: any = this.getCutsceneData(this.gameState.level);

    // Create cutscene immediately without UI controller queue to prevent conflicts
    this.currentCutscene = new Cutscene(this.canvas, cutsceneData, () => {
      // Cutscene complete, transitioning to gameplay
      this.currentCutscene = null;

      // Now set the game phase and initialize level
      this.gameState.phase = 'playing';
      this.initializeLevel();
      this.stateManager.transitionTo(GamePhase.PLAYING);

      // Level initialized and ready for gameplay
    });

    this.currentCutscene.start();
  }

  private getCutsceneData(level: number): any {
    const cutscenes: { [key: number]: any } = {
      1: {
        levelNumber: 1,
        title: "👽 COSMIC PLAYGROUND 🛸",
        description: "Cosmo crash-landed in Roswell!\nThe CIA hoards cookies - encoded joy itself.\nReclaim happiness through cosmic resistance!\n\nUse arrow keys to move • Collect all cookies • Avoid agents • Reach the finish!"
      },
      2: {
        levelNumber: 2,
        title: "Level 2: Dystopian City",
        description: "Government forces mobilize across crumbling streets.\nCracked pavement, neon signs, and surveillance everywhere.\nAmbient citizens watch from windows as you flee.\n\n⚠️ TIP: Enemies move faster here - time your movements carefully!"
      },
      3: {
        levelNumber: 3,
        title: "Level 3: Abandoned Subway",
        description: "Underground tunnels echo with danger.\nRadioactive rats emerge from dark corners.\nNavigate through the abandoned transit system...",
        weaponUnlocked: ""
      },
      4: {
        levelNumber: 4,
        title: "Level 4: Graveyard of the Fallen",
        description: "Government experiments created unholy abominations.\nZombies shamble between crooked tombstones.\nMist swirls as the undead hunt for fresh victims."
      },
      5: {
        levelNumber: 5,
        title: "Level 5: Government Lab",
        description: "The sterile facility hides dark secrets.\nInteract with lab equipment to uncover fragments.\nNavigate carefully through the final challenge...",
        weaponUnlocked: ""
      }
    };

    return cutscenes[level] || {
      levelNumber: level,
      title: `Level ${level}`,
      description: "The cosmic adventure continues...\nWill Cosmo escape Earth's grasp?"
    };
  }

  private initializeLevel() {
    // Initializing level



    this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
    this.currentLevel = new Level(this.gameState.level, this.canvas.width, this.canvas.height);

    // Initialize boss for Level 5
    if (this.gameState.level === 5 && this.currentLevel.hasBoss()) {
      this.bossStateMachine = new BossStateMachine();
      this.gameState.bossHealth = 100;
      // Boss State Machine initialized for Level 5

      // Start boss intro sequence
      const context = this.createBossContext(16); // Default 16ms for initialization
      this.bossStateMachine.start('BOSS_INTRO', context);
    } else {
      this.bossStateMachine = null;
      this.gameState.bossHealth = 0;
    }

    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.gameState.phase = 'playing';

    this.updateState();

    // Level initialized
  }





  // Removed updateBullets for better performance

  private gameLoop(currentTime: number) {
    if (!this.isRunning) return;

    // Start frame profiling
    this.performanceProfiler.startFrame();

    const deltaTime = currentTime - this.lastTime; // Renamed variable

    // CRITICAL BUG FIX: Limit to 60 FPS max for consistent movement speeds
    if (deltaTime < 16.67) { // 1000/60 = 16.67ms per frame
      this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
      return;
    }

    this.lastTime = currentTime; // Renamed variable

    // Profile update operations
    this.performanceProfiler.startUpdate();

    // Update only essential systems with capped deltaTime
    this.damageSystem.update(deltaTime); // Use the actual deltaTime after FPS capping
    this.commandInputSystem.processEventQueue();

    // Only update game logic if not in cutscene and playing
    try {
      // Always update transition manager first for smooth transitions
      this.transitionManager.update(deltaTime); // Use the actual deltaTime after FPS capping

      // Only update game logic during active gameplay
      if (this.shouldUpdateGameLogic()) {
        this.update(deltaTime); // Use the actual deltaTime after FPS capping
      }

      this.performanceProfiler.endUpdate();

      // Profile render operations
      this.performanceProfiler.startRender();

      this.render();

      this.performanceProfiler.endRender();

    } catch (error) {
      console.error('GameEngine: Critical error in game loop:', error);
      // Emergency fallback: pause game and transition to safe state
      this.emergencyStop();
    }

    // End frame profiling
    this.performanceProfiler.endFrame();

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
        console.log(`Boss State Machine: ${result.message || 'State transition'}`);

        // Boss defeated - trigger victory
        if (result.nextState === 'DEFEATED') {
          this.gameState.bossHealth = 0;
          this.audioManager.playVictoryFanfare();
          console.log('GameEngine: Boss defeated! Victory condition met.');
        }
      }
    }



    // Check collisions
    this.checkCollisions();

    // Check win condition - Act progression: Escape → Discovery → Boss → Catharsis → Mystery
    if (this.gameState.cookiesCollected >= this.gameState.totalCookies) {
      const finishLine = this.currentLevel.getFinishLine();
      if (this.checkCollision(this.player.getBounds(), finishLine)) {
        if (this.gameState.level >= 5) {
          // FIXED: Level 5 completion - cookies collection wins, no boss defeat required for movement-only game
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
      this.gameState.score += collectedCookies * 10;

      // Satisfying feedback: Cookie collection sound
      try {
        this.audioPool.play('success');
      } catch (error) {
        this.audioManager.playSuccess();
      }

      // Enhanced screen flash effect for better visual feedback
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Add sparkle effect for extra satisfaction
      for (let i = 0; i < 8; i++) {
        const sparkleX = playerBounds.x + Math.random() * playerBounds.width;
        const sparkleY = playerBounds.y + Math.random() * playerBounds.height;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(sparkleX, sparkleY, 2, 2);
      }
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
          this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
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
    // Optimized canvas clearing for better performance
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Don't render game content if we're still in TITLE phase (React overlay handles it)
    const currentPhase = this.stateManager.getCurrentPhase();
    if (!this.isRunning || currentPhase === GamePhase.TITLE) {
      return;
    }

    // PERFORMANCE FIX: Skip expensive rendering during gameOver state
    // React overlay handles the game over screen, so no need to render game content
    if (currentPhase === GamePhase.GAME_OVER || this.gameState.phase === 'gameOver') {
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
    }
  }

  /**
   * Check if game logic should be updated
   */
  private shouldUpdateGameLogic(): boolean {
    return this.gameState.phase === 'playing' &&
           !this.currentCutscene &&
           !this.transitionManager.isInTransition();
  }

  /**
   * Emergency stop for critical errors
   */
  private emergencyStop(): void {
    this.isRunning = false;
    try {
      this.stateManager.forceTransitionTo(GamePhase.TITLE);
      this.uiController.forceReset();
      this.transitionManager.reset();
    } catch (recoveryError) {
      console.error('GameEngine: Failed to recover from critical error:', recoveryError);
    }
  }

  private showVictorySequence() {
    console.log('GameEngine: Victory!');

    // Use UI controller to properly queue the victory screen
    this.uiController.queueTransition('victory', () => {
      // Epilogue: Mystery + sequel tease as specified in design doc
      const epilogueData = {
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