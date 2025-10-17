import { Fireball, FireballConfig } from './Fireball';

export interface SpinningCactusConfig {
  x: number;
  y: number;
  spinSpeed: number;
  fireballInterval: number;
  fireballSpeed: number;
  fireballHoming: boolean;
  fireballDamage: number;
}

export class SpinningCactus {
  private x: number;
  private y: number;
  private width: number = 72; // Larger cactus (24 * 3 scale)
  private height: number = 72;
  private spinSpeed: number;
  private rotation: number = 0;
  private fireballInterval: number;
  private fireballSpeed: number;
  private fireballHoming: boolean;
  private fireballDamage: number;
  private timeSinceLastShot: number = 0;
  private fireballs: Fireball[] = [];
  private armWaveOffset: number = 0;

  constructor(config: SpinningCactusConfig) {
    this.x = config.x;
    this.y = config.y;
    this.spinSpeed = config.spinSpeed;
    this.fireballInterval = config.fireballInterval * 1000; // Convert to ms
    this.fireballSpeed = config.fireballSpeed;
    this.fireballHoming = config.fireballHoming;
    this.fireballDamage = config.fireballDamage;
  }

  public update(deltaTime: number, playerX: number, playerY: number, canvasWidth: number, canvasHeight: number): void {
    // Update rotation
    this.rotation += this.spinSpeed * (deltaTime / 16.67); // Normalize to 60fps
    if (this.rotation >= Math.PI * 2) {
      this.rotation -= Math.PI * 2;
    }

    // Update arm wave animation
    this.armWaveOffset += 0.1;

    // Update fireball timer
    this.timeSinceLastShot += deltaTime;

    // Shoot fireball
    if (this.timeSinceLastShot >= this.fireballInterval) {
      this.shootFireball(playerX, playerY);
      this.timeSinceLastShot = 0;
    }

    // Update all fireballs
    this.fireballs = this.fireballs.filter(fireball => {
      fireball.update(deltaTime, playerX, playerY, canvasWidth, canvasHeight);
      return fireball.isAlive();
    });
  }

  private shootFireball(targetX: number, targetY: number): void {
    const config: FireballConfig = {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      targetX: targetX + 24, // Center of player
      targetY: targetY + 24,
      speed: this.fireballSpeed,
      homing: this.fireballHoming,
      damage: this.fireballDamage
    };

    this.fireballs.push(new Fireball(config));
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    // Draw cactus body (bright green with pink accents)
    ctx.fillStyle = '#00FF88'; // Bright alien green
    ctx.fillRect(-24, -36, 48, 72);

    // Draw spinning arms (animated)
    const armWave1 = Math.sin(this.armWaveOffset) * 8;
    const armWave2 = Math.sin(this.armWaveOffset + Math.PI) * 8;

    // Left arm
    ctx.fillStyle = '#00FF88';
    ctx.fillRect(-48, -12 + armWave1, 24, 12);
    
    // Right arm
    ctx.fillRect(24, -12 + armWave2, 24, 12);

    // Draw face (menacing eyes)
    ctx.fillStyle = '#FF00FF'; // Hot pink
    ctx.fillRect(-18, -24, 12, 12); // Left eye
    ctx.fillRect(6, -24, 12, 12); // Right eye

    // Draw spikes on top
    ctx.fillStyle = '#FFFF00'; // Yellow
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-12 + i * 12, -42, 8, 12);
    }

    ctx.restore();

    // Render all fireballs
    this.fireballs.forEach(fireball => fireball.render(ctx));
  }

  public checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    // Check collision with cactus body
    if (playerX < this.x + this.width &&
        playerX + playerWidth > this.x &&
        playerY < this.y + this.height &&
        playerY + playerHeight > this.y) {
      return true;
    }

    // Check collision with fireballs
    for (const fireball of this.fireballs) {
      if (!fireball.isAlive()) continue;

      const fbBounds = fireball.getBounds();
      if (playerX < fbBounds.x + fbBounds.width &&
          playerX + playerWidth > fbBounds.x &&
          playerY < fbBounds.y + fbBounds.height &&
          playerY + playerHeight > fbBounds.y) {
        fireball.kill();
        return true;
      }
    }

    return false;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public getFireballs(): Fireball[] {
    return this.fireballs;
  }

  public clearFireballs(): void {
    this.fireballs = [];
  }
}
