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
  
  private bullets: Array<{x: number, y: number, vx: number, vy: number, hits: number}> = [];
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
      lives: 3,
      level: 1,
      phase: 'playing',
      cookiesCollected: 0,
      totalCookies: 0,
      hasRayGun: false,
      hasAdjudicator: false,
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
    
    // Set damage callbacks
    this.damageSystem.setOnDamage((health, maxHealth) => {
      this.gameState.lives = health;
      this.updateState();
    });
    
    this.damageSystem.setOnDeath(() => {
      this.gameState.phase = 'gameOver';
      this.stateManager.transitionTo(GamePhase.GAME_OVER);
      this.updateState();
    });
    
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.updateState();
    
    this.setupEventListeners();
  }
  
  private initializeAudioPool(): void {
    // Initialize audio pools for different sound effects
    this.audioPool.initializeSound('shoot', '/sounds/shoot.mp3', 8);
    this.audioPool.initializeSound('hit', '/sounds/hit.mp3', 6);
    this.audioPool.initializeSound('pickup', '/sounds/pickup.mp3', 4);
    this.audioPool.initializeSound('crunch', '/sounds/crunch.mp3', 5);
    this.audioPool.initializeSound('adjudicator', '/sounds/adjudicator.mp3', 3);
    
    // Preload all sounds
    this.audioPool.preloadAll().catch(err => {
      console.warn('Failed to preload some audio:', err);
    });
  }

  private createBossContext(): GameContext {
    const playerBounds = this.player.getBounds();
    return {
      playerPosition: { x: playerBounds.x, y: playerBounds.y },
      playerHealth: this.gameState.lives,
      bossHealth: this.gameState.bossHealth,
      deltaTime: 16, // 60fps baseline
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      currentWeapons: [
        this.gameState.hasRayGun ? 'raygun' : '',
        this.gameState.hasAdjudicator ? 'adjudicator' : ''
      ].filter(w => w !== '')
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
        console.log('GameEngine: Starting gameplay from title screen');
        
        // Initialize the game state and first level
        this.gameState.level = 1;
        this.gameState.phase = 'playing';
        this.initializeLevel();
        
        this.stateManager.transitionTo(GamePhase.CUTSCENE);
        this.showLevelCutscene();
        return;
      }
      
      if (this.gameState.phase === 'gameOver' || this.gameState.phase === 'victory') {
        this.restart();
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
      console.log('GameEngine: Starting game...');
      
      // Initialize audio on user interaction (game start)
      await this.audioManager.initialize();
      
      // Set running flag and start game loop first
      this.isRunning = true;
      this.lastTime = performance.now();
      
      // Start with TITLE phase, not cutscene
      this.stateManager.transitionTo(GamePhase.TITLE);
      
      this.audioManager.playGameStart();
      this.audioManager.playBackgroundMusic();
      
      // Start game loop
      this.gameLoop(this.lastTime);
      
      console.log('GameEngine: Game started in TITLE phase');
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
        console.log('Fixing: Resetting UI controller');
        this.uiController.forceReset();
      }
      
      // Check for invalid states
      if (report.issues.some(issue => issue.includes('Invalid transition'))) {
        console.log('Fixing: Resetting state manager');
        this.stateManager.forceTransitionTo(GamePhase.TITLE);
      }
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public async restart() {
    console.log('GameEngine: Restarting game...');
    
    // Stop current game loop to prevent race conditions
    const wasRunning = this.isRunning;
    this.stop();
    
    // Initialize audio if not already done
    await this.audioManager.initialize();
    
    // Reset all systems
    this.damageSystem.reset();
    this.stateManager.reset();
    this.uiController.forceReset();
    
    // Clear all game objects
    this.bullets = [];
    this.bossStateMachine = null;
    
    // Reset game state
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing', // Old state system compatibility
      cookiesCollected: 0,
      totalCookies: 0,
      hasRayGun: false,
      hasAdjudicator: false,
      bossHealth: 100
    };
    
    // Initialize level 1
    this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
    this.currentLevel = new Level(1, this.canvas.width, this.canvas.height);
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    
    // Update state
    this.updateState();
    
    // Restart game loop if it was running
    if (wasRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      
      // Transition to TITLE phase
      this.stateManager.transitionTo(GamePhase.TITLE);
      
      // Play audio
      this.audioManager.playGameStart();
      this.audioManager.playBackgroundMusic();
      
      // Restart game loop
      this.gameLoop(this.lastTime);
      
      console.log('GameEngine: Game restarted successfully in TITLE phase');
    }
  }

  private handleLevelComplete() {
    console.log('GameEngine: Level complete!');
    
    // Use UI controller to properly queue the transition with delay
    this.uiController.queueTransition('levelCard', () => {
      this.nextLevel();
    }, 2000); // 2 second delay to show "Level Complete" message
  }
  
  private handleGameOver() {
    console.log('GameEngine: Game over!');
    this.gameState.phase = 'gameOver';
    this.gameState.lives = 0;
    this.stateManager.transitionTo(GamePhase.GAME_OVER);
    this.audioManager.playHit(); // Use hit sound for game over
    
    // Use UI controller to properly queue the game over screen
    this.uiController.queueTransition('gameOver', () => {
      this.updateState();
      // Stop the game after showing game over
      setTimeout(() => {
        this.stop();
      }, 3000); // Show game over for 3 seconds
    }, 1500); // 1.5 second delay before showing game over screen
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
      
      // Clean up previous level completely
      this.currentLevel = null as any; // Force cleanup
      
      // Show cutscene for new level
      this.showLevelCutscene();
    });
  }
  
  private showLevelCutscene() {
    console.log(`GameEngine: Showing cutscene for level ${this.gameState.level}`);
    const cutsceneData: CutsceneData = this.getCutsceneData(this.gameState.level);
    
    // Use UI controller to prevent overlapping transitions
    this.uiController.queueTransition('cutscene', () => {
      this.currentCutscene = new Cutscene(this.canvas, cutsceneData, () => {
        console.log('GameEngine: Cutscene complete, initializing level');
        this.currentCutscene = null;
        this.stateManager.transitionTo(GamePhase.PLAYING);
        this.initializeLevel();
      });
      
      this.currentCutscene.start();
    });
  }
  
  private getCutsceneData(level: number): CutsceneData {
    const cutscenes: { [key: number]: CutsceneData } = {
      1: {
        levelNumber: 1,
        title: "👽 COSMIC PLAYGROUND 🛸",
        description: "Cosmo crash-landed in Roswell!\nThe CIA hoards cookies - encoded joy itself.\nReclaim happiness through cosmic resistance!\n\nUse arrow keys to move • Collect all cookies • Avoid agents • Reach the finish!"
      },
      2: {
        levelNumber: 2,
        title: "Level 2: Dystopian City",
        description: "Government forces mobilize across crumbling streets.\nCracked pavement, neon signs, and surveillance everywhere.\nAmbient citizens watch from windows as you flee."
      },
      3: {
        levelNumber: 3,
        title: "Level 3: Abandoned Subway",
        description: "Underground tunnels echo with danger.\nRadioactive rats emerge from dark corners.\nIn the debris, you discover alien technology...",
        weaponUnlocked: "⚡ RAY GUN ACQUIRED ⚡\nPress SPACE to fire lightning bolts!\n(3 hits to defeat enemies)"
      },
      4: {
        levelNumber: 4,
        title: "Level 4: Graveyard of the Fallen", 
        description: "Government experiments created unholy abominations.\nZombies shamble between crooked tombstones.\nMist swirls as the undead hunt for fresh victims."
      },
      5: {
        levelNumber: 5,
        title: "Level 5: Government Lab",
        description: "The sterile facility hides dark secrets.\nInteract with lab equipment to uncover fragments.\nSomewhere here lies The Adjudicator...",
        weaponUnlocked: "🔮 THE ADJUDICATOR 🔮\nPress X for instant death rays!\nGlowing orb grants ultimate power!"
      }
    };
    
    return cutscenes[level] || {
      levelNumber: level,
      title: `Level ${level}`,
      description: "The cosmic adventure continues...\nWill Cosmo escape Earth's grasp?"
    };
  }
  
  private initializeLevel() {
    console.log(`GameEngine: Initializing level ${this.gameState.level}`);
    
    // Unlock Ray Gun starting from Level 3
    if (this.gameState.level >= 3) {
      this.gameState.hasRayGun = true;
    }
    
    // Unlock Adjudicator in Level 5
    if (this.gameState.level >= 5) {
      this.gameState.hasAdjudicator = true;
    }
    
    this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
    this.currentLevel = new Level(this.gameState.level, this.canvas.width, this.canvas.height);
    
    // Initialize boss for Level 5
    if (this.gameState.level === 5 && this.currentLevel.hasBoss()) {
      this.bossStateMachine = new BossStateMachine();
      this.gameState.bossHealth = 100;
      console.log('GameEngine: Boss State Machine initialized for Level 5');
      
      // Start boss intro sequence
      const context = this.createBossContext();
      this.bossStateMachine.start('BOSS_INTRO', context);
    } else {
      this.bossStateMachine = null;
      this.gameState.bossHealth = 0;
    }
    
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.gameState.phase = 'playing';
    this.bullets = []; // Clear bullets when starting new level
    this.updateState();
    
    console.log(`GameEngine: Level ${this.gameState.level} initialized with ${this.gameState.totalCookies} cookies`);
  }

  private fireRayGun() {
    if (!this.gameState.hasRayGun) return;
    
    const playerBounds = this.player.getBounds();
    const bullet = {
      x: playerBounds.x + playerBounds.width / 2,
      y: playerBounds.y,
      vx: 0,
      vy: -8, // Fast upward velocity
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
      this.audioManager.playAdjudicator(); // Adjudicator kill sound
    }
    
    this.adjudicatorCooldown = 5000; // 5 second cooldown
  }

  private updateBullets(deltaTime: number) {
    // Update bullet positions - faster bullets
    this.bullets.forEach(bullet => {
      bullet.x += bullet.vx * deltaTime * 0.3;
      bullet.y += bullet.vy * deltaTime * 0.3;
    });

    // Rebuild spatial grid with current enemy positions
    const enemies = this.currentLevel.getEnemies();
    this.spatialGrid.clear();
    for (const enemy of enemies) {
      if (enemy.isActive()) {
        const bounds = enemy.getBounds();
        this.spatialGrid.insert(enemy, bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }

    // Check bullet collisions using spatial grid
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      let bulletHit = false;

      const bulletBounds = {
        x: bullet.x - 6,
        y: bullet.y - 6,
        width: 12,
        height: 12
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
        if (typedEnemy.isActive()) {
          const enemyBounds = typedEnemy.getBounds();

          if (this.checkCollision(bulletBounds, enemyBounds)) {
            // Instant kill with weapons
            typedEnemy.destroy();
            this.audioPool.play('hit'); // Use audio pool
            this.gameState.score += 50;
            bullet.hits++;
            
            // Ray Gun bullets disappear after hitting enemy
            // Adjudicator bullets pierce through (up to 3 enemies)
            if (!this.gameState.hasAdjudicator || bullet.hits >= 3) {
              bulletHit = true;
            }
            break;
          }
        }
      }

      // Remove bullets that should be removed or went off screen
      if (bulletHit || bullet.y < 0 || bullet.y > this.canvas.height ||
          bullet.x < 0 || bullet.x > this.canvas.width) {
        this.bullets.splice(i, 1);
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
      
      // Run diagnostic every 10 seconds when FPS is calculated
      if (Math.random() < 0.1) { // 10% chance each second = roughly every 10 seconds
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
    if (this.gameState.phase === 'playing' && !this.currentCutscene && !this.transitionManager.isInTransition()) {
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
    
    // Update boss state machine if active
    if (this.bossStateMachine) {
      const context = this.createBossContext();
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
        if (this.gameState.level >= 5) {
          // Level 5: Must also defeat boss to win
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
    const playerBounds = this.player.getBounds();
    
    // Check cookie collisions - Core feedback loop: Visual pop + audio crunch + brief screen flash
    const collectedCookies = this.currentLevel.checkCookieCollisions(playerBounds);
    if (collectedCookies > 0) {
      this.gameState.cookiesCollected += collectedCookies;
      this.gameState.score += collectedCookies * 10;
      
      // Satisfying feedback: Cookie collection chime (crunchy/pop from design doc)
      this.audioManager.playCrunch();
      
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
    // Clear canvas
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Don't render if game hasn't started yet (title screen is React component)
    if (!this.isRunning) {
      return;
    }
    
    // If cutscene is active, render it and return
    if (this.currentCutscene && this.currentCutscene.isReady()) {
      this.currentCutscene.render();
      return;
    } else if (this.currentCutscene) {
      // Cutscene exists but not ready - render black screen to prevent flickering
      this.ctx.fillStyle = '#000022';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
        ? `[${Math.ceil(this.adjudicatorCooldown / 1000)}s]` 
        : '[X]';
      this.ctx.fillStyle = this.adjudicatorCooldown > 0 ? '#666666' : '#FFD700';
      this.ctx.fillText(`ADJUDICATOR ${cooldownText}`, 10, yOffset);
      
      // Render floating orb above player if available
      if (this.adjudicatorCooldown <= 0) {
        const playerBounds = this.player.getBounds();
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
    
    this.ctx.restore();
  }

  private showVictorySequence() {
    console.log('GameEngine: Victory!');
    
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
        
        // Stop the game after showing victory
        setTimeout(() => {
          this.stop();
        }, 5000); // Show victory for 5 seconds
      });
      
      this.currentCutscene.start();
    }, 1000); // 1 second delay before showing victory screen
  }

  private updateState() {
    this.onStateChange({ ...this.gameState });
  }
}
