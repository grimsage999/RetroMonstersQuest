import { logger } from './Logger';
export interface FireballConfig {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  homing: boolean;
  damage: number;
}

export class Fireball {
  public x: number;
  public y: number;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private speed: number;
  private homing: boolean;
  private damage: number;
  private size: number = 16;
  private alive: boolean = true;
  private trailPositions: Array<{ x: number; y: number; alpha: number }> = [];
  private hitPlayer: boolean = false; // Track if fireball hit player this frame
  private isChasing: boolean = false; // Tracks if fireball is actively chasing Cosmo (turns purple)
  private chasingStartTime: number = 0; // When the chase started

  constructor(config: FireballConfig) {
    this.x = config.x;
    this.y = config.y;
    this.speed = config.speed;
    this.homing = config.homing;
    this.damage = config.damage;

    // Calculate initial direction
    const dx = config.targetX - this.x;
    const dy = config.targetY - this.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    
    if (magnitude > 0) {
      this.velocityX = (dx / magnitude) * this.speed;
      this.velocityY = (dy / magnitude) * this.speed;
    }
  }

  public update(deltaTime: number, playerX: number, playerY: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.alive) return;

    // Homing behavior - slightly adjust direction toward player
    const playerCenterX = playerX + 24;
    const playerCenterY = playerY + 24;
    if (this.homing) {
      // Mark as chasing once homing activates (changes color to purple)
      if (!this.isChasing) {
        this.isChasing = true;
        this.chasingStartTime = Date.now();
        logger.debug('🔥 Fireball now chasing Cosmo! Changing to PURPLE.');
      }
      
      const dx = playerCenterX - this.x; // Target center of player
      const dy = playerCenterY - this.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      
      if (magnitude > 0) {
        // Slight course correction (10% adjustment)
        const targetVelX = (dx / magnitude) * this.speed;
        const targetVelY = (dy / magnitude) * this.speed;
        
        this.velocityX += (targetVelX - this.velocityX) * 0.1;
        this.velocityY += (targetVelY - this.velocityY) * 0.1;
        
        // Re-normalize to maintain constant speed
        const currentMagnitude = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (currentMagnitude > 0) {
          this.velocityX = (this.velocityX / currentMagnitude) * this.speed;
          this.velocityY = (this.velocityY / currentMagnitude) * this.speed;
        }
      }
    }

    // Update trail
    this.trailPositions.unshift({ x: this.x, y: this.y, alpha: 1.0 });
    if (this.trailPositions.length > 5) {
      this.trailPositions.pop();
    }

    // Update trail alpha
    this.trailPositions.forEach((trail, index) => {
      trail.alpha = 1 - (index / 5);
    });

    // Move fireball
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Check boundaries
    if (this.x < -this.size || this.x > canvasWidth + this.size ||
        this.y < -this.size || this.y > canvasHeight + this.size) {
      this.alive = false;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    // Color scheme changes: RED when not chasing, PURPLE when chasing Cosmo
    const isChasing = this.isChasing;

    // Draw trail
    this.trailPositions.forEach((trail, index) => {
      ctx.save();
      ctx.globalAlpha = trail.alpha * 0.6;
      const trailSize = this.size * (1 - index / 10);
      
      // Trail color matches fireball state
      const gradient = ctx.createRadialGradient(trail.x, trail.y, 0, trail.x, trail.y, trailSize);
      if (isChasing) {
        // Purple trail when chasing
        gradient.addColorStop(0, '#CC00FF');
        gradient.addColorStop(0.5, '#9900CC');
        gradient.addColorStop(1, 'rgba(153, 0, 204, 0)');
      } else {
        // Red trail initially
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(0.5, '#CC0000');
        gradient.addColorStop(1, 'rgba(204, 0, 0, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(trail.x - trailSize, trail.y - trailSize, trailSize * 2, trailSize * 2);
      ctx.restore();
    });

    // Draw main fireball
    ctx.save();
    
    if (isChasing) {
      // PURPLE fireball when chasing Cosmo
      // Outer glow
      const outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.5);
      outerGlow.addColorStop(0, '#FF00FF');
      outerGlow.addColorStop(0.5, '#CC00FF');
      outerGlow.addColorStop(1, 'rgba(204, 0, 255, 0)');
      
      ctx.fillStyle = outerGlow;
      ctx.fillRect(this.x - this.size * 1.5, this.y - this.size * 1.5, this.size * 3, this.size * 3);
      
      // Core fireball - bright purple
      const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      coreGradient.addColorStop(0, '#FFFFFF'); // White hot center
      coreGradient.addColorStop(0.4, '#FF00FF'); // Bright magenta
      coreGradient.addColorStop(1, '#9900FF'); // Deep purple
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // RED fireball initially (before chasing)
      // Outer glow
      const outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.5);
      outerGlow.addColorStop(0, '#FF6600');
      outerGlow.addColorStop(0.5, '#FF0000');
      outerGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
      
      ctx.fillStyle = outerGlow;
      ctx.fillRect(this.x - this.size * 1.5, this.y - this.size * 1.5, this.size * 3, this.size * 3);
      
      // Core fireball - red/orange
      const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      coreGradient.addColorStop(0, '#FFFF00'); // Yellow hot center
      coreGradient.addColorStop(0.5, '#FF6600'); // Orange
      coreGradient.addColorStop(1, '#FF0000'); // Red
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  public isAlive(): boolean {
    return this.alive;
  }

  public kill(): void {
    this.alive = false;
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    };
  }

  public getDamage(): number {
    return this.damage;
  }

  public markHitPlayer(): void {
    this.hitPlayer = true;
  }

  public hasHitPlayer(): boolean {
    return this.hitPlayer;
  }
}
