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

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = this.width / 2;

    // Render the dark hole underneath when open
    if (this.isOpen && this.openProgress > 0.1) {
      // Orange glow around the hole when opening
      const glowAlpha = this.openProgress * 0.6;
      ctx.fillStyle = `rgba(255, 140, 0, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Dark hole
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      ctx.fill();

      // Add depth shadows
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgba(40, 40, 40, ${0.3 - i * 0.1})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2 - i * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Slide the cover to the right as one piece
    const slideOffset = this.openProgress * this.width * 0.8;

    // NYC Subway Manhole Cover
    ctx.translate(slideOffset, 0);

    // Outer ring - metallic gray-blue
    ctx.fillStyle = '#5A7D9A';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring - darker
    ctx.fillStyle = '#4A5F7A';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Main cover surface
    ctx.fillStyle = '#6B8AA3';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 6, 0, Math.PI * 2);
    ctx.fill();

    // NYC text in center
    ctx.fillStyle = '#E8D4A0';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NYC', centerX, centerY - 2);

    // SUBWAY text at bottom
    ctx.font = 'bold 8px monospace';
    ctx.fillText('SUBWAY', centerX, centerY + radius - 12);

    // Small decorative symbols around the edge
    ctx.fillStyle = '#E8D4A0';
    const symbolRadius = radius - 12;
    const symbols = ['◯', '■', '◇', '▽', '△', '●', '□', '◆'];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * symbolRadius;
      const y = centerY + Math.sin(angle) * symbolRadius;
      ctx.font = '6px monospace';
      ctx.fillText(symbols[i], x, y);
    }

    // Add metallic edge highlight
    ctx.strokeStyle = '#8BA8BF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI);
    ctx.stroke();

    // Add some wear/rust spots for realism
    ctx.fillStyle = '#8B7355';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spotX = centerX + Math.cos(angle) * (radius - 8);
      const spotY = centerY + Math.sin(angle) * (radius - 8);
      ctx.beginPath();
      ctx.arc(spotX, spotY, 1, 0, Math.PI * 2);
      ctx.fill();
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
