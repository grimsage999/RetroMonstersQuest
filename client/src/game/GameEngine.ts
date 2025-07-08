import { Player } from './Player';
import { Enemy } from './Enemy';
import { Level } from './Level';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { Cutscene, CutsceneData } from './Cutscene';

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
      hasAdjudicator: false
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
        } else if (this.gameState.hasRayGun && this.gameState.phase === 'playing') {
          this.fireRayGun();
        }
      } else if (e.key === 'x' || e.key === 'X') {
        if (this.gameState.hasAdjudicator && this.adjudicatorCooldown <= 0) {
          this.fireAdjudicator();
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
      this.audioManager.playGameStart();
      this.audioManager.playBackgroundMusic();
      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
      
      // Show opening cutscene
      this.showLevelCutscene();
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
      totalCookies: 0,
      hasRayGun: false,
      hasAdjudicator: false
    };
    
    // Initialize level 1 first, then show cutscene
    this.player.reset(this.canvas.width / 2, this.canvas.height - 50);
    this.currentLevel = new Level(1, this.canvas.width, this.canvas.height);
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    
    // Show opening cutscene
    this.showLevelCutscene();
  }

  public nextLevel() {
    this.gameState.level++;
    this.gameState.cookiesCollected = 0;
    this.bullets = [];
    
    // Show cutscene for new level
    this.showLevelCutscene();
  }
  
  private showLevelCutscene() {
    const cutsceneData: CutsceneData = this.getCutsceneData(this.gameState.level);
    
    this.currentCutscene = new Cutscene(this.canvas, cutsceneData, () => {
      this.currentCutscene = null;
      this.initializeLevel();
    });
    
    this.currentCutscene.start();
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
    this.gameState.totalCookies = this.currentLevel.getTotalCookies();
    this.gameState.phase = 'playing';
    this.bullets = []; // Clear bullets when starting new level
    this.updateState();
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
      nearestEnemy.destroy();
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

    // Check bullet collisions with enemies
    const enemies = this.currentLevel.getEnemies();
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      let bulletHit = false;

      // Check collision with enemies
      for (const enemy of enemies) {
        if (enemy.isActive()) {
          const enemyBounds = enemy.getBounds();
          const bulletBounds = {
            x: bullet.x - 6,
            y: bullet.y - 6,
            width: 12,
            height: 12
          };

          if (this.checkCollision(bulletBounds, enemyBounds)) {
            // Instant kill with weapons
            enemy.destroy();
            this.audioManager.playHit();
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

    // Only update game logic if not in cutscene and playing
    if (this.gameState.phase === 'playing' && !this.currentCutscene) {
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
          // Final victory: Cosmic resistance successful, joy reclaimed
          this.gameState.phase = 'victory';
          this.audioManager.playVictoryFanfare();
          this.showVictorySequence();
        } else {
          // Level complete: Progress in Cosmo's escape journey
          this.gameState.phase = 'levelComplete';
          this.audioManager.playSuccess();
        }
        this.updateState();
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
    
    // If cutscene is active, render it and return
    if (this.currentCutscene) {
      this.currentCutscene.render();
      return;
    }
    
    // Render level background and objects
    this.currentLevel.render(this.ctx);
    
    // Render player
    this.player.render(this.ctx);
    
    // Render bullets
    this.renderBullets();
    
    // Render weapon UI indicators
    this.renderWeaponUI();
  }

  private renderBullets() {
    this.ctx.save();
    this.bullets.forEach(bullet => {
      if (this.gameState.hasAdjudicator) {
        // Adjudicator: Golden energy blasts
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(bullet.x - 6, bullet.y - 6, 12, 12);
        
        // Core effect
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(bullet.x - 3, bullet.y - 3, 6, 6);
      } else {
        // Ray Gun: Cyan lightning bolts
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.shadowBlur = 8;
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
    // Epilogue: Mystery + sequel tease as specified in design doc
    const epilogueData: CutsceneData = {
      levelNumber: 6,
      title: "🎃 COSMIC PLAYGROUND EPILOGUE 🎃",
      description: "Cosmo escapes through the facility doors...\nAmbience drops to empty hallway echoes.\nA white room appears...\n\n\"what?\"\n\nCosmic Playground will be back on Halloween!"
    };
    
    this.currentCutscene = new Cutscene(this.canvas, epilogueData, () => {
      this.currentCutscene = null;
      this.gameState.phase = 'victory';
      this.updateState();
    });
    
    this.currentCutscene.start();
  }

  private updateState() {
    this.onStateChange({ ...this.gameState });
  }
}
