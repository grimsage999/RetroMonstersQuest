interface CutsceneData {
  levelNumber: number;
  title: string;
  description: string;
  weaponUnlocked?: string;
}
import { CosmicTextRenderer } from './CosmicTextRenderer'; // Import the new renderer

export class Cutscene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: CutsceneData;
  private onComplete: () => void;
  private startTime: number = 0;
  private isActive: boolean = false;
  private skipHandler: ((e: KeyboardEvent) => void) | null = null;
  private autoAdvanceTimeout: number | null = null;
  private cosmicTextRenderer: CosmicTextRenderer; // Added for cosmic text rendering

  constructor(canvas: HTMLCanvasElement, data: CutsceneData, onComplete: () => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context for cutscene');
    }
    this.ctx = context;
    this.data = data;
    this.onComplete = onComplete;
    // Initialize the CosmicTextRenderer
    this.cosmicTextRenderer = new CosmicTextRenderer(this.ctx);
  }

  public isReady(): boolean {
    return this.isActive && this.startTime > 0;
  }

  public start() {
    // Starting cutscene
    this.isActive = true;
    this.startTime = Date.now();

    // Auto-advance after 4.5 seconds (more time to read) or on spacebar press
    this.skipHandler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Space' || e.key === 'Enter') {
        // Cutscene skipped by user
        this.complete();
      }
    };

    try {
      document.addEventListener('keydown', this.skipHandler);

      // Extended timing for comfortable reading
      try {
        this.autoAdvanceTimeout = window.setTimeout(() => {
          if (this.isActive) {
            // Auto-completing cutscene
            this.complete();
          }
        }, 4500); // 4.5 seconds for comfortable reading
      } catch (error) {
        // Failed to create auto-advance timeout
        this.complete();
      }
    } catch (error) {
      // Error setting up event listeners
      this.complete();
    }
  }

  private complete() {
    // Completing cutscene
    this.isActive = false;

    // Clean up event listeners and timeouts to prevent memory leaks
    if (this.skipHandler) {
      try {
        document.removeEventListener('keydown', this.skipHandler);
      } catch (error) {
        // Failed to remove keydown listener
      }
      this.skipHandler = null;
    }

    if (this.autoAdvanceTimeout) {
      clearTimeout(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = null;
    }

    if (this.onComplete) {
      this.onComplete();
    }
  }

  public render() {
    if (!this.isActive) return;

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    const elapsed = Date.now() - this.startTime;

    // Smooth easing function for natural animations
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Extended fade-in timing for smoother transition
    const fadeProgress = Math.min(elapsed / 800, 1); // 800ms smooth fade
    const fadeAlpha = easeOutCubic(fadeProgress);

    // Background with gradient for depth
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
    );
    gradient.addColorStop(0, `rgba(0, 0, 45, ${fadeAlpha})`);
    gradient.addColorStop(1, `rgba(0, 0, 20, ${fadeAlpha})`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (fadeProgress > 0.3) { // Start content after 30% of fade
      // Animated stars with twinkling effect
      const starAlpha = Math.min((elapsed - 200) / 600, 1);
      if (starAlpha > 0) {
        for (let i = 0; i < 60; i++) {
          const x = (i * 73) % this.canvas.width;
          const y = (i * 37) % this.canvas.height;
          const twinkle = Math.sin(elapsed * 0.005 + i) * 0.3 + 0.7;
          this.ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * twinkle})`;
          this.ctx.fillRect(x, y, 1, 1);
        }
      }

      // Title with smooth slide-in and enhanced glow
      const titleProgress = Math.min(Math.max((elapsed - 400) / 800, 0), 1);
      if (titleProgress > 0) {
        const titleEase = easeInOutCubic(titleProgress);
        const titleY = this.canvas.height / 2 - 80 + (50 * (1 - titleEase));

        this.ctx.save();
        this.ctx.globalAlpha = titleEase;
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.shadowBlur = 15 + Math.sin(elapsed * 0.003) * 5; // Pulsing glow
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.data.title, this.canvas.width / 2, titleY);
        this.ctx.restore();
      }

      // Description with staggered line animation
      const descProgress = Math.min(Math.max((elapsed - 800) / 1000, 0), 1);
      if (descProgress > 0) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        const lines = this.data.description.split('\n');

        lines.forEach((line, index) => {
          const lineDelay = index * 100; // Stagger each line by 100ms
          const lineProgress = Math.min(Math.max((elapsed - 800 - lineDelay) / 600, 0), 1);
          if (lineProgress > 0) {
            const lineEase = easeOutCubic(lineProgress);
            const lineX = this.canvas.width / 2 + (30 * (1 - lineEase));

            this.ctx.save();
            this.ctx.globalAlpha = lineEase;
            this.ctx.fillText(line, lineX, this.canvas.height / 2 - 20 + (index * 22));
            this.ctx.restore();
          }
        });
      }

      // Weapon unlock with dramatic entrance
      if (this.data.weaponUnlocked) {
        const weaponProgress = Math.min(Math.max((elapsed - 1500) / 800, 0), 1);
        if (weaponProgress > 0) {
          const weaponEase = easeInOutCubic(weaponProgress);
          const scale = 0.5 + (0.5 * weaponEase); // Scale from 50% to 100%

          this.ctx.save();
          this.ctx.globalAlpha = weaponEase;
          this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2 + 100);
          this.ctx.scale(scale, scale);
          this.ctx.translate(-this.canvas.width / 2, -(this.canvas.height / 2 + 100));

          this.ctx.shadowColor = '#FFFF00';
          this.ctx.shadowBlur = 12 + Math.sin(elapsed * 0.004) * 4;
          this.ctx.fillStyle = '#FFFF00';
          this.ctx.font = 'bold 20px monospace';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(this.data.weaponUnlocked, this.canvas.width / 2, this.canvas.height / 2 + 100);
          this.ctx.restore();
        }
      }

      // Continue prompt with gentle pulse
      const promptProgress = Math.min(Math.max((elapsed - 2000) / 500, 0), 1);
      if (promptProgress > 0) {
        const pulse = Math.sin(elapsed * 0.003) * 0.2 + 0.8;
        this.ctx.save();
        this.ctx.globalAlpha = promptProgress * pulse;
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height - 40);
        this.ctx.restore();
      }
    }

    this.ctx.restore();
  }
}