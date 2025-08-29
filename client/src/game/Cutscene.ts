export interface CutsceneData {
  levelNumber: number;
  title: string;
  description: string;
  weaponUnlocked?: string;
}

export class Cutscene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: CutsceneData;
  private onComplete: () => void;
  private startTime: number = 0;
  private isActive: boolean = false;
  private skipHandler: ((e: KeyboardEvent) => void) | null = null;
  private autoAdvanceTimeout: number | null = null;

  constructor(canvas: HTMLCanvasElement, data: CutsceneData, onComplete: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.data = data;
    this.onComplete = onComplete;
  }

  public isReady(): boolean {
    return this.isActive && this.startTime > 0;
  }

  public start() {
    console.log('Cutscene: Starting cutscene');
    this.isActive = true;
    this.startTime = Date.now();
    
    // Auto-advance after 3 seconds or on spacebar press
    this.skipHandler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Space' || e.key === 'Enter') {
        console.log('Cutscene: Skipped by user');
        this.complete();
      }
    };
    
    try {
      document.addEventListener('keydown', this.skipHandler);
      
      // Auto-advance after 3 seconds instead of 5
      this.autoAdvanceTimeout = window.setTimeout(() => {
        if (this.isActive) {
          console.log('Cutscene: Auto-completing after timeout');
          this.complete();
        }
      }, 3000); // 3 seconds to read
    } catch (error) {
      console.error('Cutscene: Error setting up event listeners:', error);
      this.complete(); // Fallback to complete immediately if setup fails
    }
  }

  private complete() {
    console.log('Cutscene: Completing cutscene');
    this.isActive = false;
    
    // Clean up event listeners and timeouts to prevent memory leaks
    if (this.skipHandler) {
      document.removeEventListener('keydown', this.skipHandler);
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

    // Black background with fade effect
    const elapsed = Date.now() - this.startTime;
    const fadeAlpha = Math.min(elapsed / 500, 1); // 500ms fade in
    
    this.ctx.fillStyle = `rgba(0, 0, 34, ${fadeAlpha})`; // Dark space background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (fadeAlpha >= 1) {
      // Add stars background effect
      for (let i = 0; i < 50; i++) {
        const x = (i * 73) % this.canvas.width;
        const y = (i * 37) % this.canvas.height;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x, y, 1, 1);
      }

      // Title with glow effect
      this.ctx.save();
      this.ctx.shadowColor = '#00FFFF';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = '#00FFFF';
      this.ctx.font = 'bold 32px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.data.title, this.canvas.width / 2, this.canvas.height / 2 - 80);
      this.ctx.restore();

      // Description with line breaks
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px monospace';
      this.ctx.textAlign = 'center';
      const lines = this.data.description.split('\n');
      lines.forEach((line, index) => {
        this.ctx.fillText(line, this.canvas.width / 2, this.canvas.height / 2 - 20 + (index * 22));
      });

      // Weapon unlock with special effect
      if (this.data.weaponUnlocked) {
        this.ctx.save();
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillText(this.data.weaponUnlocked, this.canvas.width / 2, this.canvas.height / 2 + 100);
        this.ctx.restore();
      }

      // Continue prompt
      this.ctx.fillStyle = '#888888';
      this.ctx.font = '14px monospace';
      this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height - 40);
    }

    this.ctx.restore();
  }
}