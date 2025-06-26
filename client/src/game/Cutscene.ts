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

  constructor(canvas: HTMLCanvasElement, data: CutsceneData, onComplete: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.data = data;
    this.onComplete = onComplete;
  }

  public start() {
    this.isActive = true;
    this.startTime = Date.now();
    this.render();
    
    // Auto-advance after 3 seconds or on spacebar press
    const handleSkip = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Space') {
        this.complete();
        document.removeEventListener('keydown', handleSkip);
      }
    };
    
    document.addEventListener('keydown', handleSkip);
    
    setTimeout(() => {
      if (this.isActive) {
        this.complete();
        document.removeEventListener('keydown', handleSkip);
      }
    }, 3000);
  }

  private complete() {
    this.isActive = false;
    this.onComplete();
  }

  private render() {
    if (!this.isActive) return;

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    // Black background with fade effect
    const elapsed = Date.now() - this.startTime;
    const fadeAlpha = Math.min(elapsed / 500, 1); // 500ms fade in
    
    this.ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (fadeAlpha >= 1) {
      // Title text
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 32px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.data.title, this.canvas.width / 2, this.canvas.height / 2 - 40);

      // Description text
      this.ctx.font = '18px monospace';
      this.ctx.fillText(this.data.description, this.canvas.width / 2, this.canvas.height / 2);

      // Weapon unlock notification
      if (this.data.weaponUnlocked) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillText(`🔫 ${this.data.weaponUnlocked} UNLOCKED!`, this.canvas.width / 2, this.canvas.height / 2 + 50);
      }

      // Continue prompt
      this.ctx.fillStyle = '#CCCCCC';
      this.ctx.font = '14px monospace';
      this.ctx.fillText('Press SPACE to continue...', this.canvas.width / 2, this.canvas.height - 50);
    }

    this.ctx.restore();

    if (this.isActive) {
      requestAnimationFrame(() => this.render());
    }
  }
}