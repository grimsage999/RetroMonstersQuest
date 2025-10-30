export class Manhole {
  private x: number;
  private y: number;
  private width: number = 48;
  private height: number = 48;
  private openCycleDuration: number;
  private closedDuration: number;
  private openDuration: number;
  private time: number = 0;
  private isOpen: boolean = false;
  private openProgress: number = 0;

  constructor(x: number, y: number, openCycleDuration: number = 4000, openDuration: number = 2000) {
    this.x = x;
    this.y = y;
    this.openCycleDuration = openCycleDuration;
    this.openDuration = openDuration;
    this.closedDuration = openCycleDuration - openDuration;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;

    const cyclePosition = this.time % this.openCycleDuration;

    if (cyclePosition < this.closedDuration) {
      this.isOpen = false;
      this.openProgress = 0;
    } else {
      this.isOpen = true;
      const openTime = cyclePosition - this.closedDuration;
      const transitionDuration = 300;

      if (openTime < transitionDuration) {
        this.openProgress = openTime / transitionDuration;
      } else if (openTime > this.openDuration - transitionDuration) {
        this.openProgress = 1 - ((openTime - (this.openDuration - transitionDuration)) / transitionDuration);
      } else {
        this.openProgress = 1;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.isOpen && this.openProgress > 0.1) {
      const holeDepth = this.openProgress;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
      
      ctx.fillStyle = `rgba(50, 50, 50, ${holeDepth * 0.8})`;
      for (let i = 0; i < 3; i++) {
        const offset = i * 4;
        ctx.fillRect(
          this.x + 4 + offset,
          this.y + 4 + offset,
          this.width - 8 - offset * 2,
          this.height - 8 - offset * 2
        );
      }

      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
    }

    const coverOffset = this.openProgress * (this.width / 2);
    
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(this.x - coverOffset, this.y, this.width / 2, this.height);
    ctx.fillRect(this.x + this.width / 2 + coverOffset, this.y, this.width / 2, this.height);

    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(this.x - coverOffset + 2, this.y + 2, this.width / 2 - 4, this.height - 4);
    ctx.fillRect(this.x + this.width / 2 + coverOffset + 2, this.y + 2, this.width / 2 - 4, this.height - 4);

    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const lineY = this.y + 10 + i * 10;
      ctx.beginPath();
      ctx.moveTo(this.x - coverOffset + 4, lineY);
      ctx.lineTo(this.x - coverOffset + this.width / 2 - 4, lineY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2 + coverOffset + 4, lineY);
      ctx.lineTo(this.x + this.width + coverOffset - 4, lineY);
      ctx.stroke();
    }

    if (this.isOpen && this.openProgress > 0.5) {
      const warningAlpha = 0.3 + Math.sin(this.time * 0.01) * 0.2;
      ctx.fillStyle = `rgba(255, 0, 0, ${warningAlpha})`;
      ctx.fillRect(this.x - 4, this.y - 4, this.width + 8, 4);
      ctx.fillRect(this.x - 4, this.y + this.height, this.width + 8, 4);
      ctx.fillRect(this.x - 4, this.y, 4, this.height);
      ctx.fillRect(this.x + this.width, this.y, 4, this.height);
    }

    ctx.restore();
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  public isDangerous(): boolean {
    return this.isOpen && this.openProgress > 0.7;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
