import { logger } from './Logger';

export class WeaponX {
  private x: number;
  private y: number;
  private width: number = 24;
  private height: number = 24;
  private collected: boolean = false;
  private floatOffset: number = 0;
  private glowIntensity: number = 0;
  private rotationAngle: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    logger.info(`WeaponX spawned at (${x}, ${y})`);
  }

  public update(deltaTime: number): void {
    if (this.collected) return;

    this.floatOffset += deltaTime * 2;
    this.glowIntensity = Math.abs(Math.sin(this.floatOffset * 2));
    this.rotationAngle += deltaTime * 1.5;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + Math.sin(this.floatOffset) * 3;

    ctx.save();
    
    const glowRadius = 40 + this.glowIntensity * 10;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
    gradient.addColorStop(0, `rgba(255, 50, 50, ${0.3 * this.glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 100, ${0.15 * this.glowIntensity})`);
    gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2);

    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotationAngle);

    ctx.shadowBlur = 15 + this.glowIntensity * 10;
    ctx.shadowColor = '#ff3333';

    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10, -2, 20, 4);

    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    if (this.collected) return false;

    return (
      playerX < this.x + this.width &&
      playerX + playerWidth > this.x &&
      playerY < this.y + this.height &&
      playerY + playerHeight > this.y
    );
  }

  public collect(): void {
    if (!this.collected) {
      this.collected = true;
      logger.info('🔴 WEAPON X COLLECTED! Bubble Shield ability unlocked!');
    }
  }

  public isCollected(): boolean {
    return this.collected;
  }

  public getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}
