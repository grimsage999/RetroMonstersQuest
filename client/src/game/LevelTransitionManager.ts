import { logger } from './Logger';
/**
 * Level Transition Manager
 * Handles smooth level transitions without lag or resets
 */

export interface LevelTransitionConfig {
  fadeOutDuration: number;
  fadeInDuration: number;
  loadingDuration: number;
  showLoadingScreen: boolean;
}

export class LevelTransitionManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isTransitioning: boolean = false;
  private transitionPhase: 'fadeOut' | 'loading' | 'fadeIn' | 'complete' = 'complete';
  private transitionTimer: number = 0;
  private config: LevelTransitionConfig;
  private onComplete: (() => void) | null = null;
  private currentLevel: number = 1;
  private nextLevel: number = 1;
  private assetsToPreload: string[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context for LevelTransition');
    }
    this.ctx = context;
    this.config = {
      fadeOutDuration: 500,
      fadeInDuration: 500,
      loadingDuration: 1000,
      showLoadingScreen: true
    };
  }

  /**
   * Start level transition
   */
  async startTransition(
    fromLevel: number, 
    toLevel: number, 
    onComplete: () => void
  ): Promise<void> {
    if (this.isTransitioning) {
      logger.warn('Transition already in progress');
      return;
    }

    this.currentLevel = fromLevel;
    this.nextLevel = toLevel;
    this.isTransitioning = true;
    this.transitionPhase = 'fadeOut';
    this.transitionTimer = 0;
    this.onComplete = onComplete;

    // Start preloading assets for next level (with error handling)
    try {
      await this.preloadLevelAssets(toLevel);
    } catch (error) {
      logger.warn('Failed to preload some level assets:', error);
      // Continue anyway - game can still function without preloaded assets
    }
  }

  /**
   * Preload assets for the next level
   */
  private async preloadLevelAssets(level: number): Promise<void> {
    // Define assets per level
    const levelAssets: { [key: number]: string[] } = {
      1: ['/sounds/level1_music.mp3'],
      2: ['/sounds/level2_music.mp3', '/textures/city_bg.png'],
      3: ['/sounds/level3_music.mp3', '/textures/subway_bg.png', '/sounds/raygun.mp3'],
      4: ['/sounds/level4_music.mp3', '/textures/graveyard_bg.png'],
      5: ['/sounds/level5_music.mp3', '/textures/lab_bg.png', '/sounds/adjudicator.mp3']
    };

    this.assetsToPreload = levelAssets[level] || [];
    
    // Simulate asset loading (with error handling)
    const promises = this.assetsToPreload.map(asset => 
      this.loadAsset(asset).catch(error => {
        logger.warn(`Failed to load asset ${asset}:`, error);
        return Promise.resolve(); // Continue despite individual failures
      })
    );
    await Promise.all(promises);
  }

  /**
   * Load a single asset
   */
  private async loadAsset(assetPath: string): Promise<void> {
    return new Promise((resolve) => {
      // Simulate loading delay
      setTimeout(() => {
        logger.info(`Loaded asset: ${assetPath}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Update transition state
   */
  update(deltaTime: number): void {
    if (!this.isTransitioning) return;

    this.transitionTimer += deltaTime;

    switch (this.transitionPhase) {
      case 'fadeOut':
        if (this.transitionTimer >= this.config.fadeOutDuration) {
          this.transitionPhase = 'loading';
          this.transitionTimer = 0;
          // Clean up previous level resources
          this.cleanupPreviousLevel();
        }
        break;

      case 'loading':
        if (this.transitionTimer >= this.config.loadingDuration) {
          this.transitionPhase = 'fadeIn';
          this.transitionTimer = 0;
          // Initialize new level (with error handling)
          if (this.onComplete) {
            try {
              this.onComplete();
            } catch (error) {
              logger.error('LevelTransitionManager: Error in onComplete callback:', error);
              // Reset transition state to prevent being stuck
              this.isTransitioning = false;
              this.transitionPhase = 'complete';
              this.transitionTimer = 0;
            }
          }
        }
        break;

      case 'fadeIn':
        if (this.transitionTimer >= this.config.fadeInDuration) {
          this.transitionPhase = 'complete';
          this.isTransitioning = false;
          this.transitionTimer = 0;
        }
        break;
    }
  }

  /**
   * Render transition effects
   */
  render(): void {
    if (!this.isTransitioning) return;

    this.ctx.save();

    switch (this.transitionPhase) {
      case 'fadeOut':
        // Fade to black
        const fadeOutAlpha = Math.min(1, this.transitionTimer / this.config.fadeOutDuration);
        this.ctx.fillStyle = `rgba(0, 0, 0, ${fadeOutAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        break;

      case 'loading':
        // Show loading screen
        if (this.config.showLoadingScreen) {
          this.renderLoadingScreen();
        }
        break;

      case 'fadeIn':
        // Fade from black
        const fadeInAlpha = Math.max(0, 1 - (this.transitionTimer / this.config.fadeInDuration));
        this.ctx.fillStyle = `rgba(0, 0, 0, ${fadeInAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        break;
    }

    this.ctx.restore();
  }

  /**
   * Render loading screen
   */
  private renderLoadingScreen(): void {
    // Black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Loading text
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      `Loading Level ${this.nextLevel}...`,
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    // Progress bar
    const progress = this.transitionTimer / this.config.loadingDuration;
    const barWidth = 300;
    const barHeight = 20;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = this.canvas.height / 2;

    // Bar background
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Bar fill
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Loading tips
    const tips = [
      'Tip: Press Shift to dash!',
      'Tip: Collect all cookies to proceed',
      'Tip: Ray Gun unlocks at Level 3',
      'Tip: Watch out for enemy patterns',
      'Tip: The Adjudicator awaits in Level 5'
    ];
    
    const tipIndex = Math.floor(this.nextLevel - 1) % tips.length;
    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText(
      tips[tipIndex],
      this.canvas.width / 2,
      this.canvas.height / 2 + 80
    );
  }

  /**
   * Clean up resources from previous level
   */
  private cleanupPreviousLevel(): void {
    // Force garbage collection by nullifying references
    logger.info(`Cleaning up level ${this.currentLevel} resources`);
    
    // This would be called by the game engine to clean up:
    // - Enemy arrays
    // - Bullet arrays
    // - Particle effects
    // - Unused textures
  }

  /**
   * Check if currently transitioning
   */
  isInTransition(): boolean {
    return this.isTransitioning;
  }

  /**
   * Reset transition manager to clean state
   */
  reset(): void {
    this.isTransitioning = false;
    this.transitionPhase = 'complete';
    this.transitionTimer = 0;
    this.onComplete = null;
    this.currentLevel = 1;
    this.nextLevel = 1;
    this.assetsToPreload = [];
  }

  /**
   * Configure transition settings
   */
  configure(config: Partial<LevelTransitionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}