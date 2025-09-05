/**
 * Level Transition Manager
 * Handles smooth level transitions without lag or resets
 */

import { EasingFunctions, type EasingFunction } from './utils/EasingFunctions';

export interface LevelTransitionConfig {
  fadeOutDuration: number;
  fadeInDuration: number;
  loadingDuration: number;
  showLoadingScreen: boolean;
  fadeOutEasing: EasingFunction;
  fadeInEasing: EasingFunction;
  progressEasing: EasingFunction;
}

type TransitionPhase = 'fadeOut' | 'loading' | 'fadeIn' | 'complete';

export class LevelTransitionManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isTransitioning: boolean = false;
  private transitionPhase: TransitionPhase = 'complete';
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
      fadeOutDuration: 200,  // Faster to reduce slow frames
      fadeInDuration: 250,   // Faster transition
      loadingDuration: 400,  // Much faster loading
      showLoadingScreen: true,
      fadeOutEasing: EasingFunctions.easeInQuad,
      fadeInEasing: EasingFunctions.easeOutQuad,
      progressEasing: EasingFunctions.easeInOutQuad
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
      console.warn('Transition already in progress');
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
      console.warn('Failed to preload some level assets:', error);
      // Continue anyway - game can still function without preloaded assets
    }
  }

  /**
   * Preload assets for the next level
   */
  private async preloadLevelAssets(level: number): Promise<void> {
    // Define assets per level (removing problematic assets)
    const levelAssets: { [key: number]: string[] } = {
      1: ['/sounds/level1_music.mp3'],
      2: ['/sounds/level2_music.mp3'],
      3: ['/sounds/level3_music.mp3'],
      4: ['/sounds/level4_music.mp3'], // No graveyard_bg.png - using generated background
      5: ['/sounds/level5_music.mp3']  // No lab_bg.png - using generated background
    };

    this.assetsToPreload = levelAssets[level] || [];
    
    // Fast parallel loading with timeout
    const promises = this.assetsToPreload.map(asset => 
      this.loadAsset(asset)
    );
    
    // Don't block transitions for more than 300ms total
    const timeoutPromise = new Promise<void>(resolve => setTimeout(resolve, 300));
    await Promise.race([Promise.all(promises), timeoutPromise]);
  }

  /**
   * Load a single asset with timeout and graceful fallback
   */
  private async loadAsset(assetPath: string): Promise<void> {
    return new Promise((resolve) => {
      // Always resolve after timeout to prevent blocking transitions
      const timeout = setTimeout(() => resolve(), 200);
      
      if (assetPath.endsWith('.mp3') || assetPath.endsWith('.wav')) {
        // Audio loading with graceful fallback
        const audio = new Audio(assetPath);
        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
        audio.addEventListener('error', () => {
          clearTimeout(timeout);
          resolve(); // Continue despite audio failure
        }, { once: true });
        audio.load();
      } else if (assetPath.endsWith('.png') || assetPath.endsWith('.jpg')) {
        // Image loading with graceful fallback
        const img = new Image();
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(); // Continue despite image failure
        };
        img.src = assetPath;
      } else {
        // Fallback for other asset types
        clearTimeout(timeout);
        setTimeout(() => resolve(), 50);
      }
    });
  }

  /**
   * Update transition state
   */
  update(deltaTime: number): void {
    if (!this.isTransitioning) return;

    // Cap deltaTime to prevent large jumps during lag spikes
    const cappedDeltaTime = Math.min(deltaTime, 1000/30); // Max 30fps equivalent
    this.transitionTimer += cappedDeltaTime;

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
              console.error('LevelTransitionManager: Error in onComplete callback:', error);
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
        this.renderFadeOverlay(
          this.transitionTimer / this.config.fadeOutDuration,
          this.config.fadeOutEasing
        );
        break;

      case 'loading':
        // Show loading screen
        if (this.config.showLoadingScreen) {
          this.renderLoadingScreen();
        }
        break;

      case 'fadeIn':
        this.renderFadeOverlay(
          1 - (this.transitionTimer / this.config.fadeInDuration),
          this.config.fadeInEasing
        );
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

    // Smooth progress bar with easing
    const rawProgress = this.transitionTimer / this.config.loadingDuration;
    const progress = EasingFunctions.apply(this.config.progressEasing, rawProgress);
    const barWidth = 300;
    const barHeight = 20;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = this.canvas.height / 2;

    // Bar background with glow effect
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 5;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Smooth bar fill with gradient
    const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#00ccff');
    gradient.addColorStop(1, '#00ffff');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Loading tips
    const tips = [
      'Tip: Press Shift to dash!',
      'Tip: Collect all cookies to proceed',
      'Tip: Watch out for radioactive rats in the subway!',
      'Tip: Watch out for enemy patterns',
      'Tip: The final lab holds the greatest challenge!'
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
    console.log(`Cleaning up level ${this.currentLevel} resources`);
    // Cleanup is handled by the game engine when setting new level
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
   * Render fade overlay with easing
   */
  private renderFadeOverlay(progress: number, easingFn: EasingFunction): void {
    const alpha = EasingFunctions.apply(easingFn, progress);
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Configure transition settings
   */
  configure(config: Partial<LevelTransitionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}