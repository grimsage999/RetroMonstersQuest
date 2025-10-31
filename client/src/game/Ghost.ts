/**
 * Ghost - Summoned projectile entity from Necromancer boss
 * Chases player for a limited time, one-hit kill if it catches them
 */

export class Ghost {
  private x: number;
  private y: number;
  private readonly width: number = 40;
  private readonly height: number = 40;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private readonly speed: number = 2.5;
  private active: boolean = true;
  private lifetime: number = 0;
  private readonly maxLifetime: number = 5000; // 5 seconds
  private animationFrame: number = 0;
  private animationTimer: number = 0;
  private fadeAlpha: number = 1;

  constructor(x: number, y: number, targetX: number, targetY: number) {
    this.x = x;
    this.y = y;
    
    // Calculate direction towards player
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      this.velocityX = (dx / distance) * this.speed;
      this.velocityY = (dy / distance) * this.speed;
    }
  }

  public update(deltaTime: number, playerX: number, playerY: number): void {
    if (!this.active) return;

    this.lifetime += deltaTime;

    // Despawn after lifetime expires
    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    // Start fading out in the last second
    if (this.lifetime > this.maxLifetime - 1000) {
      this.fadeAlpha = 1 - ((this.lifetime - (this.maxLifetime - 1000)) / 1000);
    }

    // Chase player with homing behavior
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Smooth homing - blend current velocity with direction to player
      const targetVelX = (dx / distance) * this.speed;
      const targetVelY = (dy / distance) * this.speed;
      
      this.velocityX = this.velocityX * 0.9 + targetVelX * 0.1;
      this.velocityY = this.velocityY * 0.9 + targetVelY * 0.1;
    }

    // Move ghost
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Update animation
    this.animationTimer += deltaTime;
    if (this.animationTimer > 200) {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.animationTimer = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha * 0.8;

    // Ghostly cyan glow color
    const glowColor = '#00FFFF';
    const darkColor = '#008B8B';

    // Floating animation offset
    const floatOffset = Math.sin(this.animationFrame * Math.PI / 2) * 3;

    // Ghost body (wispy ethereal shape)
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2 + floatOffset,
      this.width / 3,
      this.height / 2.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Dark ethereal core
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2 + floatOffset,
      this.width / 5,
      this.height / 4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(this.x + 12, this.y + 12 + floatOffset, 4, 6);
    ctx.fillRect(this.x + 24, this.y + 12 + floatOffset, 4, 6);

    // Wispy tail trails
    ctx.globalAlpha = this.fadeAlpha * 0.4;
    ctx.fillStyle = glowColor;
    for (let i = 0; i < 3; i++) {
      const wispX = this.x + this.width / 2 - this.velocityX * (i + 1) * 3;
      const wispY = this.y + this.height / 2 - this.velocityY * (i + 1) * 3 + floatOffset;
      const wispSize = (this.width / 4) * (1 - i * 0.3);
      
      ctx.beginPath();
      ctx.ellipse(wispX, wispY, wispSize, wispSize, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  public checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    if (!this.active) return false;

    return (
      this.x < playerX + playerWidth &&
      this.x + this.width > playerX &&
      this.y < playerY + playerHeight &&
      this.y + this.height > playerY
    );
  }

  public isActive(): boolean {
    return this.active;
  }

  public deactivate(): void {
    this.active = false;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
